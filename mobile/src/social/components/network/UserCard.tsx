// src/social/components/shared/UserCard.tsx
/**
 * UserCard — search result / network list row with follow button
 *
 * Theme migration:
 * - `layout.avatarMd`      → `SOCIAL_LAYOUT.avatarMd`  (import from layout)
 * - `type.label`           → `type.bodyMd`
 * - `colors.textSecondary` → `colors.textMuted`
 * All other tokens ✅
 */
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SearchResult } from '../../types';
import { formatCount } from '../../utils/format';
import Avatar from '../shared/Avatar';
import FollowButton from '../shared/FollowButton';
import RoleBadge from '../shared/RoleBadge';
import VerifiedBadge from '../shared/VerifiedBadge';
import type { ConnectionStatus } from '../../types/follow';

interface Props {
  user: SearchResult;
  followStatus?: ConnectionStatus;
  followLoading?: boolean;
  onPress: () => void;
  onFollowPress: () => void;
  showFollowButton?: boolean;
}

const UserCard: React.FC<Props> = memo(({
  user, followStatus = 'none', followLoading, onPress, onFollowPress,
  showFollowButton = true,
}) => {
  const { colors, spacing, type } = useSocialTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          padding: spacing.md - 2,
          gap: spacing.sm + 4,
        },
      ]}
    >
      {/* layout.avatarMd → SOCIAL_LAYOUT.avatarMd */}
      <Avatar uri={user.avatar} name={user.name} size={SOCIAL_LAYOUT.avatarMd + 4} />

      <View style={[styles.info, { gap: 2 }]}>
        <View style={styles.nameRow}>
          {/* type.label → type.bodyMd */}
          <Text
            style={[type.bodyMd, { color: colors.text, maxWidth: 180 }]}
            numberOfLines={1}
          >
            {user.name}
          </Text>
          <VerifiedBadge status={user.verificationStatus} />
          {user.role ? <RoleBadge role={user.role} /> : null}
        </View>
        {user.headline ? (
          <Text
            style={[
              type.bodySm,
              {
                // colors.textSecondary → colors.textMuted
                color: colors.textMuted,
                marginTop: 2,
              },
            ]}
            numberOfLines={1}
          >
            {user.headline}
          </Text>
        ) : null}
        <View style={[styles.metaRow, { gap: spacing.sm + 2, marginTop: 3 }]}>
          {user.followerCount !== undefined ? (
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {formatCount(user.followerCount)} followers
            </Text>
          ) : null}
          {user.location ? (
            <Text style={[type.caption, { color: colors.textMuted }]}>
              {user.location}
            </Text>
          ) : null}
        </View>
      </View>

      {showFollowButton && followStatus !== 'self' ? (
        <FollowButton
          status={followStatus}
          onPress={onFollowPress}
          loading={followLoading}
          size="sm"
        />
      ) : null}
    </TouchableOpacity>
  );
});

UserCard.displayName = 'UserCard';

const styles = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5 },
  info:    { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row' },
});

export default UserCard;
// ✅ theme-migrated
