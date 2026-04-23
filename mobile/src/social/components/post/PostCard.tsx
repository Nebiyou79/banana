// src/social/components/post/PostCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFadeIn } from '../../theme/animations';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Post, ReactionType } from '../../types';
import { formatCount, formatRelativeTime } from '../../utils/format';
import Avatar from '../shared/Avatar';
import HashtagText from '../shared/HashtagText';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';
import PostActions from './PostActions';
import PostMedia from './PostMedia';

export type PostCardMode = 'feed' | 'myPosts';

interface Props {
  post: Post;
  mode?: PostCardMode;
  onReact: (postId: string, reaction: ReactionType) => void;
  onRemoveReact: (postId: string) => void;
  onDislike: (postId: string) => void;
  onComment: (post: Post) => void;
  onShare: (post: Post) => void;
  onSave: (postId: string, isSaved: boolean) => void;
  onAuthorPress: (userId: string) => void;
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (username: string) => void;
  onMediaPress?: (post: Post, index: number) => void;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onPinPost?: (post: Post) => void;
  onCommentsPreviewPress?: (post: Post) => void;
}

const CONTENT_EXPAND_THRESHOLD = 180;
const MENU_MAX_H = 180;

const PostCard: React.FC<Props> = memo(
  ({
    post,
    mode = 'feed',
    onReact,
    onRemoveReact,
    onDislike,
    onComment,
    onShare,
    onSave,
    onAuthorPress,
    onHashtagPress,
    onMentionPress,
    onMediaPress,
    onEditPost,
    onDeletePost,
    onPinPost,
    onCommentsPreviewPress,
  }) => {
    const theme = useSocialTheme();
    const [expanded, setExpanded] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const opacity = useFadeIn(0, 220);

    // Double-tap heart overlay
    const lastTap = useRef<number>(0);
    const heartScale = useRef(new Animated.Value(0)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    // Menu dropdown
    const menuH = useRef(new Animated.Value(0)).current;
    const menuOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (menuOpen) {
        Animated.parallel([
          Animated.timing(menuH, {
            toValue: MENU_MAX_H,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(menuOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(menuH, {
            toValue: 0,
            duration: 140,
            useNativeDriver: false,
          }),
          Animated.timing(menuOpacity, {
            toValue: 0,
            duration: 140,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, [menuOpen, menuH, menuOpacity]);

    const showHeartAnimation = useCallback(() => {
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(heartOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, [heartScale, heartOpacity]);

    const handleDoubleTap = useCallback(() => {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (!post.hasLiked) {
          onReact(post._id, 'like');
        }
        showHeartAnimation();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }, [post.hasLiked, post._id, onReact, showHeartAnimation]);

    const handleAuthorPress = useCallback(() => {
      if (post.author?._id) onAuthorPress(post.author._id);
    }, [post.author?._id, onAuthorPress]);

    const handleComment = useCallback(() => onComment(post), [onComment, post]);
    const handleShare = useCallback(() => onShare(post), [onShare, post]);
    const handleSave = useCallback(
      () => onSave(post._id, post.isSaved ?? false),
      [onSave, post._id, post.isSaved]
    );
    const handleMediaPress = useCallback(
      (i: number) => onMediaPress?.(post, i),
      [onMediaPress, post]
    );
    const handleCommentsPreview = useCallback(
      () => (onCommentsPreviewPress ?? onComment)(post),
      [onCommentsPreviewPress, onComment, post]
    );

    const handleEdit = useCallback(() => {
      setMenuOpen(false);
      onEditPost?.(post);
    }, [onEditPost, post]);

    const handlePin = useCallback(() => {
      setMenuOpen(false);
      onPinPost?.(post);
    }, [onPinPost, post]);

    const handleDelete = useCallback(() => {
      setMenuOpen(false);
      Alert.alert('Delete post?', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeletePost?.(post._id),
        },
      ]);
    }, [onDeletePost, post._id]);

    const showSeeMore =
      (post.content?.length ?? 0) > CONTENT_EXPAND_THRESHOLD;
    const showMenu = mode === 'myPosts';
    const isMyPosts = mode === 'myPosts';

    return (
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              },
              android: { elevation: 2 },
            }),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleAuthorPress}
            activeOpacity={0.8}
            style={styles.headerLeft}
          >
            <Avatar
              uri={post.author?.avatar}
              name={post.author?.name}
              size={44}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {post.author?.name ?? 'Unknown'}
                </Text>
                {post.author?.verificationStatus === 'verified' ? (
                  <VerifiedBadge size={13} />
                ) : null}
                {post.author?.role ? (
                  <RoleBadge role={post.author.role} size="sm" />
                ) : null}
              </View>
              {post.author?.headline ? (
                <Text
                  style={[styles.headline, { color: theme.muted }]}
                  numberOfLines={1}
                >
                  {post.author.headline}
                </Text>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={[styles.time, { color: theme.muted }]}>
                  {formatRelativeTime(post.createdAt)}
                </Text>
                {post.pinned ? (
                  <>
                    <Text style={[styles.dotSep, { color: theme.muted }]}>·</Text>
                    <Ionicons name="pin" size={11} color={theme.muted} />
                  </>
                ) : null}
                {post.visibility === 'connections' ? (
                  <>
                    <Text style={[styles.dotSep, { color: theme.muted }]}>·</Text>
                    <Ionicons name="people" size={11} color={theme.muted} />
                  </>
                ) : post.visibility === 'private' ? (
                  <>
                    <Text style={[styles.dotSep, { color: theme.muted }]}>·</Text>
                    <Ionicons name="lock-closed" size={11} color={theme.muted} />
                  </>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>

          {showMenu ? (
            <TouchableOpacity
              onPress={() => setMenuOpen((v) => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.menuBtn}
              accessibilityLabel="Post options"
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={theme.subtext}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Menu dropdown (only in myPosts mode when open) */}
        {showMenu ? (
          <Animated.View
            style={[
              styles.menuWrap,
              {
                height: menuH,
                opacity: menuOpacity,
                backgroundColor: theme.card,
                borderBottomColor: theme.border,
              },
            ]}
            pointerEvents={menuOpen ? 'auto' : 'none'}
          >
            <MenuItem
              icon="pin-outline"
              label={post.pinned ? 'Unpin post' : 'Pin post'}
              color={theme.text}
              onPress={handlePin}
            />
            <MenuItem
              icon="create-outline"
              label="Edit post"
              color={theme.text}
              onPress={handleEdit}
              disabled={!post.canEdit}
            />
            <MenuItem
              icon="trash-outline"
              label="Delete post"
              color="#DC2626"
              onPress={handleDelete}
              disabled={!post.canDelete}
            />
          </Animated.View>
        ) : null}

        {/* Double-tap-to-like tap area wraps content + media */}
        <Pressable onPress={handleDoubleTap}>
          {post.content ? (
            <View style={styles.content}>
              <HashtagText
                text={post.content}
                onHashtagPress={onHashtagPress}
                onMentionPress={onMentionPress}
                // style={[styles.contentText, { color: theme.text }]}
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

          {post.media?.length > 0 ? (
            <View style={{ position: 'relative' }}>
              <PostMedia media={post.media} onMediaPress={handleMediaPress} />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heartOverlay,
                  {
                    opacity: heartOpacity,
                    transform: [{ scale: heartScale }],
                  },
                ]}
              >
                <Text style={styles.heartEmoji}>❤️</Text>
              </Animated.View>
            </View>
          ) : null}
        </Pressable>

        {/* Stats row */}
        {isMyPosts ? (
          <View style={styles.myPostsStatsRow}>
            <StatChip
              emoji="👍"
              count={post.stats.likes}
              color={theme.muted}
            />
            <StatChip
              icon="chatbubble-outline"
              count={post.stats.comments}
              color={theme.muted}
            />
            <StatChip
              icon="arrow-redo-outline"
              count={post.stats.shares}
              color={theme.muted}
            />
            <StatChip
              icon="eye-outline"
              count={post.stats.views}
              color={theme.muted}
            />
            <StatChip
              icon="bookmark-outline"
              count={post.stats.saves}
              color={theme.muted}
            />
          </View>
        ) : (
          <>
            {(post.stats.likes > 0 ||
              post.stats.comments > 0 ||
              post.stats.shares > 0) ? (
              <View style={styles.statsRow}>
                {post.stats.likes > 0 ? (
                  <View style={styles.statPill}>
                    <Text style={styles.statEmoji}>👍</Text>
                    <Text
                      style={[styles.statText, { color: theme.muted }]}
                    >
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
              onDislike={onDislike}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
            />

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
          </>
        )}

        {/* Transparent backdrop to dismiss menu */}
        {menuOpen ? (
          <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
            <View style={styles.menuBackdrop} />
          </TouchableWithoutFeedback>
        ) : null}
      </Animated.View>
    );
  }
);

PostCard.displayName = 'PostCard';

// ── Inline dropdown item ─────────────────────────────────────────────
const MenuItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ icon, label, color, onPress, disabled }) => {
  const theme = useSocialTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.menuItem,
        { opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-forward" size={14} color={theme.muted} />
    </TouchableOpacity>
  );
};

// ── Compact stat display ─────────────────────────────────────────────
const StatChip: React.FC<{
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  count: number;
  color: string;
}> = ({ icon, emoji, count, color }) => (
  <View style={styles.statChip}>
    {emoji ? (
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
    ) : icon ? (
      <Ionicons name={icon} size={13} color={color} />
    ) : null}
    <Text style={[styles.statChipText, { color }]}>
      {formatCount(count)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SOCIAL_LAYOUT.postCardPadding,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  name: { fontSize: 15, fontWeight: '700', maxWidth: '70%' },
  headline: { fontSize: 12, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  time: { fontSize: 11 },
  dotSep: { fontSize: 11 },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuWrap: {
    overflow: 'hidden',
    borderBottomWidth: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  menuLabel: { fontSize: 14, fontWeight: '500' },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  content: {
    paddingHorizontal: SOCIAL_LAYOUT.postCardPadding,
    paddingBottom: 10,
  },
  contentText: { fontSize: 15, lineHeight: 22 },
  seeMore: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -48,
    marginTop: -48,
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartEmoji: { fontSize: 84 },
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
  divider: { height: 0.5 },
  viewAll: {
    paddingHorizontal: SOCIAL_LAYOUT.postCardPadding,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  viewAllText: { fontSize: 13, fontWeight: '500' },
  myPostsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: SOCIAL_LAYOUT.postCardPadding,
    paddingTop: 6,
    paddingBottom: 14,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChipText: { fontSize: 12, fontWeight: '600' },
});

export default PostCard;