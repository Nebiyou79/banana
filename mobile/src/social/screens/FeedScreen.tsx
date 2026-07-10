// src/social/screens/FeedScreen.tsx
// ✅ role-theme-migrated — FIXED
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreatePostFAB, FeedList, FeedTabs } from '../components/feed';
import type { FeedSort } from '../components/feed';
import { CommentsSheet } from '../components/post';
import {
  useDislike,
  useFeed,
  useReact,
  useRemoveInteraction,
  useToggleSavePost,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import type { AdConfig, Post, ReactionType } from '../types';

const FeedScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();

  const [activeSort, setActiveSort] = useState<FeedSort>('latest');

  const filters = useMemo(
    () => ({
      sortBy: activeSort,
      ...(activeSort === 'following' ? { followingOnly: true } : {}),
    }),
    [activeSort],
  );

  const feedQ = useFeed(filters);
  const { mutate: react } = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: dislike } = useDislike();
  const { mutate: toggleSave } = useToggleSavePost();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const posts = feedQ.data?.posts ?? [];

  const handleReact = useCallback(
    (postId: string, reaction: ReactionType) => {
      const current = posts.find((p) => p._id === postId);
      react({ postId, reaction, hasInteraction: !!current?.userInteraction });
    },
    [posts, react],
  );

  const handleDislike = useCallback(
    (postId: string) => dislike({ postId }),
    [dislike],
  );

  const handleShare = useCallback(async (post: Post) => {
    try {
      await Share.share({
        message: post.content?.slice(0, 180) ?? 'Check this out on Banana',
      });
    } catch { /* noop */ }
  }, []);

  const handleAuthorPress = useCallback(
    (userId: string) => navigation.navigate('PublicProfile', { userId }),
    [navigation],
  );

  const handleAdPress = useCallback(
    (ad: AdConfig) => {
      if (ad.ctaRoute) {
        try { navigation.navigate(ad.ctaRoute as any); } catch { /* noop */ }
      }
    },
    [navigation],
  );

  const handleComment = useCallback((post: Post) => {
    setSelectedPost(post);
    setSheetVisible(true);
  }, []);

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

  return (
    <LinearGradient
      colors={theme.bgGradient}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Role-tinted top bar */}
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <Text style={[styles.appName, { color: theme.text }]}>Banana</Text>
          <View
            style={[
              styles.rolePill,
              {
                backgroundColor: theme.withAlpha(theme.colors.primary, 0.12),
                borderColor: theme.withAlpha(theme.colors.primary, 0.28),
              },
            ]}
          >
            <Text style={[styles.rolePillText, { color: theme.colors.primary }]}>
              {theme.role.charAt(0).toUpperCase() + theme.role.slice(1)}
            </Text>
          </View>
        </View>

        <FeedTabs active={activeSort} onChange={setActiveSort} />

        <View style={styles.listWrap}>
          <FeedList
            posts={posts}
            loading={feedQ.isLoading}
            refreshing={feedQ.isRefetching}
            onRefresh={feedQ.refetch}
            onEndReached={() => feedQ.fetchNextPage()}
            hasNextPage={feedQ.hasNextPage}
            isFetchingNextPage={feedQ.isFetchingNextPage}
            onReact={handleReact}
            onRemoveReact={removeReact}
            onDislike={handleDislike}
            onComment={handleComment}
            onShare={handleShare}
            onSave={(id, isSaved) => toggleSave({ id, isSaved })}
            onAuthorPress={handleAuthorPress}
            onAdPress={handleAdPress}
            adPlacement="feed"
            cardMode="feed"
            emptyTitle={
              activeSort === 'following' ? 'No posts from people you follow' : 'No posts yet'
            }
            emptySubtitle={
              activeSort === 'following'
                ? 'Follow more people to see their updates here.'
                : 'Follow more people or create your first post to fill your feed.'
            }
            emptyIcon="newspaper-outline"
            emptyAction={{ label: 'Create post', onPress: handleCreatePress }}
          />
        </View>

        {/* FAB sits inside SafeAreaView so it respects bottom insets */}
        <CreatePostFAB onPress={handleCreatePress} />

        <CommentsSheet
          visible={sheetVisible}
          post={selectedPost}
          onClose={() => setSheetVisible(false)}
          onAuthorPress={handleAuthorPress}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  listWrap: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FeedScreen;