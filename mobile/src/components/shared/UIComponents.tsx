import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── ScreenWrapper ────────────────────────────────────────────────────────────

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: object;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, scrollable = false, style }) => {
  const { theme } = useThemeStore();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
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

// ─── ScreenHeader ─────────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label?: string };
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, onBack, rightAction }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.headerBtn, { backgroundColor: colors.background }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: onBack ? spacing[3] : 0 }}>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={[styles.headerBtn, { backgroundColor: colors.primary + '20' }]}
        >
          <Ionicons name={rightAction.icon} size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── LoadingState ─────────────────────────────────────────────────────────────

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading…' }) => {
  const { theme } = useThemeStore();
  return (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ marginTop: 12, color: theme.colors.textMuted, fontSize: theme.typography.sm }}>
        {message}
      </Text>
    </View>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius, spacing } = theme;

  return (
    <View style={[styles.centeredContainer, { paddingHorizontal: spacing[6] }]}>
      <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryLight, borderRadius: borderRadius['2xl'] }]}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text, marginTop: spacing[4], textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: typography.sm, color: colors.textMuted, marginTop: spacing[2], textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </Text>
      )}
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={[styles.emptyActionBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg, marginTop: spacing[5] }]}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
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
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, destructive = false, loading = false,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        <View style={[styles.dialogBox, { backgroundColor: colors.surface, borderRadius: borderRadius.xl }]}>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontSize: typography.sm, color: colors.textMuted, lineHeight: 20, marginBottom: 24 }}>{message}</Text>
          <View style={styles.dialogBtns}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              style={[styles.dialogBtn, { backgroundColor: colors.background, borderRadius: borderRadius.md }]}
            >
              <Text style={{ color: colors.text, fontWeight: '600', fontSize: typography.sm }}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[styles.dialogBtn, {
                backgroundColor: destructive ? colors.error : colors.primary,
                borderRadius: borderRadius.md,
              }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm }}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────

export const Badge: React.FC<{ label: string; color?: string; bg?: string }> = ({ label, color, bg }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[styles.badge, { backgroundColor: bg ?? theme.colors.primaryLight, borderRadius: 20 }]}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: color ?? theme.colors.primary }}>{label}</Text>
    </View>
  );
};

// ─── Pill Button ──────────────────────────────────────────────────────────────

export const PillButton: React.FC<{
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ label, onPress, active = false, icon }) => {
  const { theme } = useThemeStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pillBtn,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          borderRadius: 20,
        },
      ]}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? '#fff' : theme.colors.textMuted} style={{ marginRight: 4 }} />}
      <Text style={{ fontSize: theme.typography.xs, fontWeight: '600', color: active ? '#fff' : theme.colors.textMuted }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    padding: 24,
  },
  dialogBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtn: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
});
