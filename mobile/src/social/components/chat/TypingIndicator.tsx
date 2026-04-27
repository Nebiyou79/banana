/**
 * TypingIndicator — three dots that pulse while the other user is typing.
 * -----------------------------------------------------------------------------
 * Plain react-native Animated (no reanimated), per the hard rules.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';

export interface TypingIndicatorProps {
  visible: boolean;
}

const Dot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const seq = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    seq.start();
    return () => seq.stop();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color, opacity }]}
    />
  );
};

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ visible }) => {
  const theme = useSocialTheme();
  if (!visible) return null;

  return (
    <View style={[styles.bubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Dot delay={0} color={theme.muted} />
      <Dot delay={150} color={theme.muted} />
      <Dot delay={300} color={theme.muted} />
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

export default TypingIndicator;