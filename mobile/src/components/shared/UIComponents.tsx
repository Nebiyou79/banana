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

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading…' }) => {
  const { colors, type } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[type.bodySm, { marginTop: 12, color: colors.textMuted }]}>{message}</Text>
    </Animated.View>
  );
};

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => {
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
    <Animated.View style={[styles.centeredContainer, { paddingHorizontal: spacing.xl, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.emptyIconBox, { backgroundColor: colors.accentBg, borderRadius: radius.xl }]}>
        <Ionicons name={icon} size={40} color={colors.accent} />
      </View>
      <Text style={[type.h4, { color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' }]}>{title}</Text>
      {subtitle && <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity onPress={action.onPress} style={[styles.emptyActionBtn, { backgroundColor: colors.accent, borderRadius: radius.lg, marginTop: spacing.xl }]}>
          <Text style={[type.bodySm, { color: '#fff', fontWeight: '700' }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

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
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, destructive = false, loading = false,
}) => {
  const { colors, radius, type } = useTheme();
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
      <Animated.View style={[styles.dialogOverlay, { backgroundColor: colors.overlay, opacity: fadeAnim }]}>
        <Animated.View style={[styles.dialogBox, { backgroundColor: colors.bgCard, borderRadius: radius.xl, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[type.h4, { color: colors.textPrimary, marginBottom: 8 }]}>{title}</Text>
          <Text style={[type.body, { color: colors.textMuted, marginBottom: 24 }]}>{message}</Text>
          <View style={styles.dialogBtns}>
            <TouchableOpacity onPress={onCancel} disabled={loading} style={[styles.dialogBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
              <Text style={[type.bodySm, { color: colors.textPrimary, fontWeight: '600' }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} disabled={loading} style={[styles.dialogBtn, { backgroundColor: destructive ? colors.error : colors.accent, borderRadius: radius.md }]}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[type.bodySm, { color: '#fff', fontWeight: '700' }]}>{confirmLabel}</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const Badge: React.FC<{ label: string; color?: string; bg?: string }> = ({ label, color, bg }) => {
  const { colors, radius, type } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: bg ?? colors.accentBg, borderRadius: radius.full }]}>
      <Text style={[type.caption, { fontWeight: '700', color: color ?? colors.accent }]}>{label}</Text>
    </View>
  );
};

export const PillButton: React.FC<{
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ label, onPress, active = false, icon }) => {
  const { colors, radius, type } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}
        style={[styles.pillBtn, {
          backgroundColor: active ? colors.accent : colors.bgCard,
          borderColor: active ? colors.accent : colors.borderPrimary,
          borderRadius: radius.full,
        }]}
      >
        {icon && <Ionicons name={icon} size={14} color={active ? '#fff' : colors.textMuted} style={{ marginRight: 4 }} />}
        <Text style={[type.caption, { fontWeight: '600', color: active ? '#fff' : colors.textMuted }]}>{label}</Text>
      </TouchableOpacity>
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