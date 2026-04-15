/**
 * mobile/src/components/common/EmptyState.tsx
 * Performance-List-Specialist: every list needs an empty state.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface EmptyStateProps {
  icon?:        string;
  title:        string;
  subtitle?:    string;
  actionLabel?: string;
  onAction?:    () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search-outline', title, subtitle, actionLabel, onAction,
}) => {
  const { theme: { colors } } = useThemeStore();
  return (
    <View style={s.wrap}>
      <View style={[s.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon as any} size={40} color={colors.primary} />
      </View>
      <Text style={[s.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text style={[s.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary }]} onPress={onAction} activeOpacity={0.8}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 300 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:    { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btn:      { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText:  { color: '#fff', fontSize: 15, fontWeight: '600' },
});