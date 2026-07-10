// src/social/components/post/PostHeader.tsx
/**
 * PostHeader — Design 2 (light: Clean & Friendly) / Design 3 (dark: Modern & Futuristic)
 *
 * Light: clean white surface, soft badge colors, friendly avatar
 * Dark: gradient avatar ring, glowing role badge, dark menu button
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
import { RADIUS, SPACING, useSocialTheme, withAlpha } from '../../theme/socialTheme';
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
    const name = author?.name ?? 'Unknown';
    const { scale: menuScale, onPressIn: menuIn, onPressOut: menuOut } = usePressScale(0.88);

    // Design 3 dark: avatar has a glowing gradient ring
    const avatarRingColor = theme.dark
      ? theme.colors.primary
      : withAlpha(theme.colors.primary, 0.35);

    return (
      <View style={styles.header}>
        {/* ── Author row ── */}
        <TouchableOpacity
          onPress={onAuthorPress}
          activeOpacity={0.75}
          style={styles.authorPressable}
        >
          <View style={styles.authorRow}>
            {/* Avatar with ring */}
            <View
              style={[
                styles.avatarRing,
                {
                  borderColor: avatarRingColor,
                  // Design 3 dark: thicker glowing ring; Design 2 light: thin subtle ring
                  borderWidth: theme.dark ? 2 : 1.5,
                  shadowColor: theme.dark ? theme.colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: theme.dark ? 0.5 : 0,
                  shadowRadius: theme.dark ? 6 : 0,
                },
              ]}
            >
              <Avatar uri={author?.avatar} name={name} size={SOCIAL_LAYOUT.avatarMd} />
              {/* Online dot */}
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: theme.colors.success,
                    borderColor: theme.colors.card,
                  },
                ]}
              />
            </View>

            {/* Text block */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.name, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <VerifiedBadge status={author?.verificationStatus} />
                {author?.role ? <RoleBadge role={author.role} size="sm" /> : null}
                {pinned ? (
                  <View
                    style={[
                      styles.pinnedBadge,
                      {
                        backgroundColor: theme.dark
                          ? withAlpha(theme.colors.primary, 0.18)
                          : withAlpha(theme.colors.primary, 0.10),
                        borderWidth: 1,
                        borderColor: withAlpha(theme.colors.primary, theme.dark ? 0.4 : 0.25),
                      },
                    ]}
                  >
                    <Ionicons name="pin" size={9} color={theme.colors.primary} />
                    <Text style={[styles.pinnedText, { color: theme.colors.primary }]}>
                      Pinned
                    </Text>
                  </View>
                ) : null}
              </View>

              {author?.headline ? (
                <Text
                  style={[styles.headline, { color: theme.colors.subtext }]}
                  numberOfLines={1}
                >
                  {truncate(author.headline, 42)}
                </Text>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: theme.colors.muted }]}>
                  {formatRelativeTime(createdAt)}
                </Text>
                <View style={[styles.metaDot, { backgroundColor: theme.colors.muted }]} />
                {visibility === 'connections' ? (
                  <Ionicons name="people" size={11} color={theme.colors.muted} />
                ) : visibility === 'private' ? (
                  <Ionicons name="lock-closed" size={11} color={theme.colors.muted} />
                ) : (
                  <Ionicons name="earth" size={11} color={theme.colors.muted} />
                )}
                <Text style={[styles.metaText, { color: theme.colors.muted }]}>
                  {visibility === 'connections'
                    ? 'Connections'
                    : visibility === 'private'
                    ? 'Only me'
                    : 'Public'}
                </Text>
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
              style={[
                styles.menuBtn,
                {
                  backgroundColor: theme.dark
                    ? withAlpha(theme.colors.primary, 0.12)
                    : withAlpha(theme.colors.muted, 0.08),
                  borderWidth: theme.dark ? 1 : 0,
                  borderColor: withAlpha(theme.colors.primary, 0.25),
                },
              ]}
              accessibilityLabel="Post options"
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={theme.dark ? theme.colors.subtext : theme.colors.muted}
              />
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
  avatarRing: {
    borderRadius: 999,
    position: 'relative',
    flexShrink: 0,
    padding: 2,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
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
    fontSize: 14.5,
    fontWeight: '700',
    flexShrink: 1,
    maxWidth: 150,
    letterSpacing: -0.2,
  },
  headline: { fontSize: 12, marginTop: 1.5 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: { fontSize: 11, fontWeight: '500' },
  metaDot: { width: 2.5, height: 2.5, borderRadius: 1.5, opacity: 0.4 },
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