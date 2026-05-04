// EmptyState.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const { colors, radius, type, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.wrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[s.iconWrap, { backgroundColor: colors.accentBg, borderRadius: radius.lg }]}>
        <Ionicons name={icon as any} size={40} color={colors.accent} />
      </View>
      <Text style={[s.title, type.h4, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[s.subtitle, type.body, { color: colors.textMuted }]}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.accent, borderRadius: radius.md }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[s.btnText, type.bodySm, { color: colors.textInverse }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 300 },
  iconWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { textAlign: 'center', marginBottom: 8, fontWeight: '700' },
  subtitle: { textAlign: 'center', marginBottom: 24 },
  btn: { paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontWeight: '600' },
});