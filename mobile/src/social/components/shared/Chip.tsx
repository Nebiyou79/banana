// src/social/components/shared/Chip.tsx
/**
 * Chip — filterable selection pill
 *
 * Theme migration:
 * - `colors.bgAlt`         → `colors.cardAlt`
 * - `spacing['1']`         → `spacing.xs`
 * - `type.labelSm`         → `type.bodySm`  (spread .fontWeight only; fontSize
 *                             is overridden inline so only fontWeight is used)
 */
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
  const { colors, spacing, radius, type, withAlpha } = useSocialTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? withAlpha(colors.primary, 0.12)
            // colors.bgAlt → colors.cardAlt
            : colors.cardAlt,
          borderColor: selected ? colors.primary : colors.border,
          paddingHorizontal: compact ? spacing.sm + 2 : spacing.md - 2,
          // spacing['1'] → spacing.xs
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
            color: selected ? colors.primary : colors.text,
            fontSize: compact ? 11 : 12,
            // type.labelSm → type.bodySm (use only fontWeight)
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

Chip.displayName = 'Chip';

const styles = StyleSheet.create({
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1 },
  label: {},
});

export default Chip;
// ✅ theme-migrated
