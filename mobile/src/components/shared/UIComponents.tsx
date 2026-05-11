// src/components/shared/UIComponents.tsx
// ─── Legacy compatibility layer ───────────────────────────────────────────────
// These components are used widely. We clean them up in place.
// Zero hardcoded hex. All colors via useTheme().

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Modal,
  StyleSheet, ScrollView, StatusBar, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

// ─── ScreenWrapper ─────────────────────────────────────────────────────────────

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: object;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children, scrollable = false, style,
}) => {
  const { colors: c } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar
        barStyle={c.bg === '#0A1628' ? 'light-content' : 'dark-content'}
        backgroundColor={c.bg}
      />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[{ flexGrow: 1 }, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

// ─── LoadingState ─────────────────────────────────────────────────────────────

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading…' }) => {
  const { colors: c, type } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
      <ActivityIndicator size="large" color={c.primary} />
      <Text style={[type.bodySm, { marginTop: 12, color: c.textMuted }]}>{message}</Text>
    </Animated.View>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, title, subtitle, action,
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.centeredContainer,
      { paddingHorizontal: spacing.xl, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <View style={[styles.emptyIconBox, {
        backgroundColor: withAlpha(c.primary, 0.12),
        borderRadius: radius.xl,
      }]}>
        <Ionicons name={icon} size={40} color={c.primary} />
      </View>
      <Text style={[type.h3, { color: c.text, marginTop: spacing.lg, textAlign: 'center' }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[type.body, { color: c.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
          {subtitle}
        </Text>
      )}
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={[styles.emptyActionBtn, { backgroundColor: c.primary, borderRadius: radius.lg, marginTop: spacing.xl }]}
        >
          <Text style={[type.bodySm, { color: c.textInverse, fontWeight: '700' }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, destructive = false, loading = false,
}) => {
  const { colors: c, radius, type } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      scaleAnim.setValue(0.88);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.dialogOverlay, { backgroundColor: c.overlay, opacity: fadeAnim }]}>
        <Animated.View style={[
          styles.dialogBox,
          { backgroundColor: c.bgElevated, borderRadius: radius.xl, transform: [{ scale: scaleAnim }] },
        ]}>
          <Text style={[type.h3, { color: c.text, marginBottom: 8 }]}>{title}</Text>
          <Text style={[type.body, { color: c.textMuted, marginBottom: 24 }]}>{message}</Text>
          <View style={styles.dialogBtns}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              style={[styles.dialogBtn, { backgroundColor: c.surface, borderRadius: radius.md }]}
            >
              <Text style={[type.bodySm, { color: c.text, fontWeight: '600' }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[styles.dialogBtn, {
                backgroundColor: destructive ? c.danger : c.primary,
                borderRadius: radius.md,
              }]}
            >
              {loading
                ? <ActivityIndicator size="small" color={c.textInverse} />
                : <Text style={[type.bodySm, { color: c.textInverse, fontWeight: '700' }]}>{confirmLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────

export const Badge: React.FC<{
  label: string;
  color?: string;
  bg?: string;
}> = ({ label, color, bg }) => {
  const { colors: c, radius, type } = useTheme();

  return (
    <View style={[styles.badge, {
      backgroundColor: bg ?? withAlpha(c.primary, 0.12),
      borderRadius: radius.full,
    }]}>
      <Text style={[type.caption, { fontWeight: '700', color: color ?? c.primary }]}>
        {label}
      </Text>
    </View>
  );
};

// ─── PillButton ───────────────────────────────────────────────────────────────

export const PillButton: React.FC<{
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ label, onPress, active = false, icon }) => {
  const { colors: c, radius, type } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          styles.pillBtn,
          {
            backgroundColor: active ? c.primary : c.bgCard,
            borderColor: active ? c.primary : c.border,
            borderRadius: radius.full,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={active ? c.textInverse : c.textMuted}
            style={{ marginRight: 4 }}
          />
        )}
        <Text style={[type.caption, {
          fontWeight: '600',
          color: active ? c.textInverse : c.textMuted,
        }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIconBox:      { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyActionBtn:    { paddingHorizontal: 28, paddingVertical: 14 },
  dialogOverlay:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogBox:         { width: '100%', padding: 24 },
  dialogBtns:        { flexDirection: 'row', gap: 10 },
  dialogBtn:         { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  badge:             { paddingHorizontal: 8, paddingVertical: 3 },
  pillBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, marginRight: 8, marginBottom: 8,
  },
});