// src/components/bids/BidCoverSheetForm.tsx
// react-hook-form controlled section for Cover Sheet fields.
// Required fields: companyName, representative, companyEmail, companyPhone,
//                  totalBidValue, currency, declarationAccepted.
// UPDATED: Fixed infinite re-render loop caused by watch() in useEffect
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  Modal, StyleSheet, KeyboardTypeOptions,
} from 'react-native';
import { Control, Controller, FieldErrors, UseFormSetValue, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BidCurrency } from '../../types/bid';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoverSheetFormValues {
  companyName: string;
  representative: string;
  representativeTitle: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  tinNumber: string;
  licenseNumber: string;
  totalBidValue: string;
  currency: BidCurrency;
  bidValidityPeriod: string;
  declarationAccepted: boolean;
}

const CURRENCIES: BidCurrency[] = ['ETB', 'USD', 'EUR', 'GBP'];

const CURRENCY_LABELS: Record<BidCurrency, string> = {
  ETB: 'ETB — Ethiopian Birr',
  USD: 'USD — US Dollar',
  EUR: 'EUR — Euro',
  GBP: 'GBP — British Pound',
};

// ── Shared field components ───────────────────────────────────────────────────

interface FieldWrapProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FieldWrap: React.FC<FieldWrapProps> = ({ label, required, error, children }) => {
  const { colors } = useTheme();
  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, { color: colors.textMuted }]}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      {children}
      {!!error && (
        <View style={fieldStyles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={colors.danger} />
          <Text style={[fieldStyles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}
    </View>
  );
};

interface StyledInputProps {
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  hasError?: boolean;
}

const StyledInput: React.FC<StyledInputProps> = ({
  value, onChangeText, onBlur, placeholder, keyboardType,
  autoCapitalize, multiline, hasError,
}) => {
  const { colors, radius } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={placeholder}
      placeholderTextColor={colors.inputPlaceholder}
      keyboardType={keyboardType ?? 'default'}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      multiline={multiline}
      style={[
        fieldStyles.input,
        {
          backgroundColor: colors.inputBg,
          borderColor: hasError ? colors.danger : colors.inputBorder,
          color: colors.text,
          borderRadius: radius.sm,
          minHeight: multiline ? 70 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
    />
  );
};

// ── Currency picker modal ─────────────────────────────────────────────────────

interface CurrencyPickerProps {
  value: BidCurrency;
  onChange: (v: BidCurrency) => void;
}

const CurrencyPicker: React.FC<CurrencyPickerProps> = ({ value, onChange }) => {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          fieldStyles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            borderRadius: radius.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
          },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 14 }}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setOpen(false)}>
          <View style={[modalStyles.sheet, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.xl }]}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Select Currency</Text>
            {CURRENCIES.map((cur) => (
              <Pressable
                key={cur}
                onPress={() => { onChange(cur); setOpen(false); }}
                style={[
                  modalStyles.option,
                  { borderBottomColor: colors.border },
                  cur === value && { backgroundColor: colors.primaryBg },
                ]}
              >
                <Text style={[modalStyles.optionText, { color: colors.text }]}>
                  {CURRENCY_LABELS[cur]}
                </Text>
                {cur === value && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  control?: Control<CoverSheetFormValues>;
  errors?: FieldErrors<CoverSheetFormValues>;
  setValue?: UseFormSetValue<CoverSheetFormValues>;
  onValidChange?: (valid: boolean) => void;
  onDataChange?: (data: CoverSheetFormValues | null) => void;
  initialValues?: CoverSheetFormValues | null;
  tenderCurrency?: BidCurrency;
}

export const BidCoverSheetForm: React.FC<Props> = ({
  control: externalControl,
  errors: externalErrors,
  setValue: externalSetValue,
  onValidChange,
  onDataChange,
  initialValues,
  tenderCurrency = 'ETB',
}) => {
  const { colors, radius, spacing } = useTheme();

  // Internal form when used standalone (no external control)
  const {
    control: internalControl,
    formState: { errors: internalErrors, isValid },
    setValue: internalSetValue,
    watch,
  } = useForm<CoverSheetFormValues>({
    defaultValues: initialValues ?? {
      companyName: '',
      representative: '',
      representativeTitle: '',
      companyEmail: '',
      companyPhone: '',
      companyAddress: '',
      tinNumber: '',
      licenseNumber: '',
      totalBidValue: '',
      currency: tenderCurrency,
      bidValidityPeriod: '',
      declarationAccepted: false,
    },
    mode: 'onChange',
  });

  const ctrl = externalControl ?? internalControl;
  const errs = externalErrors ?? internalErrors;
  const sv = externalSetValue ?? internalSetValue;

  // ── FIX: Use refs to prevent infinite loop ──────────────────────────────
  
  // Store callbacks in refs to avoid dependency issues
  const onValidChangeRef = useRef(onValidChange);
  const onDataChangeRef = useRef(onDataChange);
  
  // Update refs when props change (no dependency array needed for refs)
  useEffect(() => {
    onValidChangeRef.current = onValidChange;
    onDataChangeRef.current = onDataChange;
  });

  // Use a ref to track previous values to avoid unnecessary updates
  const prevDataRef = useRef<string>('');
  const prevValidRef = useRef<boolean | null>(null);

  // Watch form values - but don't use watchedValues directly in useEffect
  const watchedValues = watch();

  // FIX: Use a stable callback to prevent infinite loop
  useEffect(() => {
    // Only call if validity actually changed
    if (prevValidRef.current !== isValid) {
      prevValidRef.current = isValid;
      onValidChangeRef.current?.(isValid);
    }

    // Serialize to compare objects (avoid reference comparison)
    const dataString = JSON.stringify(watchedValues);
    if (prevDataRef.current !== dataString) {
      prevDataRef.current = dataString;
      onDataChangeRef.current?.(watchedValues as CoverSheetFormValues);
    }
    // Now we only depend on watchedValues and isValid, not the callbacks
  }, [watchedValues, isValid]);

  return (
    <View style={[sectionStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.xl }]}>
      {/* Section header */}
      <View style={[sectionStyles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="business-outline" size={16} color={colors.primary} />
        <Text style={[sectionStyles.title, { color: colors.text }]}>Cover Sheet</Text>
        <View style={[sectionStyles.reqNote, { backgroundColor: colors.dangerBg }]}>
          <Text style={[sectionStyles.reqNoteText, { color: colors.danger }]}>* Required</Text>
        </View>
      </View>

      <ScrollView style={sectionStyles.body} nestedScrollEnabled>
        {/* ── Company Name ─────────────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="companyName"
          rules={{ required: 'Company name is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Name" required error={errs.companyName?.message}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Legal company name"
                hasError={!!errs.companyName}
              />
            </FieldWrap>
          )}
        />

        {/* ── Representative ───────────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="representative"
          rules={{ required: 'Authorized representative is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Authorized Representative" required error={errs.representative?.message}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Full name of authorized signatory"
                hasError={!!errs.representative}
              />
            </FieldWrap>
          )}
        />

        {/* ── Representative Title ─────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="representativeTitle"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Representative Title">
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="e.g. CEO, Procurement Director"
              />
            </FieldWrap>
          )}
        />

        {/* ── Email ────────────────────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="companyEmail"
          rules={{
            required: 'Company email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Email" required error={errs.companyEmail?.message}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="procurement@company.com"
                keyboardType="email-address" autoCapitalize="none"
                hasError={!!errs.companyEmail}
              />
            </FieldWrap>
          )}
        />

        {/* ── Phone ────────────────────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="companyPhone"
          rules={{ required: 'Company phone is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Phone" required error={errs.companyPhone?.message}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="+251 911 000 000"
                keyboardType="phone-pad" autoCapitalize="none"
                hasError={!!errs.companyPhone}
              />
            </FieldWrap>
          )}
        />

        {/* ── Address ──────────────────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="companyAddress"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Address">
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Physical address"
                multiline
              />
            </FieldWrap>
          )}
        />

        {/* ── TIN ──────────────────────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="tinNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="TIN Number">
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Tax Identification Number"
                autoCapitalize="characters"
              />
            </FieldWrap>
          )}
        />

        {/* ── License ──────────────────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="licenseNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Business License Number">
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="License registration number"
                autoCapitalize="characters"
              />
            </FieldWrap>
          )}
        />

        {/* ── Total Bid Value + Currency (row) ──────────────────────── */}
        <View style={sectionStyles.twoCol}>
          <View style={{ flex: 2 }}>
            <Controller
              control={ctrl}
              name="totalBidValue"
              rules={{
                required: 'Bid value is required',
                validate: (v) => (parseFloat(v) > 0) || 'Must be greater than 0',
              }}
              render={({ field: { value, onChange, onBlur } }) => (
                <FieldWrap label="Total Bid Value" required error={errs.totalBidValue?.message}>
                  <StyledInput
                    value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    hasError={!!errs.totalBidValue}
                  />
                </FieldWrap>
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={ctrl}
              name="currency"
              rules={{ required: 'Currency required' }}
              render={({ field: { value, onChange } }) => (
                <FieldWrap label="Currency" required error={errs.currency?.message}>
                  <CurrencyPicker value={value} onChange={onChange} />
                </FieldWrap>
              )}
            />
          </View>
        </View>

        {/* ── Bid Validity Period ───────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="bidValidityPeriod"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Bid Validity Period (days)">
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="e.g. 90"
                keyboardType="number-pad"
              />
            </FieldWrap>
          )}
        />

        {/* ── Declaration Accepted ─────────────────────────────────── */}
        <Controller
          control={ctrl}
          name="declarationAccepted"
          rules={{ validate: (v) => v === true || 'You must accept the declaration to proceed' }}
          render={({ field: { value, onChange } }) => (
            <View style={sectionStyles.declarationWrap}>
              <Pressable
                onPress={() => onChange(!value)}
                style={[
                  sectionStyles.checkbox,
                  {
                    backgroundColor: value ? colors.primary : colors.inputBg,
                    borderColor: errs.declarationAccepted ? colors.danger : (value ? colors.primary : colors.inputBorder),
                    borderRadius: radius.sm,
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: value }}
              >
                {value && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
              </Pressable>
              <Pressable onPress={() => onChange(!value)} style={{ flex: 1 }}>
                <Text style={[sectionStyles.declarationText, { color: colors.textMuted }]}>
                  I confirm all information is accurate and complete, and I authorise this submission on behalf of my company.
                  <Text style={{ color: colors.danger }}> *</Text>
                </Text>
              </Pressable>
            </View>
          )}
        />
        {!!errs.declarationAccepted && (
          <View style={fieldStyles.errorRow}>
            <Ionicons name="alert-circle" size={12} color={colors.danger} />
            <Text style={[fieldStyles.errorText, { color: colors.danger }]}>
              {errs.declarationAccepted.message}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
  card: {
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
  reqNote: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  reqNoteText: {
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    padding: 16,
    maxHeight: 500,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  declarationWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  declarationText: {
    fontSize: 13,
    lineHeight: 19,
  },
});

const fieldStyles = StyleSheet.create({
  wrap: { gap: 5, marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  errorText: {
    fontSize: 11,
    lineHeight: 15,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 14,
  },
});

export default BidCoverSheetForm;