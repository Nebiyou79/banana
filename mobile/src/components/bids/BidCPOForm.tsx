// src/components/bids/BidCPOForm.tsx
// Bid Security / CPO form for Step 4 of the wizard
// Security types: CPO, Bank Guarantee, Insurance Bond
// FIXED: Removed callbacks from useEffect dependency array to prevent infinite loop
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidCurrency } from '../../types/bid';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CPOFormValues {
  bidSecurityType: 'cpo' | 'bank_guarantee' | 'insurance_bond';
  cpoNumber: string;
  cpoAmount: string;
  cpoCurrency: BidCurrency;
  cpoIssuingBank: string;
  cpoIssueDate: string;
  cpoExpiryDate: string;
}

type SecurityType = CPOFormValues['bidSecurityType'];

const SECURITY_TYPES: { value: SecurityType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  {
    value: 'cpo',
    label: 'CPO (Cheque Payment Order)',
    icon: 'cash-outline',
    description: 'Certified payment order issued by a bank - most common in Ethiopian procurement',
  },
  {
    value: 'bank_guarantee',
    label: 'Bank Guarantee',
    icon: 'business-outline',
    description: 'Irrevocable guarantee from a recognized bank',
  },
  {
    value: 'insurance_bond',
    label: 'Insurance Bond',
    icon: 'shield-checkmark-outline',
    description: 'Bid bond issued by a licensed insurance company',
  },
];

const CURRENCIES: BidCurrency[] = ['ETB', 'USD', 'EUR', 'GBP'];

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  onValidChange: (valid: boolean) => void;
  onDataChange: (data: CPOFormValues | null) => void;
  initialValues?: CPOFormValues | null;
  currency?: BidCurrency;
}

export const BidCPOForm: React.FC<Props> = ({
  onValidChange,
  onDataChange,
  initialValues,
  currency: defaultCurrency = 'ETB',
}) => {
  const { colors, spacing, radius } = useTheme();

  const [securityType, setSecurityType] = useState<SecurityType>(
    initialValues?.bidSecurityType ?? 'cpo'
  );
  const [cpoNumber, setCpoNumber] = useState(initialValues?.cpoNumber ?? '');
  const [cpoAmount, setCpoAmount] = useState(initialValues?.cpoAmount ?? '');
  const [cpoCurrency, setCpoCurrency] = useState<BidCurrency>(
    initialValues?.cpoCurrency ?? defaultCurrency
  );
  const [cpoIssuingBank, setCpoIssuingBank] = useState(initialValues?.cpoIssuingBank ?? '');
  const [cpoIssueDate, setCpoIssueDate] = useState(initialValues?.cpoIssueDate ?? '');
  const [cpoExpiryDate, setCpoExpiryDate] = useState(initialValues?.cpoExpiryDate ?? '');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // ── FIX: Use refs for callbacks to prevent infinite loop ──────────────
  const onValidChangeRef = useRef(onValidChange);
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    onValidChangeRef.current = onValidChange;
    onDataChangeRef.current = onDataChange;
  });

  const hasData = securityType && cpoNumber.trim() && cpoAmount && parseFloat(cpoAmount) > 0;

  // FIX: Removed onDataChange and onValidChange from dependency array
  useEffect(() => {
    if (hasData) {
      onDataChangeRef.current({
        bidSecurityType: securityType,
        cpoNumber: cpoNumber.trim(),
        cpoAmount: cpoAmount,
        cpoCurrency,
        cpoIssuingBank: cpoIssuingBank.trim(),
        cpoIssueDate: cpoIssueDate || undefined as any,
        cpoExpiryDate: cpoExpiryDate || undefined as any,
      });
    } else {
      onDataChangeRef.current(null);
    }
    onValidChangeRef.current(true); // CPO is always optional
  }, [securityType, cpoNumber, cpoAmount, cpoCurrency, cpoIssuingBank, cpoIssueDate, cpoExpiryDate, hasData]);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  return (
    <View style={[styles.container, { gap: spacing.lg }]}>
      {/* Header card */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.cardHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Bid Security</Text>
          <View style={[styles.optionalBadge, { backgroundColor: colors.warningBg }]}>
            <Text style={[styles.optionalText, { color: colors.warning }]}>Optional</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Bid security is required by Ethiopian procurement law. You may provide these details now or submit them separately before the tender deadline.
          </Text>

          {/* Security type selector */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SECURITY TYPE</Text>
          <View style={{ gap: spacing.sm }}>
            {SECURITY_TYPES.map((type) => {
              const isSelected = securityType === type.value;
              return (
                <Pressable
                  key={type.value}
                  onPress={() => setSecurityType(type.value)}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: isSelected ? colors.primaryBg : colors.inputBg,
                      borderColor: isSelected ? colors.primary : colors.inputBorder,
                    },
                  ]}
                >
                  <View style={styles.typeOptionContent}>
                    <Ionicons
                      name={type.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.typeLabel,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {type.label}
                      </Text>
                      <Text style={[styles.typeDesc, { color: colors.textMuted }]}>
                        {type.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Details card (shown when type selected) */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.cardHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Ionicons name="create-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Security Details</Text>
        </View>

        <View style={styles.cardBody}>
          {/* CPO Number */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              {securityType === 'cpo' ? 'CPO Number' : 'Reference Number'}
            </Text>
            <TextInput
              value={cpoNumber}
              onChangeText={setCpoNumber}
              placeholder="e.g., CPO-2024-001"
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.input, inputStyle]}
              autoCapitalize="characters"
            />
          </View>

          {/* Amount + Currency row */}
          <View style={styles.twoCol}>
            <View style={[styles.fieldWrap, { flex: 2 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Amount</Text>
              <TextInput
                value={cpoAmount}
                onChangeText={setCpoAmount}
                placeholder="0.00"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="decimal-pad"
                style={[styles.input, inputStyle]}
              />
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Currency</Text>
              <Pressable
                onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                style={[styles.input, styles.pickerInput, inputStyle]}
              >
                <Text style={{ color: colors.text }}>{cpoCurrency}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Currency picker dropdown */}
          {showCurrencyPicker && (
            <View style={[styles.dropdown, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              {CURRENCIES.map((cur) => (
                <Pressable
                  key={cur}
                  onPress={() => {
                    setCpoCurrency(cur);
                    setShowCurrencyPicker(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: cur === cpoCurrency ? colors.primaryBg : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: colors.text }}>{cur}</Text>
                  {cur === cpoCurrency && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Issuing Bank */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              {securityType === 'insurance_bond' ? 'Issuing Company' : 'Issuing Bank'}
            </Text>
            <TextInput
              value={cpoIssuingBank}
              onChangeText={setCpoIssuingBank}
              placeholder="e.g., Commercial Bank of Ethiopia"
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.input, inputStyle]}
            />
          </View>

          {/* Dates row */}
          <View style={styles.twoCol}>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Issue Date</Text>
              <TextInput
                value={cpoIssueDate}
                onChangeText={setCpoIssueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inputPlaceholder}
                style={[styles.input, inputStyle]}
                autoCapitalize="none"
              />
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Expiry Date</Text>
              <TextInput
                value={cpoExpiryDate}
                onChangeText={setCpoExpiryDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inputPlaceholder}
                style={[styles.input, inputStyle]}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: 12 },
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
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
    gap: 14,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  typeOption: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  typeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  fieldWrap: { gap: 5 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default BidCPOForm;