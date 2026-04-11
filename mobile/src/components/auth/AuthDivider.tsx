import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

// ─── AuthDivider ──────────────────────────────────────────────────────────────

interface AuthDividerProps {
  label?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ label = 'or continue with' }) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <View style={styles.dividerRow}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[styles.dividerText, { color: colors.textMuted, fontSize: typography.sm }]}>
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
};

// ─── FormError ────────────────────────────────────────────────────────────────

interface FormErrorProps {
  message?: string;
  visible?: boolean;
}

export const FormError: React.FC<FormErrorProps> = ({ message, visible = true }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;

  if (!visible || !message) return null;

  return (
    <View
      style={[
        styles.errorBox,
        { backgroundColor: colors.errorLight, borderRadius: borderRadius.lg, borderColor: colors.error },
      ]}
    >
      <Text style={[styles.errorText, { color: colors.error, fontSize: typography.sm }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  line: { flex: 1, height: 1 },
  dividerText: { fontWeight: '500' },
  // Error
  errorBox: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontWeight: '500', lineHeight: 18 },
});