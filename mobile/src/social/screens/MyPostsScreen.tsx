import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreatePostFAB, FeedList } from '../components/feed';
import { CommentsSheet } from '../components/post';
import {
  useDeletePost,
  useMyPosts,
  useReact,
  useRemoveInteraction,
  useToggleSavePost,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import type { AdConfig, Post, ReactionType } from '../types';

const MyPostsScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();

  const myPostsQ = useMyPosts();
  const { mutate: react } = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: toggleSave } = useToggleSavePost();
  const { mutate: deletePost } = useDeletePost();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const posts = myPostsQ.data?.posts ?? [];

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

  const handleMenu = useCallback(
    (post: Post) => {
      // Minimal default: delete. A richer action sheet can replace this.
      if (post.canDelete) {
        deletePost(post._id);
      }
    },
    [deletePost]
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={[]}
    >
      <FeedList
        posts={posts}
        loading={myPostsQ.isLoading}
        refreshing={myPostsQ.isRefetching}
        onRefresh={myPostsQ.refetch}
        onEndReached={() => myPostsQ.fetchNextPage()}
        hasNextPage={myPostsQ.hasNextPage}
        isFetchingNextPage={myPostsQ.isFetchingNextPage}
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
        onMenuPress={handleMenu}
        onAdPress={handleAdPress}
        adPlacement="myPosts"
        emptyTitle="You haven't posted yet"
        emptySubtitle="Share your first update and start building your presence."
        emptyIcon="create-outline"
        emptyAction={{
          label: 'Create post',
          onPress: () => {
            try {
              navigation.navigate('CreatePost');
            } catch {
              /* noop */
            }
          },
        }}
      />

      <CreatePostFAB
        onPress={() => {
          try {
            navigation.navigate('CreatePost');
          } catch {
            /* noop */
          }
        }}
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

export default MyPostsScreen;