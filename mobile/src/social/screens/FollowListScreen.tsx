// src/social/screens/FollowListScreen.tsx
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
import { UserCard } from '../components/network';
import { EmptyState, ErrorState } from '../components/shared';
import {
  useBulkFollowStatus,
  useFollowers,
  useFollowing,
  useToggleFollow,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import type { SearchResult } from '../types';
import type { SocialStackParamList } from '../navigation/types';

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

  // Normalise list entries to UserCard shape
  const listData: SearchResult[] = useMemo(() => {
    if (!listQ.data?.list) return [];
    return (listQ.data.list as any[]).map((entry: any): SearchResult => {
      const u = entry.user ?? entry.targetId ?? entry.follower ?? entry;
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
  }, [listQ.data?.list]);

  const listUserIds = useMemo(
    () => listData.map((u) => u._id).filter(Boolean),
    [listData]
  );
  const statusQ = useBulkFollowStatus(
    listUserIds,
    'User',
    listUserIds.length > 0
  );

  const handleToggle = useCallback(
    (targetId: string) => {
      setPendingFollowId(targetId);
      toggleFollow(
        { targetId, targetType: 'User', source: 'profile' },
        { onSettled: () => setPendingFollowId(null) }
      );
    },
    [toggleFollow]
  );

  const goToProfile = useCallback(
    (uid: string) => navigation.navigate('PublicProfile', { userId: uid }),
    [navigation]
  );

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
          <UserCard
            user={item}
            isFollowing={!!statusQ.data?.[item._id]?.following}
            followLoading={pendingFollowId === item._id}
            onPress={() => goToProfile(item._id)}
            onFollowPress={() => handleToggle(item._id)}
          />
        )}
        ListEmptyComponent={
          listQ.isLoading ? null : (
            <EmptyState
              icon={
                mode === 'followers' ? 'people-outline' : 'person-add-outline'
              }
              title={
                mode === 'followers' ? 'No followers yet' : 'Not following anyone'
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
    borderBottomWidth: 0.5,
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