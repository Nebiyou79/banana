// src/components/proposals/ProposalBudgetDisplay.tsx
// Banana Mobile App — Module 6B: Proposals
// Displays proposal bid amount, type, delivery time, and availability.

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import type { Proposal, ProposalListItem } from '../../types/proposal';

interface ProposalBudgetDisplayProps {
  proposal: Proposal | ProposalListItem;
  layout?: 'row' | 'card' | 'compact';
  style?: ViewStyle;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ETB: 'ETB',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  flexible: 'Flexible',
};

function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  if (amount >= 1_000_000) {
    return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol} ${(amount / 1_000).toFixed(0)}K`;
  }
  return `${symbol} ${amount.toLocaleString()}`;
}

export const ProposalBudgetDisplay: React.FC<ProposalBudgetDisplayProps> = ({
  proposal,
  layout = 'row',
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;

  const bidLabel =
    proposal.bidType === 'hourly'
      ? `${formatAmount(proposal.hourlyRate ?? proposal.proposedAmount, proposal.currency)}/hr`
      : formatAmount(proposal.proposedAmount, proposal.currency);

  const bidTypeLabel = proposal.bidType === 'hourly' ? 'Hourly Rate' : 'Fixed Price';

  const deliveryLabel = proposal.deliveryTime
    ? `${proposal.deliveryTime.value} ${proposal.deliveryTime.unit}`
    : null;

  const availLabel = AVAILABILITY_LABELS[proposal.availability] ?? proposal.availability;

  if (layout === 'compact') {
    return (
      <View style={[styles.row, style]}>
        <Text style={[styles.amountCompact, { color: '#F1BB03' }]}>{bidLabel}</Text>
        {deliveryLabel && (
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {' · '}
            {deliveryLabel}
          </Text>
        )}
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          {' · '}
          {availLabel}
        </Text>
      </View>
    );
  }

  if (layout === 'card') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          style,
        ]}
      >
        <View style={styles.cardItem}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Bid</Text>
          <Text style={[styles.cardValue, { color: '#F1BB03' }]}>{bidLabel}</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>{bidTypeLabel}</Text>
        </View>
        {deliveryLabel && (
          <View style={[styles.cardItem, styles.cardItemBordered, { borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Delivery</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{deliveryLabel}</Text>
          </View>
        )}
        <View style={[styles.cardItem, styles.cardItemBordered, { borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Availability</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{availLabel}</Text>
        </View>
      </View>
    );
  }

  // layout === 'row'
  return (
    <View style={[styles.rowLayout, style]}>
      <View style={styles.mainBid}>
        <Text style={[styles.amountLarge, { color: '#F1BB03' }]}>{bidLabel}</Text>
        <Text style={[styles.bidType, { color: colors.textMuted }]}>{bidTypeLabel}</Text>
      </View>
      <View style={styles.metaPills}>
        {deliveryLabel && (
          <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.pillText, { color: colors.textSecondary }]}>⏱ {deliveryLabel}</Text>
          </View>
        )}
        <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.pillText, { color: colors.textSecondary }]}>📅 {availLabel}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowLayout: {
    gap: 8,
  },
  mainBid: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountLarge: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  amountCompact: {
    fontSize: 15,
    fontWeight: '700',
  },
  bidType: {
    fontSize: 12,
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaText: {
    fontSize: 13,
  },
  // Card layout
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardItem: {
    flex: 1,
    padding: 12,
    gap: 2,
  },
  cardItemBordered: {
    borderLeftWidth: 1,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 10,
  },
});

export default ProposalBudgetDisplay;
