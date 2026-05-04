// Divider.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { type } from '../../constants/theme/theme';

interface DividerProps {
  label?: string | React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  insetLeft?: number;
  insetRight?: number;
  spacing?: number;
  height?: DimensionValue;
  style?: ViewStyle;
  dashed?: boolean;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  orientation = 'horizontal',
  thickness,
  color,
  insetLeft = 0,
  insetRight = 0,
  spacing = 0,
  height = '100%',
  style,
  dashed = false,
}) => {
  const { colors } = useTheme();
  const lineColor = color ?? colors.borderPrimary;
  const lineThickness = thickness ?? StyleSheet.hairlineWidth;

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            height,
            width: lineThickness,
            backgroundColor: dashed ? 'transparent' : lineColor,
          },
          dashed && { borderLeftWidth: lineThickness, borderColor: lineColor, borderStyle: 'dashed' },
          style,
        ]}
      />
    );
  }

  if (!label) {
    return (
      <View style={[styles.horizontal, { marginVertical: spacing }, style]}>
        <View
          style={[
            styles.line,
            {
              height: lineThickness,
              backgroundColor: dashed ? 'transparent' : lineColor,
              marginLeft: insetLeft,
              marginRight: insetRight,
            },
            dashed && {
              borderTopWidth: lineThickness,
              borderColor: lineColor,
              borderStyle: 'dashed',
              height: 0,
            },
          ]}
        />
      </View>
    );
  }

  const isStringLabel = typeof label === 'string';

  return (
    <View style={[styles.labelRow, { marginVertical: spacing }, style]}>
      <View
        style={[
          styles.lineFlex,
          {
            height: lineThickness,
            backgroundColor: dashed ? 'transparent' : lineColor,
            marginLeft: insetLeft,
          },
          dashed && { borderTopWidth: lineThickness, borderColor: lineColor, borderStyle: 'dashed', height: 0 },
        ]}
      />

      <View style={styles.labelWrapper}>
        {isStringLabel ? (
          <Text style={[styles.labelText, type.caption, { color: colors.textMuted }]}>{label}</Text>
        ) : (
          label
        )}
      </View>

      <View
        style={[
          styles.lineFlex,
          {
            height: lineThickness,
            backgroundColor: dashed ? 'transparent' : lineColor,
            marginRight: insetRight,
          },
          dashed && { borderTopWidth: lineThickness, borderColor: lineColor, borderStyle: 'dashed', height: 0 },
        ]}
      />
    </View>
  );
};

interface SectionDividerProps {
  label: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ label, action, style }) => {
  const { colors, type } = useTheme();

  return (
    <View style={[sectionStyles.container, { backgroundColor: colors.bgSecondary }, style]}>
      <Text style={[sectionStyles.label, type.caption, { color: colors.textMuted }]}>
        {label.toUpperCase()}
      </Text>
      {action && (
        <Text onPress={action.onPress} style={[sectionStyles.action, type.bodySm, { color: colors.accent }]}>
          {action.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  vertical: {},
  horizontal: { alignSelf: 'stretch' },
  line: { alignSelf: 'stretch' },
  lineFlex: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelWrapper: { paddingHorizontal: 4 },
  labelText: { fontWeight: '500' },
});

const sectionStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontWeight: '700', letterSpacing: 0.8 },
  action: { fontWeight: '600' },
});