// src/components/proposals/ProposalForm/Step4_Review.tsx
// Step 4: Complete review of all proposal data before submission

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  ViewStyle,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
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
  hourlyRate?: number;
  estimatedWeeklyHours?: number;
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

interface Step4Props {
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

const BID_TYPE_LABELS: Record<BidType, string> = {
  fixed: 'Fixed Price',
  hourly: 'Hourly Rate',
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

export const Step4_Review: React.FC<Step4Props> = ({
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
  const { colors: c, radius, spacing, type } = useTheme();

  const { score, total } = completionScore(data);
  const pct = Math.round((score / total) * 100);
  const strengthLabel = pct >= 85 ? 'Excellent' : pct >= 65 ? 'Strong' : pct >= 40 ? 'Fair' : 'Weak';
  const strengthColor = pct >= 65 ? '#059669' : pct >= 40 ? '#D97706' : '#DC2626';

  const validationItems: ValidationItem[] = [
    { label: 'Cover Letter', ok: data.coverLetter?.length >= 50, value: `${data.coverLetter?.length || 0} characters`, errorMsg: 'At least 50 characters required' },
    { label: 'Proposed Amount', ok: data.proposedAmount > 0, value: `${data.currency} ${data.proposedAmount.toLocaleString()}`, errorMsg: 'Bid amount is required' },
    { label: 'Delivery Time', ok: !!(data.deliveryTime?.value), value: `${data.deliveryTime?.value} ${data.deliveryTime?.unit}`, errorMsg: 'Delivery time is required' },
    { label: 'Availability', ok: !!data.availability, value: AVAILABILITY_LABELS[data.availability], errorMsg: 'Availability is required' },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumBadge, { backgroundColor: c.primary }]}>
          <Text style={[type.caption, { color: c.textInverse, fontWeight: '800', fontSize: 13 }]}>4</Text>
        </View>
        <View style={styles.stepTitleBlock}>
          <Text style={[styles.stepTitle, { color: c.text }]}>Review & Submit</Text>
          <Text style={[styles.stepSubtitle, { color: c.textMuted }]}>Check your proposal before submitting</Text>
        </View>
      </View>

      {/* Tender context */}
      {tenderTitle && (
        <View style={[styles.tenderBanner, { backgroundColor: withAlpha(c.primary, 0.07), borderColor: withAlpha(c.primary, 0.25) }]}>
          <Ionicons name="briefcase-outline" size={14} color={c.primary} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[type.caption, { color: c.primary, fontWeight: '600' }]}>Applying to:</Text>
            <Text style={[type.caption, { color: c.primary, fontWeight: '600', lineHeight: 18 }]} numberOfLines={2}>
              {tenderTitle}
            </Text>
          </View>
        </View>
      )}

      {/* Proposal Strength */}
      <View style={[styles.strengthCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
        <View style={styles.strengthHeader}>
          <Text style={[styles.strengthTitle, { color: c.text }]}>Proposal Strength</Text>
          <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel} — {pct}%</Text>
        </View>
        <View style={[styles.strengthBarBg, { backgroundColor: c.border }]}>
          <View style={[styles.strengthBarFill, { width: `${pct}%` as `${number}%`, backgroundColor: pct >= 65 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }]} />
        </View>
        <Text style={[styles.strengthSubtitle, { color: c.textMuted }]}>{score} of {total} sections completed</Text>
      </View>

      {/* Validation checklist */}
      <View style={[styles.checklistCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
        <Text style={[styles.checklistTitle, { color: c.text }]}>Required Checklist</Text>
        {validationItems.map(({ label, ok, value, errorMsg }) => (
          <View key={label} style={styles.checklistRow}>
            <Text style={[styles.checkIcon, { color: ok ? '#10B981' : '#EF4444' }]}>{ok ? '✓' : '✕'}</Text>
            <Text style={[styles.checkLabel, { color: c.textSecondary }]}>{label}</Text>
            <Text style={[styles.checkValue, { color: ok ? c.textMuted : '#EF4444' }]} numberOfLines={1}>
              {ok && value ? value : !ok ? errorMsg ?? 'Required' : '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* Cover letter preview */}
      <View style={[styles.previewCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>COVER LETTER</Text>
        <Text style={[styles.coverPreview, { color: c.textSecondary }]} numberOfLines={8}>
          {data.coverLetter || 'No cover letter written yet.'}
        </Text>
      </View>

      {/* Bid Summary */}
      <View style={[styles.previewCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>BID SUMMARY</Text>
        <View style={styles.bidSummaryGrid}>
          <View style={styles.bidSummaryItem}>
            <Text style={[styles.bidSummaryLabel, { color: c.textMuted }]}>Type</Text>
            <Text style={[styles.bidSummaryValue, { color: c.text }]}>{BID_TYPE_LABELS[data.bidType]}</Text>
          </View>
          <View style={styles.bidSummaryItem}>
            <Text style={[styles.bidSummaryLabel, { color: c.textMuted }]}>Amount</Text>
            <Text style={[styles.bidSummaryValue, { color: c.primary, fontWeight: '700' }]}>
              {data.currency} {data.proposedAmount.toLocaleString()}
              {data.bidType === 'hourly' && '/hr'}
            </Text>
          </View>
          <View style={styles.bidSummaryItem}>
            <Text style={[styles.bidSummaryLabel, { color: c.textMuted }]}>Delivery</Text>
            <Text style={[styles.bidSummaryValue, { color: c.text }]}>{data.deliveryTime.value} {data.deliveryTime.unit}</Text>
          </View>
          <View style={styles.bidSummaryItem}>
            <Text style={[styles.bidSummaryLabel, { color: c.textMuted }]}>Availability</Text>
            <Text style={[styles.bidSummaryValue, { color: c.text }]}>{AVAILABILITY_LABELS[data.availability]}</Text>
          </View>
          {data.proposedStartDate && (
            <View style={styles.bidSummaryItem}>
              <Text style={[styles.bidSummaryLabel, { color: c.textMuted }]}>Start Date</Text>
              <Text style={[styles.bidSummaryValue, { color: c.text }]}>{formatDate(data.proposedStartDate)}</Text>
            </View>
          )}
          {data.bidType === 'hourly' && data.estimatedWeeklyHours && (
            <View style={styles.bidSummaryItem}>
              <Text style={[styles.bidSummaryLabel, { color: c.textMuted }]}>Weekly Hours</Text>
              <Text style={[styles.bidSummaryValue, { color: c.text }]}>{data.estimatedWeeklyHours} hrs/week</Text>
            </View>
          )}
        </View>
      </View>

      {/* Milestones preview */}
      {data.milestones.length > 0 && (
        <View style={[styles.previewCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>PAYMENT MILESTONES ({data.milestones.length})</Text>
          <ProposalMilestoneList milestones={data.milestones} currency={data.currency} totalBid={data.proposedAmount} />
        </View>
      )}

      {/* Screening answers preview */}
      {data.screeningAnswers.length > 0 && (
        <View style={[styles.previewCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>SCREENING ANSWERS ({data.screeningAnswers.length})</Text>
          <ProposalScreeningAnswers answers={data.screeningAnswers} maxVisible={3} />
        </View>
      )}

      {/* Portfolio links preview */}
      {data.portfolioLinks.length > 0 && (
        <View style={[styles.previewCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>PORTFOLIO LINKS ({data.portfolioLinks.length})</Text>
          {data.portfolioLinks.map((link, i) => (
            <TouchableOpacity key={i} onPress={() => handleOpenLink(link)} style={[styles.linkRow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
              <Ionicons name="link-outline" size={14} color={c.textMuted} />
              <Text style={[styles.linkText, { color: c.primary }]} numberOfLines={1}>{link}</Text>
              <Ionicons name="open-outline" size={12} color={c.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Attachments preview */}
      {data.attachments.length > 0 && (
        <View style={[styles.previewCard, { backgroundColor: c.surface ?? c.bgCard, borderColor: c.border }]}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ATTACHMENTS ({data.attachments.length})</Text>
          <ProposalAttachmentList attachments={data.attachments} canDelete={false} />
        </View>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <View style={[styles.errorsCard, { backgroundColor: withAlpha(c.danger, 0.06), borderColor: c.danger }]}>
          <Text style={[styles.errorsTitle, { color: c.danger }]}>⚠ Please fix before submitting:</Text>
          {validationErrors.map((err, i) => (
            <Text key={i} style={[styles.errorItem, { color: c.danger }]}>• {err}</Text>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onSaveDraft} disabled={isSaving} activeOpacity={0.75} style={[styles.saveDraftBtn, { borderColor: c.border, backgroundColor: c.surface ?? c.bgCard }]}>
          {isSaving ? <ActivityIndicator size="small" color={c.textMuted} /> : <Text style={[styles.saveDraftText, { color: c.textSecondary }]}>💾 Save Draft</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSubmit} disabled={!canSubmit || isSubmitting} activeOpacity={0.8} style={[styles.submitBtn, { backgroundColor: canSubmit && !isSubmitting ? c.primary : c.border }]}>
          {isSubmitting ? <ActivityIndicator size="small" color="#0A2540" /> : <Text style={[styles.submitText, { color: canSubmit ? '#0A2540' : c.textMuted }]}>🚀 Submit Proposal</Text>}
        </TouchableOpacity>
      </View>

      {!canSubmit && <Text style={[styles.cannotSubmitNote, { color: c.textMuted }]}>Complete all required fields above to enable submission.</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16, flex: 1 },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  stepNumBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepTitleBlock: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700' },
  stepSubtitle: { fontSize: 12, marginTop: 2 },
  tenderBanner: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'flex-start' },
  strengthCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strengthTitle: { fontSize: 14, fontWeight: '700' },
  strengthLabel: { fontSize: 13, fontWeight: '700' },
  strengthBarBg: { height: 6, borderRadius: 99, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 99 },
  strengthSubtitle: { fontSize: 11 },
  checklistCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  checklistTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: { fontSize: 14, fontWeight: '700', width: 16 },
  checkLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  checkValue: { fontSize: 12, flexShrink: 0, maxWidth: 150 },
  previewCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  coverPreview: { fontSize: 13, lineHeight: 20 },
  bidSummaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bidSummaryItem: { minWidth: '48%', paddingVertical: 6 },
  bidSummaryLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bidSummaryValue: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  linkText: { flex: 1, fontSize: 12 },
  errorsCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  errorsTitle: { fontSize: 13, fontWeight: '700' },
  errorItem: { fontSize: 13 },
  actions: { gap: 10, marginTop: 4 },
  saveDraftBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  saveDraftText: { fontSize: 15, fontWeight: '600' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  cannotSubmitNote: { fontSize: 12, textAlign: 'center' },
});

export default Step4_Review;