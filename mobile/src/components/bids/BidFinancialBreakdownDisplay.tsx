// src/components/bids/BidFinancialBreakdownDisplay.tsx
// Read-only table: description / qty / unit / unitPrice / total
// Footer row: grand total.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BidFinancialLineItem, BidCurrency } from '../../types/bid';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(value: number, currency?: BidCurrency): string {
  return `${currency ?? 'ETB'} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Column config ─────────────────────────────────────────────────────────────

const COLS = [
  { key: 'description', label: 'Description', flex: 3, align: 'left'  as const },
  { key: 'quantity',    label: 'Qty',          flex: 1, align: 'right' as const },
  { key: 'unit',        label: 'Unit',         flex: 1, align: 'right' as const },
  { key: 'unitPrice',   label: 'Unit Price',   flex: 2, align: 'right' as const },
  { key: 'totalPrice',  label: 'Total',        flex: 2, align: 'right' as const },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  items: BidFinancialLineItem[];
  currency?: BidCurrency;
}

export const BidFinancialBreakdownDisplay: React.FC<Props> = ({ items, currency }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = {
    card:        isDark ? '#1E293B' : '#FFFFFF',
    headerBg:    isDark ? '#1A2540' : '#F1F5F9',
    footerBg:    isDark ? '#0F172A' : '#F8FAFC',
    border:      isDark ? '#334155' : '#E2E8F0',
    text:        isDark ? '#F1F5F9' : '#0F172A',
    muted:       isDark ? '#94A3B8' : '#64748B',
    accent:      '#F1BB03',
    totalText:   isDark ? '#F1BB03' : '#0A2540',
    stripBg:     isDark ? '#162032' : '#F8FAFC',
  };

  const grandTotal = items.reduce((sum, row) => sum + (row.totalPrice ?? 0), 0);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <Ionicons name="document-text-outline" size={32} color={palette.muted} />
        <Text style={[styles.emptyText, { color: palette.muted }]}>No line items</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
      {/* Section header */}
      <View style={[styles.sectionHeader, { borderBottomColor: palette.border, backgroundColor: palette.headerBg }]}>
        <Ionicons name="receipt-outline" size={15} color={palette.muted} />
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Financial Breakdown</Text>
        <Text style={[styles.itemCount, { color: palette.muted }]}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Scrollable table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 560 }}>
          {/* Table header */}
          <View style={[styles.tableHeader, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
            {COLS.map((col) => (
              <Text
                key={col.key}
                style={[
                  styles.th,
                  { flex: col.flex, color: palette.muted, textAlign: col.align },
                ]}
              >
                {col.label}
              </Text>
            ))}
          </View>

          {/* Table rows */}
          {items.map((row, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                { borderBottomColor: palette.border },
                idx % 2 !== 0 && { backgroundColor: palette.stripBg },
              ]}
            >
              <Text style={[styles.td, { flex: 3, color: palette.text, textAlign: 'left' }]} numberOfLines={2}>
                {row.description || '—'}
              </Text>
              <Text style={[styles.td, { flex: 1, color: palette.text, textAlign: 'right' }]}>
                {row.quantity ?? '—'}
              </Text>
              <Text style={[styles.td, { flex: 1, color: palette.muted, textAlign: 'right' }]} numberOfLines={1}>
                {row.unit || '—'}
              </Text>
              <Text style={[styles.td, { flex: 2, color: palette.text, textAlign: 'right' }]}>
                {row.unitPrice != null
                  ? row.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '—'}
              </Text>
              <Text style={[styles.td, { flex: 2, color: palette.text, textAlign: 'right', fontWeight: '600' }]}>
                {row.totalPrice != null
                  ? row.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '—'}
              </Text>
            </View>
          ))}

          {/* Grand total footer */}
          <View style={[styles.footer, { backgroundColor: palette.footerBg, borderTopColor: palette.accent }]}>
            <Text style={[styles.footerLabel, { flex: 3 + 1 + 1 + 2, color: palette.muted }]}>
              Grand Total
            </Text>
            <Text style={[styles.footerTotal, { flex: 2, color: palette.totalText }]}>
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
    borderRadius: 14,
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
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13 },
});

export default BidFinancialBreakdownDisplay;
