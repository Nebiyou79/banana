// src/social/components/shared/PendingRequestCard.tsx
/**
 * PendingRequestCard — incoming follow-request row with Accept / Decline
 *
 * Theme migration:
 * - `layout.avatarMd`    → `SOCIAL_LAYOUT.avatarMd`  (import from layout)
 * - `type.label`         → `type.bodyMd`
 * - `type.btn`           → `type.bodyMd`
 * - `colors.bgAlt`       → `colors.cardAlt`
 * - `colors.textSecondary` → `colors.textMuted`
 * - `elevation`          → removed (not on theme); no shadow needed on this card
 * - `'#fff'` on primary button text → `colors.white`
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SOCIAL_LAYOUT } from '../../theme/layout';
import { useSocialTheme } from '../../theme/socialTheme';
import type { FollowTarget } from '../../types';
import { formatRelativeTime } from '../../utils/format';
import Avatar from '../shared/Avatar';
import RoleBadge from '../shared/RoleBadge';

interface Props {
  followId: string;
  user: FollowTarget;
  createdAt?: string;
  onPress?: () => void;
  onAccept: () => void;
  onReject: () => void;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
}

const PendingRequestCard: React.FC<Props> = memo(({
  user, createdAt, onPress, onAccept, onReject, acceptLoading, rejectLoading,
}) => {
  const { colors, spacing, radius, type } = useSocialTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.md - 2,
          paddingVertical: spacing.sm + 4,
          gap: spacing.sm + 2,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.top, { gap: spacing.sm }]}
      >
        {/* layout.avatarMd → SOCIAL_LAYOUT.avatarMd */}
        <Avatar uri={user.avatar} name={user.name} size={SOCIAL_LAYOUT.avatarMd} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            {/* type.label → type.bodyMd */}
            <Text
              style={[type.bodyMd, { color: colors.text }]}
              numberOfLines={1}
            >
              {user.name}
            </Text>
            {user.role ? <RoleBadge role={user.role} /> : null}
          </View>
          {user.headline ? (
            <Text
              style={[
                type.bodySm,
                {
                  // colors.textSecondary → colors.textMuted
                  color: colors.textMuted,
                  marginTop: 1,
                },
              ]}
              numberOfLines={1}
            >
              {user.headline}
            </Text>
          ) : null}
          {createdAt ? (
            <Text
              style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}
            >
              Requested {formatRelativeTime(createdAt)}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={[styles.actions, { gap: spacing.sm }]}>
        {/* Decline */}
        <TouchableOpacity
          onPress={onReject}
          disabled={rejectLoading || acceptLoading}
          activeOpacity={0.8}
          style={[
            styles.btn,
            {
              // colors.bgAlt → colors.cardAlt
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
              borderRadius: radius.sm,
              paddingVertical: spacing.sm + 2,
              minHeight: 44,
            },
          ]}
        >
          {rejectLoading ? (
            // colors.textSecondary → colors.textMuted
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <>
              <Ionicons name="close" size={16} color={colors.textMuted} />
              {/* type.btn → type.bodyMd */}
              <Text style={[type.bodyMd, { color: colors.textMuted }]}>
                Decline
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Accept */}
        <TouchableOpacity
          onPress={onAccept}
          disabled={rejectLoading || acceptLoading}
          activeOpacity={0.85}
          style={[
            styles.btn,
            {
              backgroundColor: colors.primary,
              borderColor: 'transparent',
              borderRadius: radius.sm,
              paddingVertical: spacing.sm + 2,
              minHeight: 44,
            },
          ]}
        >
          {acceptLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color={colors.white} />
              {/* type.btn → type.bodyMd; '#fff' → colors.white */}
              <Text style={[type.bodyMd, { color: colors.white }]}>
                Accept
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

PendingRequestCard.displayName = 'PendingRequestCard';

const styles = StyleSheet.create({
  card: { borderBottomWidth: 0.5 },
  top: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row' },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
  },
});

export default PendingRequestCard;
// ✅ theme-migrated
