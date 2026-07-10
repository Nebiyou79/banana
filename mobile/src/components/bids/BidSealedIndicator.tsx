// src/components/bids/BidSealedIndicator.tsx
// Lock pill shown when bid.sealed=true AND tender has NOT yet been revealed.
// Disappears once isBidsRevealed=true.
// UPDATED: Uses useTheme for icon colors, improved accessibility
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  sealed: boolean;
  isBidsRevealed: boolean;
  /** 'sm' = icon-only pill  |  'md' = icon + label (default) */
  size?: 'sm' | 'md';
}

export const BidSealedIndicator: React.FC<Props> = ({
  sealed,
  isBidsRevealed,
  size = 'md',
}) => {
  const { colors } = useTheme();

  // Only show when sealed and not yet revealed
  if (!sealed || isBidsRevealed) return null;

  const isSm = size === 'sm';
  const isDark = colors.bg === '#0C1A16' || colors.bg === '#0F172A';

  return (
    <View
      style={[
        styles.pill,
        isSm && styles.pillSm,
        {
          backgroundColor: isDark ? '#422006' : '#FEF3C7',
          borderColor: isDark ? '#78350F' : '#F59E0B',
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel="Sealed bid"
    >
      <Ionicons
        name="lock-closed"
        size={isSm ? 10 : 12}
        color={isDark ? '#FDE68A' : '#92400E'}
      />
      {!isSm && (
        <Text
          style={[
            styles.label,
            { color: isDark ? '#FDE68A' : '#92400E' },
          ]}
          numberOfLines={1}
        >
          Sealed
        </Text>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillSm: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default BidSealedIndicator;