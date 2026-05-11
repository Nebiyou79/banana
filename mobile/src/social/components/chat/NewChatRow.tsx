// =============================================================================
// FILE: mobile/src/social/components/chat/NewChatRow.tsx
// =============================================================================

/**
 * NewChatRow — contact picker row for NewChatScreen.
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays a search result with an action badge showing the relationship:
 *
 *   'connected'    → green "Friend" badge → opens chat directly
 *   'following'    → blue "Following" badge → opens with request notice
 *   'follow_back'  → amber "Follows you" → disabled
 *   'none'         → grey "Follow first" → disabled
 *   'self'/'blocked' → row hidden entirely
 *
 * Professional polish:
 * - Theme tokens for all styling
 * - Verification badge for verified users
 * - Proper min height for touch target
 * - Accessibility labels including badge state
 * - Highlighted row on press
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../shared/Avatar';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SearchResult } from '../../types';
import type { ConnectionStatus } from '../../types/follow';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface NewChatRowProps {
  result: SearchResult;
  status: ConnectionStatus;
  onPress: () => void;
}

// ─── Badge Configuration ─────────────────────────────────────────────────────

interface BadgeSpec {
  label: string;
  iconName: 'people' | 'person-add' | 'person' | 'lock-closed';
  fg: string;
  bg: string;
  border: string;
  disabled: boolean;
}

const buildBadge = (
  status: ConnectionStatus,
  theme: ReturnType<typeof useSocialTheme>
): BadgeSpec | null => {
  switch (status) {
    case 'connected':
      return {
        label: 'Friend',
        iconName: 'people',
        fg: theme.colors.success,
        bg: theme.withAlpha(theme.colors.success, 0.12), // theme.colors.successSurface → withAlpha(success, 0.12)
        border: theme.withAlpha(theme.colors.success, 0.3),
        disabled: false,
      };
    case 'following':
      return {
        label: 'Following',
        iconName: 'person-add',
        fg: theme.primary,
        bg: theme.withAlpha(theme.colors.primary, 0.10), // theme.colors.primarySubtle → withAlpha(primary, 0.10)
        border: theme.withAlpha(theme.colors.primaryLight, 0.3), // theme.colors.primaryTint → theme.colors.primaryLight
        disabled: false,
      };
    case 'follow_back':
      return {
        label: 'Follows you',
        iconName: 'person',
        fg: theme.colors.warning,
        bg: theme.withAlpha(theme.colors.warning, 0.12), // theme.colors.warningSurface → withAlpha(warning, 0.12)
        border: theme.withAlpha(theme.colors.warning, 0.3),
        disabled: true,
      };
    case 'none':
      return {
        label: 'Follow first',
        iconName: 'lock-closed',
        fg: theme.muted,
        bg: theme.cardAlt,
        border: theme.border,
        disabled: true,
      };
    default:
      return null;
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

const NewChatRow: React.FC<NewChatRowProps> = memo(
  ({ result, status, onPress }) => {
    const theme = useSocialTheme();
    const badge = buildBadge(status, theme);

    if (!badge || status === 'self' || status === 'blocked') return null;

    return (
      <Pressable
        onPress={badge.disabled ? undefined : onPress}
        style={({ pressed }) => [
          styles.container,
          {
            borderBottomColor: theme.border,
            backgroundColor: pressed
              ? theme.withAlpha(theme.colors.primary, 0.08) // theme.colors.cardPressed → withAlpha(primary, 0.08)
              : 'transparent',
            opacity: badge.disabled ? 0.55 : 1,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${result.name}, ${badge.label}. ${
          badge.disabled
            ? 'Not available to chat'
            : 'Tap to start conversation'
        }`}
        accessibilityState={{ disabled: badge.disabled }}
      >
        {/* Avatar */}
        <Avatar
          uri={result.avatar ?? null}
          name={result.name}
          size={48}
          isOnline={result.isOnline ?? false}
          lastSeen={result.lastSeen ?? null}
        />

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {result.name}
            </Text>
            {/* {result.verificationStatus === 'full' && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={theme.primary}
                style={{ flexShrink: 0 }}
              />
            )} */}
          </View>
          {result.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {result.headline}
            </Text>
          ) : null}
        </View>

        {/* Action badge */}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badge.bg,
              borderColor: badge.border,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Ionicons
            name={badge.iconName}
            size={12}
            color={badge.fg}
          />
          <Text style={[styles.badgeText, { color: badge.fg }]}>
            {badge.label}
          </Text>
        </View>
      </Pressable>
    );
  }
);

NewChatRow.displayName = 'NewChatRow';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    minHeight: 68,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  headline: {
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default NewChatRow;
// ✅ theme-migrated
