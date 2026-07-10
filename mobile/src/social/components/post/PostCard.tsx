// src/social/components/post/PostCard.tsx
/**
 * PostCard — Design 2 (light: Soft & Friendly) / Design 3 (dark: Modern & Futuristic)
 * - Light: white card, soft shadow, clean border, friendly typography
 * - Dark: dark card with gradient accent border, glowing primary accents
 */
import React, { memo, useCallback, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFadeIn } from '../../theme/animations';
import { RADIUS, SPACING, useSocialTheme, withAlpha } from '../../theme/socialTheme';
import type { Post, ReactionType } from '../../types';
import PostActions from './PostActions';
import PostHeader from './PostHeader';
import PostMedia from './PostMedia';

interface Props {
  post: Post;
  onAuthorPress?: (userId: string) => void;
  onMenuPress?: () => void;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRemoveReact: (postId: string) => void;
  onDislike: (postId: string) => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onMediaPress?: (index: number) => void;
  showMenu?: boolean;
}

const MAX_LINES = 4;

const PostBody: React.FC<{ text: string }> = ({ text }) => {
  const theme = useSocialTheme();
  const parts = text.split(/(#\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <Text key={i} style={{ color: theme.colors.primary, fontWeight: '700' }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </>
  );
};

const PostCard: React.FC<Props> = memo(
  ({
    post,
    onAuthorPress,
    onMenuPress,
    onReact,
    onRemoveReact,
    onDislike,
    onComment,
    onShare,
    onSave,
    onMediaPress,
    showMenu = true,
  }) => {
    const theme = useSocialTheme();
    const [expanded, setExpanded] = useState(false);
    const [showSeeMore, setShowSeeMore] = useState(false);

    const opacity = useFadeIn(0, 300);

    const reactionsTotal = (post.stats?.likes ?? 0) + (post.stats?.dislikes ?? 0);
    const topReactions = Object.entries(post.stats?.reactionBreakdown ?? {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type]) => theme.reactions[type])
      .filter(Boolean);

    // Design 3 dark: gradient accent border using role primary
    const cardBorderColor = theme.dark
      ? withAlpha(theme.colors.primary, 0.45)
      : theme.colors.border;

    // Design 2 light: soft shadow; Design 3 dark: glow shadow
    const shadowStyle = theme.dark
      ? {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 6,
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 3,
        };

    return (
      <Animated.View
        style={[
          styles.card,
          shadowStyle,
          {
            backgroundColor: theme.colors.card,
            borderColor: cardBorderColor,
            // Design 3 dark: subtle left accent strip via borderLeftWidth
            borderLeftWidth: theme.dark ? 2.5 : 1,
            borderLeftColor: theme.dark ? theme.colors.primary : cardBorderColor,
            opacity,
          },
        ]}
      >
        {/* Design 3 dark: gradient accent top strip */}
        {theme.dark && (
          <View
            style={[
              styles.accentStrip,
              { backgroundColor: withAlpha(theme.colors.primary, 0.12) },
            ]}
          />
        )}

        {/* ── Header ── */}
        <PostHeader
          author={post.author}
          createdAt={post.createdAt}
          pinned={post.pinned}
          visibility={post.visibility}
          onAuthorPress={() => onAuthorPress?.(post.author?._id ?? '')}
          onMenuPress={onMenuPress}
          showMenu={showMenu}
        />

        {/* ── Body text ── */}
        {post.content ? (
          <View style={styles.textWrap}>
            <Text
              style={[
                styles.bodyText,
                {
                  color: theme.colors.text,
                  // Design 2 light: slightly looser line height for friendliness
                  lineHeight: theme.dark ? 22 : 23,
                },
              ]}
              numberOfLines={expanded ? undefined : MAX_LINES}
              onTextLayout={(e) => {
                if (!expanded && e.nativeEvent.lines.length > MAX_LINES) {
                  setShowSeeMore(true);
                }
              }}
            >
              <PostBody text={post.content} />
            </Text>
            {showSeeMore && !expanded ? (
              <TouchableOpacity
                onPress={() => setExpanded(true)}
                hitSlop={{ top: 4, bottom: 4 }}
              >
                <Text style={[styles.seeMore, { color: theme.colors.primary }]}>
                  See more
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ── Media ── */}
        {post.media?.length ? (
          <View style={styles.mediaWrap}>
            <PostMedia media={post.media} onMediaPress={onMediaPress} />
          </View>
        ) : null}

        {/* ── Reactions summary ── */}
        {reactionsTotal > 0 ? (
          <View
            style={[
              styles.reactionsSummary,
              {
                borderBottomColor: theme.dark
                  ? withAlpha(theme.colors.border, 0.5)
                  : theme.colors.border,
              },
            ]}
          >
            {/* Left: stacked emoji circles + total count */}
            <TouchableOpacity
              onPress={onComment}
              activeOpacity={0.75}
              style={styles.reactionsLeft}
            >
              {topReactions.map((emoji, i) => (
                <View
                  key={i}
                  style={[
                    styles.emojiCircle,
                    {
                      backgroundColor: theme.dark
                        ? withAlpha(theme.colors.primary, 0.18)
                        : theme.colors.cardAlt,
                      borderColor: theme.colors.card,
                      marginLeft: i > 0 ? -7 : 0,
                    },
                  ]}
                >
                  <Text style={styles.emojiCircleText}>{emoji}</Text>
                </View>
              ))}
              <Text style={[styles.reactionTotalText, { color: theme.colors.muted }]}>
                {reactionsTotal >= 1000
                  ? `${(reactionsTotal / 1000).toFixed(1)}k`
                  : reactionsTotal.toLocaleString()}
              </Text>
            </TouchableOpacity>

            {/* Right: comment count tap target */}
            {(post.stats?.comments ?? 0) > 0 ? (
              <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
                <Text style={[styles.commentCountText, { color: theme.colors.muted }]}>
                  {post.stats.comments.toLocaleString()} comment
                  {post.stats.comments !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ── Divider ── */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.dark
                ? withAlpha(theme.colors.border, 0.6)
                : theme.colors.border,
            },
          ]}
        />

        {/* ── Actions ── */}
        <PostActions
          post={post}
          onReact={onReact}
          onRemoveReact={onRemoveReact}
          onDislike={onDislike}
          onComment={onComment}
          onShare={onShare}
          onSave={onSave}
        />
      </Animated.View>
    );
  }
);

PostCard.displayName = 'PostCard';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentStrip: {
    height: 3,
    width: '100%',
  },
  textWrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    paddingTop: 2,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  seeMore: {
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 4,
  },
  mediaWrap: { overflow: 'hidden' },
  reactionsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 1,
    borderBottomWidth: 0.5,
  },
  reactionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emojiCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  emojiCircleText: { fontSize: 13 },
  reactionTotalText: { fontSize: 12.5, fontWeight: '500' },
  commentCountText:  { fontSize: 12.5, fontWeight: '500' },
  divider: { height: 0.5 },
});

export default PostCard;
export { PostCard };