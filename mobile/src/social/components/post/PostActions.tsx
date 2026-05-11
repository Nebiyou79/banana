// src/social/components/post/PostActions.tsx
/**
 * PostActions — like/react, dislike, comment, share, save action bar
 * All flat aliases (theme.primary, theme.subtext, theme.border) are
 * backwards-compatible — no token changes required in this file.
 * ✅ role-theme-migrated
 */
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
import { SPACING, useSocialTheme } from '../../theme/socialTheme';
import type { Post, ReactionType } from '../../types';
import { formatCount } from '../../utils/format';
import ReactionPicker from './ReactionPicker';

interface Props {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRemoveReact: (postId: string) => void;
  onDislike: (postId: string) => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

const PostActions: React.FC<Props> = memo(
  ({ post, onReact, onRemoveReact, onDislike, onComment, onShare, onSave }) => {
    const theme = useSocialTheme();
    const [showReactions, setShowReactions] = useState(false);

    const rawValue    = post.userInteraction?.value;
    const userReaction: ReactionType | undefined =
      rawValue && rawValue !== 'dislike' ? (rawValue as ReactionType) : undefined;
    const activeEmoji = userReaction ? theme.reactions[userReaction] ?? '' : '';

    const { scale: likeScale,    trigger: triggerLike }                             = useLikeBurst();
    const { scale: dislikeScale, onPressIn: dislikeIn, onPressOut: dislikeOut }     = usePressScale(0.88);
    const { scale: commentScale, onPressIn: commentIn, onPressOut: commentOut }     = usePressScale(0.88);
    const { scale: shareScale,   onPressIn: shareIn,   onPressOut: shareOut }       = usePressScale(0.88);
    const { scale: saveScale,    trigger: triggerSave }                             = useLikeBurst();

    const handleLikePress = useCallback(() => {
      if (post.hasLiked) {
        onRemoveReact(post._id);
      } else {
        triggerLike();
        onReact(post._id, 'like');
      }
      setShowReactions(false);
    }, [post.hasLiked, post._id, onReact, onRemoveReact, triggerLike]);

    const handleDislikePress = useCallback(() => {
      if (post.hasDisliked) {
        onRemoveReact(post._id);
      } else {
        if (post.hasLiked) onRemoveReact(post._id);
        onDislike(post._id);
      }
      setShowReactions(false);
    }, [post.hasDisliked, post.hasLiked, post._id, onDislike, onRemoveReact]);

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

    return (
      <View style={styles.row}>
        {/* ── Like / Reaction ── */}
        <View style={styles.reactionWrap}>
          {showReactions ? (
            <ReactionPicker
              onSelect={handleReactionSelect}
              onDismiss={() => setShowReactions(false)}
            />
          ) : null}
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <TouchableOpacity
              onPress={handleLikePress}
              onLongPress={() => setShowReactions(true)}
              delayLongPress={320}
              activeOpacity={0.7}
              style={styles.btn}
              accessibilityLabel={post.hasLiked ? 'Remove reaction' : 'React to post'}
            >
              {post.hasLiked && activeEmoji ? (
                <Text style={styles.emojiReact}>{activeEmoji}</Text>
              ) : (
                <Ionicons name="heart-outline" size={20} color={theme.subtext} />
              )}
              <Text
                style={[
                  styles.btnLabel,
                  {
                    color:      post.hasLiked ? theme.colors.primary : theme.subtext,
                    fontWeight: post.hasLiked ? '700' : '500',
                  },
                ]}
              >
                {post.stats.likes > 0 ? formatCount(post.stats.likes) : 'Like'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={[styles.sep, { backgroundColor: theme.border }]} />

        {/* ── Dislike ── */}
        <Animated.View style={{ transform: [{ scale: dislikeScale }] }}>
          <TouchableOpacity
            onPress={handleDislikePress}
            onPressIn={dislikeIn}
            onPressOut={dislikeOut}
            activeOpacity={0.7}
            style={styles.btn}
            accessibilityLabel={post.hasDisliked ? 'Remove dislike' : 'Dislike'}
          >
            <Ionicons
              name={post.hasDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
              size={19}
              color={post.hasDisliked ? theme.colors.primary : theme.subtext}
            />
            <Text
              style={[
                styles.btnLabel,
                {
                  color:      post.hasDisliked ? theme.colors.primary : theme.subtext,
                  fontWeight: post.hasDisliked ? '700' : '500',
                },
              ]}
            >
              {post.stats.dislikes > 0 ? formatCount(post.stats.dislikes) : 'Dislike'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={[styles.sep, { backgroundColor: theme.border }]} />

        {/* ── Comment ── */}
        <Animated.View style={{ transform: [{ scale: commentScale }] }}>
          <TouchableOpacity
            onPress={onComment}
            onPressIn={commentIn}
            onPressOut={commentOut}
            activeOpacity={0.7}
            style={styles.btn}
            accessibilityLabel="Comment"
          >
            <Ionicons name="chatbubble-outline" size={19} color={theme.subtext} />
            <Text style={[styles.btnLabel, { color: theme.subtext }]}>
              {post.stats.comments > 0 ? formatCount(post.stats.comments) : 'Comment'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Share ── */}
        {post.allowSharing !== false ? (
          <>
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
            <Animated.View style={{ transform: [{ scale: shareScale }] }}>
              <TouchableOpacity
                onPress={onShare}
                onPressIn={shareIn}
                onPressOut={shareOut}
                activeOpacity={0.7}
                style={styles.btn}
                accessibilityLabel="Share"
              >
                <Ionicons name="arrow-redo-outline" size={19} color={theme.subtext} />
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : null}

        <View style={{ flex: 1 }} />

        {/* ── Save ── */}
        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
            style={styles.saveBtn}
            accessibilityLabel={post.isSaved ? 'Unsave post' : 'Save post'}
          >
            <Ionicons
              name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={post.isSaved ? theme.colors.primary : theme.subtext}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
);

PostActions.displayName = 'PostActions';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    minHeight: 44,
  },
  reactionWrap: { position: 'relative' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 10,
    minHeight: 44,
    minWidth: 44,
  },
  btnLabel:   { fontSize: 13 },
  emojiReact: { fontSize: 19 },
  sep: { width: 0.5, height: 18, marginHorizontal: 2, opacity: 0.5 },
  saveBtn: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
});

export default PostActions;
export { PostActions };