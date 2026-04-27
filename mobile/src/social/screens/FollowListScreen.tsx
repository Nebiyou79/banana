// src/social/screens/FollowListScreen.tsx
/**
 * FollowListScreen — followers / following list for a given user.
 * -----------------------------------------------------------------------------
 * Updated for the v2 follow system:
 *   - No pending logic anywhere.
 *   - Uses the new `useBulkConnectionStatus` so each row's button shows
 *     Follow / Following / Follow Back correctly.
 *   - Pulls list data from the v2 hooks (`useFollowers` / `useFollowing`).
 *
 * The `UserCard` component is expected to accept a `connectionStatus` prop
 * (the v2-aware variant). If your UserCard hasn't been migrated yet, you
 * can swap to `<SearchResultCard>` here without losing functionality.
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchResultCard from '../components/shared/SearchResultCard';
import { EmptyState, ErrorState } from '../components/shared';
import {
  useFollowers,
  useFollowing,
  useToggleFollow,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import type { SearchResult } from '../types';
import type { SocialStackParamList } from '../navigation/types';
import { useBulkConnectionStatus } from '../hooks/useFollow';

type FollowListRoute = RouteProp<
  SocialStackParamList,
  'Followers' | 'Following'
>;

const FollowListScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<FollowListRoute>();
  const userId = route.params?.userId;
  const title =
    route.params?.title ??
    (route.name === 'Following' ? 'Following' : 'Followers');

  const mode: 'followers' | 'following' =
    route.name === 'Following' ? 'following' : 'followers';

  const followersQ = useFollowers(userId);
  const followingQ = useFollowing(userId);
  const listQ = mode === 'followers' ? followersQ : followingQ;

  const { mutate: toggleFollow } = useToggleFollow();
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);

  // ── Normalise list entries onto SearchResult shape ─────────────────────
  const listData: SearchResult[] = useMemo(() => {
    const list = listQ.data?.list as any[] | undefined;
    if (!list?.length) return [];
    return list
      .map((entry: any): SearchResult | null => {
        const u =
          (entry?.user && typeof entry.user === 'object' ? entry.user : null) ??
          (entry?.targetId && typeof entry.targetId === 'object'
            ? entry.targetId
            : null) ??
          (entry?.follower && typeof entry.follower === 'object'
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
      })
      .filter(Boolean) as SearchResult[];
  }, [listQ.data?.list]);

  const listUserIds = useMemo(
    () => listData.map((u) => u._id),
    [listData],
  );
  const { statusMap } = useBulkConnectionStatus(listUserIds);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (targetId: string) => {
      setPendingFollowId(targetId);
      toggleFollow(
        { targetId, targetType: 'User', source: 'profile' },
        { onSettled: () => setPendingFollowId(null) },
      );
    },
    [toggleFollow],
  );

  const goToProfile = useCallback(
    (uid: string) => navigation.navigate('PublicProfile', { userId: uid }),
    [navigation],
  );

  // ── Render ─────────────────────────────────────────────────────────────
  if (listQ.isError) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.bg }]}
        edges={['top']}
      >
        <ErrorState
          message={`Couldn't load ${mode}`}
          onRetry={listQ.refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <FlashList
        data={listData}
        keyExtractor={(u) => u._id}
        onEndReached={() => listQ.hasNextPage && listQ.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={listQ.isRefetching}
            onRefresh={listQ.refetch}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <SearchResultCard
            result={item}
            status={statusMap[item._id] ?? 'none'}
            onPress={() => goToProfile(item._id)}
            onFollowPress={() => handleToggle(item._id)}
            followLoading={pendingFollowId === item._id}
          />
        )}
        ListEmptyComponent={
          listQ.isLoading ? null : (
            <EmptyState
              icon={
                mode === 'followers' ? 'people-outline' : 'person-add-outline'
              }
              title={
                mode === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone'
              }
              subtitle={
                mode === 'followers'
                  ? 'Followers will appear here as they join.'
                  : 'Accounts you follow will appear here.'
              }
            />
          )
        }
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FollowListScreen;