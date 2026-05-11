// src/social/components/post/CommentItem.tsx
/**
 * CommentItem — individual comment bubble with like, reply, role badge
 *
 * Theme migration:
 * - theme.danger → theme.colors.danger (using colors object for like heart)
 * - theme.borderAccent → theme.colors.borderAccent (reply line)
 * - theme.primary → unchanged (flat alias still valid)
 * - RADIUS.lg, SPACING.md → imported from socialTheme
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { RADIUS, SPACING, useSocialTheme } from '../../theme/socialTheme';
import type { Comment } from '../../types';
import { formatCount, formatRelativeTime } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';

interface Props {
  comment: Comment;
  index?: number;
  onAuthorPress?: (userId: string) => void;
  onLikePress?: (commentId: string) => void;
  onReplyPress?: (comment: Comment) => void;
}

const CommentItem: React.FC<Props> = memo(
  ({ comment, index = 0, onAuthorPress, onLikePress, onReplyPress }) => {
    const theme    = useSocialTheme();
    const name     = comment.author?.name ?? 'Unknown';
    const hasReplies = (comment.metadata?.replyCount ?? 0) > 0;

    // Staggered entrance — fade + slide up
    const opacity    = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(12)).current;

    useEffect(() => {
      const delay = Math.min(index * 50, 300);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          delay,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 140,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    // Like button burst
    const likeScale = useRef(new Animated.Value(1)).current;
    const handleLikePress = () => {
      Animated.sequence([
        Animated.spring(likeScale, {
          toValue: 1.45,
          friction: 4,
          tension: 300,
          useNativeDriver: true,
        }),
        Animated.spring(likeScale, {
          toValue: 1,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
      onLikePress?.(comment._id);
    };

    return (
      <Animated.View style={[styles.row, { opacity, transform: [{ translateY }] }]}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={() => onAuthorPress?.(comment.author?._id ?? '')}
          activeOpacity={0.7}
        >
          <Avatar
            uri={comment.author?.avatar}
            name={name}
            size={SOCIAL_LAYOUT.avatarSm}
          />
        </TouchableOpacity>

        <View style={styles.body}>
          {/* Bubble */}
          <View style={[styles.bubble, { backgroundColor: theme.cardAlt }]}>
            <View style={styles.nameRow}>
              <TouchableOpacity
                onPress={() => onAuthorPress?.(comment.author?._id ?? '')}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              </TouchableOpacity>
              {comment.author?.role ? (
                <RoleBadge role={comment.author.role} size="sm" />
              ) : null}
            </View>
            <Text style={[styles.content, { color: theme.text }]}>
              {comment.content}
            </Text>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: theme.muted }]}>
              {formatRelativeTime(comment.createdAt)}
            </Text>

            {/* Like */}
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <TouchableOpacity
                onPress={handleLikePress}
                activeOpacity={0.6}
                style={styles.metaBtn}
                accessibilityLabel={comment.isLiked ? 'Unlike comment' : 'Like comment'}
              >
                <Ionicons
                  name={comment.isLiked ? 'heart' : 'heart-outline'}
                  size={13}
                  color={comment.isLiked ? theme.colors.danger : theme.muted}
                />
                <Text
                  style={[
                    styles.metaText,
                    {
                      color:      comment.isLiked ? theme.colors.danger : theme.muted,
                      fontWeight: comment.isLiked ? '700' : '500',
                    },
                  ]}
                >
                  {comment.likes > 0 ? formatCount(comment.likes) : 'Like'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Reply */}
            <TouchableOpacity
              onPress={() => onReplyPress?.(comment)}
              activeOpacity={0.6}
              style={styles.metaBtn}
            >
              <Text
                style={[styles.metaText, { color: theme.subtext, fontWeight: '600' }]}
              >
                Reply
              </Text>
            </TouchableOpacity>
          </View>

          {/* View replies */}
          {hasReplies ? (
            <TouchableOpacity
              onPress={() => onReplyPress?.(comment)}
              activeOpacity={0.6}
              style={styles.viewReplies}
            >
              <View
                style={[styles.replyLine, { backgroundColor: theme.colors.borderAccent }]}
              />
              <Text style={[styles.replyText, { color: theme.primary }]}>
                View {formatCount(comment.metadata.replyCount)}{' '}
                {comment.metadata.replyCount === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
    );
  }
);

CommentItem.displayName = 'CommentItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    gap: 9,
  },
  body:    { flex: 1, minWidth: 0 },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    maxWidth: 160,
    letterSpacing: -0.1,
  },
  content: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    marginTop: 5,
  },
  metaText: { fontSize: 11.5 },
  metaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingVertical: 4,
  },
  viewReplies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
    paddingHorizontal: 4,
    minHeight: 32,
  },
  replyLine: { width: 20, height: 1.5, borderRadius: 1 },
  replyText: { fontSize: 12, fontWeight: '700' },
});

export default CommentItem;
export { CommentItem };
// ✅ theme-migrated
