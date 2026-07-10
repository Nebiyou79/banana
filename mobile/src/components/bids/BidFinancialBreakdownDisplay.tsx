// src/components/bids/BidFinancialBreakdownDisplay.tsx
// Read-only table: description / qty / unit / unitPrice / total
// Footer row: grand total.
// UPDATED: Migrated to useTheme hook
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidFinancialLineItem, BidCurrency } from '../../types/bid';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(value: number, currency?: BidCurrency): string {
  return `${currency ?? 'ETB'} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  items: BidFinancialLineItem[];
  currency?: BidCurrency;
}

export const BidFinancialBreakdownDisplay: React.FC<Props> = ({ items, currency }) => {
  const { colors, radius } = useTheme();

  const grandTotal = items.reduce((sum, row) => sum + (row.totalPrice ?? 0), 0);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.bgCard, borderRadius: radius.lg }]}>
        <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No line items</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bgCard, borderRadius: radius.lg }]}>
      {/* Section header */}
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Ionicons name="receipt-outline" size={15} color={colors.textMuted} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Breakdown</Text>
        <Text style={[styles.itemCount, { color: colors.textMuted }]}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Scrollable table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 560 }}>
          {/* Table header */}
          <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.th, { flex: 3, color: colors.textMuted }]}>Description</Text>
            <Text style={[styles.th, { flex: 1, color: colors.textMuted }]}>Qty</Text>
            <Text style={[styles.th, { flex: 1, color: colors.textMuted }]}>Unit</Text>
            <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Unit Price</Text>
            <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Total</Text>
          </View>

          {/* Table rows */}
          {items.map((row, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                { borderBottomColor: colors.border },
                idx % 2 !== 0 && { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.td, { flex: 3, color: colors.text }]} numberOfLines={2}>
                {row.description || '—'}
              </Text>
              <Text style={[styles.td, { flex: 1, color: colors.text }]}>
                {row.quantity ?? '—'}
              </Text>
              <Text style={[styles.td, { flex: 1, color: colors.textMuted }]} numberOfLines={1}>
                {row.unit || '—'}
              </Text>
              <Text style={[styles.td, { flex: 2, color: colors.text }]}>
                {row.unitPrice != null
                  ? row.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
                  : '—'}
              </Text>
              <Text style={[styles.td, { flex: 2, color: colors.text, fontWeight: '600' }]}>
                {row.totalPrice != null
                  ? row.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
                  : '—'}
              </Text>
            </View>
          ))}

          {/* Grand total footer */}
          <View style={[styles.footer, { backgroundColor: colors.inputBg, borderTopColor: colors.primary }]}>
            <Text style={[styles.footerLabel, { flex: 8, color: colors.textMuted }]}>
              Grand Total
            </Text>
            <Text style={[styles.footerTotal, { flex: 2, color: colors.primary }]}>
              {fmtCurrency(grandTotal, currency)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  itemCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  td: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderTopWidth: 2,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    textAlign: 'right',
  },
  footerTotal: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    padding: 32,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13 },
});

export default BidFinancialBreakdownDisplay;