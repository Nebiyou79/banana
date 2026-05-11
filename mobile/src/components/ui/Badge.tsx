// src/components/ui/Badge.tsx
// Usage: <Badge variant="role" role="candidate" size="md" />
//        <Badge variant="status" status="success" label="Active" />

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

type BadgeVariant = 'role' | 'status' | 'custom';
type RoleType = 'candidate' | 'freelancer' | 'company' | 'organization';
type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  role?: RoleType;
  status?: StatusType;
  color?: string;
  size?: BadgeSize;
  filled?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'custom',
  role,
  status,
  color,
  size = 'md',
  filled = true,
}) => {
  const { colors: c, radius } = useTheme();

  const resolvedColor = useMemo(() => {
    if (variant === 'role' && role) return c[role];
    if (variant === 'status' && status) {
      if (status === 'neutral') return c.textMuted;
      return c[status];
    }
    return color ?? c.primary;
  }, [variant, role, status, color, c]);

  const sizeStyle = size === 'sm' ? styles.sm : styles.md;
  const textStyle = size === 'sm' ? styles.textSm : styles.textMd;

  return (
    <View
      style={[
        styles.base,
        sizeStyle,
        { borderRadius: radius.full },
        filled
          ? { backgroundColor: resolvedColor }
          : {
              backgroundColor: withAlpha(resolvedColor, 0.12),
              borderWidth: 1,
              borderColor: resolvedColor,
            },
      ]}
    >
      <Text
        style={[
          styles.text,
          textStyle,
          { color: filled ? '#FFFFFF' : resolvedColor },
        ]}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    height: 22,
    justifyContent: 'center',
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    height: 28,
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlignVertical: 'center',
  },
  textSm: { fontSize: 10, lineHeight: 14 },
  textMd: { fontSize: 12, lineHeight: 16 },
});

export default Badge;