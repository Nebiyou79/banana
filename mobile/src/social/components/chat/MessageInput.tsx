// src/social/components/chat/MessageInput.tsx
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

export interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_LINES = 4;
const LINE_HEIGHT = 20;
const INPUT_MIN_HEIGHT = 40;
const INPUT_MAX_HEIGHT = LINE_HEIGHT * MAX_LINES + 20;

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message…',
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, dark } = theme;
  
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

  // Dark mode: darker input background, vibrant border on focus
  // Light mode: light input background, clean border
  const inputBg = dark ? colors.inputBg : colors.cardAlt;
  const borderColor = isFocused ? colors.primary : colors.border;
  const borderWidth = isFocused ? 1.5 : 1;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            paddingBottom: 10,
            borderTopWidth: StyleSheet.hairlineWidth,
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
                ? theme.withAlpha(colors.primary, 0.1)
                : 'transparent',
              borderRadius: radius.pill,
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
            color={showEmoji ? colors.primary : colors.muted}
          />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={disabled ? 'Accept request to reply' : placeholder}
          placeholderTextColor={colors.muted}
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
              backgroundColor: inputBg,
              color: colors.text,
              height: inputHeight,
              maxHeight: INPUT_MAX_HEIGHT,
              borderRadius: radius.pill,
              borderColor: borderColor,
              borderWidth: borderWidth,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 15,
              lineHeight: LINE_HEIGHT,
              minHeight: 40,
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
              backgroundColor: canSend ? colors.primary : colors.cardAlt,
              borderRadius: radius.pill,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
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
            color={canSend ? colors.white : colors.muted}
          />
        </TouchableOpacity>
      </View>

      <EmojiPicker
        visible={showEmoji}
        onClose={() => setShowEmoji(false)}
        onSelect={handleEmojiSelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    flexShrink: 0,
  },
});

export default MessageInput;