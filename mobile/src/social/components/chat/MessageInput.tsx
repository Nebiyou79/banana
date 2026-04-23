// src/social/components/chat/MessageInput.tsx
/**
 * Mobile chat input.
 *
 *   [😊]  [  TextInput autoexpand  ]  [Send]
 *
 *  • TextInput multiline, max 4 visible lines.
 *  • Left: emoji button → opens EmojiPicker bottom sheet.
 *  • Right: send button (disabled when empty or sending).
 *  • Emits `chat:typing_start` on text change, `chat:typing_stop` after
 *    2s of idle.
 *  • Minimum touch target: 44×44.
 */
import { Ionicons } from '@expo/vector-icons';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputContentSizeChangeEventData,
//   TCfUqPqByNuTTTR2w1SCXfKnwkQvVBjreGa,
  TouchableOpacity,
  View,
} from 'react-native';
import { socketService } from '../../services/socketService';
import { useSocialTheme } from '../../theme/socialTheme';
import EmojiPicker from './EmojiPicker';

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => void | Promise<void>;
  isSending?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_HEIGHT = 4 * 22; // ~4 lines @ 22px line-height

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSend,
  isSending = false,
  disabled = false,
  placeholder = 'Type a message…',
}) => {
  const theme = useSocialTheme();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const [height, setHeight] = useState(40);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const typingIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEmittedStart = useRef(false);

  /* ── typing emitter ────────────────────────────────────────────── */
  const emitStart = useCallback(() => {
    if (hasEmittedStart.current) return;
    socketService.emit('chat:typing_start', { conversationId });
    hasEmittedStart.current = true;
  }, [conversationId]);

  const emitStop = useCallback(() => {
    if (!hasEmittedStart.current) return;
    socketService.emit('chat:typing_stop', { conversationId });
    hasEmittedStart.current = false;
  }, [conversationId]);

  const scheduleStop = useCallback(() => {
    if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
    typingIdleTimer.current = setTimeout(emitStop, 2000);
  }, [emitStop]);

  useEffect(() => {
    return () => {
      if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
      emitStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  /* ── handlers ──────────────────────────────────────────────────── */
  const handleChange = (text: string) => {
    setValue(text);
    if (text.length > 0) {
      emitStart();
      scheduleStop();
    } else {
      emitStop();
    }
  };

  const handleContentSize = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    const h = e.nativeEvent.contentSize.height;
    setHeight(Math.min(Math.max(40, h + 8), MAX_HEIGHT));
  };

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;

    // Clear immediately for snappy UX.
    const toSend = trimmed;
    setValue('');
    setHeight(40);
    emitStop();

    try {
      await onSend(toSend);
    } catch {
      // Restore draft on failure.
      setValue(toSend);
    }
  }, [value, disabled, isSending, onSend, emitStop]);

  const insertEmoji = (emoji: string) => {
    setValue((v) => v + emoji);
    emitStart();
    scheduleStop();
  };

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  return (
    <>
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setEmojiOpen((v) => !v)}
          disabled={disabled}
          style={styles.iconBtn}
          accessibilityLabel="Insert emoji"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name="happy-outline"
            size={24}
            color={disabled ? theme.muted : theme.subtext}
          />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          onContentSizeChange={handleContentSize}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          multiline
          editable={!disabled}
          maxLength={2000}
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
              height,
              maxHeight: MAX_HEIGHT,
            },
          ]}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? theme.primary : theme.skeleton,
              opacity: canSend ? 1 : 0.6,
            },
          ]}
          accessibilityLabel="Send message"
        >
          {isSending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {value.length > 1800 ? (
        <View style={styles.counterRow}>
          <Text style={[styles.counter, { color: theme.muted }]}>
            {2000 - value.length} characters remaining
          </Text>
        </View>
      ) : null}

      <EmojiPicker
        open={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        onPick={insertEmoji}
      />
    </>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    fontSize: 15,
    lineHeight: 20,
    borderWidth: StyleSheet.hairlineWidth,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterRow: {
    paddingHorizontal: 64,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  counter: {
    fontSize: 11,
  },
});

export default MessageInput;