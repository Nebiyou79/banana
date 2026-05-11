// =============================================================================
// FILE: mobile/src/social/components/chat/MessageBubble.tsx — FIXED (Bug 5)
// =============================================================================

/**
 * MessageBubble — a single chat message with professional styling.
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG 5 FIXES:
 *   1. Own message text color: fixed to '#FFFFFF' (was theme.subtext = gray).
 *      White text is required on the primary/accent background for contrast.
 *
 *   2. Received message background: uses theme.card with a hairline border in
 *      theme.border. Own messages: theme.primary, no border.
 *
 *   3. Shadow on own messages: adds iOS shadowColor/shadowOpacity/shadowRadius
 *      and Android elevation for depth (iMessage / Telegram style).
 *
 *   4. Sender avatar on OTHER messages: a 28px circular Avatar appears to the
 *      LEFT of the bubble, but only when `showTail` is true (last message in
 *      a consecutive run). Consecutive messages from the same sender show no
 *      avatar to reduce clutter, matching Telegram group-chat behaviour.
 *      When the avatar is NOT shown a 28 + 8 = 36px spacer is rendered to
 *      keep consecutive bubbles left-aligned with the tailed bubble.
 *
 *   5. Read receipts (ticks) only on OWN messages:
 *        ✓  gray  = sent
 *        ✓✓ gray  = delivered
 *        ✓✓ blue  = read
 *      Never shown on received messages.
 *
 * New props:
 *   senderAvatar?: string | null   — avatar URI for the other user
 *   senderName?:  string           — name used for avatar initials fallback
 *
 * Own messages:   Right-aligned, PRIMARY background, WHITE text, shadow, ticks
 * Other messages: Left-aligned, CARD background, TEXT color, optional avatar
 * Deleted:        Muted italic placeholder
 */

import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSocialTheme } from '../../theme/socialTheme';
import Avatar from '../shared/Avatar';
import type { Message } from '../../types/chat';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime?: boolean;
  showTail?: boolean;
  onLongPress?: (message: Message) => void;
  /** Avatar URI for the other user (only used when isOwn === false) */
  senderAvatar?: string | null;
  /** Name for avatar initials fallback (only used when isOwn === false) */
  senderName?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Size of the sender avatar shown beside received messages */
const AVATAR_SIZE = 28;
/** Gap between avatar and bubble */
const AVATAR_GAP = 8;
/** Total left offset so consecutive received bubbles align with tailed ones */
const AVATAR_SLOT = AVATAR_SIZE + AVATAR_GAP;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

// ─── Component ───────────────────────────────────────────────────────────────

const MessageBubble: React.FC<MessageBubbleProps> = memo(
  ({
    message,
    isOwn,
    showTime = true,
    showTail = false,
    onLongPress,
    senderAvatar,
    senderName,
  }) => {
    const theme = useSocialTheme();
    const isDeleted = message.type === 'deleted';

    // ── BUG 5 FIX 1 & 2: Colors ───────────────────────────────────────────
    // Own messages:      Primary/accent background + WHITE text
    // Other messages:    Card background + theme.text (dark) + hairline border
    const bubbleBg = isOwn ? theme.primary : theme.card;
    const textColor = isOwn ? '#FFFFFF' : theme.text;           // FIX: was theme.subtext
    const mutedColor = isOwn ? 'rgba(255,255,255,0.75)' : theme.muted;
    const borderColor = isOwn ? 'transparent' : theme.border;

    // ── Read receipt ticks (own messages only) ────────────────────────────
    const getTicks = (): { icon: 'checkmark' | 'checkmark-done'; color: string } => {
      switch (message.status) {
        case 'read':
          return { icon: 'checkmark-done', color: '#38BDF8' };  // Blue double-tick
        case 'delivered':
          return { icon: 'checkmark-done', color: mutedColor }; // Gray double-tick
        case 'sent':
        default:
          return { icon: 'checkmark', color: mutedColor };      // Gray single-tick
      }
    };

    const ticks = getTicks();

    // ── Border radius with optional tail ─────────────────────────────────
    const borderRadius = {
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      // FIX: tail corner is on the bottom of the LAST message in a run
      borderBottomLeftRadius: !isOwn && showTail ? theme.radius.sm : theme.radius.lg,
      borderBottomRightRadius: isOwn && showTail ? theme.radius.sm : theme.radius.lg,
    };

    // ── BUG 5 FIX 3: Shadow on own messages (iMessage/Telegram depth) ─────
    const ownShadow = isOwn
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.12,
          shadowRadius: 3,
          elevation: 2,
        }
      : {};

    // ── BUG 5 FIX 4: Avatar slot for received messages ────────────────────
    // showTail = true  → last message in a run → show avatar
    // showTail = false → middle/top of a run  → show empty spacer to keep
    //                    alignment consistent with the tailed bubble below
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
        {/* ── Left avatar slot (received messages only) ──────────────── */}
        {showAvatar && (
          <View style={[styles.avatarContainer, { marginRight: AVATAR_GAP }]}>
            <Avatar
              uri={senderAvatar ?? null}
              name={senderName ?? 'U'}
              size={AVATAR_SIZE}
              // No presence dot on message-level avatars — only on the header
              isOnline={false}
              lastSeen={null}
            />
          </View>
        )}
        {showAvatarSpacer && (
          // Empty slot keeps consecutive received bubbles horizontally aligned
          <View style={{ width: AVATAR_SLOT }} />
        )}

        {/* ── Message bubble ─────────────────────────────────────────── */}
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
              borderWidth: isOwn ? 0 : StyleSheet.hairlineWidth,
              borderColor,
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
          {/* ── Deleted placeholder ─────────────────────────────────── */}
          {isDeleted ? (
            <View style={styles.deletedRow}>
              <Ionicons
                name="ban-outline"
                size={14}
                color={mutedColor}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.deletedText, { color: mutedColor }]}>
                Message deleted
              </Text>
            </View>
          ) : (
            <>
              {/* ── Reply indicator ───────────────────────────────────── */}
              {message.replyTo && typeof message.replyTo !== 'string' && (
                <View
                  style={[
                    styles.replyContainer,
                    {
                      backgroundColor: isOwn
                        ? theme.withAlpha('#FFFFFF', 0.15)
                        : theme.withAlpha(theme.primary, 0.08),
                      borderLeftColor: isOwn
                        ? 'rgba(255,255,255,0.5)'
                        : theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.replyName,
                      {
                        color: isOwn
                          ? 'rgba(255,255,255,0.9)'
                          : theme.primary,
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
                          : theme.subtext,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {message.replyTo.content ?? 'Message unavailable'}
                  </Text>
                </View>
              )}

              {/* ── Main text ────────────────────────────────────────── */}
              {/* BUG 5 FIX 1: textColor is '#FFFFFF' for own, theme.text for other */}
              <Text style={[styles.content, { color: textColor }]} selectable>
                {message.content}
              </Text>
            </>
          )}

          {/* ── Timestamp + Read receipts ─────────────────────────────── */}
          {showTime && (
            <View style={styles.metaRow}>
              <Text style={[styles.time, { color: mutedColor }]}>
                {formatTime(message.createdAt)}
              </Text>
              {/* BUG 5 FIX 5: Ticks ONLY on own messages, never on received */}
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
  }
);

MessageBubble.displayName = 'MessageBubble';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end', // avatars align to bottom of bubble
    marginVertical: 2,
  },
  avatarContainer: {
    // Keeps the avatar flush with the bubble bottom
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
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