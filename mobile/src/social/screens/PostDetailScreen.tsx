// src/social/screens/PostDetailScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommentItem, PostCard } from '../components/post';
import { EmptyState, ErrorState } from '../components/shared';
import {
  useAddComment,
  useComments,
  useDislike,
  usePost,
  useReact,
  useRemoveInteraction,
  useSharePost,
  useToggleCommentLike,
  useToggleSavePost,
} from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import type { Comment, Post, ReactionType } from '../types';
import type { SocialStackParamList } from '../navigation/types';

type PostDetailRoute = RouteProp<SocialStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<PostDetailRoute>();
  const postId = route.params?.postId ?? '';

  const postQ = usePost(postId);
  const commentsQ = useComments(postId);
  const { mutate: react } = useReact();
  const { mutate: removeReact } = useRemoveInteraction();
  const { mutate: dislike } = useDislike();
  const { mutate: toggleSave } = useToggleSavePost();
  const { mutate: sharePost } = useSharePost();
  const { mutate: addComment, isPending: commentPending } =
    useAddComment(postId);
  const { mutate: toggleCommentLike } = useToggleCommentLike();

  const [text, setText] = useState('');
  const post = postQ.data as Post | null;
  const comments: Comment[] = commentsQ.data?.comments ?? [];

  const handleReact = useCallback(
    (id: string, reaction: ReactionType) => {
      react({
        postId: id,
        reaction,
        hasInteraction: !!post?.userInteraction,
      });
    },
    [post, react]
  );

  const handleShare = useCallback(async () => {
    if (!post) return;
    sharePost(post._id);
    try {
      await Share.share({
        message: post.content?.slice(0, 180) ?? 'Check this post on Banana',
      });
    } catch {
      /* noop */
    }
  }, [post, sharePost]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !postId) return;
    addComment({ content: trimmed });
    setText('');
    Keyboard.dismiss();
  }, [text, postId, addComment]);

  const goToProfile = useCallback(
    (uid: string) => navigation.navigate('PublicProfile', { userId: uid }),
    [navigation]
  );

  if (postQ.isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (postQ.isError || !post) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.bg }]}
        edges={['top']}
      >
        <Header onBack={() => navigation.goBack()} theme={theme} title="Post" />
        <ErrorState message="Couldn't load post" onRetry={postQ.refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      <Header onBack={() => navigation.goBack()} theme={theme} title="Post" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={comments}
          keyExtractor={(c) => c._id}
          keyboardShouldPersistTaps="handled"
          onEndReached={() =>
            commentsQ.hasNextPage && commentsQ.fetchNextPage()
          }
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View>
              <PostCard
                post={post}
                onReact={handleReact}
                onRemoveReact={removeReact}
                onDislike={(id) => dislike({ postId: id })}
                onComment={() => {
                  /* already here — focus input? */
                }}
                onShare={handleShare}
                onSave={(id, isSaved) => toggleSave({ id, isSaved })}
                onAuthorPress={goToProfile}
              />
              <Text
                style={[
                  styles.commentsHeader,
                  { color: theme.text, borderBottomColor: theme.border },
                ]}
              >
                Comments
              </Text>
            </View>
          }
          ListEmptyComponent={
            commentsQ.isLoading ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginTop: 24 }}
              />
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title="No comments yet"
                subtitle="Be the first to share your thoughts."
              />
            )
          }
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              onAuthorPress={goToProfile}
              onLikePress={toggleCommentLike}
            />
          )}
          ListFooterComponent={
            commentsQ.isFetchingNextPage ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ padding: 16 }}
              />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 12 }}
        />

        <View
          style={[
            styles.inputRow,
            { borderTopColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            placeholderTextColor={theme.muted}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || commentPending}
            style={[
              styles.sendBtn,
              {
                backgroundColor: theme.primary,
                opacity: text.trim() && !commentPending ? 1 : 0.4,
              },
            ]}
            accessibilityLabel="Post comment"
          >
            {commentPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Header: React.FC<{
  onBack: () => void;
  theme: any;
  title: string;
}> = ({ onBack, theme, title }) => (
  <View
    style={[
      styles.header,
      { backgroundColor: theme.card, borderBottomColor: theme.border },
    ]}
  >
    <TouchableOpacity
      onPress={onBack}
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
);

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
  commentsHeader: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PostDetailScreen;