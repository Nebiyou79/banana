import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdCard } from '../components/ads';
import {
  NetworkStats,
  PendingRequestCard,
  SuggestionsRow,
  UserCard,
} from '../components/network';
import {
  Chip,
  EmptyState,
  SectionHeader,
} from '../components/shared';
import {
  useAcceptFollowRequest,
  useBulkFollowStatus,
  useFollowers,
  useFollowing,
  useFollowStats,
  useFollowSuggestions,
  usePendingRequests,
  useRejectFollowRequest,
  useToggleFollow,
} from '../hooks';
import { getAdForPlacement } from '../theme/adsConfig';
import { useSocialTheme } from '../theme/socialTheme';
import type { FollowTarget, SearchResult } from '../types';

type NetworkTab = 'followers' | 'following' | 'pending';

const NetworkScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<NetworkTab>('followers');
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);

  // Data hooks
  const statsQ = useFollowStats();
  const suggestionsQ = useFollowSuggestions(10);
  const followersQ = useFollowers();
  const followingQ = useFollowing();
  const pendingQ = usePendingRequests();

  const { mutate: toggleFollow } = useToggleFollow();
  const acceptM = useAcceptFollowRequest();
  const rejectM = useRejectFollowRequest();

  // Bulk follow-status for suggestions, so each card knows its state.
  const suggestionIds = useMemo(
    () => (suggestionsQ.data ?? []).map((u) => u._id),
    [suggestionsQ.data]
  );
  const bulkStatusQ = useBulkFollowStatus(
    suggestionIds,
    'User',
    suggestionIds.length > 0
  );

  const ad = getAdForPlacement(theme.role, 'network');

  // ── Handlers ─────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (userId: string) => {
      setPendingFollowId(userId);
      toggleFollow(
        { targetId: userId, targetType: 'User', source: 'network' },
        {
          onSettled: () => setPendingFollowId(null),
        }
      );
    },
    [toggleFollow]
  );

  const goToProfile = useCallback(
    (userId: string) => navigation.navigate('PublicProfile', { userId }),
    [navigation]
  );

  const onRefresh = useCallback(() => {
    statsQ.refetch();
    suggestionsQ.refetch();
    followersQ.refetch();
    followingQ.refetch();
    pendingQ.refetch();
  }, [statsQ, suggestionsQ, followersQ, followingQ, pendingQ]);

  // ── Current list (followers/following/pending) ───────────────────
  const listQ =
    activeTab === 'followers'
      ? followersQ
      : activeTab === 'following'
      ? followingQ
      : null;

  const listData: SearchResult[] = useMemo(() => {
    if (!listQ?.data?.list) return [];
    // Normalise list entries into SearchResult-like shape expected by UserCard
    return (listQ.data.list as any[]).map((entry: any): SearchResult => {
      const u = entry.user ?? entry.targetId ?? entry;
      return {
        _id: u?._id ?? entry?._id ?? '',
        name: u?.name ?? 'Unknown',
        avatar: u?.avatar,
        role: u?.role ?? 'candidate',
        headline: u?.headline,
        followerCount: u?.socialStats?.followerCount,
        verificationStatus: u?.verificationStatus,
      };
    });
  }, [listQ?.data?.list]);

  const listUserIds = useMemo(
    () => listData.map((u) => u._id).filter(Boolean),
    [listData]
  );
  const listStatusQ = useBulkFollowStatus(
    listUserIds,
    'User',
    activeTab !== 'pending' && listUserIds.length > 0
  );

  // ── Header (stats + suggestions + tabs) ──────────────────────────
  const ListHeader = useCallback(
    () => (
      <View>
        <NetworkStats
          stats={statsQ.data}
          loading={statsQ.isLoading}
          onFollowersPress={() => setActiveTab('followers')}
          onFollowingPress={() => setActiveTab('following')}
        />

        {suggestionsQ.data && suggestionsQ.data.length > 0 ? (
          <>
            <SectionHeader title="Suggested for you" />
            <SuggestionsRow
              suggestions={suggestionsQ.data}
              loading={suggestionsQ.isLoading}
              followStatus={bulkStatusQ.data}
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
          <Chip
            label={`Requests${
              pendingQ.data?.length ? ` · ${pendingQ.data.length}` : ''
            }`}
            selected={activeTab === 'pending'}
            onPress={() => setActiveTab('pending')}
          />
        </View>
      </View>
    ),
    [
      statsQ.data,
      statsQ.isLoading,
      suggestionsQ.data,
      suggestionsQ.isLoading,
      bulkStatusQ.data,
      pendingFollowId,
      activeTab,
      pendingQ.data,
      ad,
      goToProfile,
      handleToggle,
    ]
  );

  // ── Empty-state per tab ──────────────────────────────────────────
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
        icon="mail-open-outline"
        title="No pending requests"
        subtitle="Follow requests awaiting your approval will appear here."
      />
    );
  };

  // ── Pending tab: render pending list ─────────────────────────────
  if (activeTab === 'pending') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.bg }]}
        edges={['top']}
      >
        <FlashList
          data={pendingQ.data ?? []}
          keyExtractor={(item: any) =>
            item?._id ?? String(Math.random())
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={pendingQ.isLoading ? null : renderEmpty()}
          refreshControl={
            <RefreshControl
              refreshing={pendingQ.isRefetching}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }: any) => {
            const target: FollowTarget =
              item?.follower && typeof item.follower === 'object'
                ? item.follower
                : {
                    _id: item?.follower ?? item?._id ?? '',
                    name: item?.name ?? 'Unknown',
                    avatar: item?.avatar,
                    role: item?.role,
                    headline: item?.headline,
                  };
            return (
              <PendingRequestCard
                followId={item._id}
                user={target}
                createdAt={item.createdAt}
                onPress={() => goToProfile(target._id)}
                onAccept={() => acceptM.mutate(item._id)}
                onReject={() => rejectM.mutate(item._id)}
                acceptLoading={
                  acceptM.isPending && acceptM.variables === item._id
                }
                rejectLoading={
                  rejectM.isPending && rejectM.variables === item._id
                }
              />
            );
          }}
          ListFooterComponent={
            pendingQ.isLoading ? (
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
  }

  // ── Followers / Following list ───────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <FlashList
        data={listData}
        keyExtractor={(u) => u._id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={listQ?.isLoading ? null : renderEmpty()}
        onEndReached={() => listQ?.hasNextPage && listQ.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={listQ?.isRefetching ?? false}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <UserCard
            user={item}
            isFollowing={
              !!listStatusQ.data?.[item._id]?.following
            }
            followLoading={pendingFollowId === item._id}
            onPress={() => goToProfile(item._id)}
            onFollowPress={() => handleToggle(item._id)}
          />
        )}
        ListFooterComponent={
          listQ?.isFetchingNextPage ? (
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default NetworkScreen;