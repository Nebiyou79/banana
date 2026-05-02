// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  The 5-step ProfessionalTenderForm shell (post-refactor).
//
//  Step map:
//    1. Step1_BasicInfo           — identity + category picker + ref-num generator + invitees
//    2. Step2_Procurement         — procurement.* + CPO subsection
//    3. Step3_EligibilityEvaluation — eligibility + scope + evaluation
//    4. Step4_DatesDocuments      — dates + preBidMeeting (P-14 root) + files
//    5. Step5_Review              — summary
//
//  Owns:
//   • RHF + zod resolver + FormProvider
//   • Step state + per-step trigger() validation
//   • Edit-mode pre-fill via useProfessionalTenderEditData + reset()
//   • Edit-lock redirect when status !== 'draft'
//   • Staged files (kept outside RHF) — passed into Step 4 (picker) and Step 5 (review)
//   • Dual-action submit: Save Draft / Publish
// ─────────────────────────────────────────────────────────────────────────────

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

import { useThemeStore } from '../../../store/themeStore';
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

import Step1_BasicInfo            from './Step1_BasicInfo';
import Step2_Procurement          from './Step2_Procurement';
import Step3_EligibilityEvaluation from './Step3_EligibilityEvaluation';
import Step4_DatesDocuments, { type StagedFile } from './Step4_DatesDocuments';
import Step5_Review               from './Step5_Review';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export interface ProfessionalTenderFormProps {
  tenderId?: string;
  onSuccess: (id: string) => void;
  onCancel: () => void;
  onRedirectToAddendum?: (tenderId: string) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  STEPPER
// ═════════════════════════════════════════════════════════════════════════════

const Stepper: React.FC<{
  current: StepIndex;
  onJump: (idx: StepIndex) => void;
  highestVisited: StepIndex;
}> = ({ current, onJump, highestVisited }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { active: '#60A5FA', done: '#34D399', idle: '#475569', bgActive: '#1E3A5F', bgDone: '#022C22', bgIdle: '#0F172A', text: '#F1F5F9', textMute: '#94A3B8' }
    : { active: '#2563EB', done: '#16A34A', idle: '#94A3B8', bgActive: '#DBEAFE', bgDone: '#D1FAE5', bgIdle: '#F1F5F9', text: '#0F172A', textMute: '#64748B' };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={stepperStyles.row}
    >
      {STEP_DEFINITIONS.map((def, i) => {
        const isActive = def.index === current;
        const isDone = def.index < current;
        const visitable = def.index <= highestVisited;
        const dotBg = isDone ? palette.bgDone : isActive ? palette.bgActive : palette.bgIdle;
        const dotFg = isDone ? palette.done   : isActive ? palette.active   : palette.idle;
        return (
          <React.Fragment key={def.index}>
            <Pressable
              onPress={() => visitable && onJump(def.index)}
              disabled={!visitable}
              style={({ pressed }: { pressed: boolean }) => [
                stepperStyles.itemBlock,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled: !visitable }}
              accessibilityLabel={`Step ${def.index}: ${def.title}`}
            >
              <View style={[stepperStyles.dot, { backgroundColor: dotBg, borderColor: dotFg }]}>
                {isDone ? (
                  <Check size={14} color={dotFg} strokeWidth={3} />
                ) : (
                  <Text style={[stepperStyles.dotNum, { color: dotFg }]}>{def.index}</Text>
                )}
              </View>
              <Text
                style={[
                  stepperStyles.itemLabel,
                  { color: isActive ? dotFg : palette.textMute },
                ]}
                numberOfLines={1}
              >
                {def.shortTitle}
              </Text>
            </Pressable>
            {i < STEP_DEFINITIONS.length - 1 && (
              <View style={[stepperStyles.connector, { backgroundColor: isDone ? palette.done : palette.idle }]} />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════

const ProfessionalTenderForm: React.FC<ProfessionalTenderFormProps> = ({
  tenderId,
  onSuccess,
  onCancel,
  onRedirectToAddendum,
}) => {
  const isEdit = !!tenderId;
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { background: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', textMuted: '#94A3B8', primary: '#60A5FA', primaryFg: '#0F172A', secondary: '#334155', secondaryFg: '#F1F5F9', success: '#22C55E', successFg: '#FFFFFF' }
      : { background: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textMuted: '#64748B', primary: '#2563EB', primaryFg: '#FFFFFF', secondary: '#E2E8F0', secondaryFg: '#0F172A', success: '#16A34A', successFg: '#FFFFFF' },
    [isDark],
  );

  const methods = useForm<ProfessionalTenderFormValues>({
    resolver: zodResolver(professionalTenderFormSchema) as any,
    defaultValues: buildEmptyFormValues(),
    mode: 'onChange',
  });

  const [step, setStep] = useState<StepIndex>(1);
  const [highestVisited, setHighestVisited] = useState<StepIndex>(1);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  // ─── Edit-mode data fetch ───────────────────────────────────────────────
  const { data: editData, isLoading: editLoading, error: editError } =
    useProfessionalTenderEditData(tenderId, { enabled: isEdit });

  // ─── Edit-lock redirect ─────────────────────────────────────────────────
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

  // ─── Pre-fill on edit-data arrival ──────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !editData) return;
    if (editData.status !== 'draft') return;

    // Hydrate invitedCompanies from any of: invitedCompanies[], invitations[].companyId, etc.
    // We accept either a string array or an array of objects with ._id / .companyId / .company.
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
      title:               editData.title ?? '',
      briefDescription:    editData.briefDescription ?? '',
      description:         editData.description ?? '',
      procurementCategory: editData.procurementCategory ?? '',
      tenderType:          editData.tenderType ?? 'services',
      // P-01: workflowType only — ignore any legacy biddingType
      workflowType:        editData.workflowType ?? 'open',
      visibilityType:      editData.visibilityType ?? 'public',
      referenceNumber:     editData.referenceNumber ?? '',
      invitedCompanies:    invited,

      procurement: {
        procuringEntity:     editData.procurement?.procuringEntity ?? '',
        procurementMethod:   editData.procurement?.procurementMethod ?? 'open_tender',
        fundingSource:       editData.procurement?.fundingSource ?? '',
        bidSecurityAmount:   editData.procurement?.bidSecurityAmount,
        bidSecurityCurrency: editData.procurement?.bidSecurityCurrency ?? 'ETB',
        contactPerson: {
          name:     editData.procurement?.contactPerson?.name ?? '',
          email:    editData.procurement?.contactPerson?.email ?? '',
          phone:    editData.procurement?.contactPerson?.phone ?? '',
          position: editData.procurement?.contactPerson?.position ?? '',
        },
      },
      cpoRequired:    !!editData.cpoRequired,
      cpoDescription: editData.cpoDescription ?? '',
      cpoAmount:      (editData as any).cpoAmount,
      cpoCurrency:    (editData as any).cpoCurrency ?? 'ETB',

      eligibility: {
        minimumExperience:         editData.eligibility?.minimumExperience,
        requiredCertifications:    editData.eligibility?.requiredCertifications ?? [],
        legalRegistrationRequired: !!editData.eligibility?.legalRegistrationRequired,
      },
      scope: { description: editData.scope?.description ?? '' },
      evaluation: {
        evaluationMethod: editData.evaluation?.evaluationMethod ?? 'combined',
        technicalWeight:  editData.evaluation?.technicalWeight ?? 70,
        financialWeight:  editData.evaluation?.financialWeight ?? 30,
        criteria:         editData.evaluation?.criteria ?? '',
      },

      deadline:              editData.deadline ?? '',
      bidOpeningDate:        editData.bidOpeningDate ?? '',
      clarificationDeadline: editData.clarificationDeadline ?? '',
      // P-14: preBidMeeting is at ROOT of the response
      preBidMeeting: {
        enabled:    !!editData.preBidMeeting,
        date:       editData.preBidMeeting?.date ?? '',
        location:   editData.preBidMeeting?.location ?? '',
        onlineLink: editData.preBidMeeting?.onlineLink ?? '',
        mandatory:  !!editData.preBidMeeting?.mandatory,
      },
    });
  }, [isEdit, editData, methods]);

  // ─── Mutations ──────────────────────────────────────────────────────────
  const createMut = useCreateProfessionalTender();
  const updateMut = useUpdateProfessionalTender();
  const isSubmitting = createMut.isPending || updateMut.isPending;

  // ─── Step navigation ────────────────────────────────────────────────────
  const goNext = useCallback(async () => {
    const fieldsToValidate = STEP_FIELDS[step];
    const ok = fieldsToValidate.length === 0
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

  const goToStep = useCallback((target: StepIndex) => {
    if (target > highestVisited) return;
    setStep(target);
  }, [highestVisited]);

  // ─── Submit ─────────────────────────────────────────────────────────────
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
      const payload = { ...toCreatePayload(values), status } as
        Parameters<typeof createMut.mutateAsync>[0]['data'];

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

  // ─── Loading / error states ─────────────────────────────────────────────
  if (isEdit && editLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={[styles.loadingText, { color: palette.textMuted }]}>Loading tender…</Text>
      </View>
    );
  }

  if (isEdit && editError) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.background }]}>
        <Text style={[styles.errorText, { color: palette.text }]}>
          {(editError as any)?.message ?? 'Failed to load tender data.'}
        </Text>
        <Pressable
          onPress={onCancel}
          style={[styles.btn, styles.btnSecondary, { backgroundColor: palette.secondary }]}
        >
          <Text style={[styles.btnLabel, { color: palette.secondaryFg }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <FormProvider {...methods}>
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.title, { color: palette.text }]}>
            {isEdit ? 'Edit Draft Tender' : 'New Professional Tender'}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
            Step {step} of {STEP_DEFINITIONS.length} · {STEP_DEFINITIONS[step - 1].title}
          </Text>
          <View style={styles.stepperWrap}>
            <Stepper current={step} onJump={goToStep} highestVisited={highestVisited} />
          </View>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.body}
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
        <View style={[styles.footer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {step === 1 ? (
            <Pressable
              onPress={onCancel}
              style={[styles.btn, styles.btnSecondary, { backgroundColor: palette.secondary }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go back"
            >
              <Text style={[styles.btnLabel, { color: palette.secondaryFg }]}>Cancel</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={goBack}
              style={[styles.btn, styles.btnSecondary, { backgroundColor: palette.secondary }]}
              accessibilityRole="button"
              accessibilityLabel="Go to previous step"
            >
              <ChevronLeft size={16} color={palette.secondaryFg} strokeWidth={2.5} />
              <Text style={[styles.btnLabel, { color: palette.secondaryFg }]}>Back</Text>
            </Pressable>
          )}

          {step < STEP_DEFINITIONS.length ? (
            <Pressable
              onPress={goNext}
              disabled={isSubmitting}
              style={[
                styles.btn,
                styles.btnPrimary,
                { backgroundColor: palette.primary, opacity: isSubmitting ? 0.6 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go to next step"
            >
              <Text style={[styles.btnLabel, { color: palette.primaryFg }]}>Next</Text>
              <ChevronRight size={16} color={palette.primaryFg} strokeWidth={2.5} />
            </Pressable>
          ) : (
            <View style={styles.submitGroup}>
              <Pressable
                onPress={() => handleSubmit('draft')}
                disabled={isSubmitting}
                style={[
                  styles.btn,
                  styles.btnSecondary,
                  { backgroundColor: palette.secondary, opacity: isSubmitting ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save as draft"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={palette.secondaryFg} />
                ) : (
                  <Save size={16} color={palette.secondaryFg} strokeWidth={2.5} />
                )}
                <Text style={[styles.btnLabel, { color: palette.secondaryFg }]}>Save Draft</Text>
              </Pressable>
              <Pressable
                onPress={() => handleSubmit('published')}
                disabled={isSubmitting}
                style={[
                  styles.btn,
                  styles.btnPublish,
                  { backgroundColor: palette.success, opacity: isSubmitting ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Publish tender now"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={palette.successFg} />
                ) : (
                  <Send size={16} color={palette.successFg} strokeWidth={2.5} />
                )}
                <Text style={[styles.btnLabel, { color: palette.successFg }]}>Publish</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </FormProvider>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 13 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 6 },

  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, gap: 4 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  stepperWrap: { marginTop: 12 },

  bodyScroll: { flex: 1 },
  body: { padding: 16, paddingBottom: 32 },

  footer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    flex: 1,
  },
  btnPrimary: {},
  btnSecondary: {},
  btnPublish: {},
  btnLabel: { fontSize: 14, fontWeight: '700' },
  submitGroup: { flex: 2, flexDirection: 'row', gap: 8 },
});

const stepperStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  itemBlock: { alignItems: 'center', gap: 4, paddingHorizontal: 4, minWidth: 64 },
  dot: {
    width: 28, height: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  dotNum: { fontSize: 12, fontWeight: '800' },
  itemLabel: { fontSize: 10, fontWeight: '600' },
  connector: { width: 16, height: 2, opacity: 0.4 },
});

export default ProfessionalTenderForm;
export { type StagedFile };