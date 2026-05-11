// src/components/bids/BidSealedIndicator.tsx
// Lock pill shown when bid.sealed=true AND tender has NOT yet been revealed.
// Disappears once isBidsRevealed=true.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  // Only show when sealed and not yet revealed
  if (!sealed || isBidsRevealed) return null;

  const isSm = size === 'sm';

  return (
    <View style={[styles.pill, isSm && styles.pillSm]}>
      <Ionicons
        name="lock-closed"
        size={isSm ? 10 : 12}
        color="#92400E"
      />
      {!isSm && (
        <Text style={styles.label} numberOfLines={1}>
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignSelf: 'flex-start',
  },
  pillSm: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.2,
  },
});

export default BidSealedIndicator;
