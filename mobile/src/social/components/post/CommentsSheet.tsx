// src/social/components/post/CommentsSheet.tsx
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
import { useSocialTheme } from '../../theme/socialTheme';
import type { Comment, Post } from '../../types';
import { formatCount } from '../../utils/format';
import Avatar from '../shared/Avatar';
import EmptyState from '../shared/EmptyState';
import CommentItem from './CommentItem';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = Math.min(SCREEN_H * 0.82, 680);

interface Props {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
  onAuthorPress?: (userId: string) => void;
}

const CommentsSheet: React.FC<Props> = memo(({
  visible,
  post,
  onClose,
  onAuthorPress,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, dark, withAlpha } = theme;
  
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const postId = post?._id ?? '';
  const commentsQ = useComments(postId);
  const { mutate: addComment, isPending } = useAddComment(postId);
  const { mutate: toggleLike } = useToggleCommentLike();

  const comments: Comment[] = (commentsQ.data as any)?.comments ?? [];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 9,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
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
          duration: 200,
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

  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');

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

  const sendScale = useRef(new Animated.Value(1)).current;
  const onSendPressIn = () =>
    Animated.spring(sendScale, { toValue: 0.88, friction: 6, tension: 320, useNativeDriver: true }).start();
  const onSendPressOut = () =>
    Animated.spring(sendScale, { toValue: 1, friction: 5, tension: 220, useNativeDriver: true }).start();

  const hasText = text.trim().length > 0;

  // Dark mode: sheet glow, vibrant accent
  // Light mode: clean sheet, subtle border
  const sheetBorderColor = dark
    ? withAlpha(colors.primary, 0.35)
    : colors.border;
  const sheetBorderWidth = dark ? 1 : 0.5;
  const handleColor = dark
    ? withAlpha(colors.primary, 0.4)
    : withAlpha(colors.muted, 0.4);

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
          { backgroundColor: colors.overlay, opacity: backdropOpacity },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
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
            backgroundColor: colors.card,
            height: SHEET_H,
            transform: [{ translateY }],
            borderTopColor: sheetBorderColor,
            borderTopWidth: sheetBorderWidth,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
        ]}
      >
        <View style={styles.handleWrap}>
          <View
            style={[
              styles.handle,
              {
                backgroundColor: handleColor,
                width: 40,
                height: 4,
                borderRadius: 2,
                alignSelf: 'center',
                marginTop: 10,
                marginBottom: 4,
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.header,
            { 
              borderBottomColor: colors.border,
              borderBottomWidth: 0.5,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>
              Comments
            </Text>
            {(post?.stats?.comments ?? 0) > 0 && (
              <View
                style={[
                  styles.countBadge,
                  { 
                    backgroundColor: withAlpha(colors.primary, dark ? 0.18 : 0.10),
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 10,
                  },
                ]}
              >
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                  {formatCount(post!.stats.comments)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setSortBy(s => s === 'recent' ? 'top' : 'recent')}
              style={[
                styles.sortBtn,
                { 
                  backgroundColor: withAlpha(colors.primary, dark ? 0.1 : 0.06),
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 12,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortText, { color: colors.primary }]}>
                {sortBy === 'recent' ? 'Most recent' : 'Top'}
              </Text>
              <Ionicons name="chevron-down" size={11} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: dark
                    ? withAlpha(colors.primary, 0.12)
                    : withAlpha(colors.muted, 0.1),
                  borderWidth: dark ? 1 : 0,
                  borderColor: withAlpha(colors.primary, 0.2),
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
              accessibilityLabel="Close comments"
            >
              <Ionicons name="close" size={17} color={colors.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {commentsQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
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
              contentContainerStyle={{ paddingBottom: spacing.sm }}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.4}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                commentsQ.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
                ) : null
              }
            />
          )}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.composer,
              {
                borderTopColor: colors.border,
                backgroundColor: colors.card,
                borderTopWidth: 0.5,
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
              },
            ]}
          >
            <Avatar size={34} name="Me" />

            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="Add a comment…"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                {
                  backgroundColor: dark
                    ? withAlpha(colors.primary, 0.07)
                    : colors.cardAlt,
                  color: colors.text,
                  borderColor: hasText
                    ? colors.primary
                    : dark
                    ? withAlpha(colors.primary, 0.25)
                    : colors.border,
                  borderWidth: hasText ? 1.5 : 1,
                  flex: 1,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.md,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                  fontSize: 14,
                  maxHeight: 120,
                  minHeight: 44,
                  lineHeight: 20,
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
                disabled={!hasText || isPending}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: hasText && !isPending ? 1 : 0.35,
                    shadowColor: dark ? colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: dark && hasText ? 0.6 : 0,
                    shadowRadius: 8,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
                accessibilityLabel="Post comment"
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={17} color="#fff" style={{ marginLeft: 1 }} />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
});

CommentsSheet.displayName = 'CommentsSheet';

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sortText: { fontSize: 11.5, fontWeight: '600' },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
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