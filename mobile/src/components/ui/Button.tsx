import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

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
  const { theme } = useThemeStore();
  const { colors } = theme;

  const isDisabled = disabled || loading;

  const containerStyles = [
    styles.base,
    sizeStyles[size],
    getVariantStyle(variant, colors),
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style
  ];

  const textColor = getTextColor(variant, colors);

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
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
  );
};

const getVariantStyle = (variant: Variant, colors: any) => {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.primary };
    case 'secondary':
      return { backgroundColor: colors.banana };
    case 'outline':
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'danger':
      return { backgroundColor: colors.error };
    default:
      return { backgroundColor: colors.primary };
  }
};

const getTextColor = (variant: Variant, colors: any): string => {
  switch (variant) {
    case 'outline':
      return colors.primary;
    case 'ghost':
      return colors.primary;
    case 'secondary':
      return colors.black;
    default:
      return colors.white;
  }
};

const sizeStyles: Record<Size, object> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  md: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  lg: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 12 },
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