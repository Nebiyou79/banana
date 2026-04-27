// src/social/components/chat/NewChatRow.tsx
/**
 * NewChatRow — used by NewChatScreen to pick someone to message.
 * -----------------------------------------------------------------------------
 * Renders a connection-status badge so the user understands what tapping
 * will do BEFORE they tap:
 *
 *   connected   → green "Friend" badge   → opens chat directly
 *   following   → blue  "Following" badge → opens compose with request notice
 *   follow_back → amber "Follows you"     → disabled, tap shows "Follow first"
 *   none        → grey  "Follow first"    → disabled
 *   self / blocked → row hidden
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Avatar from '../shared/Avatar';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SearchResult } from '../../types';
import type { ConnectionStatus } from '../../types/follow';

export interface NewChatRowProps {
  result: SearchResult;
  status: ConnectionStatus;
  onPress: () => void;
}

interface BadgeSpec {
  label: string;
  iconName:
    | 'people'
    | 'person-add'
    | 'person'
    | 'lock-closed';
  fg: string;
  bg: string;
  border: string;
  disabled: boolean;
}

const buildBadge = (
  status: ConnectionStatus,
  theme: ReturnType<typeof useSocialTheme>,
): BadgeSpec | null => {
  switch (status) {
    case 'connected':
      return {
        label: 'Friend',
        iconName: 'people',
        fg: '#047857',
        bg: '#D1FAE5',
        border: '#A7F3D0',
        disabled: false,
      };
    case 'following':
      return {
        label: 'Following',
        iconName: 'person-add',
        fg: theme.primary,
        bg: theme.primaryLighter,
        border: theme.primaryLighter,
        disabled: false,
      };
    case 'follow_back':
      return {
        label: 'Follows you',
        iconName: 'person',
        fg: '#B45309',
        bg: '#FEF3C7',
        border: '#FDE68A',
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

const NewChatRow: React.FC<NewChatRowProps> = memo(
  ({ result, status, onPress }) => {
    const theme = useSocialTheme();
    const badge = buildBadge(status, theme);
    if (!badge) return null;

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={badge.disabled}
        style={[
          styles.row,
          {
            borderBottomColor: theme.border,
            opacity: badge.disabled ? 0.6 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Message ${result.name} — ${badge.label}`}
        accessibilityState={{ disabled: badge.disabled }}
      >
        <Avatar uri={result.avatar} name={result.name} size={48} />
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {result.name}
            </Text>
            {result.verificationStatus === 'verified' && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.primary}
              />
            )}
          </View>
          {result.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={1}
            >
              {result.headline}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.badge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Ionicons name={badge.iconName} size={12} color={badge.fg} />
          <Text style={[styles.badgeText, { color: badge.fg }]}>
            {badge.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

NewChatRow.displayName = 'NewChatRow';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  body: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  headline: { fontSize: 12, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

export default NewChatRow;