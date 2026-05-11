// src/social/components/post/ReactionPicker.tsx
/**
 * ReactionPicker — animated emoji reaction tray (core Animated only)
 *
 * Fix applied: `useRef` inside `.map()` violated React rules of hooks.
 * Replaced with a single `pressScaleRefs` array initialised once via useMemo.
 */
import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { RADIUS, useSocialTheme } from '../../theme/socialTheme';
import type { ReactionType } from '../../types';

const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'like',        emoji: '👍', label: 'Like' },
  { type: 'heart',       emoji: '❤️', label: 'Heart' },
  { type: 'celebrate',   emoji: '🎉', label: 'Celebrate' },
  { type: 'percent_100', emoji: '💯', label: '100%' },
  { type: 'clap',        emoji: '👏', label: 'Clap' },
];

interface Props {
  onSelect: (r: ReactionType) => void;
  onDismiss?: () => void;
}

const ReactionPicker: React.FC<Props> = memo(({ onSelect }) => {
  const theme = useSocialTheme();

  // Container entrance
  const containerScale   = useRef(new Animated.Value(0.65)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Per-emoji staggered entrance
  const emojiAnims = useRef(
    REACTIONS.map(() => ({
      scale:      new Animated.Value(0),
      translateY: new Animated.Value(10),
    }))
  ).current;

  // ✅ Fix: pressScale refs held in a stable array — no hooks inside .map()
  const pressScaleRefs = useMemo(
    () => REACTIONS.map(() => new Animated.Value(1)),
    [] // created once, never recreated
  );

  useEffect(() => {
    // Container pop-in
    Animated.parallel([
      Animated.spring(containerScale, {
        toValue: 1,
        friction: 7,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered emoji entrance
    Animated.stagger(
      38,
      emojiAnims.map(({ scale, translateY }) =>
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 7,
            tension: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 240,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.picker,
        {
          backgroundColor: theme.card,
          borderColor:     theme.border,
          shadowColor:     theme.dark ? '#000' : '#0A2540',
          opacity:         containerOpacity,
          transform:       [{ scale: containerScale }],
        },
      ]}
      accessibilityRole="menu"
    >
      {REACTIONS.map((r, i) => {
        const pressScale = pressScaleRefs[i];

        const onPressIn = () =>
          Animated.spring(pressScale, {
            toValue: 0.82,
            friction: 6,
            tension: 300,
            useNativeDriver: true,
          }).start();

        const onPressOut = () =>
          Animated.spring(pressScale, {
            toValue: 1,
            friction: 5,
            tension: 200,
            useNativeDriver: true,
          }).start();

        return (
          <Animated.View
            key={r.type}
            style={{
              transform: [
                { scale:      emojiAnims[i].scale },
                { translateY: emojiAnims[i].translateY },
              ],
              opacity: emojiAnims[i].scale,
            }}
          >
            <Animated.View style={{ transform: [{ scale: pressScale }] }}>
              <TouchableOpacity
                onPress={() => onSelect(r.type)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                accessibilityLabel={r.label}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                style={styles.reaction}
              >
                <Text style={styles.emoji}>{r.emoji}</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
});

ReactionPicker.displayName = 'ReactionPicker';

const styles = StyleSheet.create({
  picker: {
    position: 'absolute',
    bottom: 54,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
    zIndex: 100,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 14,
  },
  reaction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
});

export default ReactionPicker;
export { ReactionPicker };
// ✅ theme-migrated
