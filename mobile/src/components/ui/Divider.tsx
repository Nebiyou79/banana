// src/components/ui/Divider.tsx
// Usage: <Divider /> | <Divider label="or" /> | <Divider inset={16} />

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface DividerProps {
  label?: string;
  inset?: number;
  color?: string;
  vertical?: boolean;
  height?: DimensionValue;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  inset = 0,
  color,
  vertical = false,
  height = '100%',
  style,
}) => {
  const { colors: c, spacing, type } = useTheme();
  const lineColor = color ?? c.border;

  if (vertical) {
    return (
      <View
        style={[
          {
            width: StyleSheet.hairlineWidth,
            height,
            backgroundColor: lineColor,
          },
          style,
        ]}
      />
    );
  }

  if (!label) {
    return (
      <View
        style={[
          {
            height: StyleSheet.hairlineWidth,
            backgroundColor: lineColor,
            marginLeft: inset,
            marginVertical: spacing.md,
            alignSelf: 'stretch',
          },
          style,
        ]}
      />
    );
  }

  return (
    <View style={[styles.labelRow, { marginVertical: spacing.md }, style]}>
      <View style={[styles.line, { backgroundColor: lineColor, marginLeft: inset }]} />
      <Text
        style={[
          type.caption,
          {
            color: c.textMuted,
            marginHorizontal: spacing.sm,
            fontWeight: '500',
          },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: lineColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});

export default Divider;