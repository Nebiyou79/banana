// src/social/components/post/PostCard.tsx
/**
 * PostCard — root post card component. Composes PostHeader, PostMedia, PostActions.
 *
 * Theme migration:
 * - theme.border  → theme.colors.border  (authoritative)
 * - theme.card    → theme.colors.card    (authoritative)
 * - theme.primary → theme.colors.primary (authoritative)
 * - theme.muted   → theme.colors.muted   (authoritative)
 * - theme.text    → theme.colors.text    (authoritative)
 * - theme.cardAlt → theme.colors.cardAlt (authoritative)
 * Flat aliases left as-is where already consistent.
 */
import React, { memo, useCallback, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFadeIn } from '../../theme/animations';
import { RADIUS, SPACING, useSocialTheme } from '../../theme/socialTheme';
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

/** Renders plain text + turns #hashtags role-primary colour */
const PostBody: React.FC<{ text: string }> = ({ text }) => {
  const theme  = useSocialTheme();
  const parts  = text.split(/(#\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <Text key={i} style={{ color: theme.colors.primary, fontWeight: '600' }}>
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
    const [expanded,    setExpanded]    = useState(false);
    const [showSeeMore, setShowSeeMore] = useState(false);

    // Entrance fade
    const opacity = useFadeIn(0, 280);

    // Reactions summary
    const reactionsTotal =
      (post.stats?.likes ?? 0) + (post.stats?.dislikes ?? 0);

    const topReactions = Object.entries(post.stats?.reactionBreakdown ?? {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type]) => theme.reactions[type])
      .filter(Boolean);

    return (
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor:     theme.colors.border,
            opacity,
          },
        ]}
      >
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
              style={[styles.bodyText, { color: theme.colors.text }]}
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

        {/* ── Reactions summary row ── */}
        {reactionsTotal > 0 ? (
          <View
            style={[
              styles.reactionsSummary,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.reactionsLeft}>
              {topReactions.map((emoji, i) => (
                <View
                  key={i}
                  style={[
                    styles.emojiPill,
                    {
                      backgroundColor: theme.colors.cardAlt,
                      borderColor:     theme.colors.card,
                      marginLeft:      i > 0 ? -6 : 0,
                    },
                  ]}
                >
                  <Text style={styles.emojiPillText}>{emoji}</Text>
                </View>
              ))}
              <Text style={[styles.reactionCount, { color: theme.colors.muted }]}>
                {reactionsTotal.toLocaleString()}
              </Text>
            </View>

            {post.stats?.comments > 0 ? (
              <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
                <Text style={[styles.commentCount, { color: theme.colors.muted }]}>
                  {post.stats.comments.toLocaleString()} comment
                  {post.stats.comments !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ── Divider ── */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

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
    marginBottom:     SPACING.md,
    borderRadius:     RADIUS.md,
    borderWidth:      1,
    overflow:         'hidden',
  },
  textWrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom:     SPACING.sm,
  },
  bodyText: {
    fontSize:      14.5,
    lineHeight:    22,
    fontWeight:    '400',
    letterSpacing: 0.1,
  },
  seeMore: {
    fontSize:   13.5,
    fontWeight: '600',
    marginTop:  3,
  },
  mediaWrap: { overflow: 'hidden' },
  reactionsSummary: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    borderBottomWidth: 0.5,
  },
  reactionsLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  emojiPill: {
    width:          22,
    height:         22,
    borderRadius:   11,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
  },
  emojiPillText:  { fontSize: 12 },
  reactionCount:  { fontSize: 12.5, fontWeight: '500' },
  commentCount:   { fontSize: 12.5, fontWeight: '500' },
  divider:        { height: 0.5, opacity: 0.6 },
});

export default PostCard;
export { PostCard };
// ✅ theme-migrated
