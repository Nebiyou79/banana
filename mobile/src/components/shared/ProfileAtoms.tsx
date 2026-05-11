// src/components/profile/ProfileAtoms.tsx
// ─── Profile UI atoms ──────────────────────────────────────────────────────────
// All colors via useTheme(). withAlpha() replaces string concatenation.

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

// ─── SkeletonCard ──────────────────────────────────────────────────────────────

export interface SkeletonCardProps {
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

// Internal shimmer — not exported, used only within this file
const Shimmer: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors: c } = useTheme();
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[{ backgroundColor: c.skeleton, borderRadius: 8, opacity: anim }, style]} />
  );
};

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ height = 80, radius: radiusProp, style }) => {
  const { colors: c, radius } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[{
      height,
      borderRadius: radiusProp ?? radius.lg,
      backgroundColor: c.skeleton,
      opacity: anim,
    }, style]} />
  );
};

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 88 }) => (
  <Shimmer style={{ width: size, height: size, borderRadius: size / 2 }} />
);

// ─── CompletionBar ─────────────────────────────────────────────────────────────

interface CompletionBarProps {
  percentage: number;
  label?: string;
  accentColor?: string;
  style?: ViewStyle;
}

export const CompletionBar: React.FC<CompletionBarProps> = ({
  percentage, label, accentColor, style,
}) => {
  const { colors: c, type } = useTheme();
  const pct = Math.min(100, Math.max(0, Math.round(percentage)));
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  // Color adapts based on completion level
  const barColor = pct >= 80 ? c.success : pct >= 50 ? (accentColor ?? c.primary) : c.warning;

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        {label && (
          <Text style={[type.caption, { color: c.textMuted, fontWeight: '500' }]}>{label}</Text>
        )}
        <Text style={[type.caption, { color: barColor, fontWeight: '700', marginLeft: 'auto' }]}>
          {pct}% complete
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: c.border, borderRadius: 99, overflow: 'hidden' }}>
        <Animated.View style={{
          height: '100%',
          borderRadius: 99,
          backgroundColor: barColor,
          width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }} />
      </View>
    </View>
  );
};

// ─── StatBadge ────────────────────────────────────────────────────────────────

interface StatBadgeProps {
  icon: string;
  label: string;
  value: string | number;
  accentColor?: string;
}

export const StatBadge: React.FC<StatBadgeProps> = ({ icon, label, value, accentColor }) => {
  const { colors: c, radius, type } = useTheme();
  const color = accentColor ?? c.primary;

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{
        width: 40, height: 40,
        borderRadius: radius.md,
        backgroundColor: withAlpha(color, 0.12),
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[type.body, { color: c.text, fontWeight: '700', lineHeight: 20 }]}>{value}</Text>
      <Text style={[type.caption, { color: c.textMuted, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: string;
  text: string;
  iconColor?: string;
  style?: ViewStyle;
}

export const InfoRow: React.FC<InfoRowProps> = ({ icon, text, iconColor, style }) => {
  const { colors: c, type } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <Ionicons name={icon as any} size={15} color={iconColor ?? c.textMuted} />
      <Text style={[type.bodySm, { color: c.textMuted, flex: 1 }]} numberOfLines={1}>{text}</Text>
    </View>
  );
};

// ─── BadgePill ────────────────────────────────────────────────────────────────

interface BadgePillProps {
  label: string;
  color?: string;
  textColor?: string;
  icon?: string;
  style?: ViewStyle;
}

export const BadgePill: React.FC<BadgePillProps> = ({
  label, color, textColor, icon, style,
}) => {
  const { colors: c, radius, type } = useTheme();
  const bg = color ?? c.primary;
  const fg = textColor ?? c.textInverse;

  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: bg,
      borderRadius: radius.full,
      paddingHorizontal: 10, paddingVertical: 4,
    }, style]}>
      {icon && <Ionicons name={icon as any} size={11} color={fg} />}
      <Text style={[type.caption, { color: fg, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
};

// ─── SectionDivider ───────────────────────────────────────────────────────────

export const SectionDivider: React.FC<{ label?: string; style?: ViewStyle }> = ({ label, style }) => {
  const { colors: c, type } = useTheme();

  if (!label) {
    return (
      <View style={[{
        height: StyleSheet.hairlineWidth,
        backgroundColor: c.border,
        marginVertical: 16,
      }, style]} />
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 }, style]}>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />
      <Text style={[type.caption, {
        color: c.textMuted, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.8,
      }]}>
        {label}
      </Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />
    </View>
  );
};

// ─── VerifiedBadge ────────────────────────────────────────────────────────────

export const VerifiedBadge: React.FC<{ size?: number }> = ({ size = 16 }) => {
  const { colors: c } = useTheme();
  return <Ionicons name="checkmark-circle" size={size} color={c.info} />;
};