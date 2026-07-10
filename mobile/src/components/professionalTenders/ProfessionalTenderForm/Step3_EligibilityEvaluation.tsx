// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/Step3_EligibilityEvaluation.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FULLY REFACTORED: Premium Mint-themed with useTheme(), PremiumCard wrappers,
//  themed WeightBar, consistent input styling.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Minus, Plus } from 'lucide-react-native';

import { useTheme } from '../../../hooks/useTheme';
import {
  ChipInput,
  LabeledField,
  OptionGrid,
  PremiumCard,
  SectionHeader,
  TextField,
  ToggleField,
} from './FormFields';
import type { ProfessionalTenderFormValues } from './formSchema';

// ═════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const EVALUATION_METHOD_OPTIONS = [
  { value: 'combined' as const,        label: 'Combined',         description: 'Technical + Financial'  },
  { value: 'technical_only' as const,  label: 'Technical Only',   description: 'No financial scoring'    },
  { value: 'financial_only' as const,  label: 'Financial Only',   description: 'Lowest-price wins'       },
];

// ═════════════════════════════════════════════════════════════════════════════
//  WEIGHT BAR — themed with useTheme()
// ═════════════════════════════════════════════════════════════════════════════

const WeightBar: React.FC<{
  technical: number;
  financial: number;
  onTechnicalChange: (next: number) => void;
}> = ({ technical, financial, onTechnicalChange }) => {
  const { colors, spacing, radius } = useTheme();

  const safeTechnical = Math.max(0, Math.min(100, technical));
  const techPct = safeTechnical;
  const finPct = 100 - safeTechnical;

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(100, safeTechnical + delta));
    onTechnicalChange(next);
  };

  return (
    <View style={styles.weightBarRoot}>
      {/* Progress Bar */}
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.border,
            borderRadius: radius.full,
            height: 14,
          },
        ]}
      >
        <View
          style={[
            styles.barTech,
            {
              width: `${techPct}%`,
              backgroundColor: colors.primary,
              borderRadius: radius.full,
            },
          ]}
        />
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
              },
            ]}
          />
          <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
            Technical
          </Text>
        </View>
        <Text style={[styles.legendValue, { color: colors.text }]}>
          {techPct}%
        </Text>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: colors.info,
                borderRadius: radius.full,
              },
            ]}
          />
          <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
            Financial
          </Text>
        </View>
        <Text style={[styles.legendValue, { color: colors.text }]}>
          {finPct}%
        </Text>
      </View>

      {/* Adjuster Buttons */}
      <View style={[styles.adjuster, { marginTop: spacing.sm }]}>
        <Pressable
          onPress={() => adjust(-5)}
          style={[
            styles.adjusterBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
          accessibilityLabel="Decrease technical weight by 5"
          accessibilityRole="button"
        >
          <Minus size={16} color={colors.text} strokeWidth={2.5} />
        </Pressable>

        <Text style={[styles.adjusterCenter, { color: colors.textMuted }]}>
          Adjust Technical · auto-balances Financial
        </Text>

        <Pressable
          onPress={() => adjust(+5)}
          style={[
            styles.adjusterBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
          accessibilityLabel="Increase technical weight by 5"
          accessibilityRole="button"
        >
          <Plus size={16} color={colors.text} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STEP COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const Step3_EligibilityEvaluation: React.FC = () => {
  const { colors, spacing, radius } = useTheme();
  const { control, setValue, formState: { errors } } =
    useFormContext<ProfessionalTenderFormValues>();
  const eligErrors = errors.eligibility;
  const scopeErrors = errors.scope;
  const evalErrors = errors.evaluation;

  const technicalWeight = useWatch({ control, name: 'evaluation.technicalWeight' });
  const financialWeight = useWatch({ control, name: 'evaluation.financialWeight' });

  const setBalanced = (technical: number) => {
    setValue('evaluation.technicalWeight', technical, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('evaluation.financialWeight', 100 - technical, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <View style={[styles.root, { gap: spacing.lg }]}>
      
      {/* ─── Eligibility ──────────────────────────────────────────────── */}
      <SectionHeader
        title="Eligibility Criteria"
        description="Requirements bidders must satisfy to qualify."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="eligibility.minimumExperience"
          render={({ field }) => (
            <LabeledField
              label="Minimum Experience (years)"
              error={eligErrors?.minimumExperience?.message}
              helper="Years of relevant experience required from bidders."
            >
              <TextField
                value={
                  field.value !== undefined && field.value !== null
                    ? String(field.value)
                    : ''
                }
                onChange={(v) => field.onChange(v === '' ? undefined : v)}
                onBlur={field.onBlur}
                placeholder="0"
                keyboardType="numeric"
                error={!!eligErrors?.minimumExperience}
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="eligibility.requiredCertifications"
          render={({ field }) => (
            <LabeledField
              label="Required Certifications"
              helper="Type a certification and press return. Examples: ISO 9001, PMP."
            >
              <ChipInput
                values={field.value ?? []}
                onChange={field.onChange}
                placeholder="Add certification…"
                max={20}
              />
            </LabeledField>
          )}
        />

        <View style={{ height: spacing.md }} />

        <Controller
          control={control}
          name="eligibility.legalRegistrationRequired"
          render={({ field }) => (
            <ToggleField
              value={!!field.value}
              onChange={field.onChange}
              label="Legal Registration Required"
              description="Bidders must be a registered legal entity in good standing."
            />
          )}
        />
      </PremiumCard>

      {/* ─── Scope ────────────────────────────────────────────────────── */}
      <SectionHeader
        title="Scope of Work"
        description="What needs to be done — the heart of the tender."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="scope.description"
          render={({ field }) => (
            <LabeledField
              label="Scope Description"
              required
              error={scopeErrors?.description?.message}
              helper="Describe deliverables, technical requirements, and expected outcomes."
            >
              <TextField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Detailed scope of work…"
                multiline
                numberOfLines={8}
                error={!!scopeErrors?.description}
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* ─── Evaluation Method ────────────────────────────────────────── */}
      <SectionHeader
        title="Evaluation Method"
        description="How you'll score the bids."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="evaluation.evaluationMethod"
          render={({ field }) => (
            <LabeledField required error={evalErrors?.evaluationMethod?.message}>
              <OptionGrid
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  if (v === 'technical_only') setBalanced(100);
                  else if (v === 'financial_only') setBalanced(0);
                }}
                options={EVALUATION_METHOD_OPTIONS}
                columns={1}
                showDescriptions
              />
            </LabeledField>
          )}
        />
      </PremiumCard>

      {/* ─── Scoring Weights ──────────────────────────────────────────── */}
      <SectionHeader
        title="Scoring Weights"
        description="Technical + Financial must sum to 100. Adjust either side — the other rebalances."
      />

      <PremiumCard>
        <WeightBar
          technical={technicalWeight ?? 70}
          financial={financialWeight ?? 30}
          onTechnicalChange={setBalanced}
        />

        <View style={[styles.weightInputs, { marginTop: spacing.md }]}>
          <View style={styles.weightInputCol}>
            <Controller
              control={control}
              name="evaluation.technicalWeight"
              render={({ field }) => (
                <LabeledField
                  label="Technical (%)"
                  error={evalErrors?.technicalWeight?.message}
                >
                  <TextField
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(v) => {
                      const n = Math.max(0, Math.min(100, Number(v) || 0));
                      setBalanced(n);
                    }}
                    onBlur={field.onBlur}
                    placeholder="0"
                    keyboardType="numeric"
                    error={!!evalErrors?.technicalWeight}
                  />
                </LabeledField>
              )}
            />
          </View>
          <View style={styles.weightInputCol}>
            <Controller
              control={control}
              name="evaluation.financialWeight"
              render={({ field }) => (
                <LabeledField
                  label="Financial (%)"
                  error={evalErrors?.financialWeight?.message}
                >
                  <TextField
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(v) => {
                      const n = Math.max(0, Math.min(100, Number(v) || 0));
                      setBalanced(100 - n);
                    }}
                    onBlur={field.onBlur}
                    placeholder="0"
                    keyboardType="numeric"
                    error={!!evalErrors?.financialWeight}
                  />
                </LabeledField>
              )}
            />
          </View>
        </View>
      </PremiumCard>

      {/* ─── Evaluation Criteria ──────────────────────────────────────── */}
      <SectionHeader
        title="Evaluation Criteria"
        description="Free-form description of how bids will be evaluated."
      />

      <PremiumCard>
        <Controller
          control={control}
          name="evaluation.criteria"
          render={({ field }) => (
            <LabeledField
              label="Evaluation Criteria"
              error={evalErrors?.criteria?.message}
              helper="Describe how bids will be scored and compared."
            >
              <TextField
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="e.g., Technical: methodology 30%, team 25%, experience 15%. Financial: lowest evaluated price wins…"
                multiline
                numberOfLines={5}
              />
            </LabeledField>
          )}
        />
      </PremiumCard>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {},

  weightBarRoot: { gap: 10 },
  bar: { overflow: 'hidden' },
  barTech: { height: '100%' },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10 },
  legendLabel: { fontSize: 13, fontWeight: '500' },
  legendValue: { fontSize: 14, fontWeight: '700' },

  adjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  adjusterBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  adjusterCenter: { flex: 1, fontSize: 11, textAlign: 'center' },

  weightInputs: { flexDirection: 'row', gap: 12 },
  weightInputCol: { flex: 1 },
});

export default Step3_EligibilityEvaluation;