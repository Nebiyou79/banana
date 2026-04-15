/**
 * mobile/src/components/common/StatCard.tsx
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     string;
  color:    string;
  subLabel?: string;
  trend?:   'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subLabel, trend }) => {
  const { theme: { colors, isDark } } = useThemeStore();
  const c = colors;

  const cardShadow = Platform.OS === 'ios'
    ? { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }
    : { elevation: 3 };

  return (
    <View style={[sc.card, { backgroundColor: c.card, borderColor: c.border }, cardShadow]}>
      <View style={[sc.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[sc.value, { color: c.text }]}>{value}</Text>
      <Text style={[sc.label, { color: c.textMuted }]}>{label}</Text>
      {subLabel && (
        <View style={sc.subRow}>
          {trend && (
            <Ionicons
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
              size={12}
              color={trend === 'up' ? c.success : trend === 'down' ? c.error : c.textMuted}
            />
          )}
          <Text style={[sc.sub, { color: trend === 'up' ? c.success : trend === 'down' ? c.error : c.textMuted }]}>
            {subLabel}
          </Text>
        </View>
      )}
    </View>
  );
};

const sc = StyleSheet.create({
  card:    { borderRadius: 16, borderWidth: 1, padding: 16, flex: 1, minWidth: 140 },
  iconWrap:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  value:   { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  label:   { fontSize: 12 },
  subRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  sub:     { fontSize: 11, fontWeight: '600' },
});