// src/social/components/post/PostActions.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLikeBurst, usePressScale } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Post, ReactionType } from '../../types';
import { formatCount } from '../../utils/format';
import ReactionPicker from './ReactionPicker';

const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  like:        '👍',
  heart:       '❤️',
  celebrate:   '🎉',
  percent_100: '💯',
  clap:        '👏',
};

interface Props {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRemoveReact: (postId: string) => void;
  onDislike: (postId: string) => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

const PostActions: React.FC<Props> = memo(({
  post,
  onReact,
  onRemoveReact,
  onDislike,
  onComment,
  onShare,
  onSave,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, dark, withAlpha } = theme;
  
  const [showReactions, setShowReactions] = useState(false);

  const rawValue = post.userInteraction?.value;
  const userReaction: ReactionType | undefined =
    rawValue && rawValue !== 'dislike' ? (rawValue as ReactionType) : undefined;
  const activeEmoji = userReaction ? (REACTION_EMOJI_MAP[userReaction] ?? '🍌') : '';

  const { scale: likeScale, trigger: triggerLike } = useLikeBurst();
  const { scale: commentScale, onPressIn: commentIn, onPressOut: commentOut } = usePressScale(0.88);
  const { scale: shareScale, onPressIn: shareIn, onPressOut: shareOut } = usePressScale(0.88);
  const { scale: saveScale, trigger: triggerSave } = useLikeBurst();

  const handleLikePress = useCallback(() => {
    if (post.hasLiked) {
      onRemoveReact(post._id);
    } else {
      triggerLike();
      onReact(post._id, 'like');
    }
    setShowReactions(false);
  }, [post.hasLiked, post._id, onReact, onRemoveReact, triggerLike]);

  const handleReactionSelect = useCallback(
    (reaction: ReactionType) => {
      triggerLike();
      onReact(post._id, reaction);
      setShowReactions(false);
    },
    [post._id, onReact, triggerLike]
  );

  const handleSave = useCallback(() => {
    triggerSave();
    onSave();
  }, [onSave, triggerSave]);

  const reactionCounts = post.stats?.reactionBreakdown as
    | Partial<Record<ReactionType, number>>
    | undefined;

  const likeCount = post.stats?.likes ?? 0;
  const commentCount = post.stats?.comments ?? 0;
  const shareCount = post.stats?.shares ?? 0;

  const labelColor = (active: boolean) =>
    active ? colors.primary : colors.muted;

  // Dark mode: subtle background
  // Light mode: transparent
  const rowBg = dark
    ? withAlpha(colors.primary, 0.03)
    : 'transparent';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: rowBg,
          paddingHorizontal: spacing.xs,
          paddingVertical: 2,
          minHeight: 46,
          flexDirection: 'row',
          alignItems: 'center',
        },
      ]}
    >
      <View style={styles.reactionWrap}>
        {showReactions ? (
          <ReactionPicker
            onSelect={handleReactionSelect}
            onDismiss={() => setShowReactions(false)}
            counts={reactionCounts}
          />
        ) : null}
        <Animated.View style={{ transform: [{ scale: likeScale }] }}>
          <TouchableOpacity
            onPress={handleLikePress}
            onLongPress={() => setShowReactions(true)}
            delayLongPress={320}
            activeOpacity={0.7}
            style={[
              styles.btn,
              post.hasLiked && {
                backgroundColor: dark
                  ? withAlpha(colors.primary, 0.14)
                  : withAlpha(colors.primary, 0.07),
                borderRadius: 22,
              },
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingHorizontal: spacing.sm,
                paddingVertical: 10,
                minHeight: 44,
                flex: 1,
              },
            ]}
            accessibilityLabel={post.hasLiked ? 'Remove reaction' : 'React to post'}
          >
            {post.hasLiked ? (
              <Text style={styles.emojiActive}>{activeEmoji || '👍'}</Text>
            ) : (
              <Text style={styles.emojiDefault}>👍</Text>
            )}
            <Text
              style={[
                styles.btnLabel,
                {
                  color: labelColor(post.hasLiked ?? false),
                  fontWeight: post.hasLiked ? '700' : '500',
                  fontSize: 13,
                },
              ]}
            >
              {likeCount > 0 ? formatCount(likeCount) : 'Like'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={[styles.sep, { backgroundColor: colors.border }]} />

      <Animated.View style={[styles.btnWrap, { transform: [{ scale: commentScale }] }]}>
        <TouchableOpacity
          onPress={onComment}
          onPressIn={commentIn}
          onPressOut={commentOut}
          activeOpacity={0.7}
          style={[
            styles.btn,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingHorizontal: spacing.sm,
              paddingVertical: 10,
              minHeight: 44,
              flex: 1,
            },
          ]}
          accessibilityLabel="Comment"
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
          <Text style={[styles.btnLabel, { color: colors.muted }]}>
            {commentCount > 0 ? formatCount(commentCount) : 'Comment'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={[styles.sep, { backgroundColor: colors.border }]} />

      {post.allowSharing !== false ? (
        <>
          <Animated.View style={[styles.btnWrap, { transform: [{ scale: shareScale }] }]}>
            <TouchableOpacity
              onPress={onShare}
              onPressIn={shareIn}
              onPressOut={shareOut}
              activeOpacity={0.7}
              style={[
                styles.btn,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 10,
                  minHeight: 44,
                  flex: 1,
                },
              ]}
              accessibilityLabel="Share"
            >
              <Ionicons name="arrow-redo-outline" size={18} color={colors.muted} />
              <Text style={[styles.btnLabel, { color: colors.muted }]}>
                {shareCount > 0 ? formatCount(shareCount) : 'Share'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
        </>
      ) : null}

      <Animated.View style={[styles.btnWrap, { transform: [{ scale: saveScale }] }]}>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          style={[
            styles.btn,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingHorizontal: spacing.sm,
              paddingVertical: 10,
              minHeight: 44,
              flex: 1,
            },
          ]}
          accessibilityLabel={post.isSaved ? 'Unsave post' : 'Save post'}
        >
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={post.isSaved ? colors.primary : colors.muted}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

PostActions.displayName = 'PostActions';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    minHeight: 46,
  },
  reactionWrap: { position: 'relative', flex: 1 },
  btnWrap: { flex: 1 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 44,
    flex: 1,
  },
  btnLabel: { fontSize: 13, fontWeight: '500' },
  emojiDefault: { fontSize: 17, opacity: 0.55 },
  emojiActive: { fontSize: 20 },
  sep: { width: 0.5, height: 18, opacity: 0.35 },
});

export default PostActions;