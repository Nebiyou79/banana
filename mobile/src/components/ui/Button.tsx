// src/components/ui/Button.tsx
// Usage: <Button label="Follow" variant="filled" size="md" onPress={...} />

import React, { useRef, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BUTTON_HEIGHT } from '../../theme/tokens';

type Variant = 'filled' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

const FONT_SIZE: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

const H_PADDING: Record<Size, number> = { sm: 14, md: 20, lg: 28 };

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'filled',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}) => {
  const { colors: c, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const {
    bgColor,
    borderColor,
    textColor,
    borderWidth,
  } = useMemo(() => {
    switch (variant) {
      case 'filled':
        return {
          bgColor: c.primary,
          borderColor: 'transparent',
          textColor: c.textInverse,
          borderWidth: 0,
        };
      case 'outline':
        return {
          bgColor: 'transparent',
          borderColor: c.primary,
          textColor: c.primary,
          borderWidth: 1.5,
        };
      case 'ghost':
        return {
          bgColor: 'transparent',
          borderColor: 'transparent',
          textColor: c.primary,
          borderWidth: 0,
        };
      case 'danger':
        return {
          bgColor: c.danger,
          borderColor: 'transparent',
          textColor: c.textInverse,
          borderWidth: 0,
        };
    }
  }, [variant, c]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const height = BUTTON_HEIGHT[size];
  const hitSlop = size === 'sm' ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined;

  return (
    <Animated.View
      style={[
        fullWidth && { width: '100%' },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.75}
        hitSlop={hitSlop}
        style={[
          styles.base,
          {
            height,
            minWidth: height * 2,
            backgroundColor: bgColor,
            borderColor,
            borderWidth,
            borderRadius: radius.md,
            paddingHorizontal: H_PADDING[size],
            opacity: isDisabled ? 0.6 : 1,
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <View style={styles.inner}>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={ICON_SIZE[size]}
                color={textColor}
                style={styles.leftIcon}
              />
            )}
            <Text
              style={[
                styles.label,
                {
                  color: textColor,
                  fontSize: FONT_SIZE[size],
                  fontWeight: '700',
                  lineHeight: height,
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {rightIcon && (
              <Ionicons
                name={rightIcon}
                size={ICON_SIZE[size]}
                color={textColor}
                style={styles.rightIcon}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  leftIcon: {
    marginRight: 6,
  },
  rightIcon: {
    marginLeft: 6,
  },
});

export default Button;