// src/social/components/shared/ErrorState.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFadeIn } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<Props> = memo(({
  message = 'Something went wrong', onRetry,
}) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, type, dark } = theme;
  const opacity = useFadeIn(0, 250);

  // Dark mode: muted red-orange icon
  // Light mode: standard muted color
  const iconColor = dark ? colors.textMuted : colors.textMuted;

  return (
    <Animated.View style={[styles.wrap, { opacity, padding: spacing.xl }]}>
      <Ionicons
        name="alert-circle-outline"
        size={40}
        color={iconColor}
      />
      <Text
        style={[
          type.body,
          { 
            color: colors.text, 
            marginTop: spacing.sm, 
            textAlign: 'center' 
          },
        ]}
      >
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          style={[
            styles.retry,
            {
              borderColor: colors.primary,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 5,
              marginTop: spacing.md,
              minHeight: 44,
            },
          ]}
        >
          <Ionicons name="refresh" size={14} color={colors.primary} />
          <Text style={[type.bodySm, { color: colors.primary }]}>
            Try again
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5 },
});

export default ErrorState;