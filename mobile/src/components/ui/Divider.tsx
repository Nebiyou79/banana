import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DividerProps {
  /** Content to display in the centre of the divider */
  label?: string | React.ReactNode;
  /** 'horizontal' (default) or 'vertical' */
  orientation?: 'horizontal' | 'vertical';
  /** Line thickness in px (default hairline) */
  thickness?: number;
  /** Override the line colour */
  color?: string;
  /** Indent from left edge — only for horizontal */
  insetLeft?: number;
  /** Indent from right edge — only for horizontal */
  insetRight?: number;
  /** Extra vertical margin around horizontal divider */
  spacing?: number;
  /** Full height of the vertical divider */
  height?: DimensionValue;
  style?: ViewStyle;
  /** Dashed line style */
  dashed?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const { theme } = useThemeStore();
  const lineColor = color ?? theme.colors.border;
  const lineThickness = thickness ?? StyleSheet.hairlineWidth;

  // ── Vertical ──────────────────────────────────────────────────────────────
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

  // ── Horizontal — no label ─────────────────────────────────────────────────
  if (!label) {
    return (
      <View
        style={[
          styles.horizontal,
          { marginVertical: spacing },
          style,
        ]}
      >
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

  // ── Horizontal — with label ───────────────────────────────────────────────
  const isStringLabel = typeof label === 'string';

  return (
    <View
      style={[
        styles.labelRow,
        { marginVertical: spacing },
        style,
      ]}
    >
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
          <Text style={[styles.labelText, { color: theme.colors.textMuted }]}>
            {label}
          </Text>
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

// ─── Section divider (labelled group separator used in lists) ─────────────────

interface SectionDividerProps {
  label: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  label,
  action,
  style,
}) => {
  const { theme } = useThemeStore();

  return (
    <View
      style={[
        sectionStyles.container,
        { backgroundColor: theme.colors.borderLight },
        style,
      ]}
    >
      <Text style={[sectionStyles.label, { color: theme.colors.textMuted }]}>
        {label.toUpperCase()}
      </Text>
      {action && (
        <Text
          onPress={action.onPress}
          style={[sectionStyles.action, { color: theme.colors.primary }]}
        >
          {action.label}
        </Text>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  vertical: {},
  horizontal: {
    alignSelf: 'stretch',
  },
  line: {
    alignSelf: 'stretch',
  },
  lineFlex: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelWrapper: {
    paddingHorizontal: 4,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
  },
});
