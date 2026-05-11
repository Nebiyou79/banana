// =============================================================================
// FILE: mobile/src/social/components/chat/MessageInput.tsx
// =============================================================================

/**
 * MessageInput — composer bar at the bottom of ChatScreen.
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 * - Auto-growing multiline input (max 4 lines)
 * - Emoji picker toggle
 * - Send button with disabled state
 * - Typing indicator emission
 * - Request-disabled state (recipient must accept before replying)
 * - Professional styling matching Telegram/WhatsApp aesthetic
 * - Proper touch targets (44px minimum)
 * - Haptic-ready buttons
 */

import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSocialTheme } from '../../theme/socialTheme';
import EmojiPicker from './EmojiPicker';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_LINES = 4;
const LINE_HEIGHT = 20;
const INPUT_MIN_HEIGHT = 40;
const INPUT_MAX_HEIGHT = LINE_HEIGHT * MAX_LINES + 20;

// ─── Component ───────────────────────────────────────────────────────────────

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message…',
}) => {
  const theme = useSocialTheme();
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const canSend = value.trim().length > 0 && !disabled;

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (text.length > 0) {
      onTyping?.();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onChangeText(value + emoji);
  };

  return (
    <>
      {/* Composer bar */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      >
        {/* Emoji button */}
        <TouchableOpacity
          onPress={() => setShowEmoji((prev) => !prev)}
          style={[
            styles.iconButton,
            {
              backgroundColor: showEmoji
                ? theme.withAlpha(theme.primary, 0.1)
                : 'transparent',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={showEmoji ? 'Close emoji picker' : 'Open emoji picker'}
          accessibilityState={{ selected: showEmoji }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={showEmoji ? 'close-outline' : 'happy-outline'}
            size={24}
            color={showEmoji ? theme.primary : theme.muted}
          />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={disabled ? 'Accept request to reply' : placeholder}
          placeholderTextColor={theme.muted}
          multiline
          maxLength={2000}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onContentSizeChange={(e) => {
            const contentHeight = e.nativeEvent.contentSize.height;
            const newHeight = Math.min(
              Math.max(INPUT_MIN_HEIGHT, contentHeight + 10),
              INPUT_MAX_HEIGHT
            );
            setInputHeight(newHeight);
          }}
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              color: theme.text,
              height: inputHeight,
              maxHeight: INPUT_MAX_HEIGHT,
              borderRadius: theme.radius.pill,
              borderColor: isFocused ? theme.primary : theme.border,
              borderWidth: isFocused ? 1.5 : 1,
            },
          ]}
          editable={!disabled}
          returnKeyType="default"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
        />

        {/* Send button */}
        <TouchableOpacity
          onPress={() => {
            onSend();
            Keyboard.dismiss();
          }}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.primary : theme.cardAlt,
              borderRadius: theme.radius.pill,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="send"
            size={18}
            color={canSend ? theme.colors.white : theme.muted} // theme.colors.onPrimary → theme.colors.white
          />
        </TouchableOpacity>
      </View>

      {/* Emoji picker */}
      <EmojiPicker
        visible={showEmoji}
        onClose={() => setShowEmoji(false)}
        onSelect={handleEmojiSelect}
      />
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingBottom: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
    minHeight: 40,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default MessageInput;
// ✅ theme-migrated
