// src/social/components/shared/RoleBadge.tsx
import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { UserRole } from '../../types';

const ROLE_LABELS: Record<UserRole, string> = {
  candidate: 'Candidate',
  freelancer: 'Freelancer',
  company: 'Company',
  organization: 'Org',
};

interface Props {
  role?: UserRole;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const RoleBadge: React.FC<Props> = memo(({ role, size = 'sm', style }) => {
  const theme = useSocialTheme();
  const { roleColors, withAlpha, dark } = theme;
  
  if (!role) return null;

  const palette = roleColors[role] ?? roleColors.candidate;
  const label = ROLE_LABELS[role] ?? role;
  const md = size === 'md';

  const height = md ? 22 : 18;
  const paddingHorizontal = md ? 8 : 6;
  const fontSize = md ? 11 : 10;

  // Dark mode: more vibrant (higher opacity)
  // Light mode: softer (lower opacity)
  const bgOpacity = dark ? 0.18 : 0.10;
  const borderOpacity = dark ? 0.35 : 0.20;

  return (
    <View
      style={[
        styles.badge,
        {
          height,
          paddingHorizontal,
          backgroundColor: withAlpha(palette.primary, bgOpacity),
          borderColor: withAlpha(palette.primary, borderOpacity),
        },
        style,
      ]}
      accessibilityLabel={`${label} role`}
    >
      <Text
        style={[
          styles.text,
          {
            color: palette.primary,
            fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    marginLeft: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default RoleBadge;