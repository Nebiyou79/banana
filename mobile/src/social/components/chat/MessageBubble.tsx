// src/social/components/chat/MessageBubble.tsx
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSocialTheme } from '../../theme/socialTheme';
import Avatar from '../shared/Avatar';
import type { Message } from '../../types/chat';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime?: boolean;
  showTail?: boolean;
  onLongPress?: (message: Message) => void;
  senderAvatar?: string | null;
  senderName?: string;
}

const AVATAR_SIZE = 28;
const AVATAR_GAP = 8;
const AVATAR_SLOT = AVATAR_SIZE + AVATAR_GAP;

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const MessageBubble: React.FC<MessageBubbleProps> = memo(({
  message,
  isOwn,
  showTime = true,
  showTail = false,
  onLongPress,
  senderAvatar,
  senderName,
}) => {
  const theme = useSocialTheme();
  const { colors, radius, dark, withAlpha } = theme;
  const isDeleted = message.type === 'deleted';

  // ── Colors with Dark/Light mode ────────────────────────────────────────
  // Own messages: Primary background + White text (always high contrast)
  // Other messages: Card background + Text color (adapts to dark/light)
  const bubbleBg = isOwn ? colors.primary : colors.card;
  const textColor = isOwn ? '#FFFFFF' : colors.text;
  const mutedColor = isOwn ? 'rgba(255,255,255,0.75)' : colors.muted;
  
  // Other messages: subtle border in dark mode, hairline in light
  const borderColor = isOwn ? 'transparent' : (dark ? 'rgba(255,255,255,0.08)' : colors.border);
  const borderWidth = isOwn ? 0 : StyleSheet.hairlineWidth;

  // ── Shadow for own messages ─────────────────────────────────────────────
  const ownShadow = isOwn ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: dark ? 0.2 : 0.12,
    shadowRadius: 3,
    elevation: 2,
  } : {};

  // ── Read receipts ──────────────────────────────────────────────────────
  const getTicks = (): { icon: 'checkmark' | 'checkmark-done'; color: string } => {
    switch (message.status) {
      case 'read':
        return { icon: 'checkmark-done', color: '#38BDF8' };
      case 'delivered':
        return { icon: 'checkmark-done', color: mutedColor };
      case 'sent':
      default:
        return { icon: 'checkmark', color: mutedColor };
    }
  };

  const ticks = getTicks();

  // ── Border radius with tail ─────────────────────────────────────────────
  const borderRadius = {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: !isOwn && showTail ? radius.sm : radius.lg,
    borderBottomRightRadius: isOwn && showTail ? radius.sm : radius.lg,
  };

  const showAvatar = !isOwn && showTail;
  const showAvatarSpacer = !isOwn && !showTail;

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    >
      {/* ── Avatar slot ────────────────────────────────────────────────── */}
      {showAvatar && (
        <View style={[styles.avatarContainer, { marginRight: AVATAR_GAP }]}>
          <Avatar
            uri={senderAvatar ?? null}
            name={senderName ?? 'U'}
            size={AVATAR_SIZE}
            isOnline={false}
            lastSeen={null}
          />
        </View>
      )}
      {showAvatarSpacer && (
        <View style={{ width: AVATAR_SLOT }} />
      )}

      {/* ── Bubble ────────────────────────────────────────────────────── */}
      <Pressable
        onLongPress={() => !isDeleted && onLongPress?.(message)}
        delayLongPress={250}
        style={({ pressed }) => [
          styles.bubble,
          borderRadius,
          ownShadow,
          {
            backgroundColor: bubbleBg,
            opacity: pressed && !isDeleted ? 0.85 : 1,
            borderWidth: borderWidth,
            borderColor: borderColor,
            maxWidth: '78%',
            paddingHorizontal: 14,
            paddingVertical: 10,
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel={
          isDeleted
            ? 'Deleted message'
            : isOwn
            ? `Your message: ${message.content}`
            : `Message from ${senderName ?? 'them'}: ${message.content}`
        }
      >
        {isDeleted ? (
          <View style={styles.deletedRow}>
            <Ionicons name="ban-outline" size={14} color={mutedColor} style={{ marginRight: 6 }} />
            <Text style={[styles.deletedText, { color: mutedColor }]}>
              Message deleted
            </Text>
          </View>
        ) : (
          <>
            {/* Reply indicator */}
            {message.replyTo && typeof message.replyTo !== 'string' && (
              <View
                style={[
                  styles.replyContainer,
                  {
                    backgroundColor: isOwn
                      ? withAlpha('#FFFFFF', 0.15)
                      : withAlpha(colors.primary, 0.08),
                    borderLeftColor: isOwn
                      ? 'rgba(255,255,255,0.5)'
                      : colors.primary,
                    borderLeftWidth: 3,
                    paddingLeft: 8,
                    paddingVertical: 4,
                    marginBottom: 6,
                    borderRadius: 4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.replyName,
                    {
                      color: isOwn
                        ? 'rgba(255,255,255,0.9)'
                        : colors.primary,
                      fontSize: 11,
                      fontWeight: '700',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {message.replyTo.sender &&
                  typeof message.replyTo.sender !== 'string'
                    ? message.replyTo.sender.name ?? 'User'
                    : 'User'}
                </Text>
                <Text
                  style={[
                    styles.replyContent,
                    {
                      color: isOwn
                        ? 'rgba(255,255,255,0.7)'
                        : colors.textMuted,
                      fontSize: 11,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {message.replyTo.content ?? 'Message unavailable'}
                </Text>
              </View>
            )}

            {/* Main content */}
            <Text style={[styles.content, { color: textColor }]} selectable>
              {message.content}
            </Text>
          </>
        )}

        {/* Timestamp + Read receipts */}
        {showTime && (
          <View style={styles.metaRow}>
            <Text style={[styles.time, { color: mutedColor, fontSize: 10 }]}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwn && !isDeleted && (
              <Ionicons
                name={ticks.icon}
                size={14}
                color={ticks.color}
                style={styles.tick}
              />
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  avatarContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginBottom: 6,
    borderRadius: 4,
  },
  replyName: {
    fontSize: 11,
    fontWeight: '700',
  },
  replyContent: {
    fontSize: 11,
    marginTop: 1,
  },
  deletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  time: {
    fontSize: 10,
  },
  tick: {
    marginLeft: 3,
  },
});

export default MessageBubble;