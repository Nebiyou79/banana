// src/components/proposals/ProposalForm/index.tsx
// Banana Mobile App — Module 6B: Proposals
// Multi-step proposal form shell. Stores draftId in state.
// CRITICAL: Draft is created FIRST, then auto-saved on every step navigation.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import {
  useCreateProposalDraft,
  useUpdateProposalDraft,
  useSubmitProposal,
  useUploadProposalAttachment,
  useRemoveProposalAttachment,
} from '../../../hooks/useProposal';
import { Step1_CoverLetter } from './Step1_CoverLetter';
import { Step2_Pricing } from './Step2_Pricing';
import { Step3_Milestones } from './Step3_Milestones';
import { Step4_ScreeningAnswers } from './Step4_ScreeningAnswers';
import { Step5_Attachments } from './Step5_Attachments';
import { Step6_Review } from './Step6_Review';
import type {
  Proposal,
  ProposalTender,
  ProposalMilestone,
  ProposalScreeningAnswer,
  ProposalAttachment,
  BidType,
  ProposalCurrency,
  ProposalAvailability,
  ProposalDurationUnit,
  TenderScreeningQuestion,
  UpdateProposalData,
} from '../../../types/proposal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProposalFormProps {
  tender: ProposalTender;
  existingDraft?: Proposal | null;
  onSuccess: (proposalId: string) => void;
  onCancel: () => void;
}

interface FormState {
  coverLetter: string;
  bidType: BidType;
  proposedAmount: string;
  currency: ProposalCurrency;
  hourlyRate: string;
  estimatedWeeklyHours: string;
  deliveryValue: string;
  deliveryUnit: ProposalDurationUnit;
  availability: ProposalAvailability;
  proposedStartDate: string;
  milestones: ProposalMilestone[];
  screeningAnswers: ProposalScreeningAnswer[];
  portfolioLinks: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Cover Letter',
  'Bid & Timeline',
  'Milestones',
  'Screening',
  'Files',
  'Review',
];

const AUTO_SAVE_DELAY_MS = 2500;

// ─── Validation ───────────────────────────────────────────────────────────────

function getValidationErrors(
  form: FormState,
  screeningQuestions: TenderScreeningQuestion[],
): string[] {
  const errors: string[] = [];
  if (!form.coverLetter || form.coverLetter.length < 50) {
    errors.push('Cover letter must be at least 50 characters');
  }
  if (!form.proposedAmount || parseFloat(form.proposedAmount) <= 0) {
    errors.push('Proposed amount must be greater than 0');
  }
  if (!form.deliveryValue || parseInt(form.deliveryValue) < 1) {
    errors.push('Delivery time is required');
  }
  if (!form.availability) {
    errors.push('Availability is required');
  }
  const requiredQs = screeningQuestions.filter((q) => q.required);
  for (const q of requiredQs) {
    const idx = screeningQuestions.indexOf(q);
    const answered = form.screeningAnswers[idx]?.answer?.trim();
    if (!answered) {
      errors.push(`Required screening question must be answered: "${q.question.slice(0, 60)}…"`);
    }
  }
  return errors;
}

function buildInitialForm(draft?: Proposal | null): FormState {
  if (!draft) {
    return {
      coverLetter: '',
      bidType: 'fixed',
      proposedAmount: '',
      currency: 'ETB',
      hourlyRate: '',
      estimatedWeeklyHours: '',
      deliveryValue: '',
      deliveryUnit: 'weeks',
      availability: 'flexible',
      proposedStartDate: '',
      milestones: [],
      screeningAnswers: [],
      portfolioLinks: [],
    };
  }
  return {
    coverLetter: draft.coverLetter ?? '',
    bidType: draft.bidType ?? 'fixed',
    proposedAmount: draft.proposedAmount ? String(draft.proposedAmount) : '',
    currency: draft.currency ?? 'ETB',
    hourlyRate: draft.hourlyRate ? String(draft.hourlyRate) : '',
    estimatedWeeklyHours: draft.estimatedWeeklyHours
      ? String(draft.estimatedWeeklyHours)
      : '',
    deliveryValue: draft.deliveryTime?.value ? String(draft.deliveryTime.value) : '',
    deliveryUnit: draft.deliveryTime?.unit ?? 'weeks',
    availability: draft.availability ?? 'flexible',
    proposedStartDate: draft.proposedStartDate ?? '',
    milestones: draft.milestones ?? [],
    screeningAnswers: draft.screeningAnswers ?? [],
    portfolioLinks: draft.portfolioLinks ?? [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProposalForm: React.FC<ProposalFormProps> = ({
  tender,
  existingDraft,
  onSuccess,
  onCancel,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;

  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(existingDraft?._id ?? null);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(existingDraft));
  const [attachments, setAttachments] = useState<ProposalAttachment[]>(
    existingDraft?.attachments ?? [],
  );
  const [showValidation, setShowValidation] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingDraft = useRef(false);

  const createDraftMutation = useCreateProposalDraft();
  const updateDraftMutation = useUpdateProposalDraft();
  const submitMutation = useSubmitProposal();
  const uploadMutation = useUploadProposalAttachment();
  const removeAttachmentMutation = useRemoveProposalAttachment();

  const screeningQuestions: TenderScreeningQuestion[] =
    tender.details?.screeningQuestions ?? [];

  // ── Ensure draft exists ───────────────────────────────────────────────────

  const ensureDraft = useCallback(async (): Promise<string | null> => {
    if (draftId) return draftId;
    if (creatingDraft.current) return null;
    creatingDraft.current = true;
    try {
      const draft = await createDraftMutation.mutateAsync({
        tenderId: tender._id,
        coverLetter: form.coverLetter.trim() || 'Draft in progress',
        bidType: form.bidType || 'fixed',
        proposedAmount: parseFloat(form.proposedAmount) || 0,
        deliveryTime: {
          value: parseInt(form.deliveryValue) || 1,
          unit: form.deliveryUnit,
        },
        availability: form.availability || 'flexible',
        currency: form.currency,
      });
      setDraftId(draft._id);
      creatingDraft.current = false;
      return draft._id;
    } catch {
      creatingDraft.current = false;
      return null;
    }
  }, [draftId, form, tender._id, createDraftMutation]);

  // ── Auto-save ─────────────────────────────────────────────────────────────

  const buildUpdatePayload = useCallback((): UpdateProposalData => {
    return {
      coverLetter: form.coverLetter,
      bidType: form.bidType,
      proposedAmount: parseFloat(form.proposedAmount) || 0,
      currency: form.currency,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
      estimatedWeeklyHours: form.estimatedWeeklyHours
        ? parseInt(form.estimatedWeeklyHours)
        : undefined,
      deliveryTime: {
        value: parseInt(form.deliveryValue) || 1,
        unit: form.deliveryUnit,
      },
      availability: form.availability,
      proposedStartDate: form.proposedStartDate || undefined,
      milestones: form.milestones,
      screeningAnswers: form.screeningAnswers,
      portfolioLinks: form.portfolioLinks.filter((l) => l.trim()),
    };
  }, [form]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      let id = draftId;
      if (!id) {
        id = await ensureDraft();
        if (!id) return;
      }
      setSaveState('saving');
      try {
        await updateDraftMutation.mutateAsync({
          proposalId: id,
          data: buildUpdatePayload(),
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    }, AUTO_SAVE_DELAY_MS);
  }, [draftId, ensureDraft, updateDraftMutation, buildUpdatePayload]);

  // Trigger auto-save when form changes
  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goNext = async () => {
    // Ensure draft is created before leaving step 0
    if (step === 0 && !draftId) {
      await ensureDraft();
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setShowValidation(true);
    const errors = getValidationErrors(form, screeningQuestions);
    if (errors.length > 0) return;

    let id = draftId;
    if (!id) {
      id = await ensureDraft();
      if (!id) {
        Alert.alert('Error', 'Could not create proposal draft. Please try again.');
        return;
      }
    }

    // Final save before submit
    try {
      await updateDraftMutation.mutateAsync({
        proposalId: id,
        data: buildUpdatePayload(),
      });
    } catch {
      // Continue even if final save fails — try to submit anyway
    }

    submitMutation.mutate(id, {
      onSuccess: (proposal) => {
        onSuccess(proposal._id);
      },
      onError: (err: Error) => {
        Alert.alert('Submission failed', err.message ?? 'Please try again.');
      },
    });
  };

  const handleSaveDraft = async () => {
    let id = draftId;
    if (!id) {
      id = await ensureDraft();
      if (!id) return;
    }
    setSaveState('saving');
    try {
      await updateDraftMutation.mutateAsync({
        proposalId: id,
        data: buildUpdatePayload(),
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
      Alert.alert('Draft saved', 'Your progress has been saved.');
    } catch {
      setSaveState('error');
    }
  };

  // ── Attachment handlers ───────────────────────────────────────────────────

  const handleUpload = async (uri: string, name: string, mimeType: string) => {
    let id = draftId;
    if (!id) {
      id = await ensureDraft();
      if (!id) {
        Alert.alert('Error', 'Draft not ready for attachments yet.');
        return;
      }
    }
    uploadMutation.mutate(
      { proposalId: id, fileUri: uri, fileName: name, mimeType, attachmentType: 'other' },
      {
        onSuccess: (response) => {
          setAttachments(response.attachments);
        },
        onError: (err: Error) => {
          Alert.alert('Upload failed', err.message ?? 'Could not upload file.');
        },
      },
    );
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!draftId) return;
    removeAttachmentMutation.mutate(
      { proposalId: draftId, attachmentId },
      {
        onSuccess: () => {
          setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
        },
      },
    );
  };

  // ── Form updaters ─────────────────────────────────────────────────────────

  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const validationErrors = getValidationErrors(form, screeningQuestions);
  const canSubmit = validationErrors.length === 0;

  // ── Step progress bar ─────────────────────────────────────────────────────

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressRow}>
        {STEP_LABELS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={label}>
              <View style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: active
                        ? '#F1BB03'
                        : done
                        ? '#10B981'
                        : colors.border,
                      borderColor: active ? '#F1BB03' : done ? '#10B981' : colors.border,
                    },
                  ]}
                >
                  {done ? (
                    <Text style={styles.progressDotCheck}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.progressDotNum,
                        { color: active ? '#0A2540' : colors.textMuted },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
              </View>
              {i < STEP_LABELS.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    { backgroundColor: done ? '#10B981' : colors.border },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
        Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.textMuted }]}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Submit Proposal
        </Text>
        <View style={styles.saveStateContainer}>
          {saveState === 'saving' && (
            <Text style={[styles.saveStateText, { color: '#D97706' }]}>Saving…</Text>
          )}
          {saveState === 'saved' && (
            <Text style={[styles.saveStateText, { color: '#059669' }]}>✓ Saved</Text>
          )}
          {saveState === 'error' && (
            <Text style={[styles.saveStateText, { color: '#EF4444' }]}>Save failed</Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress bar */}
          {renderProgressBar()}

          {/* Step content */}
          {step === 0 && (
            <Step1_CoverLetter
              coverLetter={form.coverLetter}
              onChange={(v) => updateForm({ coverLetter: v })}
              saveState={saveState}
              tenderTitle={tender.title}
            />
          )}

          {step === 1 && (
            <Step2_Pricing
              bidType={form.bidType}
              proposedAmount={form.proposedAmount}
              currency={form.currency}
              hourlyRate={form.hourlyRate}
              estimatedWeeklyHours={form.estimatedWeeklyHours}
              deliveryValue={form.deliveryValue}
              deliveryUnit={form.deliveryUnit}
              availability={form.availability}
              proposedStartDate={form.proposedStartDate}
              tenderBudget={tender.details?.budget ?? null}
              tenderEngagementType={tender.details?.engagementType}
              onBidTypeChange={(v) => updateForm({ bidType: v })}
              onAmountChange={(v) => updateForm({ proposedAmount: v })}
              onCurrencyChange={(v) => updateForm({ currency: v })}
              onHourlyRateChange={(v) => updateForm({ hourlyRate: v })}
              onWeeklyHoursChange={(v) => updateForm({ estimatedWeeklyHours: v })}
              onDeliveryValueChange={(v) => updateForm({ deliveryValue: v })}
              onDeliveryUnitChange={(v) => updateForm({ deliveryUnit: v })}
              onAvailabilityChange={(v) => updateForm({ availability: v })}
              onStartDateChange={(v) => updateForm({ proposedStartDate: v })}
            />
          )}

          {step === 2 && (
            <Step3_Milestones
              milestones={form.milestones}
              proposedAmount={parseFloat(form.proposedAmount) || 0}
              currency={form.currency}
              onMilestonesChange={(v) => updateForm({ milestones: v })}
            />
          )}

          {step === 3 && (
            <Step4_ScreeningAnswers
              questions={screeningQuestions}
              answers={form.screeningAnswers}
              onAnswersChange={(v) => updateForm({ screeningAnswers: v })}
              showValidation={showValidation}
            />
          )}

          {step === 4 && (
            <Step5_Attachments
              proposalId={draftId}
              attachments={attachments}
              portfolioLinks={form.portfolioLinks}
              onUpload={handleUpload}
              onDeleteAttachment={handleDeleteAttachment}
              onPortfolioLinksChange={(v) => updateForm({ portfolioLinks: v })}
              isUploading={uploadMutation.isPending}
            />
          )}

          {step === 5 && (
            <Step6_Review
              data={{
                coverLetter: form.coverLetter,
                bidType: form.bidType,
                proposedAmount: parseFloat(form.proposedAmount) || 0,
                currency: form.currency,
                deliveryTime: {
                  value: parseInt(form.deliveryValue) || 1,
                  unit: form.deliveryUnit,
                },
                availability: form.availability,
                proposedStartDate: form.proposedStartDate,
                milestones: form.milestones,
                screeningAnswers: form.screeningAnswers,
                attachments,
                portfolioLinks: form.portfolioLinks.filter((l) => l.trim()),
              }}
              tenderTitle={tender.title}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              isSubmitting={submitMutation.isPending}
              isSaving={updateDraftMutation.isPending}
              canSubmit={canSubmit}
              validationErrors={showValidation ? validationErrors : []}
            />
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Navigation footer (hidden on review step) */}
        {step < 5 && (
          <View
            style={[
              styles.navFooter,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}
          >
            {step > 0 ? (
              <TouchableOpacity
                onPress={goPrev}
                style={[styles.navBtn, styles.prevBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.prevBtnText, { color: colors.textSecondary }]}>
                  ← Back
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.navBtnPlaceholder} />
            )}

            <TouchableOpacity
              onPress={goNext}
              style={[styles.navBtn, styles.nextBtn]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {step === 4 ? 'Review →' : 'Continue →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 13, fontWeight: '500' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  saveStateContainer: { width: 64, alignItems: 'flex-end' },
  saveStateText: { fontSize: 11, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 24 },
  progressContainer: { gap: 8, marginBottom: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressStep: { alignItems: 'center' },
  progressDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  progressDotCheck: { color: '#fff', fontSize: 12, fontWeight: '800' },
  progressDotNum: { fontSize: 11, fontWeight: '700' },
  progressLine: { flex: 1, height: 2, borderRadius: 1 },
  progressLabel: { fontSize: 12, textAlign: 'center' },
  bottomSpacer: { height: 20 },
  navFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 14,
    borderTopWidth: 1,
    gap: 12,
  },
  navBtn: {
    flex: 1, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnPlaceholder: { flex: 1 },
  prevBtn: { borderWidth: 1.5, flex: 0.4 },
  prevBtnText: { fontSize: 15, fontWeight: '600' },
  nextBtn: { backgroundColor: '#F1BB03', flex: 1 },
  nextBtnText: { color: '#0A2540', fontSize: 15, fontWeight: '800' },
});

export default ProposalForm;