/**
 * components/shared/ProfileAtoms.tsx
 * Small reusable UI atoms used across all profile screens.
 * Includes: SkeletonCard, CompletionBar, StatBadge, SectionDivider, InfoRow, BadgePill
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

export interface SkeletonCardProps {
  height?:  number;
  radius?:  number;
  style?:   ViewStyle;
}
// ─── Skeleton ────────────────────────────────────────────────────────────────

const Shimmer: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme } = useThemeStore();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[
        { backgroundColor: theme.colors.border, borderRadius: 8, opacity },
        style,
      ]}
    />
  );
};

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 80,
  radius = 14,
  style,
}) => {
  const { theme } = useThemeStore();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        { height, borderRadius: radius, backgroundColor: theme.colors.skeleton, opacity: anim },
        style,
      ]}
    />
  );
};

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 88 }) => (
  <Shimmer style={{ width: size, height: size, borderRadius: size / 2 }} />
);

// ─── CompletionBar ────────────────────────────────────────────────────────────

interface CompletionBarProps {
  percentage: number;
  label?: string;
  accentColor?: string;
  style?: ViewStyle;
}

export const CompletionBar: React.FC<CompletionBarProps> = ({
  percentage,
  label,
  accentColor = '#6366F1',
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;
  const pct = Math.min(100, Math.max(0, Math.round(percentage)));
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const color = pct >= 80 ? '#22C55E' : pct >= 50 ? accentColor : '#F59E0B';

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        {label && (
          <Text style={{ color: colors.textMuted, fontSize: typography.xs, fontWeight: '500' }}>
            {label}
          </Text>
        )}
        <Text style={{ color, fontSize: typography.xs, fontWeight: '700', marginLeft: 'auto' }}>
          {pct}% complete
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 99, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 99,
            backgroundColor: color,
            width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }}
        />
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

export const StatBadge: React.FC<StatBadgeProps> = ({ icon, label, value, accentColor = '#6366F1' }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius } = theme;

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: `${accentColor}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Ionicons name={icon as any} size={18} color={accentColor} />
      </View>
      <Text style={{ color: colors.text, fontSize: typography.base, fontWeight: '700', lineHeight: 20 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign: 'center' }}>{label}</Text>
    </View>
  );
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: string;
  text: string;
  iconColor?: string;
  style?: ViewStyle;
}

export const InfoRow: React.FC<InfoRowProps> = ({ icon, text, iconColor, style }) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <Ionicons name={icon as any} size={15} color={iconColor ?? colors.textMuted} />
      <Text style={{ color: colors.textMuted, fontSize: typography.sm, flex: 1 }} numberOfLines={1}>
        {text}
      </Text>
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
  label, color = '#6366F1', textColor = '#fff', icon, style,
}) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }, style]}>
    {icon && <Ionicons name={icon as any} size={11} color={textColor} />}
    <Text style={{ color: textColor, fontSize: 11, fontWeight: '700' }}>{label}</Text>
  </View>
);

// ─── SectionDivider ───────────────────────────────────────────────────────────

export const SectionDivider: React.FC<{ label?: string; style?: ViewStyle }> = ({ label, style }) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  if (!label) {
    return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: 16 }, style]} />;
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={{ color: colors.textMuted, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
};

// ─── VerifiedBadge ────────────────────────────────────────────────────────────

export const VerifiedBadge: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <Ionicons name="checkmark-circle" size={size} color="#3B82F6" />
);