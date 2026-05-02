// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step2_Procurement.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Step 2 (post-refactor): procurement.* + CPO subsection (1.3).
//
//  CPO (Cashier's Payment Order) is a bank-issued, certified payment instrument
//  often required as a deposit for high-value tenders. We expose:
//    • cpoRequired   — toggle
//    • cpoDescription (required when cpoRequired=true) — what the CPO must cover
//    • cpoAmount + cpoCurrency — informational; the actual CPO doc is uploaded
//      after award via POST /professional-tenders/:id/cpo
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '../../../store/themeStore';
import {
  LabeledField,
  OptionGrid,
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
  { value: 'open_tender' as const, label: 'Open Tender',       description: 'Open competition' },
  { value: 'restricted' as const,  label: 'Restricted',        description: 'Pre-qualified bidders' },
  { value: 'sealed_bid' as const,  label: 'Sealed Bid',        description: 'Confidential pricing' },
  { value: 'direct' as const,      label: 'Direct',            description: 'Single source award' },
  { value: 'framework' as const,   label: 'Framework',         description: 'Rolling agreement' },
  { value: 'negotiated' as const,  label: 'Negotiated',        description: 'Direct negotiation' },
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
  const isDark = useThemeStore((s) => s.theme.isDark);
  const { control, formState: { errors } } = useFormContext<ProfessionalTenderFormValues>();
  const procurementErrors = errors.procurement;
  const contactErrors = procurementErrors?.contactPerson;

  const cpoRequired = useWatch({ control, name: 'cpoRequired' });
  const cpoAmount = useWatch({ control, name: 'cpoAmount' });
  const cpoCurrency = useWatch({ control, name: 'cpoCurrency' });

  const palette = isDark
    ? {
        cpoBannerBg:  'rgba(245,158,11,0.12)',
        cpoBannerBd:  'rgba(245,158,11,0.40)',
        cpoBannerFg:  '#FCD34D',
        cpoMute:      '#FDE68A',
        previewBg:    '#0F172A',
        previewBd:    '#334155',
        previewLabel: '#94A3B8',
        previewValue: '#F1F5F9',
        infoBg:       'rgba(59,130,246,0.10)',
        infoBd:       'rgba(59,130,246,0.30)',
        infoFg:       '#93C5FD',
      }
    : {
        cpoBannerBg:  '#FFFBEB',
        cpoBannerBd:  '#FDE68A',
        cpoBannerFg:  '#92400E',
        cpoMute:      '#B45309',
        previewBg:    '#F8FAFC',
        previewBd:    '#E2E8F0',
        previewLabel: '#64748B',
        previewValue: '#0F172A',
        infoBg:       '#EFF6FF',
        infoBd:       '#BFDBFE',
        infoFg:       '#1D4ED8',
      };

  return (
    <View style={styles.root}>
      {/* ─── Procuring Entity ────────────────────────────────────────────── */}
      <SectionHeader
        title="Procuring Entity"
        description="The organization legally responsible for this procurement."
      />

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

      {/* ─── Procurement Method ──────────────────────────────────────────── */}
      <SectionHeader
        title="Procurement Method"
        description="How this tender will be administered."
      />

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

      {/* ─── Bid Security ───────────────────────────────────────────────── */}
      <SectionHeader
        title="Bid Security"
        description="Bond amount required from bidders to participate."
      />

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

      {/* ─── Contact Person ─────────────────────────────────────────────── */}
      <SectionHeader
        title="Contact Person"
        description="Optional — primary contact for clarifications."
      />

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

      {/* ─── CPO SECTION (1.3) ──────────────────────────────────────────── */}
      <SectionHeader
        title="CPO (Cashier's Payment Order)"
        description="Bank-certified payment instrument required from awarded bidders."
      />

      <View
        style={[
          styles.infoBanner,
          { backgroundColor: palette.infoBg, borderColor: palette.infoBd },
        ]}
      >
        <Ionicons name="information-circle-outline" size={16} color={palette.infoFg} />
        <Text style={[styles.infoText, { color: palette.infoFg }]}>
          A CPO is a bank-issued, certified instrument bidders must present after
          award. The toggle below sets the requirement; the actual CPO document
          is submitted later by the awarded bidder.
        </Text>
      </View>

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
        <View style={styles.cpoDetails}>
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

          {/* Live preview */}
          {(cpoAmount !== undefined && cpoAmount !== null) && (
            <View
              style={[
                styles.previewCard,
                { backgroundColor: palette.previewBg, borderColor: palette.previewBd },
              ]}
            >
              <Text style={[styles.previewLabel, { color: palette.previewLabel }]}>
                CPO PREVIEW
              </Text>
              <Text style={[styles.previewValue, { color: palette.previewValue }]}>
                {Number(cpoAmount).toLocaleString()} {cpoCurrency ?? 'ETB'}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.cpoBanner,
              { backgroundColor: palette.cpoBannerBg, borderColor: palette.cpoBannerBd },
            ]}
          >
            <Ionicons name="warning-outline" size={16} color={palette.cpoBannerFg} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.cpoBannerTitle, { color: palette.cpoBannerFg }]}>
                Important
              </Text>
              <Text style={[styles.cpoBannerDesc, { color: palette.cpoMute }]}>
                CPO requirement is shown to all bidders. They must arrange the
                bank instrument before bidding.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { gap: 18 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16 },

  cpoDetails: { gap: 14 },

  cpoAmountRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },

  previewCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  previewLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  previewValue: { fontSize: 18, fontWeight: '800' },

  cpoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cpoBannerTitle: { fontSize: 12, fontWeight: '700' },
  cpoBannerDesc:  { fontSize: 11, lineHeight: 15 },
});

export default Step2_Procurement;