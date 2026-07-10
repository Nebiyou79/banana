// src/components/bids/BidFinancialBreakdownForm.tsx
// UPDATED: Added category picker, VAT %, discount, payment terms, totals display
// Mobile-optimized card layout with category badges, auto-calculated totals
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidFinancialLineItem, BidCurrency } from '../../types/bid';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Category = 'labor' | 'materials' | 'logistics' | 'overhead' | 'tax' | 'other';

const CATEGORIES: { value: Category; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: 'labor', label: 'Labor', icon: 'people-outline', color: '#3B82F6' },
  { value: 'materials', label: 'Materials', icon: 'cube-outline', color: '#10B981' },
  { value: 'logistics', label: 'Logistics', icon: 'car-outline', color: '#F59E0B' },
  { value: 'overhead', label: 'Overhead', icon: 'business-outline', color: '#8B5CF6' },
  { value: 'tax', label: 'Tax', icon: 'receipt-outline', color: '#EF4444' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

// ─── Working draft type ──────────────────────────────────────────────────────

export interface LineItemDraft {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: number;
  category: Category;
}

export function draftToLineItem(row: LineItemDraft): BidFinancialLineItem {
  const qty = parseFloat(row.quantity) || 0;
  const price = parseFloat(row.unitPrice) || 0;
  return {
    description: row.description,
    quantity: qty,
    unit: row.unit,
    unitPrice: price,
    totalPrice: qty * price,
    category: row.category,
  };
}

export function lineItemToDraft(item: BidFinancialLineItem): LineItemDraft {
  return {
    description: item.description ?? '',
    quantity: String(item.quantity ?? ''),
    unit: item.unit ?? '',
    unitPrice: String(item.unitPrice ?? ''),
    totalPrice: item.totalPrice ?? 0,
    category: (item.category as Category) ?? 'other',
  };
}

export function emptyDraft(): LineItemDraft {
  return { description: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0, category: 'other' };
}

function recompute(row: LineItemDraft): LineItemDraft {
  const qty = parseFloat(row.quantity) || 0;
  const price = parseFloat(row.unitPrice) || 0;
  return { ...row, totalPrice: qty * price };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(value: number, currency: BidCurrency = 'ETB'): string {
  return `${currency} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Category picker modal ───────────────────────────────────────────────────

interface CategoryPickerProps {
  value: Category;
  onChange: (cat: Category) => void;
  colors: any;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ value, onChange, colors }) => {
  const [open, setOpen] = useState(false);
  const selected = CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[5];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[catStyles.trigger, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
      >
        <View style={[catStyles.dot, { backgroundColor: selected.color }]} />
        <Text style={[catStyles.triggerText, { color: colors.text }]}>{selected.label}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
      </Pressable>

      {open && (
        <Pressable style={catStyles.overlay} onPress={() => setOpen(false)}>
          <View style={[catStyles.dropdown, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[catStyles.dropdownTitle, { color: colors.text }]}>Category</Text>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => {
                  onChange(cat.value);
                  setOpen(false);
                }}
                style={[
                  catStyles.option,
                  { borderBottomColor: colors.border },
                  cat.value === value && { backgroundColor: colors.primaryBg },
                ]}
              >
                <View style={[catStyles.dot, { backgroundColor: cat.color }]} />
                <Text style={[catStyles.optionText, { color: colors.text }]}>{cat.label}</Text>
                {cat.value === value && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}
    </>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const { colors, spacing, radius } = useTheme();

  // NEW: VAT %, discount, payment terms
  const [vatPercentage, setVatPercentage] = useState('15');
  const [discount, setDiscount] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  const subtotal = items.reduce((s, r) => s + (r.totalPrice || 0), 0);
  const vatPct = parseFloat(vatPercentage) || 0;
  const vatAmount = subtotal * (vatPct / 100);
  const discountAmount = parseFloat(discount) || 0;
  const totalWithVAT = subtotal + vatAmount - discountAmount;

  const updateRow = useCallback(
    (idx: number, patch: Partial<LineItemDraft>) => {
      const next = items.map((r, i) =>
        i === idx ? recompute({ ...r, ...patch }) : r
      );
      onChange(next);
    },
    [items, onChange]
  );

  const addRow = useCallback(() => {
    onChange([...items, emptyDraft()]);
  }, [items, onChange]);

  const removeRow = useCallback(
    (idx: number) => {
      if (items.length <= 1) return;
      onChange(items.filter((_, i) => i !== idx));
    },
    [items, onChange]
  );

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  return (
    <View style={[styles.container, { gap: spacing.lg }]}>
      {/* Header */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.cardHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Financial Breakdown</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {items.length} row{items.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Line items */}
        <ScrollView nestedScrollEnabled style={{ maxHeight: 400 }}>
          {items.map((row, idx) => (
            <View
              key={idx}
              style={[
                styles.itemCard,
                {
                  backgroundColor: idx % 2 === 0 ? colors.bgCard : colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {/* Row header: number + category + delete */}
              <View style={styles.itemHeader}>
                <Text style={[styles.itemNum, { color: colors.textMuted }]}>#{idx + 1}</Text>
                <CategoryPicker value={row.category} onChange={(cat) => updateRow(idx, { category: cat })} colors={colors} />
                <Pressable
                  onPress={() => removeRow(idx)}
                  disabled={items.length <= 1}
                  style={[styles.deleteBtn, { backgroundColor: colors.dangerBg, opacity: items.length <= 1 ? 0.3 : 1 }]}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                </Pressable>
              </View>

              {/* Description */}
              <TextInput
                value={row.description}
                onChangeText={(v) => updateRow(idx, { description: v })}
                placeholder="Item description"
                placeholderTextColor={colors.inputPlaceholder}
                style={[styles.input, inputStyle]}
              />

              {/* Qty + Unit row */}
              <View style={styles.twoCol}>
                <TextInput
                  value={row.quantity}
                  onChangeText={(v) => updateRow(idx, { quantity: v })}
                  placeholder="Qty"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="decimal-pad"
                  style={[styles.input, { flex: 1 }, inputStyle]}
                />
                <TextInput
                  value={row.unit}
                  onChangeText={(v) => updateRow(idx, { unit: v })}
                  placeholder="Unit (e.g., pcs)"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.input, { flex: 2 }, inputStyle]}
                />
              </View>

              {/* Unit price + total */}
              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Unit Price</Text>
                  <TextInput
                    value={row.unitPrice}
                    onChangeText={(v) => updateRow(idx, { unitPrice: v })}
                    placeholder="0.00"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="decimal-pad"
                    style={[styles.input, inputStyle]}
                  />
                </View>
                <View style={styles.equalsSign}>
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>=</Text>
                </View>
                <View style={[styles.totalBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>
                    {fmtCurrency(row.totalPrice, currency)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Add row button */}
        <View style={[styles.addRowWrap, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={addRow}
            style={[styles.addBtn, { backgroundColor: colors.primaryBg }]}
          >
            <Ionicons name="add-circle" size={18} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Line Item</Text>
          </Pressable>
        </View>
      </View>

      {/* NEW: VAT, Discount, Payment Terms Card */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.cardHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Ionicons name="calculator-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tax & Discount</Text>
        </View>

        <View style={styles.cardBody}>
          {/* VAT % */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelWrap}>
              <Ionicons name="receipt-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>VAT Percentage (%)</Text>
            </View>
            <TextInput
              value={vatPercentage}
              onChangeText={setVatPercentage}
              placeholder="15"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="decimal-pad"
              style={[styles.fieldInput, inputStyle]}
            />
          </View>

          {/* Discount */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelWrap}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Discount Amount</Text>
            </View>
            <TextInput
              value={discount}
              onChangeText={setDiscount}
              placeholder="0.00"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="decimal-pad"
              style={[styles.fieldInput, inputStyle]}
            />
          </View>

          {/* Payment Terms */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelWrap}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Payment Terms</Text>
            </View>
            <TextInput
              value={paymentTerms}
              onChangeText={setPaymentTerms}
              placeholder="e.g., Net 30 days"
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.fieldInput, inputStyle]}
            />
          </View>
        </View>
      </View>

      {/* NEW: Totals Summary Card */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.cardHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Ionicons name="wallet-outline" size={16} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Summary</Text>
        </View>

        <View style={styles.cardBody}>
          {/* Subtotal */}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { color: colors.textMuted }]}>Subtotal</Text>
            <Text style={[styles.totalsValue, { color: colors.text }]}>
              {fmtCurrency(subtotal, currency)}
            </Text>
          </View>

          {/* VAT */}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { color: colors.textMuted }]}>
              VAT ({vatPct}%)
            </Text>
            <Text style={[styles.totalsValue, { color: colors.text }]}>
              {fmtCurrency(vatAmount, currency)}
            </Text>
          </View>

          {/* Discount (if any) */}
          {discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: colors.danger }]}>Discount</Text>
              <Text style={[styles.totalsValue, { color: colors.danger }]}>
                −{fmtCurrency(discountAmount, currency)}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={[styles.totalsDivider, { backgroundColor: colors.primary }]} />

          {/* Total with VAT */}
          <View style={styles.totalsRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total with VAT</Text>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              {fmtCurrency(totalWithVAT, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Error */}
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: {
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
  cardBody: {
    padding: 16,
    gap: 14,
  },

  // Item cards
  itemCard: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemNum: {
    fontSize: 12,
    fontWeight: '700',
    width: 28,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 42,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  equalsSign: {
    paddingBottom: 10,
  },
  totalBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },

  // Add row
  addRowWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Tax & Discount fields
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldInput: {
    width: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    textAlign: 'right',
  },

  // Totals
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalsLabel: {
    fontSize: 13,
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalsDivider: {
    height: 2,
    borderRadius: 1,
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
  },
});

// ─── Category Picker Styles ──────────────────────────────────────────────────

const catStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dropdown: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    padding: 14,
    paddingBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
  },
});

export default BidFinancialBreakdownForm;