// src/social/components/post/PostHeader.tsx
/**
 * PostHeader — post card header with author info, role badge, and menu
 *
 * Theme migration: flat aliases (theme.primary, theme.card, theme.muted, etc.)
 * are all preserved by the backwards-compat layer — no token changes needed here.
 * Added `theme.colors.success` for onlineDot to use the authoritative colors object.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePressScale } from '../../theme/animations';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { RADIUS, SPACING, useSocialTheme } from '../../theme/socialTheme';
import type { PostAuthor } from '../../types';
import { formatRelativeTime, truncate } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';

interface Props {
  author: PostAuthor;
  createdAt: string;
  pinned?: boolean;
  visibility?: 'public' | 'connections' | 'private';
  onAuthorPress?: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

const PostHeader: React.FC<Props> = memo(
  ({ author, createdAt, pinned, visibility, onAuthorPress, onMenuPress, showMenu }) => {
    const theme = useSocialTheme();
    const name  = author?.name ?? 'Unknown';
    const { scale: menuScale, onPressIn: menuIn, onPressOut: menuOut } = usePressScale(0.88);

    return (
      <View style={styles.header}>
        {/* ── Author row ── */}
        <TouchableOpacity
          onPress={onAuthorPress}
          activeOpacity={0.75}
          style={styles.authorPressable}
        >
          <View style={styles.authorRow}>
            {/* Avatar + online dot */}
            <View style={styles.avatarWrap}>
              <Avatar uri={author?.avatar} name={name} size={SOCIAL_LAYOUT.avatarMd} />
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: theme.colors.success,
                    borderColor:     theme.card,
                  },
                ]}
              />
            </View>

            {/* Text block */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.name, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <VerifiedBadge status={author?.verificationStatus} />
                {author?.role ? (
                  <RoleBadge role={author.role} size="xs" />
                ) : null}
                {pinned ? (
                  <View
                    style={[
                      styles.pinnedBadge,
                      { backgroundColor: theme.primaryLighter },
                    ]}
                  >
                    <Ionicons name="pin" size={9} color={theme.primary} />
                    <Text style={[styles.pinnedText, { color: theme.primary }]}>
                      Pinned
                    </Text>
                  </View>
                ) : null}
              </View>

              {author?.headline ? (
                <Text
                  style={[styles.headline, { color: theme.subtext }]}
                  numberOfLines={1}
                >
                  {truncate(author.headline, 42)}
                </Text>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: theme.muted }]}>
                  {formatRelativeTime(createdAt)}
                </Text>
                {visibility === 'connections' ? (
                  <>
                    <View style={[styles.metaDot, { backgroundColor: theme.muted }]} />
                    <Ionicons name="people" size={11} color={theme.muted} />
                  </>
                ) : visibility === 'private' ? (
                  <>
                    <View style={[styles.metaDot, { backgroundColor: theme.muted }]} />
                    <Ionicons name="lock-closed" size={11} color={theme.muted} />
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Menu button ── */}
        {showMenu ? (
          <Animated.View style={{ transform: [{ scale: menuScale }] }}>
            <TouchableOpacity
              onPress={onMenuPress}
              onPressIn={menuIn}
              onPressOut={menuOut}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.menuBtn, { backgroundColor: theme.cardAlt }]}
              accessibilityLabel="Post options"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color={theme.muted} />
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

PostHeader.displayName = 'PostHeader';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  authorPressable: { flex: 1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'nowrap',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
    maxWidth: 150,
    letterSpacing: -0.1,
  },
  headline: { fontSize: 12, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: { fontSize: 11, fontWeight: '500' },
  metaDot: { width: 2.5, height: 2.5, borderRadius: 1.5, opacity: 0.5 },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  pinnedText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PostHeader;
export { PostHeader };
// ✅ theme-migrated
