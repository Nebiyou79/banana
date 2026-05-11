// UIComponents.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Modal, StyleSheet, SafeAreaView, ScrollView, StatusBar, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: object;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, scrollable = false, style }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgPrimary} />
      {scrollable ? (
        <ScrollView contentContainerStyle={[{ flexGrow: 1 }, style]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label?: string };
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, rightAction }) => {
  const { colors, radius, type, spacing, shadows } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.borderPrimary, ...shadows.sm, opacity: fadeAnim }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={[styles.headerBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: onBack ? spacing.md : 0 }}>
          <Text style={[type.h4, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[type.caption, { color: colors.textMuted, marginTop: spacing.xs }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress} style={[styles.headerBtn, { backgroundColor: colors.accentBg, borderRadius: radius.md }]}>
          <Ionicons name={rightAction.icon} size={20} color={colors.accent} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIconBox: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyActionBtn: { paddingHorizontal: 28, paddingVertical: 14 },
  dialogOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogBox: { width: '100%', padding: 24 },
  dialogBtns: { flexDirection: 'row', gap: 10 },
  dialogBtn: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  pillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, marginRight: 8, marginBottom: 8 },
});