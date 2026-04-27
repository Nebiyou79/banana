/**
 * MessageInput — composer at the bottom of ChatScreen.
 * -----------------------------------------------------------------------------
 * - Multiline (auto-grows to ~4 lines)
 * - Emoji button (left) toggles the EmojiPicker bottom sheet
 * - Send button (right) disabled when empty
 * - Emits typing_start on change, typing_stop after 2s idle (via useTyping)
 */

import React, { useState } from 'react';
import {
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
  onChangeText: (v: string) => void;
  onSend: () => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_LINES = 4;
const LINE_HEIGHT = 20;

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  onTyping,
  disabled,
  placeholder = 'Message…',
}) => {
  const theme = useSocialTheme();
  const [height, setHeight] = useState(40);
  const [showEmoji, setShowEmoji] = useState(false);

  const canSend = value.trim().length > 0 && !disabled;

  const handleChange = (v: string) => {
    onChangeText(v);
    onTyping?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    onChangeText(value + emoji);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setShowEmoji(true)}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open emoji picker"
        >
          <Ionicons name="happy-outline" size={24} color={theme.muted} />
        </TouchableOpacity>

        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          multiline
          onContentSizeChange={(e) => {
            const h = Math.min(
              Math.max(40, e.nativeEvent.contentSize.height + 10),
              LINE_HEIGHT * MAX_LINES + 20,
            );
            setHeight(h);
          }}
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              color: theme.text,
              height,
              maxHeight: LINE_HEIGHT * MAX_LINES + 20,
            },
          ]}
          editable={!disabled}
          returnKeyType="default"
        />

        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? theme.primary : theme.cardAlt,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons
            name="send"
            size={18}
            color={canSend ? '#fff' : theme.muted}
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: 10,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MessageInput;