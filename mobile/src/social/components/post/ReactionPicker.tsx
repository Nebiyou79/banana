// src/social/components/post/ReactionPicker.tsx
/**
 * ReactionPicker — Banana Social Design
 *
 * Floating pill tray that appears on long-press of the Like button.
 * Matches the mockup: 🍌 Like · ❤️ Love · 🔥 Fire · 👏 Clap · 😄 Haha · 😮 Wow · 😢 Sad · 😠 Angry
 *
 * Animations (core Animated only):
 * - Container: scale 0.6 → 1 spring pop-in + opacity fade
 * - Each emoji: staggered translateY + scale spring entrance
 * - Press: individual scale squeeze + release
 *
 * FIX: pressScaleRefs held in stable useMemo array — no hooks inside .map()
 */
import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RADIUS, useSocialTheme, withAlpha } from '../../theme/socialTheme';
import type { ReactionType } from '../../types';

const REACTIONS: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'like',        emoji: '👍', label: 'Like'      },
  { type: 'heart',       emoji: '❤️', label: 'Love'      },
  { type: 'celebrate',   emoji: '🎉', label: 'Celebrate' },
  { type: 'percent_100', emoji: '💯', label: '100'       },
  { type: 'clap',        emoji: '👏', label: 'Clap'      },
];

interface Props {
  onSelect: (r: ReactionType) => void;
  onDismiss?: () => void;
  /** Optional counts per reaction type — shown below each emoji */
  counts?: Partial<Record<ReactionType, number>>;
}

const ReactionPicker: React.FC<Props> = memo(({ onSelect, counts }) => {
  const theme = useSocialTheme();

  // Container entrance
  const containerScale   = useRef(new Animated.Value(0.6)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Per-emoji entrance anims
  const emojiAnims = useRef(
    REACTIONS.map(() => ({
      scale:      new Animated.Value(0),
      translateY: new Animated.Value(12),
    }))
  ).current;

  // Per-emoji press scales — stable array, no hooks in .map()
  const pressScaleRefs = useMemo(
    () => REACTIONS.map(() => new Animated.Value(1)),
    []
  );

  useEffect(() => {
    // Container pop-in
    Animated.parallel([
      Animated.spring(containerScale, {
        toValue: 1,
        friction: 6,
        tension: 220,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered emoji entrance
    Animated.stagger(
      32,
      emojiAnims.map(({ scale, translateY }) =>
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 7,
            tension: 240,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

  // Dark/light surface
  const pickerBg = theme.dark
    ? theme.colors.card
    : '#FFFFFF';
  const pickerBorder = theme.dark
    ? withAlpha(theme.colors.primary, 0.3)
    : 'rgba(0,0,0,0.08)';
  const shadowColor = theme.dark ? theme.colors.primary : '#000';

  return (
    <Animated.View
      style={[
        styles.picker,
        {
          backgroundColor: pickerBg,
          borderColor: pickerBorder,
          shadowColor,
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
      accessibilityRole="menu"
    >
      {REACTIONS.map((r, i) => {
        const pressScale = pressScaleRefs[i];
        const count = counts?.[r.type];

        const onPressIn = () =>
          Animated.spring(pressScale, {
            toValue: 0.78,
            friction: 5,
            tension: 360,
            useNativeDriver: true,
          }).start();

        const onPressOut = () =>
          Animated.spring(pressScale, {
            toValue: 1,
            friction: 5,
            tension: 220,
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
                style={styles.reactionBtn}
                activeOpacity={1}
              >
                <Text style={styles.emoji}>{r.emoji}</Text>
                {count != null && count > 0 ? (
                  <Text
                    style={[
                      styles.count,
                      { color: theme.dark ? theme.colors.primary : theme.colors.primary },
                    ]}
                  >
                    {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)}
                  </Text>
                ) : (
                  <Text style={[styles.label, { color: theme.colors.muted }]}>
                    {r.label}
                  </Text>
                )}
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
    bottom: 56,
    left: -4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 0,
    zIndex: 200,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 16,
  },
  reactionBtn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 44,
    minHeight: 44,
  },
  emoji: { fontSize: 28 },
  count: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default ReactionPicker;
export { ReactionPicker };