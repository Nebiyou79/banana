// src/components/professionalTenders/ProfessionalTenderForm/index.tsx
// FULLY REFACTORED: Premium Mint-themed shell with useTheme(), proper insets, reusable components

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Save, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import {
  useCreateProfessionalTender,
  useProfessionalTenderEditData,
  useUpdateProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import {
  buildEmptyFormValues,
  professionalTenderFormSchema,
  STEP_DEFINITIONS,
  STEP_FIELDS,
  toCreatePayload,
  type ProfessionalTenderFormValues,
  type StepIndex,
} from './formSchema';

import Step1_BasicInfo from './Step1_BasicInfo';
import Step2_Procurement from './Step2_Procurement';
import Step3_EligibilityEvaluation from './Step3_EligibilityEvaluation';
import Step4_DatesDocuments, { type StagedFile } from './Step4_DatesDocuments';
import Step5_Review from './Step5_Review';

// ═════════════════════════════════════════════════════════════════════════════
// PROPS
// ═════════════════════════════════════════════════════════════════════════════

export interface ProfessionalTenderFormProps {
  tenderId?: string;
  onSuccess: (id: string) => void;
  onCancel: () => void;
  onRedirectToAddendum?: (tenderId: string) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// PREMIUM STEP INDICATOR
// ═════════════════════════════════════════════════════════════════════════════

const StepIndicator: React.FC<{
  current: StepIndex;
  onJump: (idx: StepIndex) => void;
  highestVisited: StepIndex;
}> = ({ current, onJump, highestVisited }) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        stepperStyles.row,
        { paddingHorizontal: spacing.md },
      ]}
    >
      {STEP_DEFINITIONS.map((def, i) => {
        const isActive = def.index === current;
        const isDone = def.index < current;
        const visitable = def.index <= highestVisited;

        return (
          <React.Fragment key={def.index}>
            <Pressable
              onPress={() => visitable && onJump(def.index)}
              disabled={!visitable}
              style={({ pressed }) => [
                stepperStyles.itemBlock,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled: !visitable }}
              accessibilityLabel={`Step ${def.index}: ${def.title}`}
            >
              <View
                style={[
                  stepperStyles.dot,
                  {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDone
                      ? colors.success
                      : isActive
                      ? `${colors.primary}18`
                      : 'transparent',
                    borderColor: isDone
                      ? colors.success
                      : isActive
                      ? colors.primary
                      : colors.border,
                    borderWidth: 2,
                  },
                  isActive && stepperStyles.activeDot,
                ]}
              >
                {isDone ? (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      stepperStyles.dotNum,
                      {
                        color: isActive ? colors.primary : colors.textMuted,
                        fontWeight: isActive ? '700' : '600',
                      },
                    ]}
                  >
                    {def.index}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  stepperStyles.itemLabel,
                  {
                    color: isActive
                      ? colors.primary
                      : isDone
                      ? colors.textSecondary
                      : colors.textMuted,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {def.shortTitle}
              </Text>
            </Pressable>
            {i < STEP_DEFINITIONS.length - 1 && (
              <View
                style={[
                  stepperStyles.connector,
                  {
                    backgroundColor: isDone ? colors.success : colors.border,
                    height: 2,
                    flex: 1,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const ProfessionalTenderForm: React.FC<ProfessionalTenderFormProps> = ({
  tenderId,
  onSuccess,
  onCancel,
  onRedirectToAddendum,
}) => {
  const isEdit = !!tenderId;
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const methods = useForm<ProfessionalTenderFormValues>({
    resolver: zodResolver(professionalTenderFormSchema) as any,
    defaultValues: buildEmptyFormValues(),
    mode: 'onChange',
  });

  const [step, setStep] = useState<StepIndex>(1);
  const [highestVisited, setHighestVisited] = useState<StepIndex>(1);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  const { data: editData, isLoading: editLoading, error: editError } =
    useProfessionalTenderEditData(tenderId, { enabled: isEdit });

  useEffect(() => {
    if (!isEdit || !editData) return;
    if (editData.status !== 'draft') {
      const id = editData._id;
      if (onRedirectToAddendum) {
        onRedirectToAddendum(id);
      } else {
        Alert.alert(
          'Cannot edit published tender',
          'Tenders can only be edited while in Draft status. Use the Addendum system to amend a published tender.',
          [{ text: 'OK', onPress: onCancel }],
        );
      }
    }
  }, [isEdit, editData, onRedirectToAddendum, onCancel]);

  useEffect(() => {
    if (!isEdit || !editData) return;
    if (editData.status !== 'draft') return;

    const hydrateInvited = (raw: any): string[] => {
      if (!Array.isArray(raw)) return [];
      return raw
        .map((entry) =>
          typeof entry === 'string'
            ? entry
            : entry?.companyId ?? entry?._id ?? entry?.company?._id ?? null,
        )
        .filter((x): x is string => typeof x === 'string' && x.length > 0);
    };

    const invited = hydrateInvited(
      (editData as any).invitedCompanies ?? (editData as any).invitations,
    );

    methods.reset({
      title: editData.title ?? '',
      briefDescription: editData.briefDescription ?? '',
      description: editData.description ?? '',
      procurementCategory: editData.procurementCategory ?? '',
      tenderType: editData.tenderType ?? 'services',
      workflowType: editData.workflowType ?? 'open',
      visibilityType: editData.visibilityType ?? 'public',
      referenceNumber: editData.referenceNumber ?? '',
      invitedCompanies: invited,
      procurement: {
        procuringEntity: editData.procurement?.procuringEntity ?? '',
        procurementMethod: editData.procurement?.procurementMethod ?? 'open_tender',
        fundingSource: editData.procurement?.fundingSource ?? '',
        bidSecurityAmount: editData.procurement?.bidSecurityAmount,
        bidSecurityCurrency: editData.procurement?.bidSecurityCurrency ?? 'ETB',
        contactPerson: {
          name: editData.procurement?.contactPerson?.name ?? '',
          email: editData.procurement?.contactPerson?.email ?? '',
          phone: editData.procurement?.contactPerson?.phone ?? '',
          position: editData.procurement?.contactPerson?.position ?? '',
        },
      },
      cpoRequired: !!editData.cpoRequired,
      cpoDescription: editData.cpoDescription ?? '',
      cpoAmount: (editData as any).cpoAmount,
      cpoCurrency: (editData as any).cpoCurrency ?? 'ETB',
      eligibility: {
        minimumExperience: editData.eligibility?.minimumExperience,
        requiredCertifications: editData.eligibility?.requiredCertifications ?? [],
        legalRegistrationRequired: !!editData.eligibility?.legalRegistrationRequired,
      },
      scope: { description: editData.scope?.description ?? '' },
      evaluation: {
        evaluationMethod: editData.evaluation?.evaluationMethod ?? 'combined',
        technicalWeight: editData.evaluation?.technicalWeight ?? 70,
        financialWeight: editData.evaluation?.financialWeight ?? 30,
        criteria: editData.evaluation?.criteria ?? '',
      },
      deadline: editData.deadline ?? '',
      bidOpeningDate: editData.bidOpeningDate ?? '',
      clarificationDeadline: editData.clarificationDeadline ?? '',
      preBidMeeting: {
        enabled: !!editData.preBidMeeting,
        date: editData.preBidMeeting?.date ?? '',
        location: editData.preBidMeeting?.location ?? '',
        onlineLink: editData.preBidMeeting?.onlineLink ?? '',
        mandatory: !!editData.preBidMeeting?.mandatory,
      },
    });
  }, [isEdit, editData, methods]);

  const createMut = useCreateProfessionalTender();
  const updateMut = useUpdateProfessionalTender();
  const isSubmitting = createMut.isPending || updateMut.isPending;

  const goNext = useCallback(async () => {
    const fieldsToValidate = STEP_FIELDS[step];
    const ok =
      fieldsToValidate.length === 0
        ? true
        : await methods.trigger(fieldsToValidate as any, { shouldFocus: true });
    if (!ok) return;
    const next = Math.min(step + 1, STEP_DEFINITIONS.length) as StepIndex;
    setStep(next);
    if (next > highestVisited) setHighestVisited(next);
  }, [step, methods, highestVisited]);

  const goBack = useCallback(() => {
    const prev = Math.max(step - 1, 1) as StepIndex;
    setStep(prev);
  }, [step]);

  const goToStep = useCallback(
    (target: StepIndex) => {
      if (target > highestVisited) return;
      setStep(target);
    },
    [highestVisited],
  );

  const handleSubmit = useCallback(
    async (status: 'draft' | 'published') => {
      if (status === 'published') {
        const ok = await methods.trigger(undefined, { shouldFocus: true });
        if (!ok) {
          const errs = methods.formState.errors;
          for (const def of STEP_DEFINITIONS) {
            const stepFields = STEP_FIELDS[def.index];
            const hasError = stepFields.some((f) => (errs as any)[f]);
            if (hasError) {
              setStep(def.index);
              if (def.index > highestVisited) setHighestVisited(def.index);
              break;
            }
          }
          return;
        }
      }

      const values = methods.getValues();
      const payload = { ...toCreatePayload(values), status } as Parameters<
        typeof createMut.mutateAsync
      >[0]['data'];

      try {
        if (isEdit && tenderId) {
          const updated = await updateMut.mutateAsync({
            id: tenderId,
            data: payload,
            files: stagedFiles,
          });
          onSuccess(updated._id);
        } else {
          const created = await createMut.mutateAsync({
            data: payload,
            files: stagedFiles,
          });
          onSuccess(created._id);
        }
      } catch (err: any) {
        Alert.alert(
          status === 'draft' ? 'Save failed' : 'Publish failed',
          err?.message ?? 'Something went wrong. Please try again.',
        );
      }
    },
    [methods, isEdit, tenderId, stagedFiles, createMut, updateMut, onSuccess, highestVisited],
  );

  if (isEdit && editLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading tender…
        </Text>
      </View>
    );
  }

  if (isEdit && editError) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {(editError as any)?.message ?? 'Failed to load tender data.'}
        </Text>
        <Pressable
          onPress={onCancel}
          style={[
            styles.btn,
            styles.btnSecondary,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.btnLabel, { color: colors.text }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FormProvider {...methods}>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: insets.top + spacing.md,
              paddingBottom: spacing.md,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {isEdit ? 'Edit Draft Tender' : 'New Professional Tender'}
          </Text>
          <Text
            style={[styles.subtitle, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            Step {step} of {STEP_DEFINITIONS.length} · {STEP_DEFINITIONS[step - 1].title}
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <StepIndicator
              current={step}
              onJump={goToStep}
              highestVisited={highestVisited}
            />
          </View>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={[
            styles.body,
            { padding: spacing.lg, paddingBottom: spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && <Step1_BasicInfo />}
          {step === 2 && <Step2_Procurement />}
          {step === 3 && <Step3_EligibilityEvaluation />}
          {step === 4 && (
            <Step4_DatesDocuments
              files={stagedFiles}
              onFilesChange={setStagedFiles}
            />
          )}
          {step === 5 && <Step5_Review files={stagedFiles} />}
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.bgCard,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
              ...shadows.md,
            },
          ]}
        >
          {step === 1 ? (
            <Pressable
              onPress={onCancel}
              style={[
                styles.btn,
                styles.btnSecondary,
                {
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  height: 52,
                  flex: 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go back"
            >
              <Text style={[styles.btnLabel, { color: colors.text }]}>Cancel</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={goBack}
              style={[
                styles.btn,
                styles.btnSecondary,
                {
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  height: 52,
                  flex: 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go to previous step"
            >
              <ChevronLeft size={16} color={colors.text} strokeWidth={2.5} />
              <Text style={[styles.btnLabel, { color: colors.text }]}>Back</Text>
            </Pressable>
          )}

          {step < STEP_DEFINITIONS.length ? (
            <Pressable
              onPress={goNext}
              disabled={isSubmitting}
              style={[
                styles.btn,
                styles.btnPrimary,
                {
                  backgroundColor: isSubmitting ? colors.textDisabled : colors.primary,
                  borderRadius: radius.lg,
                  height: 52,
                  flex: 1,
                  ...shadows.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go to next step"
            >
              <Text style={[styles.btnLabel, { color: '#FFFFFF' }]}>Next</Text>
              <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          ) : (
            <View style={styles.submitGroup}>
              <Pressable
                onPress={() => handleSubmit('draft')}
                disabled={isSubmitting}
                style={[
                  styles.btn,
                  styles.btnSecondary,
                  {
                    borderColor: colors.primary,
                    borderWidth: 1.5,
                    borderRadius: radius.lg,
                    height: 52,
                    flex: 0.5,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save as draft"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Save size={16} color={colors.primary} strokeWidth={2.5} />
                )}
                <Text style={[styles.btnLabel, { color: colors.primary }]}>
                  Save Draft
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleSubmit('published')}
                disabled={isSubmitting}
                style={[
                  styles.btn,
                  styles.btnPublish,
                  {
                    backgroundColor: isSubmitting ? colors.textDisabled : colors.success,
                    borderRadius: radius.lg,
                    height: 52,
                    flex: 0.5,
                    ...shadows.md,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Publish tender now"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={16} color="#FFFFFF" strokeWidth={2.5} />
                )}
                <Text style={[styles.btnLabel, { color: '#FFFFFF' }]}>Publish</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </FormProvider>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 13 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 6 },

  header: { borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  bodyScroll: { flex: 1 },
  body: {},

  footer: { flexDirection: 'row', gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  btnPrimary: {},
  btnSecondary: { borderWidth: 1.5 },
  btnPublish: {},
  btnLabel: { fontSize: 14, fontWeight: '700' },
  submitGroup: { flex: 1, flexDirection: 'row', gap: 8 },
});

const stepperStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  itemBlock: { alignItems: 'center', gap: 4, paddingHorizontal: 4, minWidth: 60 },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    shadowColor: '#2DD4A0',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  dotNum: { fontSize: 13 },
  itemLabel: { fontSize: 10 },
  connector: { marginHorizontal: 4, marginBottom: 16 },
});

export default ProfessionalTenderForm;
export { type StagedFile };