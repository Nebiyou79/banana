// src/components/bids/BidEmptyState.tsx
// Empty state with icon + message + optional CTA.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export const BidEmptyState: React.FC<Props> = ({
  icon = 'document-text-outline',
  title = 'Nothing here yet',
  message,
  ctaLabel,
  onCta,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = {
    iconWrap: isDark ? '#1E293B' : '#F1F5F9',
    iconBorder: isDark ? '#334155' : '#E2E8F0',
    icon:    isDark ? '#94A3B8' : '#64748B',
    title:   isDark ? '#F1F5F9' : '#0F172A',
    message: isDark ? '#94A3B8' : '#64748B',
    ctaBg:   '#0A2540',
    ctaText: '#FFFFFF',
  };

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: palette.iconWrap, borderColor: palette.iconBorder }]}>
        <Ionicons name={icon} size={36} color={palette.icon} />
      </View>

      <Text style={[styles.title, { color: palette.title }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.message }]}>{message}</Text>

      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: palette.ctaBg, opacity: pressed ? 0.8 : 1 },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.ctaText, { color: palette.ctaText }]}>{ctaLabel}</Text>
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
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
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
