// src/social/components/shared/EmptyState.tsx
/**
 * EmptyState — centred icon + title + subtitle + optional CTA
 *
 * Theme migration:
 * - `type.titleSm`      → `type.title`
 * - `type.btn`          → `type.bodyMd`
 * - `colors.onPrimary`  → `colors.white`
 * - `colors.textSecondary` → `colors.textMuted`
 * All other tokens ✅
 */
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
  const { colors, spacing, radius, type, withAlpha } = useSocialTheme();
  const opacity              = useFadeIn(50, 400);
  const { translateY }       = useSlideUp(20, 100);

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
            backgroundColor: withAlpha(colors.primary, 0.10),
            borderRadius: radius.pill,
            width: 72,
            height: 72,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>

      {/* type.titleSm → type.title */}
      <Text
        style={[
          type.title,
          { color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            type.bodySm,
            {
              // colors.textSecondary → colors.textMuted
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
          {/* type.btn → type.bodyMd; colors.onPrimary → colors.white */}
          <Text style={[type.bodyMd, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  wrap:       { alignItems: 'center', justifyContent: 'center' },
  iconCircle: { alignItems: 'center', justifyContent: 'center' },
  action:     { justifyContent: 'center' },
});

export default EmptyState;
// ✅ theme-migrated
