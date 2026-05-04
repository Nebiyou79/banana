// ScreenHeader.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: string;
  rightLabel?: string;
  onRightPress?: () => void;
  transparent?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title, subtitle, onBack, rightIcon, rightLabel, onRightPress, transparent,
}) => {
  const { colors, radius, type, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[h.wrap, {
      backgroundColor: transparent ? 'transparent' : colors.bgCard,
      borderBottomColor: transparent ? 'transparent' : colors.borderPrimary,
      paddingTop: insets.top + 4,
      ...(!transparent ? shadows.sm : {}),
      opacity: fadeAnim,
    }]}>
      <StatusBar barStyle="dark-content" />
      <View style={h.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={[h.backBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={h.center}>
          <Text style={[h.title, type.h4, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[h.subtitle, type.caption, { color: colors.textMuted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>

        <View style={h.right}>
          {(rightIcon || rightLabel) && onRightPress ? (
            <TouchableOpacity onPress={onRightPress} style={[h.rightBtn, { backgroundColor: colors.accentBg, borderRadius: radius.full }]} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              {rightIcon && <Ionicons name={rightIcon as any} size={20} color={colors.accent} />}
              {rightLabel && <Text style={[h.rightLabel, type.caption, { color: colors.accent }]}>{rightLabel}</Text>}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const h = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, minHeight: 52 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  title: { fontWeight: '700' },
  subtitle: { marginTop: 1 },
  right: { width: 44, alignItems: 'flex-end' },
  rightBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  rightLabel: { fontWeight: '600' },
});