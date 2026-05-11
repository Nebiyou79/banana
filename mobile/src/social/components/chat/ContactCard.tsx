// =============================================================================
// FILE: mobile/src/social/components/chat/ContactCard.tsx
// =============================================================================

/**
 * ContactCard — single row in the conversations list.
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ [Avatar●]  Name                                   2m ago   │
 *   │            Headline                              ● unread   │
 *   │            Last message preview…                            │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Professional polish:
 * - Theme tokens for all colors, spacing, typography
 * - Proper touch target (minHeight: 72)
 * - Avatar with online presence dot
 * - Unread badge with pill shape and overflow protection
 * - Follow button for non-connected users
 * - Haptic-ready press feedback via opacity
 * - Truncation with ellipsizeMode for long names/messages
 */

import React, { memo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';
import Avatar from '../shared/Avatar';
import FollowButton from '../shared/FollowButton';
import { formatRelativeTime } from '../../utils/presence';
import type { ConnectionStatus } from '../../types/follow';
import type { Conversation } from '../../types/chat';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ContactCardProps {
  conversation: Conversation;
  status?: ConnectionStatus;
  onPress: () => void;
  onFollowPress?: () => void;
  followLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ContactCard: React.FC<ContactCardProps> = memo(
  ({
    conversation,
    status = 'none',
    onPress,
    onFollowPress,
    followLoading,
  }) => {
    const theme = useSocialTheme();
    const other = conversation.otherUser;
    const last = conversation.lastMessage;
    const unread = conversation.unreadCount ?? 0;
    const hasUnread = unread > 0;

    // Compute preview text
    const preview = last
      ? last.type === 'deleted'
        ? 'Message deleted'
        : last.content ?? ''
      : 'Say hello 👋';

    const showFollow = onFollowPress && status !== 'self' && !hasUnread;

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.65}
        style={[
          styles.container,
          {
            borderBottomColor: theme.border,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${other?.name ?? 'Unknown'}, ${
          hasUnread ? `${unread} unread messages` : 'no unread messages'
        }`}
        accessibilityHint="Opens the conversation"
      >
        {/* Avatar with presence indicator */}
        <Avatar
          uri={other?.avatar ?? null}
          name={other?.name ?? 'U'}
          size={56}
          lastSeen={other?.lastSeen}
          isOnline={other?.isOnline}
          showPresence
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Top row: Name + Timestamp */}
          <View style={styles.topRow}>
            <Text
              style={[
                styles.name,
                {
                  color: theme.text,
                  fontWeight: hasUnread ? '800' : '600',
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {other?.name ?? 'Unknown'}
            </Text>
            <Text
              style={[styles.time, { color: theme.muted }]}
              numberOfLines={1}
            >
              {formatRelativeTime(
                conversation.lastMessageAt ?? conversation.updatedAt
              )}
            </Text>
          </View>

          {/* Headline */}
          {other?.headline ? (
            <Text
              style={[styles.headline, { color: theme.subtext }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {other.headline}
            </Text>
          ) : null}

          {/* Bottom row: Preview + Unread badge or Follow button */}
          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.preview,
                {
                  color: hasUnread ? theme.text : theme.subtext,
                  fontWeight: hasUnread ? '600' : '400',
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {preview}
            </Text>

            {hasUnread ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.primary,
                    borderRadius: theme.radius.pill,
                    minWidth: 22,
                    height: 22,
                    paddingHorizontal: theme.spacing.sm,
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            ) : showFollow ? (
              <FollowButton
                status={status}
                onPress={onFollowPress}
                loading={followLoading}
                size="sm"
              />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

ContactCard.displayName = 'ContactCard';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
    minHeight: 72,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    flexShrink: 0,
  },
  headline: {
    fontSize: 12,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    gap: 8,
  },
  preview: {
    fontSize: 13,
    flex: 1,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ContactCard;
// ✅ theme-migrated
