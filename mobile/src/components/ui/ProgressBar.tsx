// src/components/ui/ProgressBar.tsx
// Usage: <ProgressBar value={72} color={c.success} />

import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ProgressBarProps {
  value: number;         // 0..100
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  height = 8,
  color,
  backgroundColor,
  animated = true,
  style,
}) => {
  const { colors: c, radius } = useTheme();
  const widthAnim = useRef(new Animated.Value(0)).current;

  const clampedValue = Math.min(100, Math.max(0, value));

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: clampedValue,
        duration: 350,
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(clampedValue);
    }
  }, [clampedValue, animated]);

  const fillWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: backgroundColor ?? c.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: fillWidth,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? c.primary,
        }}
      />
    </View>
  );
};

export default ProgressBar;