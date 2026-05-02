// src/components/proposals/ProposalForm/Step6_Review.tsx
// Banana Mobile App — Module 6B: Proposals
// Step 6: Read-only summary of all proposal data before final submission.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import { ProposalStatusBadge } from '../ProposalStatusBadge';
import { ProposalMilestoneList } from '../ProposalMilestoneList';
import { ProposalAttachmentList } from '../ProposalAttachmentList';
import { ProposalScreeningAnswers } from '../ProposalScreeningAnswers';
import type {
  ProposalMilestone,
  ProposalScreeningAnswer,
  ProposalAttachment,
  ProposalCurrency,
  ProposalAvailability,
  BidType,
  ProposalDurationUnit,
} from '../../../types/proposal';

interface ReviewData {
  coverLetter: string;
  bidType: BidType;
  proposedAmount: number;
  currency: ProposalCurrency;
  deliveryTime: { value: number; unit: ProposalDurationUnit };
  availability: ProposalAvailability;
  proposedStartDate?: string;
  milestones: ProposalMilestone[];
  screeningAnswers: ProposalScreeningAnswer[];
  attachments: ProposalAttachment[];
  portfolioLinks: string[];
}

interface ValidationItem {
  label: string;
  ok: boolean;
  value?: string;
  errorMsg?: string;
}

interface Step6Props {
  data: ReviewData;
  tenderTitle?: string;
  onSubmit: () => void;
  onSaveDraft: () => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
  canSubmit: boolean;
  validationErrors?: string[];
  style?: ViewStyle;
}

const AVAILABILITY_LABELS: Record<ProposalAvailability, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  flexible: 'Flexible',
};

function completionScore(data: ReviewData): { score: number; total: number } {
  const checks = [
    data.coverLetter?.length >= 50,
    data.proposedAmount > 0,
    !!data.deliveryTime?.value,
    !!data.availability,
    data.milestones.length > 0,
    data.attachments.length > 0 || data.portfolioLinks.length > 0,
  ];
  return { score: checks.filter(Boolean).length, total: checks.length };
}

export const Step6_Review: React.FC<Step6Props> = ({
  data,
  tenderTitle,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  isSaving = false,
  canSubmit,
  validationErrors = [],
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;

  const { score, total } = completionScore(data);
  const pct = Math.round((score / total) * 100);
  const strengthLabel =
    pct >= 85 ? 'Excellent' : pct >= 65 ? 'Strong' : pct >= 40 ? 'Fair' : 'Weak';
  const strengthColor =
    pct >= 65 ? '#059669' : pct >= 40 ? '#D97706' : '#DC2626';

  const validationItems: ValidationItem[] = [
    {
      label: 'Cover Letter',
      ok: data.coverLetter?.length >= 50,
      value: data.coverLetter?.length >= 50
        ? `${data.coverLetter.length} characters`
        : undefined,
      errorMsg: 'At least 50 characters required',
    },
    {
      label: 'Proposed Amount',
      ok: data.proposedAmount > 0,
      value: data.proposedAmount > 0
        ? `${data.currency} ${data.proposedAmount.toLocaleString()}`
        : undefined,
      errorMsg: 'Bid amount is required',
    },
    {
      label: 'Bid Type',
      ok: true,
      value: data.bidType === 'hourly' ? 'Hourly Rate' : 'Fixed Price',
    },
    {
      label: 'Delivery Time',
      ok: !!(data.deliveryTime?.value),
      value: data.deliveryTime?.value
        ? `${data.deliveryTime.value} ${data.deliveryTime.unit}`
        : undefined,
      errorMsg: 'Delivery time is required',
    },
    {
      label: 'Availability',
      ok: !!data.availability,
      value: data.availability
        ? AVAILABILITY_LABELS[data.availability]
        : undefined,
      errorMsg: 'Availability is required',
    },
    {
      label: 'Milestones',
      ok: true,
      value: data.milestones.length > 0
        ? `${data.milestones.length} milestone${data.milestones.length !== 1 ? 's' : ''}`
        : 'None (optional)',
    },
    {
      label: 'Attachments',
      ok: true,
      value:
        data.attachments.length > 0
          ? `${data.attachments.length} file${data.attachments.length !== 1 ? 's' : ''}`
          : 'None (optional)',
    },
    {
      label: 'Portfolio Links',
      ok: true,
      value:
        data.portfolioLinks.filter((l) => l).length > 0
          ? `${data.portfolioLinks.filter((l) => l).length} link${data.portfolioLinks.filter((l) => l).length !== 1 ? 's' : ''}`
          : 'None (optional)',
    },
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>6</Text>
        </View>
        <View style={styles.stepTitleBlock}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            Review & Submit
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
            Check your proposal before submitting
          </Text>
        </View>
      </View>

      {/* Tender context */}
      {tenderTitle && (
        <View
          style={[
            styles.tenderBanner,
            { backgroundColor: 'rgba(241,187,3,0.07)', borderColor: 'rgba(241,187,3,0.25)' },
          ]}
        >
          <Text style={[styles.tenderLabel, { color: '#D97706' }]}>Applying to:</Text>
          <Text style={[styles.tenderTitle, { color: '#D97706' }]} numberOfLines={2}>
            {tenderTitle}
          </Text>
        </View>
      )}

      {/* Proposal Strength */}
      <View
        style={[
          styles.strengthCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.strengthHeader}>
          <Text style={[styles.strengthTitle, { color: colors.text }]}>
            Proposal Strength
          </Text>
          <Text style={[styles.strengthLabel, { color: strengthColor }]}>
            {strengthLabel} — {pct}%
          </Text>
        </View>
        <View style={[styles.strengthBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.strengthBarFill,
              {
                width: `${pct}%` as `${number}%`,
                backgroundColor:
                  pct >= 65 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444',
              },
            ]}
          />
        </View>
        <Text style={[styles.strengthSubtitle, { color: colors.textMuted }]}>
          {score} of {total} sections completed
        </Text>
      </View>

      {/* Validation checklist */}
      <View
        style={[
          styles.checklistCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.checklistTitle, { color: colors.text }]}>
          Submission Checklist
        </Text>
        {validationItems.map(({ label, ok, value, errorMsg }) => (
          <View key={label} style={styles.checklistRow}>
            <Text style={[styles.checkIcon, { color: ok ? '#10B981' : '#EF4444' }]}>
              {ok ? '✓' : '✕'}
            </Text>
            <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>
              {label}
            </Text>
            <Text
              style={[
                styles.checkValue,
                { color: ok ? colors.textMuted : '#EF4444' },
              ]}
              numberOfLines={1}
            >
              {ok && value ? value : !ok ? errorMsg ?? 'Required' : '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* Cover letter preview */}
      <View
        style={[
          styles.previewCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          COVER LETTER PREVIEW
        </Text>
        <Text
          style={[styles.coverPreview, { color: colors.textSecondary }]}
          numberOfLines={6}
        >
          {data.coverLetter || 'No cover letter written yet.'}
        </Text>
      </View>

      {/* Milestones preview */}
      {data.milestones.length > 0 && (
        <View
          style={[
            styles.previewCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            MILESTONES
          </Text>
          <ProposalMilestoneList
            milestones={data.milestones}
            currency={data.currency}
            totalBid={data.proposedAmount}
          />
        </View>
      )}

      {/* Screening answers preview */}
      {data.screeningAnswers.length > 0 && (
        <View
          style={[
            styles.previewCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            SCREENING ANSWERS
          </Text>
          <ProposalScreeningAnswers answers={data.screeningAnswers} maxVisible={2} />
        </View>
      )}

      {/* Attachments preview */}
      {data.attachments.length > 0 && (
        <View
          style={[
            styles.previewCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            ATTACHMENTS
          </Text>
          <ProposalAttachmentList attachments={data.attachments} canDelete={false} />
        </View>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <View
          style={[
            styles.errorsCard,
            { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: '#EF4444' },
          ]}
        >
          <Text style={styles.errorsTitle}>⚠ Please fix before submitting:</Text>
          {validationErrors.map((err, i) => (
            <Text key={i} style={styles.errorItem}>• {err}</Text>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Save Draft */}
        <TouchableOpacity
          onPress={onSaveDraft}
          disabled={isSaving}
          activeOpacity={0.75}
          style={[
            styles.saveDraftBtn,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Text style={[styles.saveDraftText, { color: colors.textSecondary }]}>
              💾 Save Draft
            </Text>
          )}
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
          activeOpacity={0.8}
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit && !isSubmitting ? '#F1BB03' : colors.border,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#0A2540" />
          ) : (
            <Text
              style={[
                styles.submitText,
                { color: canSubmit ? '#0A2540' : colors.textMuted },
              ]}
            >
              🚀 Submit Proposal
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {!canSubmit && (
        <Text style={[styles.cannotSubmitNote, { color: colors.textMuted }]}>
          Complete all required fields above to enable submission.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1BB03',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  stepNumberText: { color: '#0A2540', fontSize: 13, fontWeight: '800' },
  stepTitleBlock: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontSize: 12, marginTop: 2 },
  tenderBanner: {
    borderWidth: 1, borderRadius: 10, padding: 12,
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
  },
  tenderLabel: { fontSize: 12, fontWeight: '600', flexShrink: 0 },
  tenderTitle: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  strengthCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strengthTitle: { fontSize: 14, fontWeight: '700' },
  strengthLabel: { fontSize: 13, fontWeight: '700' },
  strengthBarBg: { height: 6, borderRadius: 99, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 99 },
  strengthSubtitle: { fontSize: 11 },
  checklistCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  checklistTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  checklistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  checkIcon: { fontSize: 14, fontWeight: '700', width: 16 },
  checkLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  checkValue: { fontSize: 12, flexShrink: 0 },
  previewCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionLabel: {
    fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  coverPreview: { fontSize: 13, lineHeight: 20 },
  errorsCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  errorsTitle: { fontSize: 13, color: '#DC2626', fontWeight: '700' },
  errorItem: { fontSize: 13, color: '#DC2626' },
  actions: { gap: 10, marginTop: 4 },
  saveDraftBtn: {
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  saveDraftText: { fontSize: 15, fontWeight: '600' },
  submitBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  cannotSubmitNote: {
    fontSize: 12, textAlign: 'center',
  },
});

export default Step6_Review;
