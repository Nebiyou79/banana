// NEW FILE
// src/components/shared/PrimaryButton.tsx
// ─── Primary button ───────────────────────────────────────────────────────────
// Supports filled / outline / ghost variants, three sizes, loading state,
// and an optional leading Ionicons icon. Uses gold+navy design system.

import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BUTTON_HEIGHT, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../theme/tokens';

type ButtonSize    = 'sm' | 'md' | 'lg';
type ButtonVariant = 'filled' | 'outline' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: string; // Ionicons name
  style?: ViewStyle;
}

const BORDER_RADIUS: Record<ButtonSize, number> = {
  sm: RADIUS.sm,
  md: RADIUS.md,
  lg: RADIUS.md,
};

const FONT: Record<ButtonSize, number> = {
  sm: FONT_SIZE.sm,
  md: FONT_SIZE.base,
  lg: FONT_SIZE.md,
};

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'filled',
  fullWidth = false,
  icon,
  style,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  // ── Color resolution ─────────────────────────────────────────────────────
  const isDisabled = disabled || loading;
  const gold = colors.primary;
  const navy = colors.textInverse; // dark navy — contrasts gold

  let bg:     string;
  let border: string;
  let fg:     string;

  if (variant === 'filled') {
    bg     = isDisabled ? gold + '66' : gold;
    border = bg;
    fg     = isDisabled ? navy + '88' : navy;
  } else if (variant === 'outline') {
    bg     = 'transparent';
    border = isDisabled ? gold + '55' : gold;
    fg     = isDisabled ? gold + '66' : gold;
  } else {
    // ghost
    bg     = 'transparent';
    border = 'transparent';
    fg     = isDisabled ? gold + '66' : gold;
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.btn,
          {
            height: BUTTON_HEIGHT[size],
            borderRadius: BORDER_RADIUS[size],
            backgroundColor: bg,
            borderColor: border,
            paddingHorizontal: size === 'sm' ? 16 : size === 'md' ? 20 : 24,
          },
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <>
            {icon ? (
              <Ionicons
                name={icon as any}
                size={ICON_SIZE[size]}
                color={fg}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text style={[styles.label, { color: fg, fontSize: FONT[size] }]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.2,
  },
  fullWidth: {
    width: '100%',
  },
});

export default PrimaryButton;