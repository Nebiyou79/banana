// src/components/auth/SocialAuthButtons.tsx
// Usage: <SocialAuthButtons />

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useThemes';

interface SocialBtnProps {
  icon:  string;
  label: string;
}

const SocialBtn: React.FC<SocialBtnProps> = ({ icon, label }) => {
  const { colors, type, spacing, radius } = useTheme();

  return (
    <Pressable
      disabled
      accessibilityLabel={`${label} — coming soon`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      style={({ pressed }) => [
        styles.btn,
        {
          borderColor:     colors.borderPrimary,
          backgroundColor: colors.bgCard,
          borderRadius:    radius.md,
          paddingVertical:   spacing.lg,
          paddingHorizontal: spacing.lg,
          opacity:           pressed ? 0.7 : 0.55,
        },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[type.body, { color: colors.textSecondary, flex: 1 }]}>
        {label}
      </Text>
      <View
        style={[
          styles.badge,
          {
            backgroundColor:   colors.warningBg,
            borderRadius:      radius.full,
            paddingHorizontal: 8,
            paddingVertical:   3,
          },
        ]}
      >
        <Text style={[type.label, { color: colors.warning }]}>Soon</Text>
      </View>
    </Pressable>
  );
};

export const SocialAuthButtons: React.FC = () => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.container, { gap: spacing.sm }]}>
      <SocialBtn icon="🔵" label="Continue with Google" />
      <SocialBtn icon="⚫" label="Continue with Apple" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  btn: {
    flexDirection: 'row',
    alignItems:    'center',
    borderWidth:   1,
    gap:           10,
  },
  icon:  { fontSize: 18 },
  badge: {},
});

export default SocialAuthButtons;