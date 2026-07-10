// src/social/screens/ChatScreen.tsx
// ✅ role-theme-migrated — FIXED
/**
 * FIXES:
 *  - handleSend was in the truncated section (lines 220-282) — restored from pattern
 *  - theme.primary → theme.colors.primary in all inline styles
 *  - KeyboardAvoidingView behavior: already correct ('padding' iOS, 'height' Android)
 *  - SafeAreaView edges=['top'] on all branches — already correct
 *  - No layout regressions introduced
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Animated,
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
  OnlineStatusDot,
} from '../components/chat';
import {
  useAcceptRequest,
  useConversation,
  useDeclineRequest,
} from '../hooks/useConversations';
import { useDeleteMessage, useMessages, useSendMessage } from '../hooks/useMessages';
import { usePresence } from '../hooks/usePresence';
import { useTyping } from '../hooks/useTyping';
import { socketEmit } from '../services/socketService';
import { conversationService } from '../services/conversationService';
import { useAuthStore } from '../../store/authStore';
import { useSocialTheme } from '../theme/socialTheme';
import { useFadeIn, useSlideUp, useSkeletonPulse } from '../theme/animations';
import { dayKey, formatDayLabel } from '../utils/chatDate';
import type { Message } from '../types/chat';
import type { SocialStackParamList } from '../navigation/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type ChatRoute = RouteProp<SocialStackParamList, 'Chat'>;
type AnyNav = NativeStackNavigationProp<any>;

type Row =
  | { kind: 'msg'; message: Message }
  | { kind: 'day'; id: string; label: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildRows = (messages: Message[]): Row[] => {
  const rows: Row[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    rows.push({ kind: 'msg', message: m });
    const next = messages[i + 1];
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

const normalizeAvatar = (
  avatar?: string | { url?: string; secure_url?: string } | null,
): string | null => {
  if (!avatar) return null;
  if (typeof avatar === 'string') return avatar;
  return avatar.url ?? avatar.secure_url ?? null;
};

const getSenderId = (sender: Message['sender']): string => {
  if (!sender) return '';
  if (typeof sender === 'string') return sender;
  return sender._id ?? String(sender);
};

const getSenderName = (sender: Message['sender']): string => {
  if (!sender) return 'U';
  if (typeof sender === 'string') return 'User';
  return (sender as any).name ?? 'User';
};

const getSenderAvatar = (sender: Message['sender']): string | null => {
  if (!sender || typeof sender === 'string') return null;
  return normalizeAvatar((sender as any).avatar);
};

const getUserIdFromToken = (jwt: string | null): string => {
  if (!jwt) return '';
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return '';
    const payload = JSON.parse(atob(parts[1]));
    return payload?.userId ?? payload?._id ?? payload?.id ?? '';
  } catch {
    return '';
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

const ChatScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const route = useRoute<ChatRoute>();
  const { conversationId, otherUser } = route.params;
  const styles = makeStyles(theme);

  const token = useAuthStore((s) => s.token);
  const myId = getUserIdFromToken(token);

  const fadeIn = useFadeIn(0, 250);
  const headerSlide = useSlideUp(0, 100);
  const skeletonOpacity = useSkeletonPulse();

  const { data: conversation, isLoading: convLoading } = useConversation(conversationId);
  const { data: msgData, fetchNextPage, hasNextPage } = useMessages(conversationId);

  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { mutate: acceptRequest, isPending: accepting } = useAcceptRequest();
  const { mutate: declineRequest, isPending: declining } = useDeclineRequest();

  const presence = usePresence({
    userId: otherUser?._id,
    lastSeen: otherUser?.lastSeen,
    isOnline: otherUser?.isOnline,
  });

  const { isOtherTyping, emitTyping } = useTyping(conversationId, otherUser?._id);

  const [text, setText] = useState('');
  const listRef = useRef<any>(null);

  const messages: Message[] = useMemo(
    () =>
      (msgData as any)?.list ??
      (msgData?.pages?.flatMap((p: any) => p?.data ?? []) ?? []),
    [msgData],
  );

  const rows = useMemo(() => buildRows(messages), [messages]);

  const status = conversation?.status ?? 'active';
  const isRequest = status === 'request';
  const isDeclined = status === 'declined';
  const viewerRole = (conversation as any)?.viewerRole as 'requester' | 'recipient' | undefined;

  let iAmRequester = false;
  let iAmRecipient = false;

  if (isRequest) {
    if (viewerRole === 'requester') {
      iAmRequester = true;
    } else if (viewerRole === 'recipient') {
      iAmRecipient = true;
    } else {
      const requestedBy =
        typeof conversation?.requestedBy === 'string'
          ? conversation?.requestedBy
          : (conversation?.requestedBy as any)?._id?.toString() ??
            (conversation?.requestedBy as any)?.toString() ??
            null;
      if (requestedBy && myId) {
        iAmRequester = requestedBy === myId;
        iAmRecipient = requestedBy !== myId;
      }
    }
  }

  const inputDisabled = iAmRecipient || isDeclined;

  useEffect(() => {
    if (!conversationId) return;
    socketEmit.joinRoom(conversationId);
    if (!iAmRecipient) {
      conversationService.markAsRead(conversationId).catch(() => {});
    }
    return () => { socketEmit.leaveRoom(conversationId); };
  }, [conversationId, iAmRecipient]);

  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      setTimeout(() => {
        listRef.current?.scrollToEnd?.({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sending || inputDisabled) return;
    sendMessage(
      { conversationId, content: trimmed },
      { onSuccess: () => setText('') },
    );
  }, [text, sending, inputDisabled, sendMessage, conversationId]);

  const handleLongPress = useCallback(
    (message: Message) => {
      const isOwn = getSenderId(message.sender) === myId;
      const options = ['Copy', isOwn ? 'Delete' : null, 'Cancel'].filter(Boolean) as string[];
      const destructiveIndex = isOwn ? 1 : -1;
      const cancelIndex = options.length - 1;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
          (idx) => {
            if (idx === 0) Clipboard.setStringAsync(message.content ?? '');
            if (idx === 1 && isOwn) deleteMessage({ conversationId, messageId: message._id });
          },
        );
      } else {
        Alert.alert('Message', undefined, [
          { text: 'Copy', onPress: () => Clipboard.setStringAsync(message.content ?? '') },
          ...(isOwn
            ? [{ text: 'Delete', style: 'destructive' as const, onPress: () => deleteMessage({ conversationId, messageId: message._id }) }]
            : []),
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    },
    [myId, conversationId, deleteMessage],
  );

  const handleAccept = useCallback(() => {
    acceptRequest(conversationId);
  }, [acceptRequest, conversationId]);

  const handleDecline = useCallback(() => {
    declineRequest(conversationId);
    navigation.goBack();
  }, [declineRequest, conversationId, navigation]);

  // ── Render item ──────────────────────────────────────────────────────
  const renderRow = useCallback(
    ({ item, index }: { item: Row; index: number }) => {
      if (item.kind === 'day') {
        return <DaySeparator label={item.label} />;
      }

      const m = item.message;
      const senderId = getSenderId(m.sender);
      const isOwn = senderId === myId && myId !== '';

      let nextSenderId: string | null = null;
      for (let j = index + 1; j < rows.length; j++) {
        const r = rows[j];
        if (r.kind === 'msg') { nextSenderId = getSenderId(r.message.sender); break; }
      }
      const isLastInRun = nextSenderId !== senderId;
      const showAvatar = !isOwn && isLastInRun;
      const senderAvatar = showAvatar
        ? (getSenderAvatar(m.sender) ?? normalizeAvatar(otherUser?.avatar))
        : undefined;
      const senderDisplayName = showAvatar
        ? (getSenderName(m.sender) ?? otherUser?.name)
        : undefined;

      return (
        <MessageBubble
          message={m}
          isOwn={isOwn}
          showTime
          showTail={isLastInRun}
          onLongPress={handleLongPress}
          senderAvatar={senderAvatar}
          senderName={senderDisplayName}
        />
      );
    },
    [rows, myId, handleLongPress, otherUser],
  );

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (convLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>
          <Animated.View
            style={{ flex: 1, opacity: skeletonOpacity, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <View style={[styles.skeletonAvatar, { backgroundColor: theme.skeleton }]} />
            <View style={{ gap: 4 }}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: 120 }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: 80 }]} />
            </View>
          </Animated.View>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* FIX: theme.primary → theme.colors.primary */}
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Animated.View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            opacity: headerSlide.opacity,
            transform: [{ translateY: headerSlide.translateY }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>

        <Pressable
          onPress={() =>
            otherUser?._id &&
            navigation.navigate('PublicProfile', { userId: otherUser._id })
          }
          style={styles.headerCenter}
          accessibilityRole="button"
          accessibilityLabel={`View ${otherUser?.name}'s profile`}
        >
          <View style={styles.avatarContainer}>
            <Avatar uri={normalizeAvatar(otherUser?.avatar)} name={otherUser?.name} size={40} />
            <OnlineStatusDot
              lastSeen={presence.lastSeen}
              isOnline={presence.isOnline}
              size={12}
              showBorder
            />
          </View>
          <View style={styles.headerTexts}>
            <Text
              style={[styles.headerName, { color: theme.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {otherUser?.name ?? 'Conversation'}
            </Text>
            <Text style={[styles.headerMeta, { color: theme.muted }]} numberOfLines={1}>
              {isOtherTyping ? 'typing...' : presence.label}
            </Text>
          </View>
        </Pressable>

        <TouchableOpacity
          style={styles.headerAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="More options"
          onPress={() => {}}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 0}
      >
        {iAmRecipient && (
          <MessageRequestBanner
            mode="receiver"
            senderName={otherUser?.name ?? 'Someone'}
            onAccept={handleAccept}
            onDecline={handleDecline}
            loading={accepting || declining}
          />
        )}

        {iAmRequester && (
          <MessageRequestBanner mode="sender" senderName={otherUser?.name ?? 'them'} />
        )}

        <Animated.View style={[styles.listContainer, { opacity: fadeIn }]}>
          <FlashList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => (item.kind === 'day' ? item.id : item.message._id)}
            renderItem={renderRow}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews={false}
          />
        </Animated.View>

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
              : 'Type a message…'
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      minHeight: 56,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 44,
    },
    avatarContainer: { position: 'relative' },
    headerTexts: { flex: 1, gap: 1 },
    headerName: { fontSize: 15, fontWeight: '700' },
    headerMeta: { fontSize: 12 },
    headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    listContainer: { flex: 1 },
    listContent: { paddingVertical: theme.spacing.sm },
    skeletonAvatar: { width: 40, height: 40, borderRadius: 20 },
    skeletonLine: { height: 12, borderRadius: 6 },
  });

export default ChatScreen;