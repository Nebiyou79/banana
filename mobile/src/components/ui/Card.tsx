import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  shadow?: boolean;
  padding?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  shadow = true,
  padding = 16,
  style,
  borderRadius: radiusProp,
}) => {
  const { theme } = useThemeStore();
  const { colors, shadows, borderRadius } = theme;

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: radiusProp ?? borderRadius.xl,
    padding,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadow ? shadows.md : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};