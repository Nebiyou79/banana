// src/components/auth/SocialAuthButtons.tsx
// Usage: <SocialAuthButtons />

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface SocialBtnConfig {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor: string;
}

const SOCIAL_BUTTONS: SocialBtnConfig[] = [
  { icon: 'logo-google', label: 'Continue with Google', iconColor: '#EA4335' },
  { icon: 'logo-apple',  label: 'Continue with Apple',  iconColor: '#000000' },
];

const SocialBtn: React.FC<SocialBtnConfig> = ({ icon, label, iconColor }) => {
  const { colors: c, type, spacing, radius } = useTheme();

  return (
    <Pressable
      disabled
      accessibilityLabel={`${label} — coming soon`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      style={({ pressed }) => [
        styles.btn,
        {
          borderColor: c.border,
          backgroundColor: c.bgCard,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          opacity: pressed ? 0.65 : 0.55,
          height: 48,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text
        style={[type.body, { color: c.textSecondary, flex: 1 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View
        style={[
          styles.soonBadge,
          {
            backgroundColor: c.warningBg,
            borderRadius: radius.full,
            paddingHorizontal: 8,
            paddingVertical: 3,
          },
        ]}
      >
        <Text style={[type.caption, { color: c.warning, fontWeight: '700' }]}>
          Soon
        </Text>
      </View>
    </Pressable>
  );
};

export const SocialAuthButtons: React.FC = () => {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {SOCIAL_BUTTONS.map(btn => (
        <SocialBtn key={btn.label} {...btn} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 10,
  },
  soonBadge: {},
});

export default SocialAuthButtons;