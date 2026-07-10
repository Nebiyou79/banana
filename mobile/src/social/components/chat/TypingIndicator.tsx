// src/social/components/chat/TypingIndicator.tsx
import React, { useEffect, useRef, memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

export interface TypingIndicatorProps {
  visible: boolean;
}

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

const TypingIndicator: React.FC<TypingIndicatorProps> = memo(({ visible }) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, dark } = theme;

  if (!visible) return null;

  // Dark mode: darker bubble, subtle border
  // Light mode: light bubble, clean border
  const bgColor = colors.card;
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : colors.border;
  const dotColor = dark ? colors.textMuted : colors.muted;

  return (
    <View style={[styles.row, { paddingHorizontal: spacing.md }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderRadius: radius.lg,
            borderBottomLeftRadius: radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel="Someone is typing"
      >
        <Dot delay={0} color={dotColor} />
        <Dot delay={150} color={dotColor} />
        <Dot delay={300} color={dotColor} />
      </View>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export default TypingIndicator;