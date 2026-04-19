import React, { memo, useCallback, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFadeIn } from '../../theme/animations';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Post, ReactionType } from '../../types';
import { formatCount } from '../../utils/format';
import HashtagText from '../shared/HashtagText';
import PostActions from './PostActions';
import PostHeader from './PostHeader';
import PostMedia from './PostMedia';

interface Props {
  post: Post;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRemoveReact: (postId: string) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onSave: (postId: string, isSaved: boolean) => void;
  onAuthorPress: (userId: string) => void;
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (username: string) => void;
  onMediaPress?: (post: Post, index: number) => void;
  onMenuPress?: (post: Post) => void;
  onCommentsPreviewPress?: (post: Post) => void;
}

const CONTENT_EXPAND_THRESHOLD = 180;

/**
 * The Instagram-style post card, composed of Header → Content → Media →
 * Stats → Actions. Memoised because it's rendered inside FlashList.
 */
const PostCard: React.FC<Props> = memo(
  ({
    post,
    onReact,
    onRemoveReact,
    onComment,
    onShare,
    onSave,
    onAuthorPress,
    onHashtagPress,
    onMentionPress,
    onMediaPress,
    onMenuPress,
    onCommentsPreviewPress,
  }) => {
    const theme = useSocialTheme();
    const [expanded, setExpanded] = useState(false);
    const opacity = useFadeIn(0, 220);

    const handleAuthorPress = useCallback(() => {
      if (post.author?._id) onAuthorPress(post.author._id);
    }, [post.author?._id, onAuthorPress]);

    const handleComment = useCallback(() => onComment(post), [onComment, post]);
    const handleShare = useCallback(() => onShare(post), [onShare, post]);
    const handleSave = useCallback(
      () => onSave(post._id, post.isSaved ?? false),
      [onSave, post._id, post.isSaved]
    );
    const handleMenu = useCallback(
      () => onMenuPress?.(post),
      [onMenuPress, post]
    );
    const handleCommentsPreview = useCallback(
      () => (onCommentsPreviewPress ?? onComment)(post),
      [onCommentsPreviewPress, onComment, post]
    );
    const handleMediaPress = useCallback(
      (i: number) => onMediaPress?.(post, i),
      [onMediaPress, post]
    );

    const showSeeMore =
      (post.content?.length ?? 0) > CONTENT_EXPAND_THRESHOLD;
    const showMenu = !!onMenuPress && (post.canEdit || post.canDelete);
    const hasStats =
      post.stats.likes > 0 ||
      post.stats.comments > 0 ||
      post.stats.shares > 0;

    return (
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderBottomColor: theme.border,
            opacity,
          },
        ]}
      >
        <PostHeader
          author={post.author}
          createdAt={post.createdAt}
          pinned={post.pinned}
          onAuthorPress={handleAuthorPress}
          onMenuPress={showMenu ? handleMenu : undefined}
          showMenu={showMenu}
        />

        {/* Content */}
        {post.content ? (
          <View style={styles.content}>
            <HashtagText
              text={post.content}
              onHashtagPress={onHashtagPress}
              onMentionPress={onMentionPress}
              style={styles.contentText}
              numberOfLines={expanded ? undefined : 4}
            />
            {showSeeMore ? (
              <TouchableOpacity
                onPress={() => setExpanded((e) => !e)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.seeMore, { color: theme.primary }]}>
                  {expanded ? 'See less' : 'See more'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Media */}
        {post.media?.length > 0 ? (
          <PostMedia media={post.media} onMediaPress={handleMediaPress} />
        ) : null}

        {/* Stats row */}
        {hasStats ? (
          <View style={styles.statsRow}>
            {post.stats.likes > 0 ? (
              <View style={styles.statPill}>
                <Text style={styles.statEmoji}>👍</Text>
                <Text style={[styles.statText, { color: theme.muted }]}>
                  {formatCount(post.stats.likes)}
                </Text>
              </View>
            ) : null}
            <View style={{ flex: 1 }} />
            {post.stats.comments > 0 ? (
              <TouchableOpacity
                onPress={handleCommentsPreview}
                activeOpacity={0.6}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={[styles.statText, { color: theme.muted }]}>
                  {formatCount(post.stats.comments)} comments
                </Text>
              </TouchableOpacity>
            ) : null}
            {post.stats.shares > 0 ? (
              <Text
                style={[
                  styles.statText,
                  { color: theme.muted, marginLeft: 10 },
                ]}
              >
                {formatCount(post.stats.shares)} shares
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <PostActions
          post={post}
          onReact={onReact}
          onRemoveReact={onRemoveReact}
          onComment={handleComment}
          onShare={handleShare}
          onSave={handleSave}
        />

        {/* "View all N comments" preview */}
        {post.stats.comments > 2 ? (
          <TouchableOpacity
            onPress={handleCommentsPreview}
            activeOpacity={0.6}
            style={styles.viewAll}
          >
            <Text style={[styles.viewAllText, { color: theme.subtext }]}>
              View all {formatCount(post.stats.comments)} comments
            </Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    );
  }
);

PostCard.displayName = 'PostCard';

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  content: {
    paddingHorizontal: SOCIAL_LAYOUT.postCardPadding,
    paddingBottom: 10,
  },
  contentText: { fontSize: 14, lineHeight: 21 },
  seeMore: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SOCIAL_LAYOUT.postCardPadding,
    paddingVertical: 8,
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statEmoji: { fontSize: 14 },
  statText: { fontSize: 12 },
  divider: { height: 0.5, marginHorizontal: 0 },
  viewAll: {
    paddingHorizontal: SOCIAL_LAYOUT.postCardPadding,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  viewAllText: { fontSize: 13, fontWeight: '500' },
});

export default PostCard;