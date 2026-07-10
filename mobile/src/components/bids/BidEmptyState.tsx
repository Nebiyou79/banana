// src/components/bids/BidEmptyState.tsx
// Empty state with icon + message + optional CTA.
// UPDATED: Uses useTheme hook, improved styling, added subtitle support
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  subtitle?: string;
  message: string;
  ctaLabel?: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  onCta?: () => void;
}

export const BidEmptyState: React.FC<Props> = ({
  icon = 'document-text-outline',
  title = 'Nothing here yet',
  subtitle,
  message,
  ctaLabel,
  ctaIcon = 'add-circle-outline',
  onCta,
}) => {
  const { colors, radius, spacing } = useTheme();

  return (
    <View style={styles.root}>
      {/* Icon circle */}
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.full,
          },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.textMuted} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {/* Subtitle (optional) */}
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      {/* Message */}
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>

      {/* CTA button */}
      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Ionicons name={ctaIcon} size={18} color={colors.textInverse} />
          <Text style={[styles.ctaText, { color: colors.textInverse }]}>
            {ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -6,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default BidEmptyState;