// src/components/shared/StatCard.tsx
// Usage: <StatCard label="Applications" value={42} icon="document-text-outline" color={c.candidate} trend="up" subLabel="+12 this week" />

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, icon, color, subLabel, trend,
}) => {
  const { colors: c, radius, type, shadows } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const trendColor = trend === 'up' ? c.success : trend === 'down' ? c.danger : c.textMuted;
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';

  return (
    <Animated.View style={[sc.card, {
      backgroundColor: c.bgCard,
      borderColor: c.border,
      borderRadius: radius.lg,
      ...shadows.sm,
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }]}>
      <View style={[sc.iconWrap, {
        backgroundColor: withAlpha(color, 0.12),
        borderRadius: radius.md,
      }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>

      <Text style={[sc.value, type.h2, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      <Text style={[sc.label, type.caption, { color: c.textMuted }]} numberOfLines={1}>
        {label}
      </Text>

      {subLabel && (
        <View style={sc.subRow}>
          <Ionicons name={trendIcon as any} size={12} color={trendColor} />
          <Text style={[sc.sub, type.caption, { color: trendColor }]} numberOfLines={1}>
            {subLabel}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const sc = StyleSheet.create({
  card:    { borderWidth: 1, padding: 16, flex: 1, minWidth: 140 },
  iconWrap:{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  value:   { marginBottom: 2, fontWeight: '800' },
  label:   { fontWeight: '400' },
  subRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  sub:     { fontWeight: '600' },
});

export default StatCard;