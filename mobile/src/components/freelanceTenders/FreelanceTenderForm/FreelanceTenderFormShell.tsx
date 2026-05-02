// mobile/src/components/freelanceTenders/FreelanceTenderForm/FreelanceTenderFormShell.tsx

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../store/themeStore';
import {
  useCreateFreelanceTender,
  useFreelanceTenderEditData,
  usePublishFreelanceTender,
  useUpdateFreelanceTender,
} from '../../../hooks/useFreelanceTender';
import type {
  EngagementType,
  ExperienceLevel,
  FreelanceTenderFormData,
  LocationType,
  ProjectType,
  TenderDetails,
} from '../../../types/freelanceTender';
import Step1Basics from './Step1Basics';
import Step2Details from './Step2Details';
import Step3Description from './Step3Description';
import Step4SkillsAttachments from './Step4SkillsAttachments';
import Step5Review from './Step5Review';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FreelanceTenderFormShellProps {
  /** If provided, form is in edit mode; pre-populates from API */
  tenderId?: string;
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

type SubmitAction = 'draft' | 'publish';

// ─── Default values ───────────────────────────────────────────────────────────

function defaultDetails(): TenderDetails {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  return {
    engagementType: 'fixed_price' as EngagementType,
    budget: { min: undefined, max: undefined, currency: 'ETB' },
    experienceLevel: 'intermediate' as ExperienceLevel,
    numberOfPositions: 1,
    projectType: 'one_time' as ProjectType,
    locationType: 'remote' as LocationType,
    urgency: 'normal',
    ndaRequired: false,
    portfolioRequired: false,
    screeningQuestions: [],
  };
}

function defaultFormData(): FreelanceTenderFormData {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  return {
    title: '',
    briefDescription: '',
    description: '',
    procurementCategory: '',
    skillsRequired: [],
    deadline: deadline.toISOString().slice(0, 16),
    details: defaultDetails(),
    attachmentFiles: [],
  };
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Description' },
  { id: 4, label: 'Skills' },
  { id: 5, label: 'Review' },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(
  step: number,
  data: FreelanceTenderFormData,
  description: string
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (step === 1) {
    if (!data.title.trim()) errs.title = 'Title is required';
    if (!data.procurementCategory) errs.procurementCategory = 'Category is required';
    if (!data.deadline) {
      errs.deadline = 'Deadline is required';
    } else {
      const d = new Date(data.deadline);
      if (isNaN(d.getTime())) errs.deadline = 'Invalid date format';
      else if (d <= new Date()) errs.deadline = 'Deadline must be in the future';
    }
  }
  if (step === 2) {
    const et = data.details.engagementType;
    if (!et) errs['details.engagementType'] = 'Engagement type is required';
    if (et === 'fixed_price') {
      if (data.details.budget?.min == null) errs['details.budget'] = 'Min budget is required';
      if (data.details.budget?.max == null) errs['details.budget'] = 'Max budget is required';
    }
    if (et === 'fixed_salary') {
      if (data.details.salaryRange?.min == null)
        errs['details.salaryRange'] = 'Min salary is required';
      if (data.details.salaryRange?.max == null)
        errs['details.salaryRange'] = 'Max salary is required';
    }
  }
  if (step === 3) {
    const plain = description.replace(/<[^>]+>/g, '').trim();
    if (plain.length < 100) errs.description = 'Description must be at least 100 characters';
  }
  return errs;
}

// ─── Main component ───────────────────────────────────────────────────────────

const FreelanceTenderFormShell: React.FC<FreelanceTenderFormShellProps> = ({
  tenderId,
  onSuccess,
  onCancel,
}) => {
  const isEdit = !!tenderId;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FreelanceTenderFormData>(defaultFormData());
  const [description, setDescription] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<
    Array<{ uri: string; name: string; mimeType: string; size?: number }>
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Hooks
  const { data: categories } = useFreelanceTenderCategories();
  const { data: editData } = useFreelanceTenderEditData(tenderId ?? '');
  const createMutation = useCreateFreelanceTender();
  const updateMutation = useUpdateFreelanceTender();
  const publishMutation = usePublishFreelanceTender();

  // Pre-populate for edit mode
  React.useEffect(() => {
    if (!editData) return;
    const t = editData as unknown as Record<string, unknown>;
    const dets = (t.details as TenderDetails | undefined) ?? defaultDetails();
    setFormData({
      title: (t.title as string) ?? '',
      briefDescription: (t.briefDescription as string) ?? '',
      description: (t.description as string) ?? '',
      procurementCategory: (t.procurementCategory as string) ?? '',
      skillsRequired: (t.skillsRequired as string[]) ?? [],
      maxApplications: t.maxApplications as number | undefined,
      deadline: t.deadline
        ? new Date(t.deadline as string).toISOString().slice(0, 16)
        : formData.deadline,
      details: dets,
      attachmentFiles: [],
    });
    setDescription((t.description as string) ?? '');
  }, [editData]);

  const patchFormData = useCallback(
    (patch: Partial<FreelanceTenderFormData>) => {
      setFormData((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  // Stepper navigation
  const goNext = () => {
    const errs = validateStep(currentStep, formData, description);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const goToStep = (step: number) => {
    setErrors({});
    setCurrentStep(step);
  };

  // Merge description into formData before submit
  const buildPayload = (): FreelanceTenderFormData => ({
    ...formData,
    description,
    attachmentFiles,
  });

  const handleSubmit = async (action: SubmitAction) => {
    // Validate all steps before submit
    let allErrors: Record<string, string> = {};
    for (let s = 1; s <= 4; s++) {
      allErrors = { ...allErrors, ...validateStep(s, formData, description) };
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const files = attachmentFiles.length > 0 ? attachmentFiles : undefined;

      let resultId: string;
      if (isEdit && tenderId) {
        const updated = await updateMutation.mutateAsync({ id: tenderId, data: payload, files });
        resultId = updated._id;
      } else {
        const created = await createMutation.mutateAsync({ data: payload, files });
        resultId = created._id;
      }

      if (action === 'publish') {
        await publishMutation.mutateAsync(resultId);
      }

      onSuccess(resultId);
    } catch {
      // Errors toasted by mutation hooks
    } finally {
      setSubmitting(false);
    }
  };

  const isMutating = submitting || createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  // ─── Render step content ────────────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Basics
            data={formData}
            onChange={patchFormData}
            errors={errors}
            categories={categories ?? {}}
          />
        );
      case 2:
        return (
          <Step2Details
            data={formData}
            onChange={patchFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <Step3Description
            data={formData}
            description={description}
            onChange={patchFormData}
            onDescriptionChange={setDescription}
            errors={errors}
          />
        );
      case 4:
        return (
          <Step4SkillsAttachments
            skillsRequired={formData.skillsRequired}
            attachmentFiles={attachmentFiles}
            onChange={patchFormData}
            onAttachmentsChange={setAttachmentFiles}
            errors={errors}
          />
        );
      case 5:
        return (
          <Step5Review
            data={formData}
            description={description}
            attachmentFiles={attachmentFiles}
            onEditStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  // ─── Stepper bar ────────────────────────────────────────────────────────────

  const StepperBar = () => (
    <View style={[styles.stepperRow, { borderBottomColor: c.border ?? c.textMuted + '22' }]}>
      {STEPS.map((step, idx) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <Pressable
              onPress={() => done && goToStep(step.id)}
              style={styles.stepItem}
              accessibilityRole="button"
              disabled={!done}
            >
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: done
                      ? c.success
                      : active
                      ? c.primary
                      : c.surface ?? c.card,
                    borderColor: done
                      ? c.success
                      : active
                      ? c.primary
                      : c.border ?? c.textMuted + '44',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepCircleText,
                    { color: done || active ? '#fff' : c.textMuted },
                  ]}
                >
                  {done ? '✓' : String(step.id)}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: active ? c.primary : done ? c.text : c.textMuted,
                    fontWeight: active ? '700' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </Pressable>
            {idx < STEPS.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  { backgroundColor: done ? c.success : c.border ?? c.textMuted + '33' },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );

  // ─── Footer buttons ─────────────────────────────────────────────────────────

  const Footer = () => (
    <View style={[styles.footer, { borderTopColor: c.border ?? c.textMuted + '22', backgroundColor: c.background ?? c.card }]}>
      {currentStep > 1 ? (
        <Pressable
          onPress={goBack}
          style={[styles.footerBtn, styles.footerBtnSecondary, { borderColor: c.textMuted + '55' }]}
          accessibilityRole="button"
          disabled={isMutating}
        >
          <Text style={[styles.footerBtnText, { color: c.textMuted }]}>← Back</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onCancel}
          style={[styles.footerBtn, styles.footerBtnSecondary, { borderColor: c.textMuted + '55' }]}
          accessibilityRole="button"
        >
          <Text style={[styles.footerBtnText, { color: c.textMuted }]}>Cancel</Text>
        </Pressable>
      )}

      {currentStep < STEPS.length ? (
        <Pressable
          onPress={goNext}
          style={[styles.footerBtn, styles.footerBtnPrimary, { backgroundColor: c.primary }]}
          accessibilityRole="button"
        >
          <Text style={styles.footerBtnPrimaryText}>
            {currentStep === STEPS.length - 1 ? 'Review →' : 'Continue →'}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.submitGroup}>
          <Pressable
            onPress={() => handleSubmit('draft')}
            disabled={isMutating}
            style={[
              styles.footerBtn,
              styles.footerBtnSecondary,
              { borderColor: c.primary + '66', flex: 1 },
            ]}
            accessibilityRole="button"
          >
            {isMutating ? (
              <ActivityIndicator color={c.primary} size="small" />
            ) : (
              <Text style={[styles.footerBtnText, { color: c.primary }]}>Save Draft</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => handleSubmit('publish')}
            disabled={isMutating}
            style={[
              styles.footerBtn,
              styles.footerBtnPrimary,
              { backgroundColor: c.primary, flex: 1.5 },
            ]}
            accessibilityRole="button"
          >
            {isMutating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.footerBtnPrimaryText}>
                {isEdit ? 'Save & Publish' : 'Publish'}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );

  // ─── Root render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: c.background ?? c.card }]}
      edges={['top', 'bottom']}
    >
      <StepperBar />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step heading */}
          <View style={styles.stepHeader}>
            <Text style={[styles.stepHeadingSmall, { color: c.textMuted }]}>
              Step {currentStep} of {STEPS.length}
            </Text>
            <Text style={[styles.stepHeading, { color: c.text }]}>
              {STEPS[currentStep - 1].label}
            </Text>
          </View>

          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.3, maxWidth: 52 },
  stepConnector: { flex: 1, height: 1.5, marginHorizontal: 4, marginBottom: 14 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stepHeader: { marginBottom: 24 },
  stepHeadingSmall: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  stepHeading: { fontSize: 22, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnSecondary: { borderWidth: 1 },
  footerBtnPrimary: {},
  footerBtnText: { fontSize: 15, fontWeight: '600' },
  footerBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submitGroup: { flex: 1, flexDirection: 'row', gap: 10 },
});

export default FreelanceTenderFormShell;

function useFreelanceTenderCategories(): { data: any; } {
    throw new Error('Function not implemented.');
}
