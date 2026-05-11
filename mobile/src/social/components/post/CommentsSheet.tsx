// src/social/components/post/CommentsSheet.tsx
/**
 * CommentsSheet — smooth spring bottom-sheet for post comments (core Animated)
 *
 * Theme migration:
 * - theme.overlay → theme.colors.overlay  (authoritative colors object)
 * - theme.border  → theme.colors.border   (authoritative)
 * - theme.primary → unchanged (flat alias valid)
 * - RADIUS.xl, RADIUS.pill, SPACING.* → from socialTheme tokens
 */
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
  Easing,
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
import { RADIUS, SPACING, useSocialTheme } from '../../theme/socialTheme';
import type { Comment, Post } from '../../types';
import { formatCount } from '../../utils/format';
import Avatar from '../shared/Avatar';
import EmptyState from '../shared/EmptyState';
import CommentItem from './CommentItem';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = Math.min(SCREEN_H * 0.80, 660);

interface Props {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onAuthorPress?: (userId: string) => void;
}

const CommentsSheet: React.FC<Props> = memo(
  ({ visible, post, onClose, onAuthorPress }) => {
    const theme    = useSocialTheme();
    const [text, setText] = useState('');
    const inputRef = useRef<TextInput>(null);

    // Core Animated values
    const translateY       = useRef(new Animated.Value(SHEET_H)).current;
    const backdropOpacity  = useRef(new Animated.Value(0)).current;

    const postId      = post?._id ?? '';
    const commentsQ   = useComments(postId);
    const { mutate: addComment, isPending } = useAddComment(postId);
    const { mutate: toggleLike }            = useToggleCommentLike();

    const comments: Comment[] = commentsQ.data?.comments ?? [];

    // ── Open / close sheet ──
    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            friction: 9,
            tension: 65,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: SHEET_H,
            friction: 10,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [visible]);

    const handleSend = useCallback(() => {
      const trimmed = text.trim();
      if (!trimmed || !postId) return;
      addComment({ content: trimmed });
      setText('');
      Keyboard.dismiss();
    }, [text, postId, addComment]);

    const handleEndReached = useCallback(() => {
      if (commentsQ.hasNextPage && !commentsQ.isFetchingNextPage) {
        commentsQ.fetchNextPage();
      }
    }, [commentsQ]);

    const renderItem = useCallback(
      ({ item, index }: { item: Comment; index: number }) => (
        <CommentItem
          comment={item}
          index={index}
          onAuthorPress={onAuthorPress}
          onLikePress={toggleLike}
          onReplyPress={() => {}}
        />
      ),
      [onAuthorPress, toggleLike]
    );

    const keyExtractor = useCallback((c: Comment) => c._id, []);

    // Send button scale
    const sendScale    = useRef(new Animated.Value(1)).current;
    const onSendPressIn  = () =>
      Animated.spring(sendScale, { toValue: 0.9, friction: 6, tension: 300, useNativeDriver: true }).start();
    const onSendPressOut = () =>
      Animated.spring(sendScale, { toValue: 1,   friction: 5, tension: 200, useNativeDriver: true }).start();

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: theme.colors.overlay, opacity: backdropOpacity },
          ]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              height: SHEET_H,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.colors.borderAccent }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {post
                ? `${formatCount(post.stats.comments)} Comments`
                : 'Comments'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.closeBtn, { backgroundColor: theme.cardAlt }]}
              accessibilityLabel="Close comments"
            >
              <Ionicons name="close" size={17} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          <View style={{ flex: 1 }}>
            {commentsQ.isLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
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
                contentContainerStyle={styles.listContent}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  commentsQ.isFetchingNextPage ? (
                    <ActivityIndicator color={theme.primary} style={{ padding: 16 }} />
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
                styles.composer,
                {
                  borderTopColor:  theme.colors.border,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Avatar size={34} name="Me" />

              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="Add a comment…"
                placeholderTextColor={theme.muted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardAlt,
                    color:           theme.text,
                    borderColor:     text.length > 0 ? theme.primary : theme.border,
                  },
                ]}
                multiline
                maxLength={1000}
              />

              <Animated.View style={{ transform: [{ scale: sendScale }] }}>
                <TouchableOpacity
                  onPress={handleSend}
                  onPressIn={onSendPressIn}
                  onPressOut={onSendPressOut}
                  disabled={!text.trim() || isPending}
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: text.trim() && !isPending ? 1 : 0.35,
                    },
                  ]}
                  accessibilityLabel="Post comment"
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Ionicons name="send" size={17} color={theme.colors.white} style={{ marginLeft: 1 }} />
                  )}
                </TouchableOpacity>
              </Animated.View>
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
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingBottom: SPACING.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 44,
    lineHeight: 20,
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
export { CommentsSheet };
// ✅ theme-migrated
