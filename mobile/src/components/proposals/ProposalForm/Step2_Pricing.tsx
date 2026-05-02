// src/components/proposals/ProposalForm/Step2_Pricing.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 2: Bid amount, bid type, currency, delivery time, availability, start date.

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import type {
  BidType,
  ProposalCurrency,
  ProposalAvailability,
  ProposalDurationUnit,
  ProposalDeliveryTime,
} from '../../../types/proposal';

interface Step2Props {
  bidType: BidType;
  proposedAmount: string;
  currency: ProposalCurrency;
  hourlyRate?: string;
  estimatedWeeklyHours?: string;
  deliveryValue: string;
  deliveryUnit: ProposalDurationUnit;
  availability: ProposalAvailability;
  proposedStartDate?: string;
  tenderBudget?: { min: number; max: number; currency: string } | null;
  tenderEngagementType?: string;
  onBidTypeChange: (v: BidType) => void;
  onAmountChange: (v: string) => void;
  onCurrencyChange: (v: ProposalCurrency) => void;
  onHourlyRateChange?: (v: string) => void;
  onWeeklyHoursChange?: (v: string) => void;
  onDeliveryValueChange: (v: string) => void;
  onDeliveryUnitChange: (v: ProposalDurationUnit) => void;
  onAvailabilityChange: (v: ProposalAvailability) => void;
  onStartDateChange?: (v: string) => void;
  style?: ViewStyle;
}

const CURRENCIES: ProposalCurrency[] = ['ETB', 'USD', 'EUR', 'GBP'];
const DURATION_UNITS: ProposalDurationUnit[] = ['hours', 'days', 'weeks', 'months'];
const AVAILABILITIES: { value: ProposalAvailability; label: string; icon: string; desc: string }[] = [
  { value: 'full-time', label: 'Full-time', icon: '⚡', desc: '40 hrs/week' },
  { value: 'part-time', label: 'Part-time', icon: '⏰', desc: '~20 hrs/week' },
  { value: 'flexible', label: 'Flexible', icon: '🌿', desc: 'Hours vary' },
];

export const Step2_Pricing: React.FC<Step2Props> = ({
  bidType,
  proposedAmount,
  currency,
  hourlyRate = '',
  estimatedWeeklyHours = '',
  deliveryValue,
  deliveryUnit,
  availability,
  proposedStartDate = '',
  tenderBudget,
  tenderEngagementType,
  onBidTypeChange,
  onAmountChange,
  onCurrencyChange,
  onHourlyRateChange,
  onWeeklyHoursChange,
  onDeliveryValueChange,
  onDeliveryUnitChange,
  onAvailabilityChange,
  onStartDateChange,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;

  const canBeHourly = tenderEngagementType === 'hourly' || !tenderEngagementType;

  const amount = parseFloat(proposedAmount) || 0;
  const isOutsideBudget = tenderBudget && amount > 0
    ? amount < tenderBudget.min || amount > tenderBudget.max
    : false;

  const inputStyle = [
    styles.textInput,
    { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border },
  ];

  const labelStyle = [styles.fieldLabel, { color: colors.textMuted }];

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>2</Text>
        </View>
        <View>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Bid & Timeline</Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            Set your rate, delivery time, and availability
          </Text>
        </View>
      </View>

      {/* Bid type selector — only show if hourly is allowed */}
      {canBeHourly && (
        <View style={styles.section}>
          <Text style={labelStyle}>Bid Type</Text>
          <View style={styles.bidTypeRow}>
            {([
              { id: 'fixed' as BidType, title: 'Fixed Price', icon: '💼', desc: 'Pay once for the full project' },
              { id: 'hourly' as BidType, title: 'Hourly Rate', icon: '⏱', desc: 'Pay per hour tracked' },
            ]).map(({ id, title, icon, desc }) => {
              const active = bidType === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => onBidTypeChange(id)}
                  activeOpacity={0.75}
                  style={[
                    styles.bidTypeCard,
                    {
                      backgroundColor: active ? 'rgba(241,187,3,0.10)' : colors.surface,
                      borderColor: active ? '#F1BB03' : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.bidTypeIcon}>{icon}</Text>
                  <Text style={[styles.bidTypeTitle, { color: active ? '#D97706' : colors.text }]}>
                    {title}
                  </Text>
                  <Text style={[styles.bidTypeDesc, { color: colors.textMuted }]}>{desc}</Text>
                  {active && (
                    <View style={styles.selectedDot}>
                      <View style={styles.selectedDotInner} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Amount + currency */}
      <View style={styles.section}>
        <Text style={labelStyle}>
          {bidType === 'hourly' ? 'Hourly Rate' : 'Total Amount'}{' '}
          <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <View style={styles.amountRow}>
          <TextInput
            value={proposedAmount}
            onChangeText={onAmountChange}
            keyboardType="numeric"
            placeholder="e.g. 9500"
            placeholderTextColor={colors.placeholder}
            style={[inputStyle, styles.amountInput]}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => onCurrencyChange(c)}
                  style={[
                    styles.currencyBtn,
                    {
                      backgroundColor: currency === c ? '#F1BB03' : colors.surface,
                      borderColor: currency === c ? '#F1BB03' : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      { color: currency === c ? '#0A2540' : colors.textMuted },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Hourly extras */}
      {bidType === 'hourly' && (
        <View style={styles.twoCol}>
          <View style={[styles.section, styles.flex1]}>
            <Text style={labelStyle}>Weekly Hours</Text>
            <TextInput
              value={estimatedWeeklyHours}
              onChangeText={onWeeklyHoursChange}
              keyboardType="numeric"
              placeholder="e.g. 40"
              placeholderTextColor={colors.placeholder}
              style={inputStyle}
            />
          </View>
          <View style={[styles.section, styles.flex1]}>
            <Text style={labelStyle}>Effective Rate</Text>
            <View style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.readonlyText, { color: colors.textMuted }]}>
                {(parseFloat(hourlyRate || proposedAmount) || 0).toLocaleString()} {currency}/hr
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Budget hint */}
      {tenderBudget && (tenderBudget.min > 0 || tenderBudget.max > 0) && (
        <View
          style={[
            styles.budgetHint,
            {
              backgroundColor: isOutsideBudget
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(16,185,129,0.06)',
              borderColor: isOutsideBudget ? '#F59E0B' : '#10B981',
            },
          ]}
        >
          <Text style={[styles.budgetHintText, { color: isOutsideBudget ? '#D97706' : '#059669' }]}>
            {isOutsideBudget ? '⚠ ' : '✓ '}Client budget:{' '}
            {tenderBudget.currency} {tenderBudget.min.toLocaleString()}–{tenderBudget.max.toLocaleString()}
            {isOutsideBudget ? ' · Your bid is outside this range' : ''}
          </Text>
        </View>
      )}

      {/* Delivery time */}
      <View style={styles.section}>
        <Text style={labelStyle}>
          Estimated Delivery <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <View style={styles.deliveryRow}>
          <TextInput
            value={deliveryValue}
            onChangeText={onDeliveryValueChange}
            keyboardType="numeric"
            placeholder="e.g. 2"
            placeholderTextColor={colors.placeholder}
            style={[inputStyle, styles.deliveryInput]}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
            <View style={styles.unitRow}>
              {DURATION_UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => onDeliveryUnitChange(u)}
                  style={[
                    styles.unitBtn,
                    {
                      backgroundColor: deliveryUnit === u ? '#0A2540' : colors.surface,
                      borderColor: deliveryUnit === u ? '#0A2540' : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: deliveryUnit === u ? '#fff' : colors.textMuted },
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Availability */}
      <View style={styles.section}>
        <Text style={labelStyle}>
          Availability <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <View style={styles.availRow}>
          {AVAILABILITIES.map(({ value, label, icon, desc }) => {
            const active = availability === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => onAvailabilityChange(value)}
                activeOpacity={0.75}
                style={[
                  styles.availCard,
                  {
                    backgroundColor: active ? 'rgba(241,187,3,0.10)' : colors.surface,
                    borderColor: active ? '#F1BB03' : colors.border,
                  },
                ]}
              >
                <Text style={styles.availIcon}>{icon}</Text>
                <Text style={[styles.availLabel, { color: active ? '#D97706' : colors.text }]}>
                  {label}
                </Text>
                <Text style={[styles.availDesc, { color: colors.textMuted }]}>{desc}</Text>
                {active && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Proposed start date */}
      <View style={styles.section}>
        <Text style={labelStyle}>Proposed Start Date <Text style={{ color: colors.textMuted }}>(optional)</Text></Text>
        <TextInput
          value={proposedStartDate}
          onChangeText={onStartDateChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.placeholder}
          style={inputStyle}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      {/* Summary */}
      {amount > 0 && deliveryValue && availability && (
        <View
          style={[
            styles.summaryBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total</Text>
            <Text style={[styles.summaryValue, { color: '#F1BB03' }]}>
              {currency} {amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {deliveryValue} {deliveryUnit}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Availability</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {AVAILABILITIES.find((a) => a.value === availability)?.label ?? availability}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 20 },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1BB03',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  stepNumberText: { color: '#0A2540', fontSize: 13, fontWeight: '800' },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontSize: 12, marginTop: 2 },
  section: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  textInput: {
    height: 46, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    fontSize: 15, fontWeight: '500',
  },
  readonlyText: { fontSize: 14, lineHeight: 44 },
  flex1: { flex: 1 },
  twoCol: { flexDirection: 'row', gap: 12 },
  amountRow: { gap: 8 },
  amountInput: { fontSize: 18, fontWeight: '700' },
  currencyScroll: { maxHeight: 40 },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
  },
  currencyText: { fontSize: 12, fontWeight: '700' },
  budgetHint: { borderWidth: 1, borderRadius: 10, padding: 12 },
  budgetHintText: { fontSize: 13, fontWeight: '500' },
  deliveryRow: { gap: 8 },
  deliveryInput: { width: 100 },
  unitScroll: { maxHeight: 40 },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  unitText: { fontSize: 12, fontWeight: '600' },
  availRow: { flexDirection: 'row', gap: 8 },
  availCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4, position: 'relative',
  },
  availIcon: { fontSize: 20 },
  availLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  availDesc: { fontSize: 10, textAlign: 'center' },
  activeDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981',
  },
  bidTypeRow: { flexDirection: 'row', gap: 10 },
  bidTypeCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 14,
    alignItems: 'center', gap: 5, position: 'relative',
  },
  bidTypeIcon: { fontSize: 22 },
  bidTypeTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  bidTypeDesc: { fontSize: 11, textAlign: 'center' },
  selectedDot: {
    position: 'absolute', top: 8, right: 8,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#F1BB03', alignItems: 'center', justifyContent: 'center',
  },
  selectedDotInner: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#0A2540',
  },
  summaryBox: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 14,
    overflow: 'hidden',
  },
  summaryItem: { flex: 1, padding: 12, alignItems: 'center', gap: 3 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  summaryLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryValue: { fontSize: 13, fontWeight: '700' },
});

export default Step2_Pricing;
