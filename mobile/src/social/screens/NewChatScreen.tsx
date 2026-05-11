// src/social/screens/NewChatScreen.tsx — FINAL FIXED VERSION
/**
 * NewChatScreen — pick someone to message.
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 *   - Search bar with auto-focus
 *   - Connection suggestions when search is empty
 *   - Three-tier tap behavior:
 *       Connected (mutual)   → opens chat immediately
 *       Following (one-way)  → opens compose with request banner
 *       No follow            → disabled with "Follow first" badge
 *   - Full socialTheme integration
 *   - Skeleton loading
 *   - Empty states
 *   - Professional header with close button
 * 
 * Navigation: Modal presentation, replaces stack on success
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import SearchBar from '../components/search/SearchBar';
import NewChatRow from '../components/chat/NewChatRow';
import { useSocialTheme } from '../theme/socialTheme';
import { useFadeIn, useSkeletonPulse } from '../theme/animations';
import { useSocialSearch } from '../hooks/useSocialSearch';
import { useBulkConnectionStatus, useConnections } from '../hooks/useFollow';
import { useGetOrCreateConversation } from '../hooks/useConversations';
import { isDirectChat } from '../utils/connectionStatus';
import type { SearchResult } from '../types';
import type { ChatUser } from '../types/chat';
import type { ConnectionStatus } from '../types/follow';

// ─── Types ───────────────────────────────────────────────────────────────────

type AnyNav = NativeStackNavigationProp<any>;

// ─── Helper: shape connections into SearchResult ─────────────────────────────

const shapeConnectionResult = (entry: any): SearchResult | null => {
  const u =
    (entry?.user && typeof entry.user === 'object' ? entry.user : null) ??
    (entry?.targetId && typeof entry.targetId === 'object' ? entry.targetId : null) ??
    entry;
  const id = u?._id ?? entry?._id;
  if (!id) return null;
  return {
    _id: id,
    type: (u?.role ?? 'candidate') as any,
    name: u?.name ?? 'Unknown',
    avatar: u?.avatar ?? null,
    role: (u?.role ?? 'candidate') as any,
    headline: u?.headline ?? null,
    followerCount: u?.socialStats?.followerCount ?? u?.followerCount ?? 0,
    verificationStatus: u?.verificationStatus ?? 'none',
    followState: 'not_following',
    isMutual: false,
  };
};

// ─── Component ───────────────────────────────────────────────────────────────

const NewChatScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const styles = makeStyles(theme);

  const fadeIn = useFadeIn(100, 250);
  const skeletonOpacity = useSkeletonPulse();

  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;

  // ── Data ─────────────────────────────────────────────────────────────
  const connectionsQ = useConnections();
  const searchQ = useSocialSearch({ q: query, type: 'all', limit: 20 });
  const { mutate: openChat, isPending: opening } = useGetOrCreateConversation();

  // Shape connections into SearchResult for display
  const connectionResults: SearchResult[] = useMemo(() => {
    const rawList = (connectionsQ.data as any)?.list ?? (connectionsQ.data as any)?.data ?? [];
    if (!Array.isArray(rawList)) return [];
    return rawList.map(shapeConnectionResult).filter(Boolean) as SearchResult[];
  }, [connectionsQ.data]);

  // Search results from the API
  const searchResults: SearchResult[] = useMemo(() => {
    return searchQ.data?.results ?? [];
  }, [searchQ.data]);

  // Visible list: search results when searching, connections when idle
  const visible = isSearching ? searchResults : connectionResults;

  // Bulk connection status for all visible users
  const userIds = useMemo(() => visible.map((r) => r._id), [visible]);
  const { statusMap } = useBulkConnectionStatus(userIds);

  // ── Tap handler ──────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const status: ConnectionStatus = statusMap[result._id] ?? 'none';

      if (status === 'none' || status === 'follow_back' || status === 'blocked') {
        Toast.show({
          type: 'info',
          text1: 'Cannot message this person',
          text2: status === 'follow_back'
            ? 'They follow you, but you need to follow them back first.'
            : 'Follow this person first to send a message.',
          position: 'bottom',
          visibilityTime: 3000,
        });
        return;
      }
      if (status === 'self') return;

      const otherUser: ChatUser = {
        _id: result._id,
        name: result.name,
        avatar: result.avatar ?? undefined,
        role: result.role,
        headline: result.headline ?? undefined,
      };

      // FIX: Pass userId as plain string. The response is ConversationResponse
      // { success, data: Conversation, created } — we extract data._id.
      openChat(result._id, {
        onSuccess: (response: any) => {
          const conversation = response?.data ?? response;
          const convId = conversation?._id;

          if (!convId) {
            Toast.show({
              type: 'error',
              text1: 'Failed to open chat',
              text2: 'Could not get conversation ID.',
              position: 'bottom',
            });
            return;
          }

          navigation.replace('Chat', {
            conversationId: convId,
            otherUser,
            isRequestFlow: !isDirectChat(status),
          });
        },
        onError: (err: any) => {
          Toast.show({
            type: 'error',
            text1: 'Failed to open conversation',
            text2: err?.response?.data?.message ?? 'Please try again.',
            position: 'bottom',
          });
        },
      } as any);
    },
    [statusMap, openChat, navigation],
  );

  // ── Render item ──────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <NewChatRow
        result={item}
        status={statusMap[item._id] ?? 'none'}
        onPress={() => handleSelect(item)}
      />
    ),
    [statusMap, handleSelect],
  );

  const keyExtractor = useCallback((item: SearchResult) => item._id, []);

  // ── Empty / loading states ──────────────────────────────────────────
  const ListEmptyComponent = useMemo(() => {
    if (isSearching) {
      if (searchQ.isLoading) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.searchingText, { color: theme.subtext }]}>Searching...</Text>
          </View>
        );
      }
      return (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.withAlpha(theme.muted, 0.1) }]}>
            <Ionicons name="search-outline" size={48} color={theme.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No matches for "{trimmed}"</Text>
          <Text style={[styles.emptySub, { color: theme.subtext }]}>Try a different name or keyword.</Text>
        </View>
      );
    }
    if (connectionsQ.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.withAlpha(theme.primary, 0.08) }]}>
          <Ionicons name="people-outline" size={48} color={theme.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No connections yet</Text>
        <Text style={[styles.emptySub, { color: theme.subtext }]}>Search above to find someone to message.</Text>
      </View>
    );
  }, [isSearching, searchQ.isLoading, connectionsQ.isLoading, trimmed, theme, styles]);

  // ── Skeleton ─────────────────────────────────────────────────────────
  if (!isSearching && connectionsQ.isLoading && connectionResults.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={26} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>New message</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.searchWrap}>
          <Animated.View style={[styles.skeletonSearch, { backgroundColor: theme.skeleton, opacity: skeletonOpacity }]} />
        </View>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Animated.View key={i} style={[styles.skeletonRow, { opacity: skeletonOpacity }]}>
            <View style={[styles.skeletonAvatar, { backgroundColor: theme.skeleton }]} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '50%' }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '35%' }]} />
            </View>
            <View style={[styles.skeletonBadge, { backgroundColor: theme.skeleton }]} />
          </Animated.View>
        ))}
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Cancel">
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>New message</Text>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View style={[styles.searchWrap, { opacity: fadeIn }]}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search people..." autoFocus showCancel={false} />
      </Animated.View>

      {!isSearching && connectionResults.length > 0 && (
        <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.subtext }]}>YOUR CONNECTIONS</Text>
          <Text style={[styles.sectionCount, { color: theme.muted }]}>{connectionResults.length}</Text>
        </View>
      )}

      <FlashList
        data={visible}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={opening ? <ActivityIndicator color={theme.primary} style={{ paddingVertical: 20 }} /> : null}
      />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    searchWrap: { paddingHorizontal: 12, paddingVertical: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
    sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
    sectionCount: { fontSize: 12, fontWeight: '600' },
    listContent: { paddingBottom: theme.spacing.xl },
    centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 10 },
    searchingText: { fontSize: 14, marginTop: 4 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64, gap: 10 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    skeletonSearch: { height: 44, borderRadius: 22 },
    skeletonRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
    skeletonAvatar: { width: 48, height: 48, borderRadius: 24 },
    skeletonLine: { height: 12, borderRadius: 6 },
    skeletonBadge: { width: 80, height: 28, borderRadius: 14 },
  });

export default NewChatScreen;