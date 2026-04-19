import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedList } from '../components/feed';
import { CommentsSheet } from '../components/post';
import {
  useReact,
  useRemoveInteraction,
  useSavedPosts,
  useToggleSavePost,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import type { AdConfig, Post, ReactionType } from '../types';

const SavedPostsScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();

  const savedQ = useSavedPosts();
  const { mutate: react } = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: toggleSave } = useToggleSavePost();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const posts = savedQ.data?.posts ?? [];

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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={[]}
    >
      <FeedList
        posts={posts}
        loading={savedQ.isLoading}
        refreshing={savedQ.isRefetching}
        onRefresh={savedQ.refetch}
        onEndReached={() => savedQ.fetchNextPage()}
        hasNextPage={savedQ.hasNextPage}
        isFetchingNextPage={savedQ.isFetchingNextPage}
        onReact={handleReact}
        onRemoveReact={removeReact}
        onComment={(p) => {
          setSelectedPost(p);
          setSheetVisible(true);
        }}
        onShare={handleShare}
        onSave={(id, isSaved) => toggleSave({ id, isSaved })}
        onAuthorPress={(userId) =>
          navigation.navigate('PublicProfile', { userId })
        }
        onAdPress={handleAdPress}
        adPlacement="savedPosts"
        emptyTitle="Nothing saved yet"
        emptySubtitle="Tap the bookmark on any post to save it for later."
        emptyIcon="bookmark-outline"
      />

      <CommentsSheet
        visible={sheetVisible}
        post={selectedPost}
        onClose={() => setSheetVisible(false)}
        onAuthorPress={(userId) =>
          navigation.navigate('PublicProfile', { userId })
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default SavedPostsScreen;