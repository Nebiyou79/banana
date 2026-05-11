// src/components/bids/BidCoverSheetForm.tsx
// react-hook-form controlled section for Cover Sheet fields.
// Required fields: companyName, representative, companyEmail, companyPhone,
//                  totalBidValue, currency, declarationAccepted.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  Modal, FlatList, StyleSheet, KeyboardTypeOptions,
} from 'react-native';
import { Control, Controller, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
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
  totalBidValue: string;         // kept as string for TextInput, parsed on submit
  currency: BidCurrency;
  bidValidityPeriod: string;     // string for TextInput
  declarationAccepted: boolean;
}

const CURRENCIES: BidCurrency[] = ['ETB', 'USD', 'EUR', 'GBP'];

const CURRENCY_LABELS: Record<BidCurrency, string> = {
  ETB: 'ETB — Ethiopian Birr',
  USD: 'USD — US Dollar',
  EUR: 'EUR — Euro',
  GBP: 'GBP — British Pound',
};

// ── Palette helper ────────────────────────────────────────────────────────────

function usePalette(isDark: boolean) {
  return {
    bg:          isDark ? '#0F172A' : '#F8FAFC',
    card:        isDark ? '#1E293B' : '#FFFFFF',
    headerBg:    isDark ? '#1A2540' : '#F1F5F9',
    border:      isDark ? '#334155' : '#E2E8F0',
    inputBg:     isDark ? '#0F172A' : '#F8FAFC',
    inputBorder: isDark ? '#475569' : '#CBD5E1',
    errorBorder: '#EF4444',
    text:        isDark ? '#F1F5F9' : '#0F172A',
    placeholder: isDark ? '#475569' : '#94A3B8',
    muted:       isDark ? '#94A3B8' : '#64748B',
    required:    '#EF4444',
    accent:      '#F1BB03',
    accentDark:  '#0A2540',
    checkBg:     isDark ? '#1E293B' : '#FFFFFF',
    checkActive: '#F1BB03',
    modal:       isDark ? '#1E293B' : '#FFFFFF',
    modalBorder: isDark ? '#334155' : '#E2E8F0',
  };
}

// ── Shared field components ───────────────────────────────────────────────────

interface FieldWrapProps {
  label: string;
  required?: boolean;
  error?: string;
  palette: ReturnType<typeof usePalette>;
  children: React.ReactNode;
}

const FieldWrap: React.FC<FieldWrapProps> = ({ label, required, error, palette, children }) => (
  <View style={fieldStyles.wrap}>
    <Text style={[fieldStyles.label, { color: palette.muted }]}>
      {label}
      {required && <Text style={{ color: palette.required }}> *</Text>}
    </Text>
    {children}
    {!!error && (
      <View style={fieldStyles.errorRow}>
        <Ionicons name="alert-circle" size={12} color={palette.required} />
        <Text style={[fieldStyles.errorText, { color: palette.required }]}>{error}</Text>
      </View>
    )}
  </View>
);

interface StyledInputProps {
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  hasError?: boolean;
  palette: ReturnType<typeof usePalette>;
}

const StyledInput: React.FC<StyledInputProps> = ({
  value, onChangeText, onBlur, placeholder, keyboardType,
  autoCapitalize, multiline, hasError, palette,
}) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    onBlur={onBlur}
    placeholder={placeholder}
    placeholderTextColor={palette.placeholder}
    keyboardType={keyboardType ?? 'default'}
    autoCapitalize={autoCapitalize ?? 'sentences'}
    multiline={multiline}
    style={[
      fieldStyles.input,
      {
        backgroundColor: palette.inputBg,
        borderColor: hasError ? palette.errorBorder : palette.inputBorder,
        color: palette.text,
        minHeight: multiline ? 70 : 44,
        textAlignVertical: multiline ? 'top' : 'center',
      },
    ]}
  />
);

// ── Currency picker modal ─────────────────────────────────────────────────────

interface CurrencyPickerProps {
  value: BidCurrency;
  onChange: (v: BidCurrency) => void;
  palette: ReturnType<typeof usePalette>;
}

const CurrencyPicker: React.FC<CurrencyPickerProps> = ({ value, onChange, palette }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          fieldStyles.input,
          {
            backgroundColor: palette.inputBg,
            borderColor: palette.inputBorder,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
          },
        ]}
      >
        <Text style={{ color: palette.text, fontSize: 14 }}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={palette.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setOpen(false)}>
          <View style={[modalStyles.sheet, { backgroundColor: palette.modal, borderColor: palette.modalBorder }]}>
            <Text style={[modalStyles.title, { color: palette.text }]}>Select Currency</Text>
            {CURRENCIES.map((cur) => (
              <Pressable
                key={cur}
                onPress={() => { onChange(cur); setOpen(false); }}
                style={[
                  modalStyles.option,
                  { borderBottomColor: palette.modalBorder },
                  cur === value && { backgroundColor: palette.accent + '22' },
                ]}
              >
                <Text style={[modalStyles.optionText, { color: palette.text }]}>
                  {CURRENCY_LABELS[cur]}
                </Text>
                {cur === value && <Ionicons name="checkmark" size={16} color={palette.accent} />}
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
  control: Control<CoverSheetFormValues>;
  errors: FieldErrors<CoverSheetFormValues>;
  setValue: UseFormSetValue<CoverSheetFormValues>;
}

export const BidCoverSheetForm: React.FC<Props> = ({ control, errors, setValue }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = usePalette(isDark);

  return (
    <View style={[sectionStyles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {/* Section header */}
      <View style={[sectionStyles.header, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
        <Ionicons name="business-outline" size={16} color={palette.accentDark} />
        <Text style={[sectionStyles.title, { color: palette.text }]}>Cover Sheet</Text>
        <View style={[sectionStyles.reqNote, { backgroundColor: palette.required + '18' }]}>
          <Text style={[sectionStyles.reqNoteText, { color: palette.required }]}>* Required</Text>
        </View>
      </View>

      <View style={sectionStyles.body}>
        {/* ── Company Name ─────────────────────────────────────────── */}
        <Controller
          control={control}
          name="companyName"
          rules={{ required: 'Company name is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Name" required error={errors.companyName?.message} palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Legal company name"
                hasError={!!errors.companyName} palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── Representative ───────────────────────────────────────── */}
        <Controller
          control={control}
          name="representative"
          rules={{ required: 'Authorized representative is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Authorized Representative" required error={errors.representative?.message} palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Full name of authorized signatory"
                hasError={!!errors.representative} palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── Representative Title ─────────────────────────────────── */}
        <Controller
          control={control}
          name="representativeTitle"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Representative Title" palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="e.g. CEO, Procurement Director"
                palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── Email ────────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="companyEmail"
          rules={{
            required: 'Company email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Email" required error={errors.companyEmail?.message} palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="procurement@company.com"
                keyboardType="email-address" autoCapitalize="none"
                hasError={!!errors.companyEmail} palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── Phone ────────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="companyPhone"
          rules={{ required: 'Company phone is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Phone" required error={errors.companyPhone?.message} palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="+251 911 000 000"
                keyboardType="phone-pad" autoCapitalize="none"
                hasError={!!errors.companyPhone} palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── Address ──────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="companyAddress"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Company Address" palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Physical address"
                multiline palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── TIN ──────────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="tinNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="TIN Number" palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="Tax Identification Number"
                autoCapitalize="characters" palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── License ──────────────────────────────────────────────── */}
        <Controller
          control={control}
          name="licenseNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Business License Number" palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="License registration number"
                autoCapitalize="characters" palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── Total Bid Value + Currency (row) ──────────────────────── */}
        <View style={sectionStyles.twoCol}>
          <View style={{ flex: 2 }}>
            <Controller
              control={control}
              name="totalBidValue"
              rules={{
                required: 'Bid value is required',
                validate: (v) => (parseFloat(v) > 0) || 'Must be greater than 0',
              }}
              render={({ field: { value, onChange, onBlur } }) => (
                <FieldWrap label="Total Bid Value" required error={errors.totalBidValue?.message} palette={palette}>
                  <StyledInput
                    value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    hasError={!!errors.totalBidValue} palette={palette}
                  />
                </FieldWrap>
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="currency"
              rules={{ required: 'Currency required' }}
              render={({ field: { value, onChange } }) => (
                <FieldWrap label="Currency" required error={errors.currency?.message} palette={palette}>
                  <CurrencyPicker value={value} onChange={onChange} palette={palette} />
                </FieldWrap>
              )}
            />
          </View>
        </View>

        {/* ── Bid Validity Period ───────────────────────────────────── */}
        <Controller
          control={control}
          name="bidValidityPeriod"
          render={({ field: { value, onChange, onBlur } }) => (
            <FieldWrap label="Bid Validity Period (days)" palette={palette}>
              <StyledInput
                value={value} onChangeText={onChange} onBlur={onBlur}
                placeholder="e.g. 90"
                keyboardType="number-pad" palette={palette}
              />
            </FieldWrap>
          )}
        />

        {/* ── Declaration Accepted ─────────────────────────────────── */}
        <Controller
          control={control}
          name="declarationAccepted"
          rules={{ validate: (v) => v === true || 'You must accept the declaration to proceed' }}
          render={({ field: { value, onChange } }) => (
            <View style={sectionStyles.declarationWrap}>
              <Pressable
                onPress={() => onChange(!value)}
                style={[
                  sectionStyles.checkbox,
                  {
                    backgroundColor: value ? palette.checkActive : palette.checkBg,
                    borderColor: errors.declarationAccepted ? palette.required : (value ? palette.checkActive : palette.inputBorder),
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: value }}
              >
                {value && <Ionicons name="checkmark" size={14} color="#0A2540" />}
              </Pressable>
              <Pressable onPress={() => onChange(!value)} style={{ flex: 1 }}>
                <Text style={[sectionStyles.declarationText, { color: palette.muted }]}>
                  I confirm all information is accurate and complete, and I authorise this submission on behalf of my company.
                  <Text style={{ color: palette.required }}> *</Text>
                </Text>
              </Pressable>
            </View>
          )}
        />
        {!!errors.declarationAccepted && (
          <View style={fieldStyles.errorRow}>
            <Ionicons name="alert-circle" size={12} color={palette.required} />
            <Text style={[fieldStyles.errorText, { color: palette.required }]}>
              {errors.declarationAccepted.message}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
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
    gap: 14,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
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
  wrap: { gap: 5 },
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
    borderRadius: 16,
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
