// src/social/screens/MyPostsScreen.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreatePostFAB, FeedList } from '../components/feed';
import { CommentsSheet } from '../components/post';
import {
  useDeletePost,
  useDislike,
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
  const { mutate: dislike } = useDislike();
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

  const handleMenu = useCallback(
    (post: Post) => {
      const canEdit = !!post.canEdit;
      const canDelete = !!post.canDelete;
      const buttons: any[] = [];
      if (canEdit) {
        buttons.push({
          text: 'Edit',
          onPress: () => navigation.navigate('EditPost', { post }),
        });
      }
      if (canDelete) {
        buttons.push({
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Delete post?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deletePost(post._id),
              },
            ]),
        });
      }
      buttons.push({ text: 'Cancel', style: 'cancel' });
      Alert.alert('Post', undefined, buttons);
    },
    [navigation, deletePost]
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
        onDislike={handleDislike}
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
          onPress: () => navigation.navigate('CreatePost'),
        }}
      />

      <CreatePostFAB onPress={() => navigation.navigate('CreatePost')} />

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