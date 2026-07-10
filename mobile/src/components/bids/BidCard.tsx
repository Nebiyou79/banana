// src/components/bids/BidCard.tsx
// List item for MyBidsScreen.
// Shows: tender title + bidNumber, bid amount (hidden if sealed+unrevealed),
//        BidStatusBadge, BidSealedIndicator, submitted date.
// UPDATED: Migrated to useTheme hook, uses theme colors
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidListItem } from '../../types/bid';
import { BidStatusBadge } from './BidStatusBadge';
import { BidSealedIndicator } from './BidSealedIndicator';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getTenderTitle(bid: BidListItem): string {
  if (typeof bid.tender === 'object' && bid.tender !== null) {
    return bid.tender.title ?? 'Untitled Tender';
  }
  return 'Untitled Tender';
}

function getTenderRef(bid: BidListItem): string | undefined {
  if (typeof bid.tender === 'object' && bid.tender !== null) {
    return bid.tender.referenceNumber;
  }
  return undefined;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  bid: BidListItem;
  /** isBidsRevealed controls whether bid amount is visible for sealed bids */
  isBidsRevealed?: boolean;
  onPress: () => void;
}

export const BidCard: React.FC<Props> = ({ bid, isBidsRevealed = false, onPress }) => {
  const { colors, radius, spacing } = useTheme();

  const tenderTitle = getTenderTitle(bid);
  const refNum = getTenderRef(bid);
  const amountHidden = bid.sealed && !isBidsRevealed;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Bid on ${tenderTitle}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Accent top strip */}
      <View style={[styles.strip, { backgroundColor: colors.primary }]} />

      <View style={[styles.body, { gap: spacing.sm }]}>
        {/* ── Row 1: Status badge + Sealed indicator ── */}
        <View style={styles.topRow}>
          <BidStatusBadge status={bid.status} size="sm" />
          <BidSealedIndicator
            sealed={bid.sealed}
            isBidsRevealed={isBidsRevealed}
            size="sm"
          />
        </View>

        {/* ── Row 2: Tender title ── */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {tenderTitle}
        </Text>

        {/* Ref + bid number row */}
        <View style={styles.refRow}>
          {refNum ? (
            <Text style={[styles.refNum, { color: colors.textMuted }]} numberOfLines={1}>
              Ref: {refNum}
            </Text>
          ) : null}
          <Text style={[styles.bidNum, { color: colors.textMuted }]} numberOfLines={1}>
            {bid.bidNumber}
          </Text>
        </View>

        {/* ── Divider ── */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ── Row 3: Amount + Date ── */}
        <View style={styles.footerRow}>
          {/* Bid amount */}
          <View style={[
            styles.amountWrap,
            {
              backgroundColor: amountHidden ? colors.warningBg : colors.surface,
              borderColor: amountHidden ? colors.warning : colors.border,
              borderRadius: radius.sm,
            },
          ]}>
            {amountHidden ? (
              <>
                <Ionicons name="lock-closed" size={12} color={colors.warning} />
                <Text style={[styles.amountHidden, { color: colors.warning }]}>Hidden until reveal</Text>
              </>
            ) : (
              <Text style={[styles.amount, { color: colors.primary }]} numberOfLines={1}>
                {formatCurrency(bid.bidAmount, bid.currency)}
              </Text>
            )}
          </View>

          {/* Submitted date */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatDate(bid.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.chevronWrap}>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  strip: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: 13,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  refNum: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  bidNum: {
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
  },
  amountHidden: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
  },
  chevronWrap: {
    paddingRight: 10,
    alignSelf: 'center',
  },
});

export default BidCard;