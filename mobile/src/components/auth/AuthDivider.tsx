// src/components/auth/AuthDivider.tsx
// Usage: <AuthDivider label="or continue with" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useThemes';

interface AuthDividerProps {
  label?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({
  label = 'or continue with',
}) => {
  const { colors, type, spacing } = useTheme();

  return (
    <View style={[styles.row, { marginVertical: spacing.xl }]}>
      <View style={[styles.line, { backgroundColor: colors.borderPrimary }]} />
      <Text
        style={[
          type.caption,
          { color: colors.textMuted, marginHorizontal: spacing.sm },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: colors.borderPrimary }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center' },
  line: { flex: 1, height: 1 },
});

export default AuthDivider;