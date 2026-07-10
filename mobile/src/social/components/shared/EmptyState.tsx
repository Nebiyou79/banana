// src/social/components/shared/EmptyState.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFadeIn, useSlideUp } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<Props> = memo(({
  icon = 'sparkles-outline', title, subtitle, actionLabel, onAction,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, type, withAlpha, dark } = theme;
  
  const opacity = useFadeIn(50, 400);
  const { translateY } = useSlideUp(20, 100);

  // Dark mode: deeper icon background
  // Light mode: softer icon background
  const iconBg = withAlpha(colors.primary, dark ? 0.15 : 0.10);
  const iconColor = colors.primary;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity,
          transform: [{ translateY }],
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxl,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: iconBg,
            borderRadius: radius.pill,
            width: 72,
            height: 72,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>

      <Text
        style={[
          type.title,
          { 
            color: colors.text, 
            textAlign: 'center', 
            marginBottom: spacing.xs 
          },
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            type.bodySm,
            {
              color: colors.textMuted,
              textAlign: 'center',
              maxWidth: 280,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={[
            styles.action,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm + 2,
              marginTop: spacing.lg,
              minHeight: 44,
            },
          ]}
        >
          <Text style={[type.bodyMd, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },
  action: { justifyContent: 'center' },
});

export default EmptyState;