/**
 * MessageBubble — a single chat message.
 * -----------------------------------------------------------------------------
 * Own messages: right-aligned, primary color background.
 * Other messages: left-aligned, card-alt background.
 * Deleted: muted italic "Message deleted".
 * Long-press exposes Copy/Delete via an ActionSheet provided by the parent.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSocialTheme } from '../../theme/socialTheme';
import type { Message } from '../../types/chat';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  /** Show timestamp row under bubble. */
  showTime?: boolean;
  /** Show tail (tighter corner) — typically on the last in a run. */
  showTail?: boolean;
  onLongPress?: (m: Message) => void;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const am = h < 12;
  h = h % 12 || 12;
  return `${h}:${m} ${am ? 'AM' : 'PM'}`;
};

const TICKS: Record<Message['status'], { icon: 'checkmark' | 'checkmark-done'; tint: 'default' | 'active' }> = {
  sent: { icon: 'checkmark', tint: 'default' },
  delivered: { icon: 'checkmark-done', tint: 'default' },
  read: { icon: 'checkmark-done', tint: 'active' },
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTime = true,
  showTail = true,
  onLongPress,
}) => {
  const theme = useSocialTheme();
  const isDeleted = message.type === 'deleted';

  const bubbleBg = isOwn ? theme.primary : theme.card;
  const textColor = isOwn ? '#FFFFFF' : theme.text;
  const mutedColor = isOwn ? 'rgba(255,255,255,0.75)' : theme.muted;

  const borderRadius = {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: !isOwn && showTail ? 4 : 18,
    borderBottomRightRadius: isOwn && showTail ? 4 : 18,
  };

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isOwn ? 'flex-end' : 'flex-start' },
      ]}
    >
      <Pressable
        onLongPress={() => !isDeleted && onLongPress?.(message)}
        delayLongPress={250}
        style={({ pressed }) => [
          styles.bubble,
          borderRadius,
          {
            backgroundColor: bubbleBg,
            opacity: pressed ? 0.85 : 1,
            borderWidth: !isOwn ? StyleSheet.hairlineWidth : 0,
            borderColor: theme.border,
          },
        ]}
      >
        {isDeleted ? (
          <View style={styles.deletedRow}>
            <Ionicons name="ban-outline" size={14} color={mutedColor} />
            <Text style={[styles.deletedText, { color: mutedColor }]}>
              Message deleted
            </Text>
          </View>
        ) : (
          <Text style={[styles.content, { color: textColor }]}>
            {message.content}
          </Text>
        )}

        {showTime && (
          <View style={styles.metaRow}>
            <Text style={[styles.time, { color: mutedColor }]}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwn && !isDeleted && (
              <Ionicons
                name={TICKS[message.status].icon}
                size={14}
                color={
                  TICKS[message.status].tint === 'active'
                    ? '#38BDF8'
                    : mutedColor
                }
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, marginVertical: 2, flexDirection: 'row' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: { fontSize: 15, lineHeight: 20 },
  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deletedText: { fontSize: 14, fontStyle: 'italic' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  time: { fontSize: 11 },
});

export default MessageBubble;