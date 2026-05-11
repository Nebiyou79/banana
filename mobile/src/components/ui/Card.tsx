// src/components/ui/Card.tsx
// Usage: <Card variant="elevated" onPress={...}>{children}</Card>

import React, { useRef, useEffect, useMemo } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../theme/tokens';

type Variant = 'default' | 'elevated' | 'outlined';
type PaddingKey = keyof typeof SPACING;

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  padding?: PaddingKey;
  stripeColor?: string;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'lg',
  stripeColor,
  style,
}) => {
  const { colors: c, radius, shadows, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const cardStyle = useMemo<ViewStyle>(() => {
    const base: ViewStyle = {
      backgroundColor: c.bgCard,
      borderRadius: radius.lg,
      padding: spacing[padding],
      overflow: stripeColor ? undefined : 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return { ...base, ...shadows.md };
      case 'outlined':
        return { ...base, borderWidth: 1, borderColor: c.border };
      default:
        return { ...base, borderWidth: 1, borderColor: c.border };
    }
  }, [variant, c, radius, shadows, spacing, padding, stripeColor]);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const inner = (
    <View style={[cardStyle, style]}>
      {/* Android-safe colored stripe — uses absolute position, not overflow:hidden */}
      {stripeColor && (
        <View
          style={[
            styles.stripe,
            {
              backgroundColor: stripeColor,
              borderTopLeftRadius: radius.lg,
              borderBottomLeftRadius: radius.lg,
            },
          ]}
        />
      )}
      <View style={stripeColor ? { paddingLeft: 12 } : undefined}>
        {children}
      </View>
    </View>
  );

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }, { scale: scaleAnim }],
      }}
    >
      {onPress ? (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});

export default Card;