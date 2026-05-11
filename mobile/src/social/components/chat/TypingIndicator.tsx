// =============================================================================
// FILE: mobile/src/social/components/chat/TypingIndicator.tsx
// =============================================================================

/**
 * TypingIndicator — animated three-dot indicator.
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses react-native Animated (no reanimated) per hard rules.
 *
 * Professional polish:
 * - Theme token for colors
 * - Left-aligned bubble matching incoming message style
 * - Smooth pulsing animation with 3 staggered dots
 * - Proper tail on bubble bottom-left
 */

import React, { useEffect, useRef, memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TypingIndicatorProps {
  visible: boolean;
}

// ─── Animated Dot ────────────────────────────────────────────────────────────

interface DotProps {
  delay: number;
  color: string;
}

const Dot: React.FC<DotProps> = memo(({ delay, color }) => {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const sequence = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );
    sequence.start();
    return () => sequence.stop();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, opacity },
      ]}
    />
  );
});

Dot.displayName = 'Dot';

// ─── Main Component ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC<TypingIndicatorProps> = memo(({ visible }) => {
  const theme = useSocialTheme();

  if (!visible) return null;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            marginHorizontal: theme.spacing.md,
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel="Someone is typing"
      >
        <Dot delay={0} color={theme.muted} />
        <Dot delay={150} color={theme.muted} />
        <Dot delay={300} color={theme.muted} />
      </View>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export default TypingIndicator;
// ✅ theme-migrated
