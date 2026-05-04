// FilterChip.tsx
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  dotColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'filled' | 'outline';
  count?: number;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  dotColor,
  disabled = false,
  style,
  variant = 'filled',
  count,
}) => {
  const { colors, radius, type } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const isFilled = variant === 'filled';
  const bg = selected ? (isFilled ? colors.accent : colors.accentBg) : colors.bgCard;
  const borderColor = selected ? colors.accent : colors.borderPrimary;
  const textColor = selected ? (isFilled ? colors.textInverse : colors.accent) : colors.textSecondary;
  const iconColor = selected ? (isFilled ? colors.textInverse : colors.accent) : colors.textMuted;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          styles.chip,
          { backgroundColor: bg, borderColor, borderRadius: radius.full },
          disabled && styles.disabled,
          style,
        ]}
      >
        {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
        {icon && !dotColor && <Ionicons name={icon} size={14} color={iconColor} style={styles.prefixIcon} />}
        <Text style={[styles.label, type.caption, { color: textColor }]}>{label}</Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: selected ? 'rgba(255,255,255,0.25)' : colors.bgSecondary, borderRadius: radius.full }]}>
            <Text style={[styles.countText, { color: selected && isFilled ? '#fff' : colors.textMuted }]}>
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
        {onRemove && selected && (
          <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onRemove(); }} hitSlop={6} style={styles.removeButton}>
            <Ionicons name="close-circle" size={15} color={isFilled ? 'rgba(255,255,255,0.8)' : colors.accent} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ChipOption {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  dotColor?: string;
  count?: number;
}

interface FilterChipGroupProps {
  options: ChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  containerStyle?: ViewStyle;
  variant?: 'filled' | 'outline';
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  options,
  selected,
  onToggle,
  multi = true,
  containerStyle,
  variant = 'filled',
}) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.groupContent, containerStyle]}>
      {options.map((opt) => (
        <FilterChip
          key={opt.id}
          label={opt.label}
          icon={opt.icon}
          dotColor={opt.dotColor}
          count={opt.count}
          selected={selected.includes(opt.id)}
          variant={variant}
          onPress={() => onToggle(opt.id)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingVertical: 7, paddingHorizontal: 14, marginRight: 8, gap: 5 },
  disabled: { opacity: 0.45 },
  dot: { width: 8, height: 8, borderRadius: 99 },
  prefixIcon: { marginRight: -2 },
  label: { fontWeight: '600' },
  countBadge: { paddingHorizontal: 6, paddingVertical: 2, marginLeft: 2 },
  countText: { fontSize: 11, fontWeight: '700' },
  removeButton: { marginLeft: 2 },
  groupContent: { paddingVertical: 2, paddingHorizontal: 16 },
});