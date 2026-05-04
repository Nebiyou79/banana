// StatCard.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subLabel, trend }) => {
  const { colors, radius, type, shadows } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[sc.card, {
      backgroundColor: colors.bgCard,
      borderColor: colors.borderPrimary,
      borderRadius: radius.lg,
      ...shadows.sm,
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }]}>
      <View style={[sc.iconWrap, { backgroundColor: color + '18', borderRadius: radius.md }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[sc.value, type.h2, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[sc.label, type.caption, { color: colors.textMuted }]}>{label}</Text>
      {subLabel && (
        <View style={sc.subRow}>
          {trend && (
            <Ionicons
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
              size={12}
              color={trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textMuted}
            />
          )}
          <Text style={[sc.sub, type.caption, { color: trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textMuted }]}>
            {subLabel}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const sc = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, flex: 1, minWidth: 140 },
  iconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  value: { marginBottom: 2, fontWeight: '800' },
  label: { fontWeight: '400' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  sub: { fontWeight: '600' },
});