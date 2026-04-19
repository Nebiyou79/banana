import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { ReactionType } from '../../types';

const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😄', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
];

interface Props {
  onSelect: (r: ReactionType) => void;
  onDismiss?: () => void;
}

/**
 * Popover of reaction emojis that scales in one-by-one when mounted.
 * Positioned above the like button by the parent.
 */
const ReactionPicker: React.FC<Props> = memo(({ onSelect }) => {
  const theme = useSocialTheme();
  const scales = useRef(
    REACTIONS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      40,
      scales.map((s) =>
        Animated.spring(s, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [scales]);

  return (
    <View
      style={[
        styles.picker,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: '#000',
        },
      ]}
      accessibilityRole="menu"
    >
      {REACTIONS.map((r, i) => (
        <Animated.View
          key={r.type}
          style={{
            transform: [
              {
                scale: scales[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 1],
                }),
              },
            ],
            opacity: scales[i],
          }}
        >
          <TouchableOpacity
            style={styles.reaction}
            onPress={() => onSelect(r.type)}
            accessibilityLabel={r.label}
            hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
          >
            <Text style={styles.emoji}>{r.emoji}</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
});

ReactionPicker.displayName = 'ReactionPicker';

// Ensure Easing import isn't flagged as unused by some TS configs
void Easing;

const styles = StyleSheet.create({
  picker: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    flexDirection: 'row',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    zIndex: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  reaction: { padding: 6, borderRadius: 20 },
  emoji: { fontSize: 26 },
});

export default ReactionPicker;