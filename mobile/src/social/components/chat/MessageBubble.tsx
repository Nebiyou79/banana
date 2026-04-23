// src/social/components/chat/MessageBubble.tsx
/**
 * Mobile message bubble.
 *
 * Own messages:   right-aligned, theme.primary bg, white text, rounded
 *                 18px with 4px top-right corner ("tail").
 * Other messages: left-aligned, theme.card bg, theme.text color, rounded
 *                 18px with 4px top-left corner.
 * Deleted:        italic "Message deleted" in muted color, no bubble bg.
 *
 * Features:
 *   • Timestamp under bubble (11px muted).
 *   • Read receipts for own messages (✓ sent / ✓✓ gray / ✓✓ blue).
 *   • Optional reply preview above content.
 *   • Long-press opens `@expo/react-native-action-sheet` with Copy / Delete.
 *     - "Delete for everyone" appears only for own messages within 2h.
 */
import { Ionicons } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as Clipboard from 'expo-clipboard';
import React, { memo, useCallback } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Message } from '../../services/messageService';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  onDelete?: (messageId: string, deleteFor: 'me' | 'everyone') => void;
  onReport?: (messageId: string) => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function getAvatarUrl(avatar: any): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  return avatar.secure_url || avatar.url;
}

const MessageBubble: React.FC<MessageBubbleProps> = memo(
  ({ message, isOwnMessage, showAvatar = false, onDelete, onReport }) => {
    const theme = useSocialTheme();
    const { showActionSheetWithOptions } = useActionSheet();

    const isDeleted =
      message.type === 'deleted' || Boolean(message.deletedAt);

    const canDeleteForEveryone = useCallback(() => {
      if (!isOwnMessage || isDeleted) return false;
      if (!message.canDeleteUntil) return false;
      return Date.now() < new Date(message.canDeleteUntil).getTime();
    }, [isOwnMessage, isDeleted, message.canDeleteUntil]);

    /* ── Long-press menu ─────────────────────────────────────────── */
    const openMenu = useCallback(() => {
      if (isDeleted) return;

      const options: string[] = ['Copy'];
      const destructiveIndex: number[] = [];

      if (isOwnMessage) {
        options.push('Delete for me');
        destructiveIndex.push(options.length - 1);
        if (canDeleteForEveryone()) {
          options.push('Delete for everyone');
          destructiveIndex.push(options.length - 1);
        }
      } else {
        options.push('Report');
      }

      options.push('Cancel');
      const cancelIndex = options.length - 1;

      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        (buttonIndex?: number) => {
          if (buttonIndex === undefined || buttonIndex === cancelIndex) return;
          const label = options[buttonIndex];
          if (label === 'Copy') {
            if (message.content) {
              Clipboard.setStringAsync(message.content).then(() =>
                Toast.show({ type: 'success', text1: 'Copied' })
              );
            }
          } else if (label === 'Delete for me') {
            onDelete?.(message._id, 'me');
          } else if (label === 'Delete for everyone') {
            onDelete?.(message._id, 'everyone');
          } else if (label === 'Report') {
            onReport?.(message._id);
          }
        }
      );
    }, [
      isDeleted,
      isOwnMessage,
      canDeleteForEveryone,
      message._id,
      message.content,
      onDelete,
      onReport,
      showActionSheetWithOptions,
    ]);

    /* ── Status ticks ─────────────────────────────────────────────── */
    const renderStatusTick = () => {
      if (!isOwnMessage || isDeleted) return null;
      if (message.status === 'read') {
        return (
          <Ionicons
            name="checkmark-done"
            size={14}
            color="#60A5FA"
            style={{ marginLeft: 2 }}
          />
        );
      }
      if (message.status === 'delivered') {
        return (
          <Ionicons
            name="checkmark-done"
            size={14}
            color={theme.muted}
            style={{ marginLeft: 2 }}
          />
        );
      }
      return (
        <Ionicons
          name="checkmark"
          size={14}
          color={theme.muted}
          style={{ marginLeft: 2 }}
        />
      );
    };

    /* ── Deleted ──────────────────────────────────────────────────── */
    if (isDeleted) {
      return (
        <View
          style={[
            styles.row,
            isOwnMessage ? styles.rowEnd : styles.rowStart,
          ]}
        >
          <View style={[styles.deletedPill, { borderColor: theme.border }]}>
            <Ionicons name="ban-outline" size={12} color={theme.muted} />
            <Text style={[styles.deletedText, { color: theme.muted }]}>
              Message deleted
            </Text>
          </View>
        </View>
      );
    }

    /* ── Normal ───────────────────────────────────────────────────── */
    const avatarUrl = showAvatar
      ? getAvatarUrl((message.sender as any)?.avatar)
      : undefined;

    return (
      <View
        style={[
          styles.row,
          isOwnMessage ? styles.rowEnd : styles.rowStart,
        ]}
      >
        {!isOwnMessage ? (
          showAvatar ? (
            <View style={styles.avatarSlot}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: theme.cardAlt, alignItems: 'center', justifyContent: 'center' },
                  ]}
                >
                  <Text style={{ color: theme.muted, fontSize: 11 }}>
                    {(message.sender?.name?.[0] || '?').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.avatarSlot} />
          )
        ) : null}

        <View
          style={[
            styles.column,
            isOwnMessage ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' },
          ]}
        >
          {/* Reply preview */}
          {message.replyTo ? (
            <View
              style={[
                styles.replyPreview,
                isOwnMessage
                  ? {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderLeftColor: 'rgba(255,255,255,0.6)',
                    }
                  : {
                      backgroundColor: theme.cardAlt,
                      borderLeftColor: theme.muted,
                    },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.replyAuthor,
                  {
                    color: isOwnMessage
                      ? 'rgba(255,255,255,0.85)'
                      : theme.subtext,
                  },
                ]}
              >
                {message.replyTo.sender?.name || 'Unknown'}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.replyText,
                  {
                    color: isOwnMessage
                      ? 'rgba(255,255,255,0.95)'
                      : theme.text,
                  },
                ]}
              >
                {message.replyTo.content ||
                  (message.replyTo.type === 'deleted'
                    ? 'Deleted message'
                    : '')}
              </Text>
            </View>
          ) : null}

          {/* Bubble */}
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={openMenu}
            delayLongPress={280}
            style={[
              styles.bubble,
              isOwnMessage
                ? {
                    backgroundColor: theme.primary,
                    borderTopRightRadius: 4,
                  }
                : {
                    backgroundColor: theme.card,
                    borderTopLeftRadius: 4,
                    borderColor: theme.border,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
            ]}
          >
            <Text
              style={[
                styles.content,
                {
                  color: isOwnMessage ? '#FFFFFF' : theme.text,
                },
              ]}
              selectable
            >
              {message.content}
            </Text>
          </TouchableOpacity>

          {/* Meta */}
          <View
            style={[
              styles.meta,
              isOwnMessage ? { flexDirection: 'row-reverse' } : null,
            ]}
          >
            <Text style={[styles.time, { color: theme.muted }]}>
              {formatTime(message.createdAt)}
            </Text>
            {renderStatusTick()}
          </View>
        </View>
      </View>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

const AVATAR = 28;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  avatarSlot: {
    width: AVATAR,
    height: AVATAR,
    marginRight: 6,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  column: {
    maxWidth: '78%',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  time: {
    fontSize: 11,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 2,
    maxWidth: '100%',
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  replyText: {
    fontSize: 12,
  },
  deletedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  deletedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default MessageBubble;