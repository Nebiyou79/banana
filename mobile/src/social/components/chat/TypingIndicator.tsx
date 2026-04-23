// src/social/components/chat/TypingIndicator.tsx
/**
 * Animated three-dot typing indicator. Uses RN Animated API (no reanimated).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface TypingIndicatorProps {
  name?: string;
}

const Dot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: -3,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, translate]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, transform: [{ translateY: translate }] },
      ]}
    />
  );
};

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ name }) => {
  const theme = useSocialTheme();
  const dotColor = theme.muted;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Dot delay={0} color={dotColor} />
        <Dot delay={150} color={dotColor} />
        <Dot delay={300} color={dotColor} />
      </View>
      {name ? (
        <Text style={[styles.label, { color: theme.muted }]}>
          {name} is typing…
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default TypingIndicator;