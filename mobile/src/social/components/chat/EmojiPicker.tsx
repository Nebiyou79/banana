// src/social/components/chat/EmojiPicker.tsx
/**
 * Emoji picker bottom sheet. Wraps `rn-emoji-keyboard` which handles all
 * platform-specific keyboard sizing and searching.
 *
 * If the dependency isn't installed yet the picker falls back to a small
 * inline grid — ChatScreen will still work, just without full emoji support.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
}

// Attempt to use rn-emoji-keyboard; if missing, use a fallback.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let EmojiKeyboard: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  EmojiKeyboard = require('rn-emoji-keyboard').default;
} catch {
  EmojiKeyboard = null;
}

const FALLBACK = [
  '😀','😂','😊','😍','🥰','😎','🤔','😢','😭','😡',
  '👍','👎','❤️','🔥','🎉','✨','💯','🙏','👋','🤝',
  '✅','❌','⭐','💡','📌','📎','🚀','⏰','📅','💬',
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  open,
  onClose,
  onPick,
}) => {
  const theme = useSocialTheme();

  if (EmojiKeyboard) {
    return (
      <EmojiKeyboard
        open={open}
        onClose={onClose}
        onEmojiSelected={(e: { emoji: string }) => onPick(e.emoji)}
        theme={{
          backdrop: theme.overlay,
          knob: theme.primary,
          container: theme.card,
          header: theme.subtext,
          category: {
            icon: theme.muted,
            iconActive: theme.primary,
            container: theme.card,
            containerActive: theme.primaryLighter,
          },
          search: {
            text: theme.text,
            placeholder: theme.muted,
            background: theme.inputBg,
          },
        }}
        enableSearchBar
        categoryPosition="top"
      />
    );
  }

  // Fallback picker — absolute-positioned grid.
  if (!open) return null;
  return (
    <>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.overlay }]}
      />
      <View style={[styles.sheet, { backgroundColor: theme.card }]}>
        <View style={styles.grid}>
          {FALLBACK.map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => {
                onPick(e);
                onClose();
              }}
              style={styles.cell}
            >
              <Text style={styles.emoji}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    inset: 0 as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});

export default EmojiPicker;