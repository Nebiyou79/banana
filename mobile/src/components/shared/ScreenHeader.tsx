/**
 * mobile/src/components/common/ScreenHeader.tsx
 * Reusable screen header with back button, title, and optional right action.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface ScreenHeaderProps {
  title:       string;
  subtitle?:   string;
  onBack?:     () => void;
  rightIcon?:  string;
  rightLabel?: string;
  onRightPress?: () => void;
  transparent?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title, subtitle, onBack, rightIcon, rightLabel, onRightPress, transparent,
}) => {
  const { theme: { colors, isDark } } = useThemeStore();
  const insets = useSafeAreaInsets();
  const c = colors;

  return (
    <View style={[
      h.wrap,
      {
        backgroundColor: transparent ? 'transparent' : c.surface,
        borderBottomColor: transparent ? 'transparent' : c.border,
        paddingTop: insets.top + 4,
      },
    ]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={h.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={h.backBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={h.center}>
          <Text style={[h.title, { color: c.text }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[h.subtitle, { color: c.textMuted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>

        <View style={h.right}>
          {(rightIcon || rightLabel) && onRightPress ? (
            <TouchableOpacity onPress={onRightPress} style={[h.rightBtn, { backgroundColor: c.primaryLight }]} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              {rightIcon && <Ionicons name={rightIcon as any} size={20} color={c.primary} />}
              {rightLabel && <Text style={[h.rightLabel, { color: c.primary }]}>{rightLabel}</Text>}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>
      </View>
    </View>
  );
};

const h = StyleSheet.create({
  wrap:       { borderBottomWidth: StyleSheet.hairlineWidth },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, minHeight: 52 },
  backBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  center:     { flex: 1, alignItems: 'center' },
  title:      { fontSize: 16, fontWeight: '700' },
  subtitle:   { fontSize: 12, marginTop: 1 },
  right:      { width: 44, alignItems: 'flex-end' },
  rightBtn:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  rightLabel: { fontSize: 13, fontWeight: '600' },
});