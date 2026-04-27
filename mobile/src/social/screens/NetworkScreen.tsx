// src/social/screens/NetworkScreen.tsx
/**
 * NetworkScreen — your network overview.
 * -----------------------------------------------------------------------------
 * v2 layout (no pending-requests tab):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ Stats:  Followers · Following · Connections  │
 *   │ Suggested for you  ──────────────────────▸   │
 *   │ Ad placement (optional)                      │
 *   ├──────────────────────────────────────────────┤
 *   │ Tabs:  Followers │ Following │ Connections   │
 *   ├──────────────────────────────────────────────┤
 *   │ User rows (FollowButton + ChatActionButton)  │
 *   └──────────────────────────────────────────────┘
 */

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AdCard } from '../components/ads';
import {
  NetworkStats,
  SuggestionsRow,
} from '../components/network';
import {
  Chip,
  EmptyState,
  SectionHeader,
} from '../components/shared';
import SearchResultCard from '../components/shared/SearchResultCard';
import {
  useFollowers,
  useFollowing,
  useFollowStats,
  useFollowSuggestions,
  useToggleFollow,
} from '../hooks';
import { getAdForPlacement } from '../theme/adsConfig';
import { useSocialTheme } from '../theme/socialTheme';
import type { FollowTarget, SearchResult } from '../types';
import { useBulkConnectionStatus, useConnections } from '../hooks/useFollow';

type NetworkTab = 'followers' | 'following' | 'connections';
type AnyNav = NativeStackNavigationProp<any>;

/** Normalise heterogeneous list entries onto SearchResult shape. */
const toSearchResult = (entry: any): SearchResult | null => {
  if (!entry) return null;
  const u =
    (entry.user && typeof entry.user === 'object' ? entry.user : null) ??
    (entry.targetId && typeof entry.targetId === 'object'
      ? entry.targetId
      : null) ??
    (entry.follower && typeof entry.follower === 'object'
      ? entry.follower
      : null) ??
    entry;
  const id = u?._id ?? entry?._id;
  if (!id) return null;
  return {
    _id: id,
    name: u?.name ?? 'Unknown',
    avatar: u?.avatar,
    role: u?.role ?? 'candidate',
    headline: u?.headline,
    followerCount: u?.socialStats?.followerCount,
    verificationStatus: u?.verificationStatus,
  };
};

const NetworkScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<AnyNav>();
  const styles = makeStyles(theme);

  const [activeTab, setActiveTab] = useState<NetworkTab>('connections');
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);

  // ── Data hooks ──────────────────────────────────────────────────────
  const statsQ = useFollowStats();
  const suggestionsQ = useFollowSuggestions(10);
  const followersQ = useFollowers();
  const followingQ = useFollowing();
  const connectionsQ = useConnections();

  const { mutate: toggleFollow } = useToggleFollow();

  // Active list query
  const listQ =
    activeTab === 'followers'
      ? followersQ
      : activeTab === 'following'
      ? followingQ
      : connectionsQ;

  // Suggestion bulk-status (for the suggestion row buttons)
  const suggestionIds = useMemo(
    () => (suggestionsQ.data ?? []).map((u: any) => u._id).filter(Boolean),
    [suggestionsQ.data],
  );
  const suggestionStatus = useBulkConnectionStatus(suggestionIds);

  const ad = getAdForPlacement(theme.role, 'network');

  // ── List data normalisation ─────────────────────────────────────────
  const listData: SearchResult[] = useMemo(() => {
    const list = (listQ.data?.list ?? []) as any[];
    return list.map(toSearchResult).filter(Boolean) as SearchResult[];
  }, [listQ.data?.list]);

  const listUserIds = useMemo(
    () => listData.map((u) => u._id),
    [listData],
  );
  const listStatus = useBulkConnectionStatus(listUserIds);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (userId: string) => {
      setPendingFollowId(userId);
      toggleFollow(
        { targetId: userId, targetType: 'User', source: 'network' },
        { onSettled: () => setPendingFollowId(null) },
      );
    },
    [toggleFollow],
  );

  const goToProfile = useCallback(
    (userId: string) => navigation.navigate('PublicProfile', { userId }),
    [navigation],
  );

  const onRefresh = useCallback(() => {
    statsQ.refetch();
    suggestionsQ.refetch();
    listQ.refetch();
  }, [statsQ, suggestionsQ, listQ]);

  // ── Header (stats + suggestions + tabs) ─────────────────────────────
  const ListHeader = useCallback(
    () => (
      <View>
        <NetworkStats
          stats={statsQ.data}
          loading={statsQ.isLoading}
          onFollowersPress={() => setActiveTab('followers')}
          onFollowingPress={() => setActiveTab('following')}
          onConnectionsPress={() => setActiveTab('connections')}
        />

        {suggestionsQ.data && suggestionsQ.data.length > 0 ? (
          <>
            <SectionHeader title="Suggested for you" />
            <SuggestionsRow
              suggestions={suggestionsQ.data}
              loading={suggestionsQ.isLoading}
              pendingFollowId={pendingFollowId}
              onUserPress={goToProfile}
              onFollowPress={(u: FollowTarget) => handleToggle(u._id)}
            />
          </>
        ) : null}

        {ad ? (
          <View style={{ paddingTop: 8 }}>
            <AdCard ad={ad} />
          </View>
        ) : null}

        <SectionHeader title="Your network" />
        <View style={styles.tabs}>
          <Chip
            label={`Connections${
              statsQ.data?.totalConnections !== undefined
                ? ` · ${statsQ.data.totalConnections}`
                : ''
            }`}
            selected={activeTab === 'connections'}
            onPress={() => setActiveTab('connections')}
          />
          <Chip
            label={`Followers${
              statsQ.data?.followers !== undefined
                ? ` · ${statsQ.data.followers}`
                : ''
            }`}
            selected={activeTab === 'followers'}
            onPress={() => setActiveTab('followers')}
          />
          <Chip
            label={`Following${
              statsQ.data?.following !== undefined
                ? ` · ${statsQ.data.following}`
                : ''
            }`}
            selected={activeTab === 'following'}
            onPress={() => setActiveTab('following')}
          />
        </View>
      </View>
    ),
    [
      statsQ.data,
      statsQ.isLoading,
      suggestionsQ.data,
      suggestionsQ.isLoading,
      suggestionStatus.statusMap,
      pendingFollowId,
      activeTab,
      ad,
      goToProfile,
      handleToggle,
      styles.tabs,
    ],
  );

  // ── Empty states per tab ────────────────────────────────────────────
  const renderEmpty = () => {
    if (activeTab === 'followers') {
      return (
        <EmptyState
          icon="people-outline"
          title="No followers yet"
          subtitle="Share great content and keep engaging — followers will come."
        />
      );
    }
    if (activeTab === 'following') {
      return (
        <EmptyState
          icon="person-add-outline"
          title="You're not following anyone"
          subtitle="Explore the suggestions above or search to find people."
        />
      );
    }
    return (
      <EmptyState
        icon="link-outline"
        title="No connections yet"
        subtitle="When you and someone follow each other, you'll both appear here."
      />
    );
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <FlashList
        data={listData}
        keyExtractor={(u) => u._id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={listQ.isLoading ? null : renderEmpty()}
        onEndReached={() => listQ.hasNextPage && listQ.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={listQ.isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <SearchResultCard
            result={item}
            status={listStatus.statusMap[item._id] ?? 'none'}
            onPress={() => goToProfile(item._id)}
            onFollowPress={() => handleToggle(item._id)}
            followLoading={pendingFollowId === item._id}
          />
        )}
        ListFooterComponent={
          listQ.isFetchingNextPage ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ padding: 20 }}
            />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
};

const makeStyles = (_theme: ReturnType<typeof useSocialTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    tabs: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
  });

export default NetworkScreen;