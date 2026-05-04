// ProfileAtoms.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface SkeletonCardProps {
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

const Shimmer: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors } = useTheme();
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
  return <Animated.View style={[{ backgroundColor: colors.skeleton, borderRadius: 8, opacity }, style]} />;
};

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ height = 80, radius: radiusProp, style }) => {
  const { colors, radius } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return <Animated.View style={[{ height, borderRadius: radiusProp ?? radius.lg, backgroundColor: colors.skeleton, opacity: anim }, style]} />;
};

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 88 }) => (
  <Shimmer style={{ width: size, height: size, borderRadius: size / 2 }} />
);

interface CompletionBarProps {
  percentage: number;
  label?: string;
  accentColor?: string;
  style?: ViewStyle;
}

export const CompletionBar: React.FC<CompletionBarProps> = ({ percentage, label, accentColor, style }) => {
  const { colors, type } = useTheme();
  const color = accentColor ?? colors.accent;
  const pct = Math.min(100, Math.max(0, Math.round(percentage)));
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  const barColor = pct >= 80 ? colors.success : pct >= 50 ? color : colors.warning;

  return (
    <View style={style}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        {label && <Text style={[type.caption, { color: colors.textMuted, fontWeight: '500' }]}>{label}</Text>}
        <Text style={[type.caption, { color: barColor, fontWeight: '700', marginLeft: 'auto' }]}>{pct}% complete</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.borderPrimary, borderRadius: 99, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', borderRadius: 99, backgroundColor: barColor, width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
      </View>
    </View>
  );
};

interface StatBadgeProps {
  icon: string;
  label: string;
  value: string | number;
  accentColor?: string;
}

export const StatBadge: React.FC<StatBadgeProps> = ({ icon, label, value, accentColor }) => {
  const { colors, radius, type } = useTheme();
  const color = accentColor ?? colors.accent;

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[type.body, { color: colors.textPrimary, fontWeight: '700', lineHeight: 20 }]}>{value}</Text>
      <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
};

interface InfoRowProps {
  icon: string;
  text: string;
  iconColor?: string;
  style?: ViewStyle;
}

export const InfoRow: React.FC<InfoRowProps> = ({ icon, text, iconColor, style }) => {
  const { colors, type } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <Ionicons name={icon as any} size={15} color={iconColor ?? colors.textMuted} />
      <Text style={[type.bodySm, { color: colors.textMuted, flex: 1 }]} numberOfLines={1}>{text}</Text>
    </View>
  );
};

interface BadgePillProps {
  label: string;
  color?: string;
  textColor?: string;
  icon?: string;
  style?: ViewStyle;
}

export const BadgePill: React.FC<BadgePillProps> = ({ label, color, textColor = '#fff', icon, style }) => {
  const { radius, type } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 }, style]}>
      {icon && <Ionicons name={icon as any} size={11} color={textColor} />}
      <Text style={[type.caption, { color: textColor, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
};

export const SectionDivider: React.FC<{ label?: string; style?: ViewStyle }> = ({ label, style }) => {
  const { colors, type } = useTheme();

  if (!label) {
    return <View style={[{ height: 1, backgroundColor: colors.borderPrimary, marginVertical: 16 }, style]} />;
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
      <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }]}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
    </View>
  );
};

export const VerifiedBadge: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <Ionicons name="checkmark-circle" size={size} color="#3B82F6" />
);