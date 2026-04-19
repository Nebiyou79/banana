import { Ionicons } from '@expo/vector-icons';
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useAddComment,
  useComments,
  useToggleCommentLike,
} from '../../hooks/useComments';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Comment, Post } from '../../types';
import { formatCount } from '../../utils/format';
import EmptyState from '../shared/EmptyState';
import CommentItem from './CommentItem';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(SCREEN_H * 0.78, 640);

interface Props {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onAuthorPress?: (userId: string) => void;
}

/**
 * Bottom-sheet comments. Slides up from the bottom using Animated.spring,
 * with a backdrop tap to dismiss. Uses the `useComments` + `useAddComment`
 * hooks directly — no service calls in UI.
 */
const CommentsSheet: React.FC<Props> = memo(
  ({ visible, post, onClose, onAuthorPress }) => {
    const theme = useSocialTheme();
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const [text, setText] = useState('');

    const postId = post?._id ?? '';
    const commentsQ = useComments(postId);
    const { mutate: addComment, isPending } = useAddComment(postId);
    const { mutate: toggleLike } = useToggleCommentLike();

    const comments: Comment[] = commentsQ.data?.comments ?? [];
    const hasNext = commentsQ.hasNextPage;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            friction: 9,
            tension: 70,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [visible, translateY, backdropOpacity]);

    const handleSend = useCallback(() => {
      const trimmed = text.trim();
      if (!trimmed || !postId) return;
      addComment({ content: trimmed });
      setText('');
      Keyboard.dismiss();
    }, [text, postId, addComment]);

    const handleEndReached = useCallback(() => {
      if (hasNext && !commentsQ.isFetchingNextPage) {
        commentsQ.fetchNextPage();
      }
    }, [hasNext, commentsQ]);

    const renderItem = useCallback(
      ({ item }: { item: Comment }) => (
        <CommentItem
          comment={item}
          onAuthorPress={onAuthorPress}
          onLikePress={toggleLike}
        />
      ),
      [onAuthorPress, toggleLike]
    );

    const keyExtractor = useCallback((c: Comment) => c._id, []);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: theme.overlay, opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              transform: [{ translateY }],
              height: SHEET_HEIGHT,
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleWrap}>
            <View
              style={[styles.handle, { backgroundColor: theme.muted }]}
            />
          </View>

          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: theme.border },
            ]}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              {post ? `${formatCount(post.stats.comments)} Comments` : 'Comments'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close comments"
            >
              <Ionicons name="close" size={24} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <View style={{ flex: 1 }}>
            {commentsQ.isLoading ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginTop: 32 }}
              />
            ) : comments.length === 0 ? (
              <EmptyState
                icon="chatbubbles-outline"
                title="No comments yet"
                subtitle="Be the first to share your thoughts."
              />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 12 }}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={
                  commentsQ.isFetchingNextPage ? (
                    <ActivityIndicator
                      color={theme.primary}
                      style={{ padding: 16 }}
                    />
                  ) : null
                }
              />
            )}
          </View>

          {/* Composer */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
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
                disabled={!text.trim() || isPending}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: text.trim() && !isPending ? 1 : 0.4,
                  },
                ]}
                accessibilityLabel="Post comment"
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    );
  }
);

CommentsSheet.displayName = 'CommentsSheet';

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  handle: { width: 44, height: 4, borderRadius: 2, opacity: 0.5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 15, fontWeight: '700' },
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

export default CommentsSheet;