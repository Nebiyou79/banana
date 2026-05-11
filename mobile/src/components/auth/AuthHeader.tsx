// src/components/auth/AuthHeader.tsx
// Usage: <AuthHeader title="Welcome back" subtitle="Sign in to continue" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
}) => {
  const { colors: c, spacing, type, radius } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.xl }]}>
      {showLogo && (
        <View
          style={[
            styles.logoBg,
            {
              backgroundColor: c.primaryBg,
              borderColor: c.borderAccent,
              borderRadius: radius.xl,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={styles.logoEmoji}>🍌</Text>
        </View>
      )}

      <Text
        style={[
          type.h1,
          { color: c.text, textAlign: 'center', fontWeight: '700' },
        ]}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            type.body,
            {
              color: c.textMuted,
              textAlign: 'center',
              marginTop: spacing.sm,
              paddingHorizontal: spacing.xl,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoBg: {
    width: 76,
    height: 76,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 40,
  },
});

export default AuthHeader;