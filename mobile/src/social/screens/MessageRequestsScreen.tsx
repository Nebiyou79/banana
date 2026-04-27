/**
 * MessageRequestsScreen — dedicated list of incoming message requests.
 * -----------------------------------------------------------------------------
 * Each row supports Accept / Decline inline. Tapping the body opens the
 * conversation (where the user can also act via the banner).
 */

import React, { useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSocialTheme } from '../theme/socialTheme';
import {
  useAcceptRequest,
  useDeclineRequest,
  useMessageRequests,
} from '../hooks/useConversations';
import { RequestCard } from '../components/chat';
import type { Conversation } from '../types/chat';

type AnyNav = NativeStackNavigationProp<any>;

const MessageRequestsScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const styles = makeStyles(theme);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isRefetching,
    refetch,
  } = useMessageRequests();
  const { mutate: acceptRequest } = useAcceptRequest();
  const { mutate: declineRequest } = useDeclineRequest();

  // Per-row pending state for buttons.
  const [pendingById, setPendingById] = useState<
    Record<string, 'accept' | 'decline' | null>
  >({});

  const requests: Conversation[] = data?.list ?? [];

  const setPending = (id: string, v: 'accept' | 'decline' | null) =>
    setPendingById((m) => ({ ...m, [id]: v }));

  const handleAccept = (conv: Conversation) => {
    setPending(conv._id, 'accept');
    acceptRequest(conv._id, {
      onSettled: () => setPending(conv._id, null),
      onSuccess: () =>
        navigation.navigate('Chat', {
          conversationId: conv._id,
          otherUser: conv.otherUser,
        }),
    });
  };

  const handleDecline = (conv: Conversation) => {
    setPending(conv._id, 'decline');
    declineRequest(conv._id, {
      onSettled: () => setPending(conv._id, null),
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Message Requests
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <FlashList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <RequestCard
            conversation={item}
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId: item._id,
                otherUser: item.otherUser,
              })
            }
            onAccept={() => handleAccept(item)}
            onDecline={() => handleDecline(item)}
            actionPending={pendingById[item._id] ?? null}
          />
        )}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="mail-open-outline"
              size={48}
              color={theme.muted}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No message requests
            </Text>
            <Text style={[styles.emptySub, { color: theme.subtext }]}>
              When someone you're not connected with sends you a message,
              it will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const makeStyles = (theme: ReturnType<typeof useSocialTheme>) =>
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
    title: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 80,
      gap: 10,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700' },
    emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  });

export default MessageRequestsScreen;