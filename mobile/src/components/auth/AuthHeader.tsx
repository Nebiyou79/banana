// src/components/auth/AuthHeader.tsx
// Usage: <AuthHeader title="Welcome back" subtitle="Sign in to continue" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useThemes';

interface AuthHeaderProps {
  title:     string;
  subtitle?: string;
  showLogo?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
}) => {
  const { colors, type, spacing } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing['2xl'] }]}>
      {showLogo && (
        <View
          style={[
            styles.logoBg,
            {
              backgroundColor: colors.accentBg,
              borderColor:     colors.borderAccent,
              marginBottom:    spacing.lg,
            },
          ]}
        >
          <Text style={styles.logoEmoji}>🍌</Text>
        </View>
      )}

      <Text style={[type.display, { color: colors.textPrimary, textAlign: 'center' }]}>
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            type.bodyLg,
            {
              color:           colors.textMuted,
              textAlign:       'center',
              marginTop:       spacing.sm,
              paddingHorizontal: spacing.xl,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoBg: {
    width:           76,
    height:          76,
    borderRadius:    22,
    borderWidth:     1.5,
    alignItems:      'center',
    justifyContent:  'center',
  },
  logoEmoji: {
    fontSize: 40,
  },
});

export default AuthHeader;