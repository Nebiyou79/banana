// Button.tsx
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  Animated,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  style,
  ...rest
}) => {
  const { colors, radius, type } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const containerStyles = [
    styles.base,
    sizeStyles[size],
    getVariantStyle(variant, colors),
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    { borderRadius: radius.lg },
    style,
  ];

  const textColor = getTextColor(variant, colors);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        activeOpacity={1}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? colors.accent : colors.textInverse}
          />
        ) : (
          <View style={styles.inner}>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text style={[styles.text, textSizeStyles[size], { color: textColor }]}>
              {title}
            </Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const getVariantStyle = (variant: Variant, colors: any) => {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.accent };
    case 'secondary':
      return { backgroundColor: colors.bgSecondary };
    case 'outline':
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'danger':
      return { backgroundColor: colors.error };
    default:
      return { backgroundColor: colors.accent };
  }
};

const getTextColor = (variant: Variant, colors: any): string => {
  switch (variant) {
    case 'outline':
    case 'ghost':
      return colors.accent;
    case 'secondary':
      return colors.textPrimary;
    default:
      return colors.textInverse;
  }
};

const sizeStyles: Record<Size, object> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 20 },
  lg: { paddingVertical: 16, paddingHorizontal: 28 },
};

const textSizeStyles: Record<Size, object> = {
  sm: { fontSize: 13, lineHeight: 18 },
  md: { fontSize: 15, lineHeight: 20 },
  lg: { fontSize: 16, lineHeight: 22 },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  inner: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '600', textAlign: 'center' },
  leftIcon: { marginRight: 8 },
  rightIcon: { marginLeft: 8 },
});