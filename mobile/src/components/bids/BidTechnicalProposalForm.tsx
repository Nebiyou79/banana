// src/components/bids/BidTechnicalProposalForm.tsx
// UPDATED: Added onValidChange, onDataChange, initialValue props for BidForm integration
// FIXED: Removed callbacks from useEffect dependency array to prevent infinite loop
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Control, Controller, FieldErrors, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TechnicalProposalFormValues {
  technicalProposal: string;
}

const MIN_CHARS = 100;
const MAX_CHARS = 10_000;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  control?: Control<TechnicalProposalFormValues>;
  errors?: FieldErrors<TechnicalProposalFormValues>;
  onValidChange?: (valid: boolean) => void;
  onDataChange?: (data: TechnicalProposalFormValues | null) => void;
  initialValue?: string;
}

export const BidTechnicalProposalForm: React.FC<Props> = ({
  control: externalControl,
  errors: externalErrors,
  onValidChange,
  onDataChange,
  initialValue,
}) => {
  const { colors, radius, spacing } = useTheme();

  // Internal form when used standalone
  const {
    control: internalControl,
    formState: { errors: internalErrors, isValid },
    watch,
  } = useForm<TechnicalProposalFormValues>({
    defaultValues: {
      technicalProposal: initialValue ?? '',
    },
    mode: 'onChange',
  });

  const ctrl = externalControl ?? internalControl;
  const errs = externalErrors ?? internalErrors;

  // ── FIX: Use refs for callbacks to prevent infinite loop ──────────────
  const onValidChangeRef = useRef(onValidChange);
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    onValidChangeRef.current = onValidChange;
    onDataChangeRef.current = onDataChange;
  });

  // Watch value for callbacks
  const watchedValue = watch('technicalProposal');
  
  // FIX: Removed onValidChange and onDataChange from dependency array
  useEffect(() => {
    const len = watchedValue?.length ?? 0;
    onValidChangeRef.current?.(len >= MIN_CHARS && len <= MAX_CHARS);
    onDataChangeRef.current?.({ technicalProposal: watchedValue ?? '' });
  }, [watchedValue]);

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, borderRadius: radius.xl }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="document-text-outline" size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Technical Proposal</Text>
      </View>

      {/* Hint */}
      <View style={[styles.hint, { backgroundColor: colors.inputBg, borderBottomColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
        <Text style={[styles.hintText, { color: colors.textMuted }]}>
          Describe your technical approach, methodology, team qualifications, and why you are best placed to deliver.
          Minimum {MIN_CHARS} characters.
        </Text>
      </View>

      <View style={styles.body}>
        <Controller
          control={ctrl}
          name="technicalProposal"
          rules={{
            required: 'Technical proposal is required',
            minLength: { value: MIN_CHARS, message: `Minimum ${MIN_CHARS} characters required` },
            maxLength: { value: MAX_CHARS, message: `Maximum ${MAX_CHARS} characters allowed` },
          }}
          render={({ field: { value, onChange, onBlur } }) => {
            const len = value?.length ?? 0;
            const remaining = MAX_CHARS - len;
            const isUnderMin = len > 0 && len < MIN_CHARS;
            const isNearMax = remaining < 500 && remaining > 0;
            const isAtMax = remaining <= 0;

            const counterColor = isAtMax
              ? colors.danger
              : isUnderMin
              ? colors.warning
              : isNearMax
              ? colors.warning
              : colors.textMuted;

            return (
              <View style={{ gap: spacing.sm }}>
                <TextInput
                  value={value}
                  onChangeText={(t) => onChange(t.slice(0, MAX_CHARS))}
                  onBlur={onBlur}
                  placeholder="Describe your technical approach, methodology, qualifications, and relevant experience…"
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.textarea,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: errs.technicalProposal ? colors.danger : colors.inputBorder,
                      color: colors.text,
                      borderRadius: radius.md,
                    },
                  ]}
                />

                {/* Counter row */}
                <View style={styles.counterRow}>
                  {isUnderMin ? (
                    <View style={styles.counterLeft}>
                      <Ionicons name="alert-circle" size={12} color={colors.warning} />
                      <Text style={[styles.counterHint, { color: colors.warning }]}>
                        {MIN_CHARS - len} more character{MIN_CHARS - len !== 1 ? 's' : ''} needed
                      </Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <Text style={[styles.counter, { color: counterColor }]}>
                    {len.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                  </Text>
                </View>

                {/* Validation error */}
                {!!errs.technicalProposal && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errs.technicalProposal.message}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    fontSize: 15,
    fontWeight: '800',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  body: {
    padding: 16,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 180,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterHint: {
    fontSize: 11,
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 11,
  },
});

export default BidTechnicalProposalForm;