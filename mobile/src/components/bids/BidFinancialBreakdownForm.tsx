// src/components/bids/BidFinancialBreakdownForm.tsx
// Dynamic line-item table editor.
// Columns: description, quantity, unit, unitPrice, totalPrice (auto = qty × unitPrice).
// Grand total auto-summed. At least 1 row required.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BidFinancialLineItem, BidCurrency } from '../../types/bid';

// ── Types ─────────────────────────────────────────────────────────────────────

// Working row — all fields as strings for TextInput compatibility
export interface LineItemDraft {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: number;       // computed, not editable
}

function draftToLineItem(row: LineItemDraft): BidFinancialLineItem {
  const qty  = parseFloat(row.quantity)  || 0;
  const price = parseFloat(row.unitPrice) || 0;
  return {
    description: row.description,
    quantity:    qty,
    unit:        row.unit,
    unitPrice:   price,
    totalPrice:  qty * price,
  };
}

function lineItemToDraft(item: BidFinancialLineItem): LineItemDraft {
  return {
    description: item.description ?? '',
    quantity:    String(item.quantity ?? ''),
    unit:        item.unit ?? '',
    unitPrice:   String(item.unitPrice ?? ''),
    totalPrice:  item.totalPrice ?? 0,
  };
}

function emptyDraft(): LineItemDraft {
  return { description: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0 };
}

function recompute(row: LineItemDraft): LineItemDraft {
  const qty   = parseFloat(row.quantity)  || 0;
  const price = parseFloat(row.unitPrice) || 0;
  return { ...row, totalPrice: qty * price };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  items: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
  currency?: BidCurrency;
  error?: string;
}

export const BidFinancialBreakdownForm: React.FC<Props> = ({
  items,
  onChange,
  currency = 'ETB',
  error,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = {
    card:          isDark ? '#1E293B' : '#FFFFFF',
    headerBg:      isDark ? '#1A2540' : '#F1F5F9',
    rowBg:         isDark ? '#1E293B' : '#FFFFFF',
    rowAlt:        isDark ? '#162032' : '#F8FAFC',
    border:        isDark ? '#334155' : '#E2E8F0',
    inputBg:       isDark ? '#0F172A' : '#FFFFFF',
    inputBorder:   isDark ? '#475569' : '#CBD5E1',
    text:          isDark ? '#F1F5F9' : '#0F172A',
    muted:         isDark ? '#94A3B8' : '#64748B',
    placeholder:   isDark ? '#475569' : '#94A3B8',
    required:      '#EF4444',
    accent:        '#F1BB03',
    accentDark:    '#0A2540',
    totalBg:       isDark ? '#0F172A' : '#F8FAFC',
    totalText:     isDark ? '#F1BB03' : '#0A2540',
    deleteBg:      isDark ? '#450A0A' : '#FEE2E2',
    deleteText:    '#EF4444',
    addBtnBg:      '#F1BB03',
    addBtnText:    '#0A2540',
  };

  const grandTotal = items.reduce((s, r) => s + (r.totalPrice || 0), 0);

  const updateRow = useCallback(
    (idx: number, patch: Partial<LineItemDraft>) => {
      const next = items.map((r, i) =>
        i === idx ? recompute({ ...r, ...patch }) : r,
      );
      onChange(next);
    },
    [items, onChange],
  );

  const addRow = useCallback(() => {
    onChange([...items, emptyDraft()]);
  }, [items, onChange]);

  const removeRow = useCallback(
    (idx: number) => {
      if (items.length <= 1) return; // keep at least 1 row
      onChange(items.filter((_, i) => i !== idx));
    },
    [items, onChange],
  );

  // ── Mini cell input ──────────────────────────────────────────────────────
  const CellInput = ({
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    flex = 1,
  }: {
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'decimal-pad';
    flex?: number;
  }) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={palette.placeholder}
      keyboardType={keyboardType}
      style={[
        cellStyles.input,
        {
          flex,
          backgroundColor: palette.inputBg,
          borderColor: palette.inputBorder,
          color: palette.text,
        },
      ]}
    />
  );

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {/* Section header */}
      <View style={[styles.header, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
        <Ionicons name="receipt-outline" size={16} color={palette.accentDark} />
        <Text style={[styles.title, { color: palette.text }]}>Financial Breakdown</Text>
        <View style={[styles.countBadge, { backgroundColor: palette.accent + '33' }]}>
          <Text style={[styles.countText, { color: palette.accentDark }]}>{items.length} row{items.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Column labels */}
      <View style={[styles.colHeader, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
        <Text style={[styles.colLabel, { flex: 3, color: palette.muted }]}>Description</Text>
        <Text style={[styles.colLabel, { flex: 1, color: palette.muted, textAlign: 'center' }]}>Qty</Text>
        <Text style={[styles.colLabel, { flex: 1, color: palette.muted, textAlign: 'center' }]}>Unit</Text>
        <Text style={[styles.colLabel, { flex: 2, color: palette.muted, textAlign: 'right' }]}>Unit Price</Text>
        <Text style={[styles.colLabel, { flex: 2, color: palette.muted, textAlign: 'right' }]}>Total</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Rows */}
      <ScrollView nestedScrollEnabled horizontal={false}>
        {items.map((row, idx) => (
          <View
            key={idx}
            style={[
              styles.row,
              {
                backgroundColor: idx % 2 === 0 ? palette.rowBg : palette.rowAlt,
                borderBottomColor: palette.border,
              },
            ]}
          >
            {/* Row number */}
            <Text style={[styles.rowNum, { color: palette.muted }]}>{idx + 1}</Text>

            <View style={styles.rowFields}>
              {/* Description — full width */}
              <CellInput
                value={row.description}
                onChangeText={(v) => updateRow(idx, { description: v })}
                placeholder="Item description"
                flex={1}
              />

              {/* Qty + Unit row */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <CellInput
                  value={row.quantity}
                  onChangeText={(v) => updateRow(idx, { quantity: v })}
                  placeholder="Qty"
                  keyboardType="decimal-pad"
                  flex={1}
                />
                <CellInput
                  value={row.unit}
                  onChangeText={(v) => updateRow(idx, { unit: v })}
                  placeholder="Unit"
                  flex={1}
                />
              </View>

              {/* Unit price */}
              <CellInput
                value={row.unitPrice}
                onChangeText={(v) => updateRow(idx, { unitPrice: v })}
                placeholder="0.00"
                keyboardType="decimal-pad"
                flex={1}
              />

              {/* Auto-calculated total */}
              <View style={[styles.totalCell, { backgroundColor: palette.totalBg, borderColor: palette.border }]}>
                <Text style={[styles.totalValue, { color: palette.totalText }]}>
                  {fmtNum(row.totalPrice)}
                </Text>
              </View>
            </View>

            {/* Remove button */}
            <Pressable
              onPress={() => removeRow(idx)}
              disabled={items.length <= 1}
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: items.length <= 1 ? 'transparent' : palette.deleteBg,
                  opacity: items.length <= 1 ? 0.3 : 1,
                },
              ]}
              accessibilityLabel={`Remove row ${idx + 1}`}
            >
              <Ionicons name="trash-outline" size={14} color={palette.deleteText} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Grand total footer */}
      <View style={[styles.footer, { backgroundColor: palette.totalBg, borderTopColor: palette.accent }]}>
        <Text style={[styles.footerLabel, { color: palette.muted }]}>Grand Total</Text>
        <Text style={[styles.footerTotal, { color: palette.totalText }]}>
          {currency} {fmtNum(grandTotal)}
        </Text>
      </View>

      {/* Add row button */}
      <View style={[styles.addRow, { borderTopColor: palette.border }]}>
        <Pressable
          onPress={addRow}
          style={[styles.addBtn, { backgroundColor: palette.addBtnBg }]}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={16} color={palette.addBtnText} />
          <Text style={[styles.addBtnText, { color: palette.addBtnText }]}>Add Line Item</Text>
        </Pressable>
        {!!error && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={12} color={palette.required} />
            <Text style={[styles.errorText, { color: palette.required }]}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Export helper so parent can convert before submit ─────────────────────────
export { draftToLineItem, lineItemToDraft, emptyDraft };

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  rowNum: {
    width: 18,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 11,
  },
  rowFields: {
    flex: 1,
    gap: 6,
  },
  totalCell: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 2,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  footerTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  addRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 42,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: { fontSize: 11 },
});

const cellStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 36,
  },
});

export default BidFinancialBreakdownForm;
