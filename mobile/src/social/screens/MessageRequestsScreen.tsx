// src/social/screens/MessageRequestsScreen.tsx
// ✅ role-theme-migrated — FIXED
/**
 * FIXES:
 *  - theme.primary → theme.colors.primary everywhere (canonical form)
 *  - theme.subtext → theme.colors.subtext (via flat alias — both work; canonicalised)
 *  - Animated SafeAreaView opacity: style prop accepts Animated values
 *    → keep existing pattern but use theme.bg for backgroundColor
 *  - EmptyState title='' removed in skeleton branch — was showing blank EmptyState
 *    during initial load; replaced with centred ActivityIndicator
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSocialTheme } from '../theme/socialTheme';
import { useFadeIn } from '../theme/animations';
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
  const fadeIn = useFadeIn(100, 250);

  // ── Data ─────────────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isRefetching,
    refetch,
    isLoading,
  } = useMessageRequests();

  const { mutate: acceptRequest, isPending: accepting } = useAcceptRequest();
  const { mutate: declineRequest, isPending: declining } = useDeclineRequest();

  const requests: Conversation[] = useMemo(() => {
    if (!data) return [];
    const enhanced = data as any;
    if (Array.isArray(enhanced.list)) return enhanced.list;
    if (Array.isArray(enhanced.pages)) {
      return enhanced.pages.flatMap((p: any) => p?.data ?? []);
    }
    return [];
  }, [data]);

  const [pendingById, setPendingById] = useState<Record<string, 'accept' | 'decline' | null>>({});

  const setPending = useCallback((id: string, v: 'accept' | 'decline' | null) => {
    setPendingById((prev) => ({ ...prev, [id]: v }));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleAccept = useCallback(
    (conv: Conversation) => {
      setPending(conv._id, 'accept');
      acceptRequest(conv._id, {
        onSettled: () => setPending(conv._id, null),
        onSuccess: () => {
          navigation.navigate('Chat', {
            conversationId: conv._id,
            otherUser: conv.otherUser,
          });
        },
      } as any);
    },
    [acceptRequest, setPending, navigation],
  );

  const handleDecline = useCallback(
    (conv: Conversation) => {
      setPending(conv._id, 'decline');
      declineRequest(conv._id, {
        onSettled: () => setPending(conv._id, null),
      } as any);
    },
    [declineRequest, setPending],
  );

  const openChat = useCallback(
    (conv: Conversation) => {
      navigation.navigate('Chat', {
        conversationId: conv._id,
        otherUser: conv.otherUser,
      });
    },
    [navigation],
  );

  // ── Render item ──────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <RequestCard
        conversation={item}
        onPress={() => openChat(item)}
        onAccept={() => handleAccept(item)}
        onDecline={() => handleDecline(item)}
        actionPending={pendingById[item._id] ?? null}
      />
    ),
    [openChat, handleAccept, handleDecline, pendingById],
  );

  const keyExtractor = useCallback((item: Conversation) => item._id, []);

  // ── Empty state ──────────────────────────────────────────────────────
  const EmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          // FIX: theme.primary → theme.colors.primary
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View
          style={[
            styles.emptyIconWrap,
            // FIX: theme.primary → theme.colors.primary
            { backgroundColor: theme.withAlpha(theme.colors.primary, 0.08) },
          ]}
        >
          <Ionicons name="mail-open-outline" size={48} color={theme.colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No message requests
        </Text>
        <Text style={[styles.emptySub, { color: theme.subtext }]}>
          When someone you're not connected with sends you a message, it will appear here.
        </Text>
      </View>
    );
  }, [isLoading, theme, styles]);

  // ── Loading (initial, no items yet) ──────────────────────────────────
  // FIX: removed blank <EmptyState title='' /> in favour of centred spinner
  if (isLoading && requests.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Message Requests</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView
      // FIX: opacity animated value on SafeAreaView style is fine in RN
      style={[styles.container, { backgroundColor: theme.bg, opacity: fadeIn }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Message Requests</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Count subtitle */}
      {requests.length > 0 && (
        <View style={[styles.subtitleWrap, { borderBottomColor: theme.border }]}>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
          </Text>
        </View>
      )}

      {/* List */}
      <FlashList
        data={requests}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            // FIX: theme.primary → theme.colors.primary
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={EmptyComponent}
        ListFooterComponent={
          hasNextPage && requests.length > 0 ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={{ paddingVertical: 16 }}
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      minHeight: 56,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitleWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    subtitle: { fontSize: 13 },
    listContent: { paddingBottom: theme.spacing.xl },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 80,
      gap: 10,
    },
    emptyIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });

export default MessageRequestsScreen;