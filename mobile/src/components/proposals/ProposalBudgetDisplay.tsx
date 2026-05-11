// src/components/proposals/ProposalBudgetDisplay.tsx
// Banana Mobile App — Module 6B: Proposals
// Displays proposal bid amount, type, delivery time, and availability.
// REFACTORED: All colors via useTheme() + withAlpha(). No hardcoded hex.

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { Proposal, ProposalListItem } from '../../types/proposal';

interface ProposalBudgetDisplayProps {
  proposal: Proposal | ProposalListItem;
  layout?: 'row' | 'card' | 'compact';
  style?: ViewStyle;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ETB: 'ETB', USD: '$', EUR: '€', GBP: '£',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  flexible:    'Flexible',
};

function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  if (amount >= 1_000_000) return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `${symbol} ${(amount / 1_000).toFixed(0)}K`;
  return `${symbol} ${amount.toLocaleString()}`;
}

const ProposalBudgetDisplay: React.FC<ProposalBudgetDisplayProps> = memo(({
  proposal, layout = 'row', style,
}) => {
  const { colors: c, radius, spacing, type } = useTheme();

  const styles = useMemo(() => makeStyles(c, radius, spacing), [c, radius, spacing]);

  const bidLabel = proposal.bidType === 'hourly'
    ? `${formatAmount(proposal.hourlyRate ?? proposal.proposedAmount, proposal.currency)}/hr`
    : formatAmount(proposal.proposedAmount, proposal.currency);

  const bidTypeLabel   = proposal.bidType === 'hourly' ? 'Hourly Rate' : 'Fixed Price';
  const deliveryLabel  = proposal.deliveryTime
    ? `${proposal.deliveryTime.value} ${proposal.deliveryTime.unit}`
    : null;
  const availLabel     = AVAILABILITY_LABELS[proposal.availability] ?? proposal.availability;

  if (layout === 'compact') {
    return (
      <View style={[styles.row, style]}>
        <Text style={[type.body, { color: c.primary, fontWeight: '700' }]}>{bidLabel}</Text>
        {deliveryLabel && (
          <Text style={[type.bodySm, { color: c.textMuted }]}>{' · '}{deliveryLabel}</Text>
        )}
        <Text style={[type.bodySm, { color: c.textMuted }]}>{' · '}{availLabel}</Text>
      </View>
    );
  }

  if (layout === 'card') {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.cardItem}>
          <Text style={[type.caption, styles.cardLabel, { color: c.textMuted }]}>Bid</Text>
          <Text style={[type.bodySm, { color: c.primary, fontWeight: '700' }]}>{bidLabel}</Text>
          <Text style={[type.caption, { color: c.textMuted }]}>{bidTypeLabel}</Text>
        </View>
        {deliveryLabel && (
          <View style={[styles.cardItem, styles.cardItemBordered, { borderColor: c.border }]}>
            <Text style={[type.caption, styles.cardLabel, { color: c.textMuted }]}>Delivery</Text>
            <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>{deliveryLabel}</Text>
          </View>
        )}
        <View style={[styles.cardItem, styles.cardItemBordered, { borderColor: c.border }]}>
          <Text style={[type.caption, styles.cardLabel, { color: c.textMuted }]}>Availability</Text>
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>{availLabel}</Text>
        </View>
      </View>
    );
  }

  // layout === 'row'
  return (
    <View style={[styles.rowLayout, style]}>
      <View style={styles.mainBid}>
        <Text style={[styles.amountLarge, { color: c.primary }]}>{bidLabel}</Text>
        <Text style={[type.caption, { color: c.textMuted }]}>{bidTypeLabel}</Text>
      </View>
      <View style={styles.metaPills}>
        {deliveryLabel && (
          <View style={[styles.pill, { backgroundColor: withAlpha(c.text, 0.06), borderColor: c.border }]}>
            <Ionicons name="time-outline" size={11} color={c.textMuted} />
            <Text style={[type.caption, { color: c.textSecondary, fontWeight: '500', marginLeft: 4 }]}>
              {deliveryLabel}
            </Text>
          </View>
        )}
        <View style={[styles.pill, { backgroundColor: withAlpha(c.text, 0.06), borderColor: c.border }]}>
          <Ionicons name="calendar-outline" size={11} color={c.textMuted} />
          <Text style={[type.caption, { color: c.textSecondary, fontWeight: '500', marginLeft: 4 }]}>
            {availLabel}
          </Text>
        </View>
      </View>
    </View>
  );
});

ProposalBudgetDisplay.displayName = 'ProposalBudgetDisplay';

const makeStyles = (c: any, radius: any, spacing: any) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    rowLayout: { gap: spacing.sm },
    mainBid: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    amountLarge: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
    metaPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: radius.full, borderWidth: 1,
    },
    card: {
      flexDirection: 'row',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface ?? c.bgCard,
      overflow: 'hidden',
    },
    cardItem: { flex: 1, padding: spacing.md, gap: 2 },
    cardItemBordered: { borderLeftWidth: StyleSheet.hairlineWidth },
    cardLabel: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
  });

export { ProposalBudgetDisplay };
export default ProposalBudgetDisplay;