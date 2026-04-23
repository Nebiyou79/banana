// src/social/screens/FeedScreen.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
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

  // Pass followingOnly=true when the Following tab is active so the
  // backend filters server-side; the client-side trending fallback lives
  // inside useFeed.
  const filters = useMemo(
    () => ({
      sortBy: activeSort,
      ...(activeSort === 'following' ? { followingOnly: true } : {}),
    }),
    [activeSort]
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
      react({
        postId,
        reaction,
        hasInteraction: !!current?.userInteraction,
      });
    },
    [posts, react]
  );

  const handleDislike = useCallback(
    (postId: string) => dislike({ postId }),
    [dislike]
  );

  const handleShare = useCallback(async (post: Post) => {
    try {
      await Share.share({
        message: post.content?.slice(0, 180) ?? 'Check this out on Banana',
      });
    } catch {
      /* noop */
    }
  }, []);

  const handleAuthorPress = useCallback(
    (userId: string) => {
      navigation.navigate('PublicProfile', { userId });
    },
    [navigation]
  );

  const handleAdPress = useCallback(
    (ad: AdConfig) => {
      if (ad.ctaRoute) {
        try {
          navigation.navigate(ad.ctaRoute as any);
        } catch {
          /* noop */
        }
      }
    },
    [navigation]
  );

  const handleComment = useCallback((post: Post) => {
    setSelectedPost(post);
    setSheetVisible(true);
  }, []);

  const handleCreatePress = useCallback(() => {
    navigation.navigate('CreatePost');
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <FeedTabs active={activeSort} onChange={setActiveSort} />

      <View style={{ flex: 1 }}>
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

      <CreatePostFAB onPress={handleCreatePress} />

      <CommentsSheet
        visible={sheetVisible}
        post={selectedPost}
        onClose={() => setSheetVisible(false)}
        onAuthorPress={handleAuthorPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default FeedScreen;