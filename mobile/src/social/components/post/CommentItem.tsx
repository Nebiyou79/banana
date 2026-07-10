// src/social/components/post/CommentItem.tsx
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
import { useSocialTheme } from '../../theme/socialTheme';
import type { Comment } from '../../types';
import { formatCount, formatRelativeTime } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';

interface Props {
  comment: Comment;
  index?: number;
  isReply?: boolean;
  onAuthorPress?: (userId: string) => void;
  onLikePress?: (commentId: string) => void;
  onReplyPress?: (comment: Comment) => void;
  onMenuPress?: (comment: Comment) => void;
}

const CommentItem: React.FC<Props> = memo(({
  comment,
  index = 0,
  isReply = false,
  onAuthorPress,
  onLikePress,
  onReplyPress,
  onMenuPress,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, type, dark, withAlpha } = theme;
  
  const name = comment.author?.name ?? 'Unknown';
  const hasReplies = (comment.metadata?.replyCount ?? 0) > 0;

  // Staggered entrance
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const delay = Math.min(index * 45, 280);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 9,
        tension: 140,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  // Like burst animation
  const likeScale = useRef(new Animated.Value(1)).current;
  const handleLikePress = () => {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.5, friction: 4, tension: 300, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1,   friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
    onLikePress?.(comment._id);
  };

  // Dark mode: subtle primary tint
  // Light mode: card background
  const bubbleBg = dark
    ? withAlpha(colors.primary, 0.05)
    : colors.cardAlt;
  const bubbleBorder = dark
    ? withAlpha(colors.primary, 0.12)
    : 'transparent';
  const borderWidth = dark ? 1 : 0;

  // Reply indent line color
  const indentColor = withAlpha(colors.primary, 0.25);

  return (
    <Animated.View
      style={[
        styles.row,
        isReply && styles.rowReply,
        { 
          opacity, 
          transform: [{ translateY }],
          paddingHorizontal: spacing.md,
          paddingVertical: isReply ? 5 : 8,
          gap: 10,
        },
      ]}
    >
      {isReply && (
        <View
          style={[
            styles.replyIndentLine,
            { 
              backgroundColor: indentColor,
              position: 'absolute',
              left: spacing.md + 8,
              top: 0,
              bottom: 0,
              width: 1.5,
              borderRadius: 1,
            },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={() => onAuthorPress?.(comment.author?._id ?? '')}
        activeOpacity={0.75}
        style={styles.avatarTouch}
      >
        <View
          style={[
            styles.avatarRing,
            {
              borderColor: dark
                ? withAlpha(colors.primary, 0.35)
                : withAlpha(colors.primary, 0.2),
              borderRadius: 999,
              borderWidth: 1.5,
              padding: 1.5,
            },
          ]}
        >
          <Avatar
            uri={comment.author?.avatar}
            name={name}
            size={isReply ? 30 : SOCIAL_LAYOUT.avatarSm}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.body}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: bubbleBg,
              borderWidth: borderWidth,
              borderColor: bubbleBorder,
              borderRadius: radius.lg,
              paddingHorizontal: 12,
              paddingVertical: 9,
            },
          ]}
        >
          <View style={styles.nameRow}>
            <TouchableOpacity
              onPress={() => onAuthorPress?.(comment.author?._id ?? '')}
              activeOpacity={0.7}
              style={styles.nameTouch}
            >
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {name}
              </Text>
            </TouchableOpacity>
            {comment.author?.role ? (
              <RoleBadge role={comment.author.role} size="sm" />
            ) : null}
            <Text style={[styles.timestamp, { color: colors.muted }]}>
              {formatRelativeTime(comment.createdAt)}
            </Text>

            <TouchableOpacity
              onPress={() => onMenuPress?.(comment)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.menuBtn}
              activeOpacity={0.6}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={13}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.content, { color: colors.text }]}>
            {comment.content}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <TouchableOpacity
              onPress={handleLikePress}
              activeOpacity={0.6}
              style={styles.metaBtn}
              accessibilityLabel={comment.isLiked ? 'Unlike comment' : 'Like comment'}
            >
              <Ionicons
                name={comment.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
                size={13}
                color={comment.isLiked ? colors.primary : colors.muted}
              />
              {(comment.likes ?? 0) > 0 ? (
                <Text
                  style={[
                    styles.metaText,
                    {
                      color: comment.isLiked ? colors.primary : colors.muted,
                      fontWeight: comment.isLiked ? '700' : '500',
                    },
                  ]}
                >
                  {formatCount(comment.likes)}
                </Text>
              ) : null}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => onReplyPress?.(comment)}
            activeOpacity={0.6}
            style={styles.metaBtn}
          >
            <Ionicons
              name="chatbubble-outline"
              size={12}
              color={colors.muted}
            />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              Reply
            </Text>
          </TouchableOpacity>
        </View>

        {hasReplies ? (
          <TouchableOpacity
            onPress={() => onReplyPress?.(comment)}
            activeOpacity={0.6}
            style={styles.viewReplies}
          >
            <View
              style={[
                styles.replyLine,
                { backgroundColor: withAlpha(colors.primary, 0.35) },
              ]}
            />
            <Text style={[styles.replyText, { color: colors.primary }]}>
              View {formatCount(comment.metadata.replyCount)}{' '}
              {comment.metadata.replyCount === 1 ? 'reply' : 'replies'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
});

CommentItem.displayName = 'CommentItem';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowReply: {
    paddingLeft: 20,
    paddingVertical: 5,
  },
  replyIndentLine: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 1.5,
    borderRadius: 1,
  },
  avatarTouch: { flexShrink: 0 },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 1.5,
    padding: 1.5,
  },
  body: { flex: 1, minWidth: 0 },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
    flexWrap: 'nowrap',
  },
  nameTouch: { flexShrink: 1 },
  name: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
    flexShrink: 0,
  },
  menuBtn: {
    marginLeft: 'auto',
    paddingLeft: 4,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
    marginTop: 5,
  },
  metaText: { fontSize: 12 },
  metaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 28,
    paddingVertical: 2,
  },
  viewReplies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    paddingHorizontal: 4,
    minHeight: 28,
  },
  replyLine: { width: 18, height: 1.5, borderRadius: 1 },
  replyText: { fontSize: 12, fontWeight: '700' },
});

export default CommentItem;