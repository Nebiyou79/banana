/**
 * EmojiPicker — bottom sheet wrapper.
 * -----------------------------------------------------------------------------
 * Primary: rn-emoji-keyboard (installed per blueprint dependencies).
 * Fallback: a compact curated grid, so the app still runs if the package
 * isn't yet installed. The dynamic require() pattern avoids a hard crash.
 */

import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

export interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

// Lazy, optional load — package may not be installed yet in every env.
let RnEmojiKeyboard: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RnEmojiKeyboard = require('rn-emoji-keyboard').default;
} catch {
  RnEmojiKeyboard = null;
}

const FALLBACK_EMOJIS = [
  '😀', '😂', '😍', '😊', '😎', '🤔', '👍', '👏',
  '🙏', '❤️', '🔥', '🎉', '🚀', '💯', '✨', '💡',
  '😢', '😮', '😡', '🤝', '💪', '👀', '☕', '📌',
];

const FallbackGrid: React.FC<EmojiPickerProps> = ({ visible, onClose, onSelect }) => {
  const theme = useSocialTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: theme.overlay }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { backgroundColor: theme.card }]}
        >
          <View style={[styles.handle, { backgroundColor: theme.muted }]} />
          <Text style={[styles.title, { color: theme.text }]}>Emoji</Text>
          <FlatList
            data={FALLBACK_EMOJIS}
            keyExtractor={(e, i) => `${e}-${i}`}
            numColumns={8}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cell}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.emoji}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const EmojiPicker: React.FC<EmojiPickerProps> = (props) => {
  if (RnEmojiKeyboard) {
    return (
      <RnEmojiKeyboard
        open={props.visible}
        onClose={props.onClose}
        onEmojiSelected={(e: { emoji: string }) => props.onSelect(e.emoji)}
      />
    );
  }
  return <FallbackGrid {...props} />;
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    minHeight: '35%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 6,
    opacity: 0.5,
  },
  title: { fontSize: 14, fontWeight: '700', padding: 10 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
});

export default EmojiPicker;