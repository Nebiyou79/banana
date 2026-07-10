// src/social/components/shared/Chip.tsx
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  compact?: boolean;
}

const Chip: React.FC<Props> = memo(({
  label, selected, onPress, iconRight, style, compact,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, type, withAlpha, dark } = theme;

  // Selected: role-primary with tint
  // Unselected: cardAlt background (dark: subtle, light: soft)
  const bg = selected 
    ? withAlpha(colors.primary, dark ? 0.25 : 0.12)
    : colors.cardAlt;
  
  const border = selected ? colors.primary : colors.border;
  const textColor = selected ? colors.primary : colors.text;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingHorizontal: compact ? spacing.sm + 2 : spacing.md - 2,
          paddingVertical: compact ? spacing.xs + 1 : spacing.sm,
          minHeight: compact ? 30 : 36,
          borderRadius: radius.pill,
        },
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!selected }}
    >
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: compact ? 11 : 12,
            fontWeight: type.bodySm.fontWeight,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {iconRight}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1 },
  label: {},
});

export default Chip;