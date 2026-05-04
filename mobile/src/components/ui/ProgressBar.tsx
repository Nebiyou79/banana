// ProgressBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'banana';
type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  valueLabel?: string;
  variant?: ProgressVariant;
  size?: ProgressSize;
  animated?: boolean;
  ticks?: number;
  style?: ViewStyle;
  rounded?: boolean;
  striped?: boolean;
}

const VARIANT_COLORS = {
  default: { fill: '#2563EB', track: '#DBEAFE' },
  success: { fill: '#059669', track: '#D1FAE5' },
  warning: { fill: '#D97706', track: '#FEF3C7' },
  error:   { fill: '#DC2626', track: '#FEE2E2' },
  banana:  { fill: '#FBBF24', track: '#FEF3C7' },
};

const SIZE_HEIGHT: Record<ProgressSize, number> = {
  xs: 4, sm: 6, md: 10, lg: 14,
};

interface StepProgressProps {
  steps: number;
  currentStep: number;
  labels?: string[];
  activeColor?: string;
  style?: ViewStyle;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps, currentStep, labels, activeColor, style,
}) => {
  const { colors } = useTheme();
  const color = activeColor ?? colors.accent;

  return (
    <View style={[stepStyles.container, style]}>
      <View style={stepStyles.track}>
        {Array.from({ length: steps }).map((_, i) => {
          const isActive = i < currentStep;
          const isCurrent = i === currentStep - 1;
          return (
            <React.Fragment key={i}>
              {i > 0 && <View style={[stepStyles.connector, { backgroundColor: isActive ? color : colors.borderPrimary }]} />}
              <View style={[stepStyles.dot, { backgroundColor: isActive ? color : colors.bgSecondary, borderColor: isActive ? color : colors.borderPrimary }, isCurrent && [stepStyles.dotCurrent, { shadowColor: color }]]}>
                {isActive && <View style={[stepStyles.dotInner, { backgroundColor: '#fff' }]} />}
              </View>
            </React.Fragment>
          );
        })}
      </View>
      {labels && (
        <View style={stepStyles.labelsRow}>
          {labels.slice(0, steps).map((lbl, i) => (
            <Text key={i} style={[stepStyles.stepLabel, { color: i < currentStep ? color : colors.textMuted, flex: 1, textAlign: i === 0 ? 'left' : i === steps - 1 ? 'right' : 'center' }]}>{lbl}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, label, showValue = false, valueLabel, variant = 'default',
  size = 'md', animated = true, ticks, style, rounded = true, striped = false,
}) => {
  const { colors, type } = useTheme();
  const variantColors = VARIANT_COLORS[variant];
  const height = SIZE_HEIGHT[size];
  const clampedPct = Math.min(100, Math.max(0, (value / max) * 100));
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, { toValue: clampedPct, duration: 600, useNativeDriver: false }).start();
    } else {
      widthAnim.setValue(clampedPct);
    }
  }, [clampedPct, animated]);

  const fillWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  const isLargeEnough = size === 'lg' && clampedPct > 20;
  const resolvedValueLabel = valueLabel ?? `${Math.round(clampedPct)}%`;

  return (
    <View style={[styles.container, style]}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && <Text style={[styles.label, type.caption, { color: colors.textSecondary }]}>{label}</Text>}
          {showValue && <Text style={[styles.valueText, type.caption, { color: variantColors.fill }]}>{resolvedValueLabel}</Text>}
        </View>
      )}
      <View style={[styles.track, { height, backgroundColor: colors.bgSecondary, borderRadius: rounded ? height / 2 : 2 }]}>
        <Animated.View style={[styles.fill, { width: fillWidth, height, backgroundColor: variantColors.fill, borderRadius: rounded ? height / 2 : 2 }]} />
        {isLargeEnough && (
          <Animated.View style={[styles.inlineValue, { width: fillWidth }]} pointerEvents="none">
            <Text style={styles.inlineValueText}>{resolvedValueLabel}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

interface RingProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  centerContent?: React.ReactNode;
  style?: ViewStyle;
}

export const RingProgress: React.FC<RingProgressProps> = ({
  value, size = 80, strokeWidth = 7, color, label, centerContent, style,
}) => {
  const { colors, type } = useTheme();
  const fillColor = color ?? colors.accent;
  const pct = Math.min(100, Math.max(0, value));

  return (
    <View style={[ringStyles.container, { width: size, height: size }, style]}>
      <View style={[ringStyles.ring, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: colors.bgSecondary }]} />
      <View style={ringStyles.center}>
        {centerContent ?? <Text style={[ringStyles.pct, { color: fillColor }]}>{Math.round(pct)}<Text style={[ringStyles.pctSign, type.caption, { color: colors.textMuted }]}>%</Text></Text>}
        {label && <Text style={[ringStyles.label, type.caption, { color: colors.textMuted }]}>{label}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontWeight: '600' },
  valueText: { fontWeight: '700' },
  track: { overflow: 'hidden', position: 'relative' },
  fill: { position: 'absolute', left: 0, top: 0 },
  inlineValue: { position: 'absolute', top: 0, left: 0, bottom: 0, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 6 },
  inlineValueText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});

const ringStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  center: { alignItems: 'center' },
  pct: { fontSize: 22, fontWeight: '800' },
  pctSign: { fontWeight: '600' },
  label: { marginTop: 2, fontWeight: '600' },
});

const stepStyles = StyleSheet.create({
  container: {},
  track: { flexDirection: 'row', alignItems: 'center' },
  connector: { flex: 1, height: 2 },
  dot: { width: 20, height: 20, borderRadius: 99, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotCurrent: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  dotInner: { width: 8, height: 8, borderRadius: 99 },
  labelsRow: { flexDirection: 'row', marginTop: 8 },
  stepLabel: { fontSize: 11, fontWeight: '600' },
});