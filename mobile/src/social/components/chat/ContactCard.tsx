/**
 * ContactCard — single row in the conversations list.
 * -----------------------------------------------------------------------------
 * Layout:
 *   ┌─────────────────────────────────────────────────┐
 *   │ [Avatar●] Name                         2m       │
 *   │           Headline                     ● (2)    │
 *   │           Last message preview…     [Follow]    │
 *   └─────────────────────────────────────────────────┘
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

const ContactCard: React.FC<ContactCardProps> = ({
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

  const preview = last
    ? last.type === 'deleted'
      ? 'Message deleted'
      : (last.content ?? '')
    : 'Say hello 👋';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { borderBottomColor: theme.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${other.name}`}
    >
      <Avatar
        uri={other.avatar}
        name={other.name}
        size={52}
        lastSeen={other.lastSeen}
        isOnline={other.isOnline}
        showPresence
      />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, { color: theme.text, fontWeight: hasUnread ? '800' : '700' }]}
            numberOfLines={1}
          >
            {other.name}
          </Text>
          <Text style={[styles.time, { color: theme.muted }]}>
            {formatRelativeTime(conversation.lastMessageAt ?? conversation.updatedAt)}
          </Text>
        </View>

        {other.headline ? (
          <Text
            style={[styles.headline, { color: theme.subtext }]}
            numberOfLines={1}
          >
            {other.headline}
          </Text>
        ) : null}

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
          >
            {preview}
          </Text>

          {hasUnread ? (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          ) : onFollowPress && status !== 'self' ? (
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
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { fontSize: 15, flex: 1 },
  time: { fontSize: 11 },
  headline: { fontSize: 12, marginTop: 1 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  preview: { fontSize: 13, flex: 1 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

export default ContactCard;