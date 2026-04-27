// src/social/screens/ChatScreen.tsx
/**
 * ChatScreen — 1-on-1 conversation view.
 * -----------------------------------------------------------------------------
 * Route params:
 *   { conversationId: string, otherUser: ChatUser, isRequestFlow?: boolean }
 *
 * Behaviour matrix:
 *   ┌────────────────────────────┬─────────────────────────────────────────┐
 *   │ status === 'active'         │ Normal chat (Tier 1, mutual)            │
 *   │ status === 'request' && me  │ "Waiting for acceptance" banner         │
 *   │   am the requester          │ Input still allowed (queued messages    │
 *   │                             │  delivered when accepted).               │
 *   │ status === 'request' && me  │ Accept / Decline banner; input disabled │
 *   │   am NOT the requester      │ until accepted.                          │
 *   │ status === 'declined'       │ Read-only banner; input disabled        │
 *   └────────────────────────────┴─────────────────────────────────────────┘
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Avatar from '../components/shared/Avatar';
import {
  DaySeparator,
  MessageBubble,
  MessageInput,
  MessageRequestBanner,
  TypingIndicator,
} from '../components/chat';
import {
  useAcceptRequest,
  useConversation,
  useDeclineRequest,
  useMarkConversationRead,

} from '../hooks/useConversations';
import { socketEmit } from '../services/socketService';
import { useAuthStore } from '../../store/authStore';
import { useSocialTheme } from '../theme/socialTheme';
import { dayKey, formatDayLabel } from '../utils/chatDate';
import type { ChatUser, Message } from '../types/chat';
import { useDeleteMessage, useMessages, useSendMessage } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';
import { useTyping } from '../hooks/useTyping';

type RouteParams = {
  Chat: {
    conversationId: string;
    otherUser: ChatUser;
    /** Hint from NewChatScreen: this is a Tier-2 request flow. */
    isRequestFlow?: boolean;
  };
};
type AnyNav = NativeStackNavigationProp<any>;

// ─────────────────────────────────────────────────────────────────────────────
// Day-separator interleaving — for an inverted list, separators sit BEFORE
// (i.e. above) the older message in render order, which is the next index in
// our newest-first array.
// ─────────────────────────────────────────────────────────────────────────────

type Row =
  | { kind: 'msg'; message: Message }
  | { kind: 'day'; id: string; label: string };

const buildRows = (messages: Message[]): Row[] => {
  const rows: Row[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    rows.push({ kind: 'msg', message: m });
    const next = messages[i + 1]; // older
    if (!next || dayKey(m.createdAt) !== dayKey(next.createdAt)) {
      rows.push({
        kind: 'day',
        id: `day-${dayKey(m.createdAt)}`,
        label: formatDayLabel(m.createdAt),
      });
    }
  }
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────

const ChatScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const route = useRoute<RouteProp<RouteParams, 'Chat'>>();
  const { conversationId, otherUser } = route.params;
  const styles = makeStyles(theme);

  const myId = useAuthStore((s) => s.user?._id);

  // ── Data ─────────────────────────────────────────────────────────────
  const { data: conversation } = useConversation(conversationId);
  const { data: msgData, fetchNextPage, hasNextPage, isLoading } =
    useMessages(conversationId);
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { mutate: markRead } = useMarkConversationRead();
  const { mutate: acceptRequest, isPending: accepting } = useAcceptRequest();
  const { mutate: declineRequest, isPending: declining } = useDeclineRequest();

  const presence = usePresence({
    userId: otherUser?._id,
    lastSeen: otherUser?.lastSeen,
    isOnline: otherUser?.isOnline,
  });
  const { isOtherTyping, emitTyping } = useTyping(
    conversationId,
    otherUser?._id,
  );

  const [text, setText] = useState('');
  const messages = msgData?.list ?? [];
  const rows = useMemo(() => buildRows(messages), [messages]);

  // ── Status resolution ────────────────────────────────────────────────
  const status = conversation?.status ?? 'active';
  const isRequest = status === 'request';
  const iAmRequester = isRequest && conversation?.requestedBy === myId;
  const iAmRecipient = isRequest && conversation?.requestedBy !== myId;

  // Input behaviour:
  //   Tier-2 sender — can still type; server holds the messages until accept.
  //   Tier-2 recipient — must accept first, so input is disabled.
  //   Declined — disabled.
  const inputDisabled = iAmRecipient || status === 'declined';

  // ── Effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    socketEmit.joinRoom(conversationId);
    if (!iAmRecipient) markRead({ conversationId });
    return () => {
      socketEmit.leaveRoom(conversationId);
    };
  }, [conversationId, iAmRecipient, markRead]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content || inputDisabled) return;
    setText('');
    sendMessage({ conversationId, content, type: 'text' });
  }, [text, inputDisabled, sendMessage, conversationId]);

  const handleLongPress = useCallback(
    (m: Message) => {
      if (!myId) return;
      const senderId =
        typeof m.sender === 'string' ? m.sender : m.sender?._id;
      const isMine = senderId === myId;
      const canDeleteForAll =
        isMine &&
        m.canDeleteUntil &&
        new Date(m.canDeleteUntil).getTime() > Date.now();

      const options = [
        ...(m.content ? ['Copy'] : []),
        ...(isMine ? ['Delete for me'] : []),
        ...(canDeleteForAll ? ['Delete for everyone'] : []),
        'Cancel',
      ];
      const cancelButtonIndex = options.length - 1;
      const destructiveButtonIndex = isMine ? options.length - 2 : undefined;

      const handle = (idx: number) => {
        const choice = options[idx];
        if (choice === 'Copy' && m.content) {
          Clipboard.setStringAsync(m.content);
        }
        if (choice === 'Delete for me') {
          deleteMessage({
            messageId: m._id,
            conversationId,
            forEveryone: false,
          });
        }
        if (choice === 'Delete for everyone') {
          deleteMessage({
            messageId: m._id,
            conversationId,
            forEveryone: true,
          });
        }
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex, destructiveButtonIndex },
          handle,
        );
      } else {
        Alert.alert('Message', '', [
          ...options
            .slice(0, -1)
            .map((opt, i) => ({ text: opt, onPress: () => handle(i) })),
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    },
    [myId, conversationId, deleteMessage],
  );

  // ── Renderers ────────────────────────────────────────────────────────
  const renderRow = useCallback(
    ({ item, index }: { item: Row; index: number }) => {
      if (item.kind === 'day') {
        return <DaySeparator label={item.label} />;
      }
      const m = item.message;
      const senderId =
        typeof m.sender === 'string' ? m.sender : m.sender?._id;
      const isOwn = senderId === myId;

      // Find the next message-row (older) to determine "last in run".
      let nextSenderId: string | null = null;
      for (let j = index + 1; j < rows.length; j++) {
        const r = rows[j];
        if (r.kind === 'msg') {
          nextSenderId =
            typeof r.message.sender === 'string'
              ? r.message.sender
              : r.message.sender?._id ?? null;
          break;
        }
      }
      const isLastInRun = nextSenderId !== senderId;

      return (
        <MessageBubble
          message={m}
          isOwn={isOwn}
          showTail={isLastInRun}
          onLongPress={handleLongPress}
        />
      );
    },
    [rows, myId, handleLongPress],
  );

  const headerTitle = (
    <Pressable
      onPress={() =>
        otherUser?._id &&
        navigation.navigate('PublicProfile', { userId: otherUser._id })
      }
      style={styles.headerTitleWrap}
    >
      <Avatar
        uri={otherUser?.avatar}
        name={otherUser?.name}
        size={36}
        lastSeen={presence.lastSeen}
        isOnline={presence.isOnline}
        showPresence
      />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text
          style={[styles.headerName, { color: theme.text }]}
          numberOfLines={1}
        >
          {otherUser?.name ?? 'Conversation'}
        </Text>
        <Text
          style={[styles.headerMeta, { color: theme.muted }]}
          numberOfLines={1}
        >
          {presence.label}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        {headerTitle}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {iAmRecipient && (
          <MessageRequestBanner
            mode="receiver"
            senderName={otherUser?.name ?? 'They'}
            onAccept={() => acceptRequest(conversationId)}
            onDecline={() =>
              declineRequest(conversationId, {
                onSuccess: () => navigation.goBack(),
              })
            }
            loading={accepting || declining}
          />
        )}

        {iAmRequester && (
          <MessageRequestBanner
            mode="sender"
            senderName={otherUser?.name ?? 'them'}
          />
        )}

        <FlashList
          data={rows}
          keyExtractor={(item) =>
            item.kind === 'day' ? item.id : item.message._id
          }
          renderItem={renderRow}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        <TypingIndicator visible={isOtherTyping} />

        <MessageInput
          value={text}
          onChangeText={setText}
          onSend={handleSend}
          onTyping={emitTyping}
          disabled={inputDisabled}
          placeholder={
            iAmRecipient
              ? 'Accept the request to reply'
              : iAmRequester
              ? 'Send a message…'
              : 'Message…'
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (_theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 12,
    },
    headerName: { fontSize: 15, fontWeight: '700' },
    headerMeta: { fontSize: 12, marginTop: 1 },
  });

export default ChatScreen;