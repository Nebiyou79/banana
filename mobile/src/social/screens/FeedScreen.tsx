import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommentsSheet } from '../components/post';
import { CreatePostFAB, FeedList, FeedTabs } from '../components/feed';
import type { FeedSort } from '../components/feed';
import {
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
    () => ({ sortBy: activeSort }),
    [activeSort]
  );

  const feedQ = useFeed(filters);
  const { mutate: react } = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: toggleSave } = useToggleSavePost();

  // Comments sheet state (owned by this screen so the sheet persists across
  // post re-renders inside the FlashList).
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
          /* route may not exist in this navigator — swallow */
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
    try {
      navigation.navigate('CreatePost');
    } catch {
      /* hook up once CreatePostScreen is added */
    }
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
          onComment={handleComment}
          onShare={handleShare}
          onSave={(id, isSaved) => toggleSave({ id, isSaved })}
          onAuthorPress={handleAuthorPress}
          onAdPress={handleAdPress}
          adPlacement="feed"
          emptyTitle="No posts yet"
          emptySubtitle="Follow more people or create your first post to fill your feed."
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