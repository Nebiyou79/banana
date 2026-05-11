// src/components/bids/BidTechnicalProposalForm.tsx
// Multiline technical proposal textarea with live char counter.
// Min 100 chars, max 10000 chars.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TechnicalProposalFormValues {
  technicalProposal: string;
}

const MIN_CHARS = 100;
const MAX_CHARS = 10_000;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  control: Control<TechnicalProposalFormValues>;
  errors: FieldErrors<TechnicalProposalFormValues>;
}

export const BidTechnicalProposalForm: React.FC<Props> = ({ control, errors }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = {
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
    accent:      '#0A2540',
    counterOk:   isDark ? '#94A3B8' : '#64748B',
    counterWarn: '#F59E0B',
    counterMin:  '#EF4444',
    hintBg:      isDark ? '#0F172A' : '#F1F5F9',
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.headerBg, borderBottomColor: palette.border }]}>
        <Ionicons name="document-text-outline" size={16} color={palette.accent} />
        <Text style={[styles.title, { color: palette.text }]}>Technical Proposal</Text>
      </View>

      {/* Hint */}
      <View style={[styles.hint, { backgroundColor: palette.hintBg, borderBottomColor: palette.border }]}>
        <Ionicons name="information-circle-outline" size={14} color={palette.muted} />
        <Text style={[styles.hintText, { color: palette.muted }]}>
          Describe your technical approach, methodology, team qualifications, and why you are best placed to deliver.
          Minimum {MIN_CHARS} characters.
        </Text>
      </View>

      <View style={styles.body}>
        <Controller
          control={control}
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
              ? palette.counterMin
              : isUnderMin
              ? palette.counterWarn
              : isNearMax
              ? palette.counterWarn
              : palette.counterOk;

            return (
              <View style={{ gap: 6 }}>
                <TextInput
                  value={value}
                  onChangeText={(t) => onChange(t.slice(0, MAX_CHARS))}
                  onBlur={onBlur}
                  placeholder="Describe your technical approach, methodology, qualifications, and relevant experience…"
                  placeholderTextColor={palette.placeholder}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.textarea,
                    {
                      backgroundColor: palette.inputBg,
                      borderColor: errors.technicalProposal ? palette.errorBorder : palette.inputBorder,
                      color: palette.text,
                    },
                  ]}
                />

                {/* Counter row */}
                <View style={styles.counterRow}>
                  {isUnderMin ? (
                    <View style={styles.counterLeft}>
                      <Ionicons name="alert-circle" size={12} color={palette.counterWarn} />
                      <Text style={[styles.counterHint, { color: palette.counterWarn }]}>
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
                {!!errors.technicalProposal && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={palette.required} />
                    <Text style={[styles.errorText, { color: palette.required }]}>
                      {errors.technicalProposal.message}
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
