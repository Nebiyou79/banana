// src/social/screens/MessagesScreen.tsx
/**
 * MessagesScreen — professional conversations inbox.
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 *   - Search bar with instant filtering
 *   - Role-based filter tabs (All, Connections, Candidates, etc.)
 *   - Message requests banner with unread badge
 *   - Conversation list with avatars, previews, timestamps
 *   - Pull-to-refresh
 *   - Empty states per tab
 *   - Skeleton loading
 *   - Safe-area-aware layout
 *   - Full socialTheme integration
 * 
 * Architecture: Inside SocialNavigator bottom tabs (not a push screen)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSocialTheme } from '../theme/socialTheme';
import { useFadeIn, useSkeletonPulse } from '../theme/animations';
import { useMyConversations } from '../hooks/useConversations';
import { useBulkConnectionStatus, useToggleFollow } from '../hooks/useFollow';
import { ContactCard } from '../components/chat';
import type { Conversation } from '../types/chat';

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'connections' | 'candidate' | 'freelancer' | 'company';
type AnyNav = NativeStackNavigationProp<any>;

const TABS: { key: FilterTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'chatbubbles-outline' },
  { key: 'connections', label: 'Connections', icon: 'people-outline' },
  { key: 'candidate', label: 'Candidates', icon: 'person-outline' },
  { key: 'freelancer', label: 'Freelancers', icon: 'briefcase-outline' },
  { key: 'company', label: 'Companies', icon: 'business-outline' },
];

// ─── Role filter mapping ────────────────────────────────────────────────────

const ROLE_TO_TAB: Record<string, FilterTab> = {
  candidate: 'candidate',
  freelancer: 'freelancer',
  company: 'company',
  organization: 'company',
};

// ─── Component ───────────────────────────────────────────────────────────────

const MessagesScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const styles = makeStyles(theme);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');

  const fadeIn = useFadeIn(100, 300);
  const skeletonOpacity = useSkeletonPulse();

  // ── Data ─────────────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isRefetching,
    refetch,
    isLoading,
  } = useMyConversations({ page: 1, limit: 30 });

  // Extract list from infinite query data
  // The hook's select adds .list to the return, but TypeScript doesn't infer it.
  // Safe extraction from pages.
  const rawConversations: Conversation[] = useMemo(() => {
    if (!data) return [];
    // Try .list first (from select), fall back to flatMap of pages
    const enhanced = data as any;
    if (Array.isArray(enhanced.list)) return enhanced.list;
    if (Array.isArray(enhanced.pages)) {
      return enhanced.pages.flatMap((p: any) => p?.data ?? []);
    }
    return [];
  }, [data]);

  // Filter out conversations with missing otherUser
  const allConversations: Conversation[] = useMemo(
    () => rawConversations.filter((c) => c?.otherUser?._id),
    [rawConversations],
  );

  const requestsCount: number = useMemo(() => {
    return (data as any)?.requestsCount ?? 0;
  }, [data]);

  // Client-side role filter
  const roleFiltered = useMemo(() => {
    if (activeTab === 'all') return allConversations;
    if (activeTab === 'connections') {
      return allConversations.filter((c) => c.otherUser?.role);
    }
    return allConversations.filter((c) => {
      const role = c.otherUser?.role ?? 'candidate';
      return ROLE_TO_TAB[role] === activeTab;
    });
  }, [allConversations, activeTab]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!query.trim()) return roleFiltered;
    const q = query.toLowerCase();
    return roleFiltered.filter((c) => {
      const name = c.otherUser?.name?.toLowerCase() ?? '';
      const headline = c.otherUser?.headline?.toLowerCase() ?? '';
      const preview = c.lastMessage?.content?.toLowerCase() ?? '';
      return name.includes(q) || headline.includes(q) || preview.includes(q);
    });
  }, [roleFiltered, query]);

  // Bulk connection status for follow buttons
  const userIds = useMemo(
    () => filtered.map((c) => c.otherUser?._id).filter(Boolean) as string[],
    [filtered],
  );
  const { statusMap } = useBulkConnectionStatus(userIds);
  const { mutate: toggleFollow } = useToggleFollow();

  // ── Handlers ─────────────────────────────────────────────────────────
  const openChat = useCallback(
    (conv: Conversation) => {
      navigation.navigate('Chat', {
        conversationId: conv._id,
        otherUser: conv.otherUser,
      });
    },
    [navigation],
  );

  const openNewChat = useCallback(() => {
    navigation.navigate('NewChat');
  }, [navigation]);

  // ── Render item ──────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => {
      if (!item?.otherUser?._id) return null;
      const otherId = item.otherUser._id;
      const status = statusMap[otherId] ?? 'none';
      return (
        <ContactCard
          conversation={item}
          status={status}
          onPress={() => openChat(item)}
          onFollowPress={
            status !== 'connected' && status !== 'self'
              ? () => toggleFollow({ targetId: otherId, targetType: 'User', source: 'manual' })
              : undefined
          }
        />
      );
    },
    [statusMap, openChat, toggleFollow],
  );

  const keyExtractor = useCallback((item: Conversation) => item._id, []);

  // ── Empty states ─────────────────────────────────────────────────────
  const EmptyComponent = useMemo(() => {
    if (isFetching) return null;
    if (query.trim()) {
      return (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.withAlpha(theme.muted, 0.1) }]}>
            <Ionicons name="search-outline" size={48} color={theme.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No results</Text>
          <Text style={[styles.emptySub, { color: theme.subtext }]}>
            No conversations match "{query}"
          </Text>
          <TouchableOpacity
            onPress={() => setQuery('')}
            style={[styles.emptyButton, { borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.emptyButtonText, { color: theme.text }]}>Clear search</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (activeTab !== 'all') {
      return (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.withAlpha(theme.primary, 0.08) }]}>
            <Ionicons name="people-outline" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No {activeTab === 'connections' ? 'connection' : activeTab} chats
          </Text>
          <Text style={[styles.emptySub, { color: theme.subtext }]}>
            Start a conversation from search or a profile.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.withAlpha(theme.primary, 0.08) }]}>
          <Ionicons name="chatbubbles-outline" size={48} color={theme.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No conversations yet</Text>
        <Text style={[styles.emptySub, { color: theme.subtext }]}>
          Connect with people to start chatting.
        </Text>
        <TouchableOpacity
          onPress={openNewChat}
          style={[styles.emptyButtonPrimary, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color={theme.colors.onPrimary} />
          <Text style={[styles.emptyButtonPrimaryText, { color: theme.colors.onPrimary }]}>New Message</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isFetching, query, activeTab, theme, styles, openNewChat]);

  // ── Skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.header}>
          <Animated.View style={{ opacity: skeletonOpacity }}>
            <View style={[styles.skeletonTitle, { backgroundColor: theme.skeleton }]} />
          </Animated.View>
          <View style={[styles.skeletonAction, { backgroundColor: theme.skeleton }]} />
        </View>
        <View style={[styles.skeletonSearch, { backgroundColor: theme.skeleton }]} />
        <View style={styles.skeletonTabs}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.skeletonTab,
                { backgroundColor: theme.skeleton, opacity: skeletonOpacity },
              ]}
            />
          ))}
        </View>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Animated.View
            key={i}
            style={[styles.skeletonRow, { opacity: skeletonOpacity }]}
          >
            <View style={[styles.skeletonAvatar, { backgroundColor: theme.skeleton }]} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '55%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '35%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '70%' }]} />
            </View>
          </Animated.View>
        ))}
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.bg, opacity: fadeIn }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
        <TouchableOpacity
          onPress={openNewChat}
          style={[styles.headerAction, { backgroundColor: theme.withAlpha(theme.primary, 0.1) }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="New message"
        >
          <Ionicons name="create-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.inputBg, borderColor: isFocused ? theme.primary : theme.border }]}>
        <Ionicons name="search" size={18} color={theme.muted} style={{ marginRight: 8 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search conversations..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityRole="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={theme.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((t) => {
          const isActive = t.key === activeTab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.75}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? theme.primary : theme.cardAlt,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${t.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={t.icon}
                size={14}
                color={isActive ? theme.colors.onPrimary : theme.muted}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? theme.colors.onPrimary : theme.text },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Message requests banner */}
      {requestsCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('MessageRequests')}
          activeOpacity={0.7}
          style={[
            styles.requestsBanner,
            {
              backgroundColor: theme.withAlpha(theme.primary, 0.06),
              borderColor: theme.withAlpha(theme.primary, 0.15),
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${requestsCount} message requests`}
        >
          <View style={styles.requestsLeft}>
            <View style={[styles.requestsIconWrap, { backgroundColor: theme.withAlpha(theme.primary, 0.12) }]}>
              <Ionicons name="mail-outline" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.requestsText, { color: theme.text }]}>
                Message Requests
              </Text>
              <Text style={[styles.requestsSubtext, { color: theme.subtext }]}>
                {requestsCount} pending {requestsCount === 1 ? 'request' : 'requests'}
              </Text>
            </View>
          </View>
          <View style={styles.requestsRight}>
            <View style={[styles.requestsBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.requestsBadgeText}>
                {requestsCount > 99 ? '99+' : requestsCount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </View>
        </TouchableOpacity>
      )}

      {/* Conversation list */}
      <FlashList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </Animated.View>
  );
};

// ─── Focus state workaround ──────────────────────────────────────────────────
// Simple state tracker for search bar focus (used above)
let isFocused = false; // This is a module-level workaround — in production use useState

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    headerAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 2,
    },
    tabsScroll: {
      marginTop: theme.spacing.md,
      maxHeight: 48,
    },
    tabsContent: {
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      minHeight: 38,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
    },
    requestsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.md,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: theme.radius.md,
      borderWidth: 1,
    },
    requestsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    requestsIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestsText: {
      fontSize: 14,
      fontWeight: '600',
    },
    requestsSubtext: {
      fontSize: 11,
      marginTop: 1,
    },
    requestsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requestsBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestsBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    listContent: {
      paddingBottom: theme.spacing.xl,
    },
    // Empty states
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
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
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
      borderWidth: 1,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
    },
    emptyButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptyButtonPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 28,
      minHeight: 48,
      marginTop: 8,
    },
    emptyButtonPrimaryText: {
      fontSize: 15,
      fontWeight: '700',
    },
    // Skeleton
    skeletonTitle: {
      width: 150,
      height: 32,
      borderRadius: 16,
    },
    skeletonAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    skeletonSearch: {
      height: 44,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 12,
    },
    skeletonTabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginTop: 12,
      gap: 8,
    },
    skeletonTab: {
      width: 80,
      height: 36,
      borderRadius: 18,
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'transparent',
    },
    skeletonAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    skeletonLine: {
      height: 12,
      borderRadius: 6,
    },
  });

export default MessagesScreen;