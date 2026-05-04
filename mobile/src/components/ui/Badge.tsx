// Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'primary' | 'muted';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
}) => {
  const { colors, radius, type } = useTheme();
  const { bg, text } = getColors(variant, colors);

  return (
    <View style={[styles.base, sizeStyles[size], { backgroundColor: bg, borderRadius: radius.sm }]}>
      <Text style={[styles.text, textSizeStyles[size], { color: text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const getColors = (variant: BadgeVariant, colors: any) => {
  switch (variant) {
    case 'success': return { bg: colors.successBg, text: colors.success };
    case 'error':   return { bg: colors.errorBg,   text: colors.error };
    case 'warning': return { bg: colors.warningBg, text: colors.warning };
    case 'info':    return { bg: colors.infoBg,    text: colors.info };
    case 'primary': return { bg: colors.accentBg, text: colors.accent };
    case 'muted':   return { bg: colors.bgSecondary,  text: colors.textMuted };
    default:        return { bg: colors.bgSecondary,  text: colors.textSecondary };
  }
};

const sizeStyles: Record<BadgeSize, object> = {
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
};

const textSizeStyles: Record<BadgeSize, object> = {
  sm: { fontSize: 10, lineHeight: 14 },
  md: { fontSize: 12, lineHeight: 16 },
};

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start' },
  text: { fontWeight: '600' },
});