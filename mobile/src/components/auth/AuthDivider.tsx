// src/components/auth/AuthDivider.tsx
// Usage: <AuthDivider label="or continue with" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AuthDividerProps {
  label?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({
  label = 'or continue with',
}) => {
  const { colors: c, type, spacing } = useTheme();

  return (
    <View style={[styles.row, { marginVertical: spacing.xl }]}>
      <View style={[styles.line, { backgroundColor: c.border }]} />
      <Text
        style={[
          type.caption,
          {
            color: c.textMuted,
            marginHorizontal: spacing.sm,
            fontWeight: '500',
          },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: c.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});

export default AuthDivider;