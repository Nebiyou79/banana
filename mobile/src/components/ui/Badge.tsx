import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

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
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { bg, text } = getColors(variant, colors);

  return (
    <View style={[styles.base, sizeStyles[size], { backgroundColor: bg }]}>
      <Text style={[styles.text, textSizeStyles[size], { color: text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const getColors = (variant: BadgeVariant, colors: any) => {
  switch (variant) {
    case 'success': return { bg: colors.successLight, text: colors.success };
    case 'error':   return { bg: colors.errorLight,   text: colors.error };
    case 'warning': return { bg: colors.warningLight, text: colors.warning };
    case 'info':    return { bg: colors.infoLight,    text: colors.info };
    case 'primary': return { bg: colors.primaryLight, text: colors.primary };
    case 'muted':   return { bg: colors.borderLight,  text: colors.textMuted };
    default:        return { bg: colors.borderLight,  text: colors.textSecondary };
  }
};

const sizeStyles: Record<BadgeSize, object> = {
  sm: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  md: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
};

const textSizeStyles: Record<BadgeSize, object> = {
  sm: { fontSize: 10, lineHeight: 14 },
  md: { fontSize: 12, lineHeight: 16 },
};

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start' },
  text: { fontWeight: '600' },
});