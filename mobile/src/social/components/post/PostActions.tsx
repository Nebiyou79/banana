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
import { useLikeBurst } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';
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
    const { scale: likeScale, trigger: triggerLike } = useLikeBurst();

    const rawValue = post.userInteraction?.value;
    const userReaction: ReactionType | undefined =
      rawValue && rawValue !== 'dislike' ? (rawValue as ReactionType) : undefined;
    const activeEmoji = userReaction ? theme.reactions[userReaction] ?? '' : '';

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
        return;
      }
      if (post.hasLiked) {
        // Clear existing reaction first, then add dislike
        onRemoveReact(post._id);
      }
      onDislike(post._id);
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

    return (
      <View style={styles.row}>
        {/* Like with long-press reaction picker */}
        <View>
          {showReactions ? (
            <ReactionPicker
              onSelect={handleReactionSelect}
              onDismiss={() => setShowReactions(false)}
            />
          ) : null}
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <TouchableOpacity
              style={styles.btn}
              onPress={handleLikePress}
              onLongPress={() => setShowReactions(true)}
              delayLongPress={350}
              activeOpacity={0.7}
              accessibilityLabel={post.hasLiked ? 'Remove reaction' : 'React'}
            >
              {post.hasLiked && activeEmoji ? (
                <Text style={styles.emoji}>{activeEmoji}</Text>
              ) : (
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={theme.subtext}
                />
              )}
              <Text
                style={[
                  styles.btnText,
                  {
                    color: post.hasLiked ? theme.primary : theme.subtext,
                    fontWeight: post.hasLiked ? '700' : '500',
                  },
                ]}
              >
                {post.stats.likes > 0
                  ? formatCount(post.stats.likes)
                  : 'Like'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Dislike */}
        <TouchableOpacity
          style={styles.btn}
          onPress={handleDislikePress}
          activeOpacity={0.7}
          accessibilityLabel={post.hasDisliked ? 'Remove dislike' : 'Dislike'}
        >
          <Ionicons
            name={post.hasDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
            size={19}
            color={post.hasDisliked ? theme.primary : theme.subtext}
          />
          <Text
            style={[
              styles.btnText,
              {
                color: post.hasDisliked ? theme.primary : theme.subtext,
                fontWeight: post.hasDisliked ? '700' : '500',
              },
            ]}
          >
            {post.stats.dislikes > 0
              ? formatCount(post.stats.dislikes)
              : 'Dislike'}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={styles.btn}
          onPress={onComment}
          activeOpacity={0.7}
          accessibilityLabel="Comment"
        >
          <Ionicons
            name="chatbubble-outline"
            size={19}
            color={theme.subtext}
          />
          <Text style={[styles.btnText, { color: theme.subtext }]}>
            {post.stats.comments > 0 ? formatCount(post.stats.comments) : 'Comment'}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        {post.allowSharing !== false ? (
          <TouchableOpacity
            style={styles.btn}
            onPress={onShare}
            activeOpacity={0.7}
            accessibilityLabel="Share"
          >
            <Ionicons
              name="arrow-redo-outline"
              size={19}
              color={theme.subtext}
            />
          </TouchableOpacity>
        ) : null}

        <View style={{ flex: 1 }} />

        {/* Save */}
        <TouchableOpacity
          style={styles.btn}
          onPress={onSave}
          activeOpacity={0.7}
          accessibilityLabel={post.isSaved ? 'Unsave post' : 'Save post'}
        >
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={19}
            color={post.isSaved ? theme.primary : theme.subtext}
          />
        </TouchableOpacity>
      </View>
    );
  }
);

PostActions.displayName = 'PostActions';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 44,
    minWidth: 44,
  },
  btnText: { fontSize: 13 },
  emoji: { fontSize: 20 },
});

export default PostActions;