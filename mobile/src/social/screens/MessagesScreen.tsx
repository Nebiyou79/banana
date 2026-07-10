// src/social/screens/MessagesScreen.tsx
// ✅ role-theme-migrated — FIXED
/**
 * FIXES:
 *  - theme.colors.onPrimary doesn't exist → replaced with theme.colors.white
 *  - Missing SafeAreaView wrapper (was plain View) → added with edges=['top']
 *  - Module-level `isFocused` variable removed (was dead code)
 *  - KeyboardAvoidingView not needed here (no input in screen root)
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
  { key: 'all',         label: 'All',         icon: 'chatbubbles-outline' },
  { key: 'connections', label: 'Connections', icon: 'people-outline' },
  { key: 'candidate',   label: 'Candidates',  icon: 'person-outline' },
  { key: 'freelancer',  label: 'Freelancers', icon: 'briefcase-outline' },
  { key: 'company',     label: 'Companies',   icon: 'business-outline' },
];

const ROLE_TO_TAB: Record<string, FilterTab> = {
  candidate:    'candidate',
  freelancer:   'freelancer',
  company:      'company',
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

  const rawConversations: Conversation[] = useMemo(() => {
    if (!data) return [];
    const enhanced = data as any;
    if (Array.isArray(enhanced.list)) return enhanced.list;
    if (Array.isArray(enhanced.pages)) {
      return enhanced.pages.flatMap((p: any) => p?.data ?? []);
    }
    return [];
  }, [data]);

  const allConversations: Conversation[] = useMemo(
    () => rawConversations.filter((c) => c?.otherUser?._id),
    [rawConversations],
  );

  const requestsCount: number = useMemo(() => (data as any)?.requestsCount ?? 0, [data]);

  const roleFiltered = useMemo(() => {
    if (activeTab === 'all') return allConversations;
    if (activeTab === 'connections') return allConversations.filter((c) => c.otherUser?.role);
    return allConversations.filter((c) => {
      const role = c.otherUser?.role ?? 'candidate';
      return ROLE_TO_TAB[role] === activeTab;
    });
  }, [allConversations, activeTab]);

  const filtered = useMemo(() => {
    if (!query.trim()) return roleFiltered;
    const q = query.toLowerCase();
    return roleFiltered.filter((c) => {
      const name    = c.otherUser?.name?.toLowerCase() ?? '';
      const headline = c.otherUser?.headline?.toLowerCase() ?? '';
      const preview = c.lastMessage?.content?.toLowerCase() ?? '';
      return name.includes(q) || headline.includes(q) || preview.includes(q);
    });
  }, [roleFiltered, query]);

  const userIds = useMemo(
    () => filtered.map((c) => c.otherUser?._id).filter(Boolean) as string[],
    [filtered],
  );
  const { statusMap } = useBulkConnectionStatus(userIds);
  const { mutate: toggleFollow } = useToggleFollow();

  // ── Handlers ─────────────────────────────────────────────────────────
  const openChat = useCallback(
    (conv: Conversation) => {
      navigation.navigate('Chat', { conversationId: conv._id, otherUser: conv.otherUser });
    },
    [navigation],
  );

  const openNewChat = useCallback(() => navigation.navigate('NewChat'), [navigation]);

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
          <Ionicons name="create-outline" size={18} color={theme.colors.white} />
          {/* FIX: theme.colors.onPrimary doesn't exist → use theme.colors.white */}
          <Text style={[styles.emptyButtonPrimaryText, { color: theme.colors.white }]}>
            New Message
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [isFetching, query, activeTab, theme, styles, openNewChat]);

  // ── Skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={styles.header}>
          <Animated.View style={{ opacity: skeletonOpacity }}>
            <View style={[styles.skeletonTitle, { backgroundColor: theme.skeleton }]} />
          </Animated.View>
          <View style={[styles.skeletonAction, { backgroundColor: theme.skeleton }]} />
        </View>
        <View style={[styles.skeletonSearch, { backgroundColor: theme.skeleton }]} />
        <View style={styles.skeletonTabs}>
          {[80, 110, 95, 105].map((w, i) => (
            <Animated.View
              key={i}
              style={[styles.skeletonTab, { backgroundColor: theme.skeleton, width: w, opacity: skeletonOpacity }]}
            />
          ))}
        </View>
        {[1, 2, 3, 4, 5].map((i) => (
          <Animated.View key={i} style={[styles.skeletonRow, { opacity: skeletonOpacity }]}>
            <View style={[styles.skeletonAvatar, { backgroundColor: theme.skeleton }]} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '55%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '80%' }]} />
            </View>
          </Animated.View>
        ))}
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────
  return (
    // FIX: wrap in SafeAreaView with edges=['top'] — was using plain Animated.View
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeIn }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
          <TouchableOpacity
            onPress={openNewChat}
            style={[styles.headerAction, { backgroundColor: theme.withAlpha(theme.primary, 0.12) }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="New message"
          >
            <Ionicons name="create-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations..."
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active
                      ? theme.withAlpha(theme.primary, 0.15)
                      : theme.withAlpha(theme.card, 0.6),
                    borderColor: active
                      ? theme.withAlpha(theme.primary, 0.5)
                      : theme.border,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={tab.icon}
                  size={14}
                  color={active ? theme.primary : theme.muted}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? theme.primary : theme.subtext },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Message requests banner */}
        {requestsCount > 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('MessageRequests')}
            style={[
              styles.requestsBanner,
              {
                backgroundColor: theme.withAlpha(theme.primary, 0.08),
                borderColor: theme.withAlpha(theme.primary, 0.25),
              },
            ]}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.requestsLeft}>
              <View
                style={[
                  styles.requestsIconWrap,
                  { backgroundColor: theme.withAlpha(theme.primary, 0.15) },
                ]}
              >
                <Ionicons name="mail-unread-outline" size={20} color={theme.primary} />
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
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
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
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 2 },
    tabsScroll: { marginTop: theme.spacing.md, maxHeight: 48 },
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
    tabText: { fontSize: 13, fontWeight: '600' },
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
    requestsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    requestsIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestsText: { fontSize: 14, fontWeight: '600' },
    requestsSubtext: { fontSize: 11, marginTop: 1 },
    requestsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    requestsBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestsBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    listContent: { paddingBottom: theme.spacing.xl },
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
    emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
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
    emptyButtonText: { fontSize: 14, fontWeight: '600' },
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
    emptyButtonPrimaryText: { fontSize: 15, fontWeight: '700' },
    // Skeleton
    skeletonTitle: { width: 150, height: 32, borderRadius: 16 },
    skeletonAction: { width: 44, height: 44, borderRadius: 22 },
    skeletonSearch: { height: 44, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
    skeletonTabs: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 8 },
    skeletonTab: { height: 36, borderRadius: 18 },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    skeletonAvatar: { width: 56, height: 56, borderRadius: 28 },
    skeletonLine: { height: 12, borderRadius: 6 },
  });

export default MessagesScreen;