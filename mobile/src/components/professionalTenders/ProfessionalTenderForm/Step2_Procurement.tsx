// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step2_Procurement.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FULLY REFACTORED: Premium Mint-themed with useTheme(), PremiumCard wrappers,
//  consistent input styling, proper theming for all banners and previews.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { AlertTriangle } from 'lucide-react-native';

import { useTheme } from '../../../hooks/useTheme';
import {
  LabeledField,
  OptionGrid,
  PremiumCard,
  SectionHeader,
  Segmented,
  TextField,
  ToggleField,
} from './FormFields';
import type { ProfessionalTenderFormValues } from './formSchema';

// ═════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const PROCUREMENT_METHOD_OPTIONS = [
  { value: 'open_tender' as const, label: 'Open Tender',  description: 'Open competition'        },
  { value: 'restricted' as const,  label: 'Restricted',   description: 'Pre-qualified bidders'    },
  { value: 'sealed_bid' as const,  label: 'Sealed Bid',   description: 'Confidential pricing'     },
  { value: 'direct' as const,      label: 'Direct',       description: 'Single source award'      },
  { value: 'framework' as const,   label: 'Framework',    description: 'Rolling agreement'        },
  { value: 'negotiated' as const,  label: 'Negotiated',   description: 'Direct negotiation'       },
];

const CURRENCY_OPTIONS = [
  { value: 'ETB' as const, label: 'ETB' },
  { value: 'USD' as const, label: 'USD' },
  { value: 'EUR' as const, label: 'EUR' },
  { value: 'GBP' as const, label: 'GBP' },
];

// ═════════════════════════════════════════════════════════════════════════════
//  STEP COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const Step2_Procurement: React.FC = () => {
  const { colors, spacing, radius } = useTheme();
  const { control, formState: { errors } } = useFormContext<ProfessionalTenderFormValues>();
  const procurementErrors = errors.procurement;
  const contactErrors = procurementErrors?.contactPerson;

  const cpoRequired = useWatch({ control, name: 'cpoRequired' });
  const cpoAmount = useWatch({ control, name: 'cpoAmount' });
  const cpoCurrency = useWatch({ control, name: 'cpoCurrency' });

  return (
    <View style={[styles.root, { gap: spacing.lg }]}>
      
      {/* ─── Procuring Entity ──────────────────────────────────────────── */}
      <SectionHeader
        title="Procuring Entity"
        description="The organization legally responsible for this procurement."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="procurement.procuringEntity"
          render={({ field }) => (
            <LabeledField
              label="Procuring Entity"
              required
              error={procurementErrors?.procuringEntity?.message}
            >
              <TextField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="e.g., Ministry of Health"
                error={!!procurementErrors?.procuringEntity}
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="procurement.fundingSource"
          render={({ field }) => (
            <LabeledField
              label="Funding Source"
              error={procurementErrors?.fundingSource?.message}
              helper="e.g., Government Treasury, World Bank, Internal Capex."
            >
              <TextField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Funding source (optional)"
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* ─── Procurement Method ────────────────────────────────────────── */}
      <SectionHeader
        title="Procurement Method"
        description="How this tender will be administered."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="procurement.procurementMethod"
          render={({ field }) => (
            <LabeledField required error={procurementErrors?.procurementMethod?.message}>
              <OptionGrid
                value={field.value}
                onChange={field.onChange}
                options={PROCUREMENT_METHOD_OPTIONS}
                columns={2}
                showDescriptions
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* ─── Bid Security ──────────────────────────────────────────────── */}
      <SectionHeader
        title="Bid Security"
        description="Bond amount required from bidders to participate."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="procurement.bidSecurityAmount"
          render={({ field }) => (
            <LabeledField
              label="Bid Security Amount"
              error={procurementErrors?.bidSecurityAmount?.message}
              helper="Enter the bond amount, or leave blank if not required."
            >
              <TextField
                value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                onChange={(v) => field.onChange(v === '' ? undefined : v)}
                onBlur={field.onBlur}
                placeholder="0"
                keyboardType="decimal-pad"
                error={!!procurementErrors?.bidSecurityAmount}
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="procurement.bidSecurityCurrency"
          render={({ field }) => (
            <LabeledField label="Currency">
              <Segmented
                value={field.value ?? 'ETB'}
                onChange={field.onChange}
                options={CURRENCY_OPTIONS}
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* ─── Contact Person ────────────────────────────────────────────── */}
      <SectionHeader
        title="Contact Person"
        description="Optional — primary contact for clarifications."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="procurement.contactPerson.name"
          render={({ field }) => (
            <LabeledField label="Name" error={contactErrors?.name?.message}>
              <TextField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Full name"
                autoCapitalize="words"
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="procurement.contactPerson.email"
          render={({ field }) => (
            <LabeledField label="Email" error={contactErrors?.email?.message}>
              <TextField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!contactErrors?.email}
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="procurement.contactPerson.phone"
          render={({ field }) => (
            <LabeledField label="Phone" error={contactErrors?.phone?.message}>
              <TextField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="+251…"
                keyboardType="phone-pad"
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* ─── CPO SECTION ───────────────────────────────────────────────── */}
      <SectionHeader
        title="CPO (Cashier's Payment Order)"
        description="Bank-certified payment instrument required from awarded bidders."
      />

      <PremiumCard>
        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: `${colors.info}12`,
              borderColor: `${colors.info}30`,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            A CPO is a bank-issued, certified instrument bidders must present after
            award. The toggle below sets the requirement; the actual CPO document
            is submitted later by the awarded bidder.
          </Text>
        </View>

        {/* CPO Required Toggle */}
        <Controller
          control={control}
          name="cpoRequired"
          render={({ field }) => (
            <ToggleField
              value={!!field.value}
              onChange={field.onChange}
              label="CPO Required"
              description="Bidders must furnish a Cashier's Payment Order on award."
            />
          )}
        />

        {/* CPO details — visible only when required */}
        {cpoRequired && (
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            
            {/* CPO Description */}
            <Controller
              control={control}
              name="cpoDescription"
              render={({ field }) => (
                <LabeledField
                  label="CPO Requirement Description"
                  required
                  error={errors.cpoDescription?.message}
                  helper="Describe what the CPO must cover, validity period, etc."
                >
                  <TextField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="e.g., 10% of bid value, valid for 90 days from award…"
                    multiline
                    numberOfLines={4}
                    maxLength={1000}
                    error={!!errors.cpoDescription}
                  />
                </LabeledField>
              )}
            />

            {/* CPO Amount + Currency Row */}
            <View style={styles.cpoAmountRow}>
              <View style={{ flex: 2 }}>
                <Controller
                  control={control}
                  name="cpoAmount"
                  render={({ field }) => (
                    <LabeledField
                      label="Indicative Amount"
                      error={errors.cpoAmount?.message}
                      helper="Optional — leave blank if percentage-based."
                    >
                      <TextField
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                        onChange={(v) => field.onChange(v === '' ? undefined : v)}
                        onBlur={field.onBlur}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        error={!!errors.cpoAmount}
                      />
                    </LabeledField>
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="cpoCurrency"
                  render={({ field }) => (
                    <LabeledField label="Currency">
                      <Segmented
                        value={field.value ?? 'ETB'}
                        onChange={field.onChange}
                        options={CURRENCY_OPTIONS}
                      />
                    </LabeledField>
                  )}
                />
              </View>
            </View>

            {/* Live Preview */}
            {(cpoAmount !== undefined && cpoAmount !== null) && (
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.md,
                  },
                ]}
              >
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>
                  CPO PREVIEW
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {Number(cpoAmount).toLocaleString()} {cpoCurrency ?? 'ETB'}
                </Text>
              </View>
            )}

            {/* Important Notice */}
            <View
              style={[
                styles.cpoBanner,
                {
                  backgroundColor: `${colors.warning}12`,
                  borderColor: `${colors.warning}30`,
                  borderRadius: radius.md,
                  padding: spacing.md,
                },
              ]}
            >
              <AlertTriangle size={16} color={colors.warning} strokeWidth={2.4} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.cpoBannerTitle, { color: colors.warning }]}>
                  Important
                </Text>
                <Text style={[styles.cpoBannerDesc, { color: colors.textSecondary }]}>
                  CPO requirement is shown to all bidders. They must arrange the
                  bank instrument before bidding.
                </Text>
              </View>
            </View>
          </View>
        )}
      </PremiumCard>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {},

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16 },

  cpoAmountRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },

  previewCard: {
    borderWidth: 1,
    gap: 4,
  },
  previewLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  previewValue: { fontSize: 18, fontWeight: '800' },

  cpoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
  },
  cpoBannerTitle: { fontSize: 12, fontWeight: '700' },
  cpoBannerDesc:  { fontSize: 11, lineHeight: 15 },
});

export default Step2_Procurement;