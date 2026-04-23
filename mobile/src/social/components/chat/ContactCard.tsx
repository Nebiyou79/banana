// src/social/components/chat/ContactCard.tsx
/**
 * Contact card row rendered in MessagesScreen's FlashList.
 *
 * ┌─────────────────────────────────────────┐
 * │ [Avatar 🟢]  Name  [Role]          2m  │
 * │              Last message preview   (2) │
 * └─────────────────────────────────────────┘
 *
 * Avatar: 52px with 12px online-dot overlay (bottom-right, white border).
 * Unread: red circle on the right with the count.
 */
import React, { memo, useMemo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Conversation } from '../../services/conversationService';
import { ROLE_COLORS, useSocialTheme } from '../../theme/socialTheme';
import type { UserRole } from '../../types';
import OnlineStatusDot from './OnlineStatusDot';

interface ContactCardProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: (conv: Conversation) => void;
  onLongPress?: (conv: Conversation) => void;
}

function getAvatarUrl(avatar: any): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  return avatar.secure_url || avatar.url;
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  if (hr < 24) return `${hr}h`;
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function previewText(conv: Conversation, currentUserId: string): string {
  const lm = conv.lastMessage;
  if (!lm) return 'No messages yet';
  if (lm.type === 'deleted' || lm.deletedAt) return 'Message deleted';
  const senderId =
    typeof lm.sender === 'string' ? lm.sender : lm.sender?._id;
  const prefix = senderId === currentUserId ? 'You: ' : '';
  return prefix + truncate(lm.content || '', 40);
}

const ROLE_LABELS: Record<UserRole, string> = {
  candidate: 'Candidate',
  freelancer: 'Freelancer',
  company: 'Company',
  organization: 'Org',
};

const ContactCard: React.FC<ContactCardProps> = memo(
  ({ conversation, currentUserId, onPress, onLongPress }) => {
    const theme = useSocialTheme();

    const other = useMemo(
      () =>
        conversation.otherParticipant ||
        conversation.participants?.find(
          (p) => p._id?.toString() !== currentUserId
        ) ||
        null,
      [conversation, currentUserId]
    );

    if (!other) return null;

    const avatarUrl = getAvatarUrl(other.avatar);
    const role = other.role?.toLowerCase() as UserRole | undefined;
    const roleBadge =
      role && ROLE_LABELS[role]
        ? {
            label: ROLE_LABELS[role],
            bg: theme.dark
              ? `${ROLE_COLORS[role].primary}22`
              : ROLE_COLORS[role].lighter,
            fg: theme.dark
              ? ROLE_COLORS[role].light
              : ROLE_COLORS[role].dark,
          }
        : null;

    const unread = conversation.unreadCount || 0;
    const preview = previewText(conversation, currentUserId);
    const ts = formatRelative(
      conversation.lastMessage?.createdAt || conversation.lastMessageAt
    );
    const isRequest = conversation.status === 'request';

    return (
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => onPress(conversation)}
        onLongPress={onLongPress ? () => onLongPress(conversation) : undefined}
        style={[
          styles.row,
          { backgroundColor: theme.bg, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.cardAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Text
                style={{ color: theme.subtext, fontSize: 18, fontWeight: '600' }}
              >
                {(other.name?.[0] || '?').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.dotWrap}>
            <OnlineStatusDot
              lastSeen={other.lastSeen}
              isOnline={other.isOnline}
              size={12}
              showBorder
              borderColor={theme.bg}
            />
          </View>
        </View>

        <View style={styles.main}>
          <View style={styles.topLine}>
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                {
                  color: theme.text,
                  fontWeight: unread > 0 ? '700' : '600',
                },
              ]}
            >
              {other.name}
            </Text>
            {roleBadge ? (
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: roleBadge.bg },
                ]}
              >
                <Text style={[styles.roleBadgeText, { color: roleBadge.fg }]}>
                  {roleBadge.label}
                </Text>
              </View>
            ) : null}
            <Text
              style={[styles.time, { color: theme.muted }]}
              numberOfLines={1}
            >
              {ts}
            </Text>
          </View>

          <View style={styles.bottomLine}>
            <Text
              numberOfLines={1}
              style={[
                styles.preview,
                {
                  color: unread > 0 ? theme.text : theme.subtext,
                  fontWeight: unread > 0 ? '600' : '400',
                  flex: 1,
                },
              ]}
            >
              {preview}
            </Text>
            {unread > 0 ? (
              <View
                style={[styles.unread, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.unreadText}>
                  {unread > 99 ? '99+' : String(unread)}
                </Text>
              </View>
            ) : null}
          </View>

          {isRequest ? (
            <Text style={styles.requestTag}>Message request</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }
);

ContactCard.displayName = 'ContactCard';

const AVATAR = 52;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    position: 'relative',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  dotWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  time: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  preview: {
    fontSize: 13,
  },
  unread: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  requestTag: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#D97706',
    marginTop: 2,
  },
});

export default ContactCard;