// src/components/ui/FilterChip.tsx
// Usage: <FilterChip label="Remote" active={isActive} onPress={toggle} count={3} />

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  dotColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  count,
  dotColor,
  icon,
  style,
}) => {
  const { colors: c, radius, spacing } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const bg = active ? c.primary : 'transparent';
  const border = active ? c.primary : c.border;
  const textColor = active ? c.textInverse : c.textSecondary;
  const iconColor = active ? c.textInverse : c.textMuted;
  const fontWeight = active ? '700' : '500';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.chip,
          {
            height: 36,
            paddingHorizontal: spacing.md,
            borderRadius: radius.full,
            backgroundColor: bg,
            borderColor: border,
            borderWidth: 1.5,
          },
          style,
        ]}
      >
        {dotColor && (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        )}
        {icon && !dotColor && (
          <Ionicons name={icon} size={13} color={iconColor} style={{ marginRight: 4 }} />
        )}
        <Text style={[styles.label, { color: textColor, fontWeight }]} numberOfLines={1}>
          {label}
          {count !== undefined && (
            <Text style={{ opacity: 0.85 }}> ({count})</Text>
          )}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default FilterChip;