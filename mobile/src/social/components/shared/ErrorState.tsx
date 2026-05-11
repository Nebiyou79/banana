// src/social/components/shared/ErrorState.tsx
/**
 * ErrorState — centred error icon + message + retry button
 *
 * Theme migration:
 * - `type.btnSm`           → `type.bodySm`
 * - `colors.textSecondary` → `colors.textMuted`
 * All other tokens ✅
 */
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
  const { colors, spacing, radius, type } = useSocialTheme();
  const opacity = useFadeIn(0, 250);

  return (
    <Animated.View style={[styles.wrap, { opacity, padding: spacing.xl }]}>
      {/* colors.textSecondary → colors.textMuted */}
      <Ionicons
        name="alert-circle-outline"
        size={40}
        color={colors.textMuted}
      />
      <Text
        style={[
          type.body,
          { color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
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
          {/* type.btnSm → type.bodySm */}
          <Text style={[type.bodySm, { color: colors.primary }]}>
            Try again
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
});

ErrorState.displayName = 'ErrorState';

const styles = StyleSheet.create({
  wrap:  { alignItems: 'center' },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5 },
});

export default ErrorState;
// ✅ theme-migrated
