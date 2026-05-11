// =============================================================================
// FILE: mobile/src/social/components/chat/EmojiPicker.tsx — FIXED (Bug 3)
// =============================================================================

/**
 * EmojiPicker — emoji keyboard wrapper.
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG 3 FIX:
 *   The original fallback grid used absolute positioning inside a View nested
 *   within FlashList. On React Native, absolutely positioned children are
 *   clipped by their nearest overflow container, and FlashList enforces its
 *   own stacking context — so the picker was rendered but invisible (hidden
 *   behind the list) or never received touch events.
 *
 *   Fix: Replace absolute positioning with a React Native `Modal` component.
 *   Modals render in a dedicated window layer above the entire component tree,
 *   so they are NEVER clipped by FlashList or any parent View, regardless of
 *   z-index or overflow settings.
 *
 * Features:
 *   - Tries to import `rn-emoji-keyboard` at runtime; falls back gracefully
 *   - Fallback: Modal sheet with a grid of 24 common emojis
 *   - Slide-up animation, semi-transparent backdrop, tap-to-close
 */

import React, { memo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

// ─── Lazy load rn-emoji-keyboard ─────────────────────────────────────────────

let RnEmojiKeyboard: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RnEmojiKeyboard = require('rn-emoji-keyboard').default;
} catch {
  RnEmojiKeyboard = null;
}

// ─── Fallback Emoji Grid ─────────────────────────────────────────────────────

const FALLBACK_EMOJIS = [
  '😀', '😂', '😍', '😊', '😎', '🤔', '👍', '👏',
  '🙏', '❤️', '🔥', '🎉', '🚀', '💯', '✨', '💡',
  '😢', '😮', '😡', '🤝', '💪', '👀', '☕', '📌',
];

/**
 * BUG 3 FIX: FallbackGrid now uses a Modal instead of absolute positioning.
 *
 * Why this fixes the bug:
 *   React Native's Modal renders its content in a separate native window that
 *   sits above every other view in the app. It is unaffected by the parent
 *   hierarchy's overflow, z-index, or stacking context — unlike an absolutely
 *   positioned View inside a FlashList which gets clipped.
 *
 * Modal props used:
 *   - `transparent`: keeps the background visible through the backdrop
 *   - `animationType="slide"`: sheet slides up from the bottom (native feel)
 *   - `statusBarTranslucent`: ensures the Modal covers the full screen on Android
 *   - `onRequestClose`: handles Android back button to dismiss
 */
const FallbackGrid: React.FC<EmojiPickerProps> = memo(
  ({ visible, onClose, onSelect }) => {
    const theme = useSocialTheme();

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Backdrop: tap outside the sheet to close */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          {/* Sheet: stopPropagation prevents backdrop tap when touching the sheet */}
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.card,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <View style={[styles.handle, { backgroundColor: theme.muted }]} />

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>Emoji</Text>

            {/* Emoji grid */}
            <FlatList
              data={FALLBACK_EMOJIS}
              keyExtractor={(item, index) => `${item}-${index}`}
              numColumns={8}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.emojiCell,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoji ${item}`}
                >
                  <Text style={styles.emoji}>{item}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    );
  }
);

FallbackGrid.displayName = 'FallbackGrid';

// ─── Main Component ─────────────────────────────────────────────────────────

const EmojiPicker: React.FC<EmojiPickerProps> = (props) => {
  // Prefer the full rn-emoji-keyboard if installed
  if (RnEmojiKeyboard) {
    return (
      <RnEmojiKeyboard
        open={props.visible}
        onClose={props.onClose}
        onEmojiSelected={(e: { emoji: string }) => props.onSelect(e.emoji)}
      />
    );
  }

  // BUG 3 FIX: FallbackGrid now uses Modal — always renders on top
  return <FallbackGrid {...props} />;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    minHeight: '35%',
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
    opacity: 0.4,
  },
  title: { fontSize: 14, fontWeight: '700', paddingBottom: 10 },
  grid: { paddingVertical: 8, gap: 4 },
  emojiCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Minimum 44px touch target per accessibility guidelines
    minHeight: 44,
    minWidth: 44,
  },
  emoji: { fontSize: 26 },
});

export default EmojiPicker;