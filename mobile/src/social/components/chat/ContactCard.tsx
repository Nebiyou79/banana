// src/social/components/chat/ContactCard.tsx
import React, { memo } from 'react';
import {
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

export interface ContactCardProps {
  conversation: Conversation;
  status?: ConnectionStatus;
  onPress: () => void;
  onFollowPress?: () => void;
  followLoading?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = memo(({
  conversation,
  status = 'none',
  onPress,
  onFollowPress,
  followLoading,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, type, dark } = theme;
  
  const other = conversation.otherUser;
  const last = conversation.lastMessage;
  const unread = conversation.unreadCount ?? 0;
  const hasUnread = unread > 0;

  // Preview text with fallback
  const preview = last
    ? last.type === 'deleted'
      ? 'Message deleted'
      : last.content ?? ''
    : 'Say hello 👋';

  const showFollow = onFollowPress && status !== 'self' && !hasUnread;

  // Dark mode: darker separator, brighter text
  // Light mode: light separator, standard text
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : colors.border;
  const nameColor = hasUnread ? colors.text : colors.text;
  const previewColor = hasUnread ? colors.text : colors.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={[
        styles.container,
        {
          borderBottomColor: borderColor,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minHeight: 72,
          gap: spacing.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${other?.name ?? 'Unknown'}, ${
        hasUnread ? `${unread} unread messages` : 'no unread messages'
      }`}
      accessibilityHint="Opens the conversation"
    >
      {/* Avatar with presence */}
      <Avatar
        uri={other?.avatar ?? null}
        name={other?.name ?? 'U'}
        size={56}
        lastSeen={other?.lastSeen}
        isOnline={other?.isOnline}
        showPresence
        ring={hasUnread}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Name + Timestamp */}
        <View style={styles.topRow}>
          <Text
            style={[
              styles.name,
              {
                color: nameColor,
                fontWeight: hasUnread ? '800' : '600',
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {other?.name ?? 'Unknown'}
          </Text>
          <Text
            style={[styles.time, { color: colors.muted }]}
            numberOfLines={1}
          >
            {formatRelativeTime(conversation.lastMessageAt ?? conversation.updatedAt)}
          </Text>
        </View>

        {/* Headline */}
        {other?.headline ? (
          <Text
            style={[styles.headline, { color: colors.textMuted }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {other.headline}
          </Text>
        ) : null}

        {/* Preview + Unread/Follow */}
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.preview,
              {
                color: previewColor,
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
                  backgroundColor: colors.primary,
                  borderRadius: radius.pill,
                  minWidth: 22,
                  height: 22,
                  paddingHorizontal: spacing.sm,
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
              showConnectedDot
            />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ContactCard.displayName = 'ContactCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
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