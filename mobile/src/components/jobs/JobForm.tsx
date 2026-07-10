// src/components/jobs/JobForm.tsx
// REFACTORED: Premium Mint-themed redesign with full theme integration,
// improved visual hierarchy, modern inputs, polished step indicator,
// better typography, responsive layout fixes, and microinteractions.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown } from 'lucide-react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { SelectPicker } from '../ui/SelectPicker';
import { TagInput } from '../ui/TagInput';
import { FormField } from '../ui/FormField';
import {
  Job,
  CreateJobData,
  ETHIOPIAN_REGIONS,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  SALARY_MODES,
  EDUCATION_LEVELS,
  JOB_CATEGORY_OPTIONS,
} from '../../services/jobService';

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_CATEGORIES = JOB_CATEGORY_OPTIONS;

const WORK_ARRANGEMENTS = [
  { value: 'office', label: 'Office Based' },
  { value: 'field-work', label: 'Field Work' },
  { value: 'both', label: 'Office & Field' },
];

const REMOTE_OPTIONS = [
  { value: 'on-site', label: 'On-Site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Fully Remote' },
];

const CURRENCIES = [
  { value: 'ETB', label: 'ETB' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

const SALARY_PERIODS = [
  { value: 'monthly', label: 'Per Month' },
  { value: 'yearly', label: 'Per Year' },
  { value: 'daily', label: 'Per Day' },
  { value: 'hourly', label: 'Per Hour' },
];

const DEMOGRAPHIC_SEX = [
  { value: 'any', label: 'Any' },
  { value: 'male', label: 'Male Only' },
  { value: 'female', label: 'Female Only' },
];

const STEPS = ['Basic Info', 'Details', 'Salary & Location', 'Preview'];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const jobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  shortDescription: z.string().max(200).optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Job type is required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  educationLevel: z.string().optional(),
  candidatesNeeded: z.string().min(1).transform((v) => parseInt(v) || 1),
  region: z.string().min(1, 'Region is required'),
  city: z.string().optional(),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
  specificLocation: z.string().optional(),
  locationLat: z.string().optional(),
  locationLng: z.string().optional(),
  applicationDeadline: z.string().min(1, 'Deadline is required'),
  salaryMode: z.string().min(1),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.string().optional(),
  remote: z.string().optional(),
  workArrangement: z.string().optional(),
  isApplyEnabled: z.boolean().default(true),
  demographicSex: z.string().optional(),
  jobNumber: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
  urgent: z.boolean().default(false),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: CreateJobData, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const toFormValues = (job: Job): Partial<JobFormValues> => ({
  title: job.title ?? '',
  description: job.description ?? '',
  shortDescription: job.shortDescription ?? '',
  category: job.category ?? '',
  type: job.type ?? 'full-time',
  experienceLevel: job.experienceLevel ?? 'mid-level',
  educationLevel: job.educationLevel ?? '',
  candidatesNeeded: String(job.candidatesNeeded ?? 1) as any,
  region: job.location?.region ?? 'addis-ababa',
  city: job.location?.city ?? '',
  subCity: job.location?.subCity ?? '',
  woreda: job.location?.woreda ?? '',
  specificLocation: job.location?.specificLocation ?? '',
  locationLat: job.location?.coordinates?.coordinates
    ? String(job.location.coordinates.coordinates[1])
    : '',
  locationLng: job.location?.coordinates?.coordinates
    ? String(job.location.coordinates.coordinates[0])
    : '',
  applicationDeadline: job.applicationDeadline
    ? new Date(job.applicationDeadline).toISOString().split('T')[0]
    : tomorrowISO(),
  salaryMode: job.salaryMode ?? 'range',
  salaryMin: job.salary?.min ? String(job.salary.min) : '',
  salaryMax: job.salary?.max ? String(job.salary.max) : '',
  salaryCurrency: job.salary?.currency ?? 'ETB',
  salaryPeriod: job.salary?.period ?? 'monthly',
  remote: job.remote ?? 'on-site',
  workArrangement: job.workArrangement ?? 'office',
  isApplyEnabled: job.isApplyEnabled ?? true,
  demographicSex: job.demographicRequirements?.sex ?? 'any',
  jobNumber: job.jobNumber ?? '',
  requirements: job.requirements?.filter(Boolean) ?? [],
  skills: job.skills?.filter(Boolean) ?? [],
  responsibilities: job.responsibilities?.filter(Boolean) ?? [],
  benefits: job.benefits?.filter(Boolean) ?? [],
  featured: job.featured ?? false,
  urgent: job.urgent ?? false,
});

const toCreateData = (vals: JobFormValues): CreateJobData => {
  const lat = parseFloat(vals.locationLat ?? '');
  const lng = parseFloat(vals.locationLng ?? '');
  const hasCoords = !isNaN(lat) && !isNaN(lng);
  return {
    title: vals.title,
    description: vals.description,
    shortDescription: vals.shortDescription,
    category: vals.category,
    type: vals.type as any,
    experienceLevel: vals.experienceLevel as any,
    educationLevel: vals.educationLevel,
    candidatesNeeded:
      typeof vals.candidatesNeeded === 'number'
        ? vals.candidatesNeeded
        : parseInt(String(vals.candidatesNeeded)) || 1,
    location: {
      region: vals.region as any,
      city: vals.city,
      subCity: vals.subCity,
      woreda: vals.woreda,
      specificLocation: vals.specificLocation,
      country: 'Ethiopia',
      ...(hasCoords
        ? { coordinates: { type: 'Point', coordinates: [lng, lat] } }
        : {}),
    },
    applicationDeadline: vals.applicationDeadline,
    salaryMode: vals.salaryMode as any,
    salary:
      vals.salaryMode === 'range'
        ? {
            min: vals.salaryMin ? parseFloat(vals.salaryMin) : undefined,
            max: vals.salaryMax ? parseFloat(vals.salaryMax) : undefined,
            currency: vals.salaryCurrency,
            period: vals.salaryPeriod,
            isPublic: true,
            isNegotiable: false,
          }
        : undefined,
    remote: vals.remote as any,
    workArrangement: vals.workArrangement as any,
    isApplyEnabled: vals.isApplyEnabled,
    requirements: vals.requirements?.filter(Boolean),
    skills: vals.skills?.filter(Boolean),
    responsibilities: vals.responsibilities?.filter(Boolean),
    benefits: vals.benefits?.filter(Boolean),
    featured: vals.featured,
    urgent: vals.urgent,
    jobNumber: vals.jobNumber,
    demographicRequirements: { sex: vals.demographicSex as any },
  };
};

const STEP_FIELDS: Record<number, (keyof JobFormValues)[]> = {
  0: ['title', 'description', 'category', 'type'],
  1: ['experienceLevel'],
  2: ['salaryMode', 'region', 'applicationDeadline'],
  3: [],
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const JobForm: React.FC<JobFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isEdit = !!initialData;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      shortDescription: '',
      category: '',
      type: 'full-time',
      experienceLevel: 'mid-level',
      educationLevel: 'none-required',
      candidatesNeeded: '1' as any,
      region: 'addis-ababa',
      city: '',
      subCity: '',
      woreda: '',
      specificLocation: '',
      locationLat: '',
      locationLng: '',
      applicationDeadline: tomorrowISO(),
      salaryMode: 'range',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'ETB',
      salaryPeriod: 'monthly',
      remote: 'on-site',
      workArrangement: 'office',
      isApplyEnabled: true,
      demographicSex: 'any',
      jobNumber: '',
      requirements: [],
      skills: [],
      responsibilities: [],
      benefits: [],
      featured: false,
      urgent: false,
    },
  });

  useEffect(() => {
    if (initialData) reset(toFormValues(initialData) as any);
  }, [initialData]);

  const salaryMode = watch('salaryMode');

  const animateStep = useCallback(
    (next: number) => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      setStep(next);
    },
    [fadeAnim]
  );

  const nextStep = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await trigger(fields as any));
    if (valid && step < STEPS.length - 1) animateStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) animateStep(step - 1);
  };

  const doSubmit = async (isDraft: boolean) => {
    handleSubmit(async (vals) => {
      try {
        setSubmitting(true);
        await onSubmit(toCreateData(vals), isDraft);
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'Failed to save job');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const loading = isLoading || submitting;
  const sharedProps = { control, errors, watch, setValue };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Premium Step Indicator */}
      <StepIndicator
        steps={STEPS}
        currentStep={step}
        onStepPress={setStep}
        colors={colors}
        spacing={spacing}
        isDark={isDark}
      />

      {/* Form Content */}
      <KeyboardAwareScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={100}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {step === 0 && <StepBasic {...sharedProps} />}
          {step === 1 && <StepDetails {...sharedProps} />}
          {step === 2 && (
            <StepSalaryLocation
              {...sharedProps}
              salaryMode={salaryMode}
              isEdit={isEdit}
            />
          )}
          {step === 3 && <StepPreview watch={watch} isEdit={isEdit} />}
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Premium Footer */}
      <FormFooter
        step={step}
        totalSteps={STEPS.length}
        isEdit={isEdit}
        loading={loading}
        onCancel={step === 0 ? onCancel : prevStep}
        onNext={nextStep}
        onSaveDraft={() => doSubmit(true)}
        onPublish={() => doSubmit(false)}
        colors={colors}
        spacing={spacing}
        radius={radius}
        shadows={shadows}
        insets={insets}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Premium Step Indicator ───────────────────────────────────────────────────

const StepIndicator: React.FC<{
  steps: string[];
  currentStep: number;
  onStepPress: (step: number) => void;
  colors: any;
  spacing: any;
  isDark: boolean;
}> = ({ steps, currentStep, onStepPress, colors, spacing }) => {
  return (
    <View
      style={[
        stepStyles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <View style={stepStyles.row}>
        {steps.map((label, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          const isLast = i === steps.length - 1;

          return (
            <React.Fragment key={label}>
              <TouchableOpacity
                onPress={() => onStepPress(i)}
                style={stepStyles.stepItem}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    stepStyles.circle,
                    {
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isCompleted
                        ? colors.primary
                        : isActive
                        ? `${colors.primary}18`
                        : 'transparent',
                      borderColor: isCompleted || isActive ? colors.primary : colors.border,
                      borderWidth: 2,
                    },
                    isActive && stepStyles.activeCircle,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        stepStyles.circleText,
                        {
                          color: isActive ? colors.primary : colors.textMuted,
                          fontWeight: isActive ? '700' : '600',
                        },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    stepStyles.label,
                    {
                      color: isActive ? colors.primary : isCompleted ? colors.textSecondary : colors.textMuted,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
              {!isLast && (
                <View
                  style={[
                    stepStyles.connector,
                    {
                      backgroundColor: i < currentStep ? colors.primary : colors.border,
                      height: 2,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

// ─── Premium Form Footer ──────────────────────────────────────────────────────

const FormFooter: React.FC<{
  step: number;
  totalSteps: number;
  isEdit: boolean;
  loading: boolean;
  onCancel: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  colors: any;
  spacing: any;
  radius: any;
  shadows: any;
  insets: any;
}> = ({
  step,
  totalSteps,
  isEdit,
  loading,
  onCancel,
  onNext,
  onSaveDraft,
  onPublish,
  colors,
  spacing,
  radius,
  shadows,
  insets,
}) => {
  const isLastStep = step === totalSteps - 1;
const TAB_BAR_TOTAL_HEIGHT = 70;
  return (
    <View
      style={[
        footerStyles.container,
        {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          // 🔧 FIX: Add tab bar height to bottom padding
          paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg) + TAB_BAR_TOTAL_HEIGHT,
          ...shadows.md,
        },
      ]}
    >
      <View style={footerStyles.row}>
        {/* Back/Cancel Button */}
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          disabled={loading}
          style={[
            footerStyles.button,
            footerStyles.secondaryButton,
            {
              borderColor: colors.border,
              borderRadius: radius.lg,
              height: 52,
              flex: isLastStep && !isEdit ? 0.4 : 1,
            },
          ]}
        >
          <Ionicons
            name={step === 0 ? 'close-outline' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
          <Text style={[footerStyles.buttonText, { color: colors.text }]}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {!isLastStep ? (
          /* Next Button */
          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.9}
            style={[
              footerStyles.button,
              footerStyles.primaryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.lg,
                height: 52,
                flex: 1,
                ...shadows.md,
              },
            ]}
          >
            <Text style={footerStyles.primaryText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          /* Publish/Save Draft */
          <View style={[footerStyles.row, { flex: 1, gap: spacing.sm }]}>
            {!isEdit && (
              <TouchableOpacity
                onPress={onSaveDraft}
                disabled={loading}
                activeOpacity={0.7}
                style={[
                  footerStyles.button,
                  footerStyles.secondaryButton,
                  {
                    borderColor: colors.primary,
                    borderWidth: 1.5,
                    borderRadius: radius.lg,
                    height: 52,
                    flex: 0.5,
                  },
                ]}
              >
                <Ionicons name="save-outline" size={16} color={colors.primary} />
                <Text style={[footerStyles.buttonText, { color: colors.primary }]}>
                  {loading ? 'Saving…' : 'Save Draft'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onPublish}
              disabled={loading}
              activeOpacity={0.9}
              style={[
                footerStyles.button,
                footerStyles.primaryButton,
                {
                  backgroundColor: loading ? colors.textDisabled : colors.primary,
                  borderRadius: radius.lg,
                  height: 52,
                  flex: 0.5,
                  ...shadows.md,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={isEdit ? 'checkmark-circle' : 'paper-plane'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={footerStyles.primaryText}>
                    {isEdit ? 'Update Job' : 'Publish Job'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Step Header ──────────────────────────────────────────────────────────────

const StepHeader: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={[headerStyles.container, { marginBottom: spacing.xl }]}>
      <View
        style={[
          headerStyles.iconContainer,
          {
            backgroundColor: `${colors.primary}15`,
            borderRadius: radius.md,
            width: 48,
            height: 48,
          },
        ]}
      >
        <Ionicons name={icon as any} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[headerStyles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[headerStyles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

// ─── Premium Card ─────────────────────────────────────────────────────────────

const PremiumCard: React.FC<{
  children: React.ReactNode;
  title?: string;
  icon?: string;
  style?: any;
}> = ({ children, title, icon, style }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={[
        cardStyles.container,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.lg,
          marginBottom: spacing.lg,
          ...shadows.sm,
        },
        style,
      ]}
    >
      {title && (
        <View
          style={[
            cardStyles.header,
            {
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            },
          ]}
        >
          {icon && (
            <View
              style={[
                cardStyles.iconBg,
                { backgroundColor: `${colors.primary}15`, borderRadius: radius.sm },
              ]}
            >
              <Ionicons name={icon as any} size={15} color={colors.primary} />
            </View>
          )}
          <Text style={[cardStyles.title, { color: colors.text }]}>{title}</Text>
        </View>
      )}
      <View style={{ padding: spacing.lg }}>{children}</View>
    </View>
  );
};

// ─── Pill Selector ────────────────────────────────────────────────────────────

const PillSelector: React.FC<{
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}> = ({ options, value, onChange, label, required, error }) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text
          style={[
            pillStyles.label,
            { color: colors.text, marginBottom: spacing.sm },
          ]}
        >
          {label}
          {required && (
            <Text style={{ color: colors.danger }}> *</Text>
          )}
        </Text>
      )}
      <View style={pillStyles.container}>
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
              style={[
                pillStyles.pill,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderRadius: radius.full,
                  paddingVertical: spacing.sm + 2,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            >
              <Text
                style={[
                  pillStyles.pillText,
                  {
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && (
        <Text style={[pillStyles.error, { color: colors.danger }]}>{error}</Text>
      )}
    </View>
  );
};

// ─── Info Banner ──────────────────────────────────────────────────────────────

const InfoBanner: React.FC<{
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
}> = ({ children, type = 'info' }) => {
  const { colors, spacing, radius } = useTheme();
  const colorMap = {
    info: colors.info,
    warning: colors.warning,
    success: colors.success,
  };

  return (
    <View
      style={[
        bannerStyles.container,
        {
          backgroundColor: `${colorMap[type]}12`,
          borderColor: `${colorMap[type]}30`,
          borderRadius: radius.md,
          padding: spacing.md,
        },
      ]}
    >
      <Ionicons
        name={
          type === 'info'
            ? 'information-circle-outline'
            : type === 'warning'
            ? 'warning-outline'
            : 'checkmark-circle-outline'
        }
        size={18}
        color={colorMap[type]}
      />
      <Text style={[bannerStyles.text, { color: colors.textMuted }]}>
        {children}
      </Text>
    </View>
  );
};

// ─── Setting Row ──────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  icon: string;
  iconColor: string;
  label: string;
  sublabel?: string;
  name: string;
  control: any;
  trackColor: string;
}> = ({ icon, iconColor, label, sublabel, name, control, trackColor }) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <View style={settingStyles.row}>
          <View
            style={[
              settingStyles.iconBox,
              {
                backgroundColor: `${iconColor}15`,
                borderRadius: radius.md,
                width: 40,
                height: 40,
              },
            ]}
          >
            <Ionicons name={icon as any} size={18} color={iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[settingStyles.label, { color: colors.text }]}>
              {label}
            </Text>
            {sublabel && (
              <Text style={[settingStyles.sublabel, { color: colors.textMuted }]}>
                {sublabel}
              </Text>
            )}
          </View>
          <Switch
            value={value}
            onValueChange={onChange}
            trackColor={{ false: colors.border, true: trackColor }}
            thumbColor="#FFFFFF"
          />
        </View>
      )}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

const StepBasic = ({ control, errors, watch }: any) => {
  const { colors, spacing } = useTheme();

  return (
    <View>
      <StepHeader
        icon="briefcase-outline"
        title="Basic Information"
        subtitle="Start with the essentials about this role"
      />

      <PremiumCard title="Job Details" icon="document-text-outline">
        <Controller
          name="title"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Job Title"
              required
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Senior Software Engineer"
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          name="category"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Category"
              required
              value={value}
              options={JOB_CATEGORIES}
              onSelect={onChange}
              placeholder="Select job category"
              error={errors.category?.message}
              searchable
            />
          )}
        />

        <Controller
          name="type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <PillSelector
              label="Employment Type"
              required
              options={JOB_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={value}
              onChange={onChange}
              error={errors.type?.message}
            />
          )}
        />

        <Controller
          name="jobNumber"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Reference Number"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. JOB-2026-001 (optional)"
            />
          )}
        />
      </PremiumCard>

      <PremiumCard title="Description" icon="create-outline">
        <Controller
          name="shortDescription"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Short Description"
              value={value}
              onChangeText={onChange}
              placeholder="Brief summary shown on the job card (max 200 chars)"
              maxLength={200}
              multiline
              hint={`${(value ?? '').length}/200`}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Full Description"
              required
              value={value}
              onChangeText={onChange}
              placeholder="Describe the role, team, and day-to-day responsibilities…"
              multiline
              numberOfLines={7}
              hint={`${(value ?? '').length}/5000 — min 50`}
              error={errors.description?.message}
            />
          )}
        />
      </PremiumCard>

      <PremiumCard title="Listing Options" icon="options-outline">
        <SettingRow
          icon="flash"
          iconColor="#EF4444"
          label="Mark as Urgent"
          sublabel="Shows a red URGENT badge"
          name="urgent"
          control={control}
          trackColor="#EF4444"
        />
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            marginVertical: spacing.sm,
          }}
        />
        <SettingRow
          icon="star"
          iconColor="#F59E0B"
          label="Feature This Job"
          sublabel="Boosts visibility with FEATURED badge"
          name="featured"
          control={control}
          trackColor="#F59E0B"
        />
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            marginVertical: spacing.sm,
          }}
        />
        <SettingRow
          icon="checkmark-circle"
          iconColor="#10B981"
          label="Accept Applications"
          sublabel="Candidates can apply through the app"
          name="isApplyEnabled"
          control={control}
          trackColor="#10B981"
        />
      </PremiumCard>
    </View>
  );
};

// ─── Step 2: Details ──────────────────────────────────────────────────────────

const StepDetails = ({ control, errors }: any) => {
  const { colors, spacing } = useTheme();

  return (
    <View>
      <StepHeader
        icon="list-outline"
        title="Role Details"
        subtitle="Work arrangements and candidate requirements"
      />

      <PremiumCard title="Work Arrangement" icon="business-outline">
        <Controller
          name="experienceLevel"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Experience Level"
              required
              value={value}
              options={EXPERIENCE_LEVELS.map((e) => ({
                value: e.value,
                label: e.label,
              }))}
              onSelect={onChange}
              placeholder="Select experience level"
              error={errors.experienceLevel?.message}
            />
          )}
        />

        <Controller
          name="educationLevel"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Education Level"
              value={value ?? ''}
              options={EDUCATION_LEVELS.map((e) => ({
                value: e.value,
                label: e.label,
              }))}
              onSelect={onChange}
              placeholder="Select education level"
            />
          )}
        />

        <Controller
          name="remote"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Work Mode"
              value={value ?? 'on-site'}
              options={REMOTE_OPTIONS}
              onSelect={onChange}
              placeholder="Select work mode"
            />
          )}
        />

        <Controller
          name="workArrangement"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Work Arrangement"
              value={value ?? 'office'}
              options={WORK_ARRANGEMENTS}
              onSelect={onChange}
              placeholder="Select arrangement"
            />
          )}
        />
      </PremiumCard>

      <PremiumCard title="Required Skills" icon="construct-outline">
        <Controller
          name="skills"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TagInput
              label=""
              values={value ?? []}
              onChange={onChange}
              placeholder="Type a skill and press Add"
            />
          )}
        />
      </PremiumCard>

      <PremiumCard title="Requirements" icon="checkmark-circle-outline">
        <Controller
          name="requirements"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TagInput
              label=""
              values={value ?? []}
              onChange={onChange}
              placeholder="Add a requirement and press Add"
            />
          )}
        />
      </PremiumCard>

      <PremiumCard title="Responsibilities" icon="list-outline">
        <Controller
          name="responsibilities"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TagInput
              label=""
              values={value ?? []}
              onChange={onChange}
              placeholder="Add a responsibility and press Add"
            />
          )}
        />
      </PremiumCard>

      <PremiumCard title="Benefits & Perks" icon="heart-outline">
        <Controller
          name="benefits"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TagInput
              label=""
              values={value ?? []}
              onChange={onChange}
              placeholder="Add a benefit and press Add"
            />
          )}
        />
      </PremiumCard>
    </View>
  );
};

// ─── Step 3: Salary & Location ────────────────────────────────────────────────

const StepSalaryLocation = ({
  control,
  errors,
  watch,
  setValue,
  salaryMode,
}: any) => {
  const { colors, spacing, radius } = useTheme();
  const locationLat = watch('locationLat');
  const locationLng = watch('locationLng');
  const hasPin =
    locationLat &&
    locationLng &&
    !isNaN(parseFloat(locationLat)) &&
    !isNaN(parseFloat(locationLng));
  const [mapVisible, setMapVisible] = useState(false);
  const pinLat = hasPin ? parseFloat(locationLat) : 9.032;
  const pinLng = hasPin ? parseFloat(locationLng) : 38.7469;

  return (
    <View>
      <StepHeader
        icon="cash-outline"
        title="Salary, Location & Deadline"
        subtitle="Compensation, where candidates will work, and timing"
      />

      <PremiumCard title="Salary & Compensation" icon="cash-outline">
        <Controller
          name="salaryMode"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Salary Display Mode"
              required
              value={value}
              options={SALARY_MODES.map((m) => ({
                value: m.value,
                label: m.label,
              }))}
              onSelect={onChange}
              placeholder="Select salary mode"
              error={errors.salaryMode?.message}
            />
          )}
        />

        {salaryMode === 'range' && (
          <>
            <Controller
              name="salaryCurrency"
              control={control}
              render={({ field: { value, onChange } }) => (
                <PillSelector
                  label="Currency"
                  options={CURRENCIES}
                  value={value ?? 'ETB'}
                  onChange={onChange}
                />
              )}
            />

            <View
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Controller
                  name="salaryMin"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormField
                      label="Min Salary"
                      value={value}
                      onChangeText={onChange}
                      placeholder="e.g. 15000"
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  name="salaryMax"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormField
                      label="Max Salary"
                      value={value}
                      onChangeText={onChange}
                      placeholder="e.g. 30000"
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              name="salaryPeriod"
              control={control}
              render={({ field: { value, onChange } }) => (
                <SelectPicker
                  label="Pay Period"
                  value={value ?? 'monthly'}
                  options={SALARY_PERIODS}
                  onSelect={onChange}
                  placeholder="Select pay period"
                />
              )}
            />
          </>
        )}

        {salaryMode !== 'range' && (
          <InfoBanner type="info">
            {salaryMode === 'hidden' && 'Salary will be hidden from candidates.'}
            {salaryMode === 'negotiable' &&
              'Salary will be shown as "Negotiable".'}
            {salaryMode === 'company-scale' &&
              'Salary will be shown as "As per company scale".'}
          </InfoBanner>
        )}
      </PremiumCard>

      <PremiumCard title="Job Location" icon="location-outline">
        <Controller
          name="region"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Region"
              required
              value={value}
              options={ETHIOPIAN_REGIONS.map((r) => ({
                value: r.value,
                label: r.label,
              }))}
              onSelect={onChange}
              placeholder="Select region"
              error={errors.region?.message}
              searchable
            />
          )}
        />

        <View
          style={{
            flexDirection: 'row',
            gap: spacing.md,
            marginBottom: spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <Controller
              name="city"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormField
                  label="City"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. Addis Ababa"
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              name="subCity"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormField
                  label="Sub-City"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. Bole"
                />
              )}
            />
          </View>
        </View>

        <Controller
          name="woreda"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Woreda"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Woreda 03"
            />
          )}
        />

        <Controller
          name="specificLocation"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Specific Location / Landmark"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Near Bole Medhanialem, Edna Mall"
              hint="Helps candidates find you easily"
            />
          )}
        />

        <View
          style={[
            locationStyles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={locationStyles.headerRow}>
            <View
              style={[
                locationStyles.iconCircle,
                {
                  backgroundColor: `${colors.primary}15`,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons name="pin" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[locationStyles.title, { color: colors.text }]}
              >
                Pin Exact Location
              </Text>
              <Text
                style={[locationStyles.subtitle, { color: colors.textMuted }]}
              >
                Lets candidates find you on the "Jobs Near Me" map
              </Text>
            </View>
          </View>

          {hasPin && (
            <View
              style={[
                locationStyles.coordBadge,
                {
                  backgroundColor: `${colors.primary}12`,
                  borderColor: `${colors.primary}30`,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.primary}
              />
              <Text
                style={[
                  locationStyles.coordText,
                  { color: colors.primary },
                ]}
              >
                {parseFloat(locationLat).toFixed(5)}°N,{' '}
                {parseFloat(locationLng).toFixed(5)}°E
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setValue('locationLat', '');
                  setValue('locationLng', '');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              locationStyles.mapButton,
              {
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}08`,
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setMapVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={18} color={colors.primary} />
            <Text style={[locationStyles.mapButtonText, { color: colors.primary }]}>
              {hasPin ? 'Move Pin on Map' : 'Pick Location on Map'}
            </Text>
          </TouchableOpacity>
        </View>
      </PremiumCard>

      <PremiumCard title="Hiring Details" icon="calendar-outline">
        <Controller
          name="applicationDeadline"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Application Deadline"
              required
              value={value}
              onChangeText={onChange}
              placeholder="YYYY-MM-DD"
              hint="Format: YYYY-MM-DD  (e.g. 2026-12-31)"
              error={errors.applicationDeadline?.message}
              keyboardType="numbers-and-punctuation"
            />
          )}
        />

        <View
          style={{
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.sm,
          }}
        >
          <View style={{ flex: 1 }}>
            <Controller
              name="candidatesNeeded"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormField
                  label="No. of Positions"
                  required
                  value={String(value ?? '1')}
                  onChangeText={onChange}
                  placeholder="e.g. 3"
                  keyboardType="numeric"
                  error={errors.candidatesNeeded?.message}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              name="demographicSex"
              control={control}
              render={({ field: { value, onChange } }) => (
                <SelectPicker
                  label="Gender Requirement"
                  value={value ?? 'any'}
                  options={DEMOGRAPHIC_SEX}
                  onSelect={onChange}
                  placeholder="Any"
                />
              )}
            />
          </View>
        </View>
      </PremiumCard>

      <MapPickerModal
        visible={mapVisible}
        initialLat={pinLat}
        initialLng={pinLng}
        hasExistingPin={!!hasPin}
        onConfirm={(lat, lng) => {
          setValue('locationLat', lat.toFixed(6));
          setValue('locationLng', lng.toFixed(6));
          setMapVisible(false);
        }}
        onClose={() => setMapVisible(false)}
      />
    </View>
  );
};

// ─── Step 4: Preview ──────────────────────────────────────────────────────────

const StepPreview = ({
  watch,
  isEdit,
}: {
  watch: any;
  isEdit: boolean;
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const vals = watch();

  const cat =
    JOB_CATEGORIES.find((x) => x.value === vals.category)?.label ??
    vals.category;
  const type =
    JOB_TYPES.find((x) => x.value === vals.type)?.label ?? vals.type;
  const exp =
    EXPERIENCE_LEVELS.find((x) => x.value === vals.experienceLevel)
      ?.label ?? vals.experienceLevel;
  const edu =
    EDUCATION_LEVELS.find((x) => x.value === vals.educationLevel)
      ?.label ?? vals.educationLevel;
  const region =
    ETHIOPIAN_REGIONS.find((x) => x.value === vals.region)?.label ??
    vals.region;
  const sal =
    SALARY_MODES.find((x) => x.value === vals.salaryMode)?.label ??
    vals.salaryMode;
  const remote =
    REMOTE_OPTIONS.find((x) => x.value === vals.remote)?.label ?? vals.remote;

  const salaryDisplay =
    vals.salaryMode === 'range' && vals.salaryMin
      ? `${vals.salaryCurrency ?? 'ETB'} ${vals.salaryMin}–${
          vals.salaryMax
        } / ${vals.salaryPeriod ?? 'month'}`
      : sal;

  const locationParts = [
    vals.specificLocation,
    vals.city,
    vals.subCity,
    vals.woreda,
    region,
  ].filter(Boolean);

  const hasPin =
    vals.locationLat &&
    vals.locationLng &&
    !isNaN(parseFloat(vals.locationLat)) &&
    !isNaN(parseFloat(vals.locationLng));

  const detailRows = [
    { icon: 'briefcase-outline' as const, label: 'Category', value: cat },
    { icon: 'time-outline' as const, label: 'Type', value: type },
    {
      icon: 'trending-up-outline' as const,
      label: 'Experience',
      value: exp,
    },
    {
      icon: 'school-outline' as const,
      label: 'Education',
      value: edu || 'Not specified',
    },
    { icon: 'globe-outline' as const, label: 'Work Mode', value: remote },
    {
      icon: 'cash-outline' as const,
      label: 'Salary',
      value: salaryDisplay,
    },
    {
      icon: 'location-outline' as const,
      label: 'Location',
      value: locationParts.join(', ') || '—',
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Deadline',
      value: vals.applicationDeadline || '—',
    },
    {
      icon: 'people-outline' as const,
      label: 'Positions',
      value: String(vals.candidatesNeeded ?? 1),
    },
    {
      icon: 'pin-outline' as const,
      label: 'Map Pin',
      value: hasPin
        ? `${parseFloat(vals.locationLat).toFixed(4)}°N, ${parseFloat(
            vals.locationLng
          ).toFixed(4)}°E`
        : 'Not set',
    },
  ];

  return (
    <View>
      <StepHeader
        icon="eye-outline"
        title="Review & Publish"
        subtitle={
          isEdit
            ? 'Review your changes before updating'
            : 'Everything look good?'
        }
      />

      {/* Title Card */}
      <View
        style={[
          previewStyles.titleCard,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            ...shadows.sm,
          },
        ]}
      >
        <Text
          style={[previewStyles.jobTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {vals.title || 'No title entered'}
        </Text>

        {(vals.urgent || vals.featured) && (
          <View style={previewStyles.badgeRow}>
            {vals.urgent && (
              <View
                style={[
                  previewStyles.badge,
                  {
                    backgroundColor: `${colors.danger}15`,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    previewStyles.badgeText,
                    { color: colors.danger },
                  ]}
                >
                  URGENT
                </Text>
              </View>
            )}
            {vals.featured && (
              <View
                style={[
                  previewStyles.badge,
                  {
                    backgroundColor: `${colors.warning}15`,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    previewStyles.badgeText,
                    { color: colors.warning },
                  ]}
                >
                  FEATURED
                </Text>
              </View>
            )}
          </View>
        )}

        {vals.shortDescription ? (
          <Text
            style={[
              previewStyles.shortDesc,
              { color: colors.textSecondary },
            ]}
            numberOfLines={3}
          >
            {vals.shortDescription}
          </Text>
        ) : null}
      </View>

      {/* Details Card */}
      <View
        style={[
          previewStyles.section,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            ...shadows.sm,
          },
        ]}
      >
        <Text style={[previewStyles.sectionTitle, { color: colors.textMuted }]}>
          JOB DETAILS
        </Text>
        {detailRows.map((row, index) => (
          <View
            key={row.label}
            style={[
              previewStyles.row,
              index < detailRows.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                previewStyles.rowIcon,
                {
                  backgroundColor: `${colors.primary}12`,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons name={row.icon} size={14} color={colors.primary} />
            </View>
            <Text style={[previewStyles.rowLabel, { color: colors.textMuted }]}>
              {row.label}
            </Text>
            <Text
              style={[previewStyles.rowValue, { color: colors.text }]}
              numberOfLines={1}
            >
              {row.value || '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* Array Sections (Skills, Requirements, etc.) */}
      {[
        {
          key: 'skills',
          icon: 'construct-outline' as const,
          label: 'Skills',
        },
        {
          key: 'requirements',
          icon: 'checkmark-circle-outline' as const,
          label: 'Requirements',
        },
        {
          key: 'responsibilities',
          icon: 'list-outline' as const,
          label: 'Responsibilities',
        },
        {
          key: 'benefits',
          icon: 'heart-outline' as const,
          label: 'Benefits',
        },
      ].map((arr) => {
        const items: string[] = vals[arr.key] ?? [];
        if (items.length === 0) return null;

        return (
          <View
            key={arr.key}
            style={[
              previewStyles.section,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                ...shadows.sm,
              },
            ]}
          >
            <View style={previewStyles.arrayHeader}>
              <Ionicons name={arr.icon} size={15} color={colors.primary} />
              <Text
                style={[
                  previewStyles.sectionTitle,
                  { color: colors.textMuted },
                ]}
              >
                {arr.label.toUpperCase()}
              </Text>
            </View>
            <View style={previewStyles.tagContainer}>
              {items.map((item, i) => (
                <View
                  key={i}
                  style={[
                    previewStyles.tag,
                    {
                      backgroundColor: `${colors.primary}12`,
                      borderColor: `${colors.primary}25`,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      previewStyles.tagText,
                      { color: colors.primary },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* Description Preview */}
      {vals.description ? (
        <View
          style={[
            previewStyles.section,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              ...shadows.sm,
            },
          ]}
        >
          <Text
            style={[previewStyles.sectionTitle, { color: colors.textMuted }]}
          >
            DESCRIPTION PREVIEW
          </Text>
          <Text
            style={[
              previewStyles.descText,
              { color: colors.textSecondary },
            ]}
            numberOfLines={10}
          >
            {vals.description}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAP PICKER MODAL
// ═══════════════════════════════════════════════════════════════════════════════

interface MapPickerModalProps {
  visible: boolean;
  initialLat: number;
  initialLng: number;
  hasExistingPin: boolean;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({
  visible,
  initialLat,
  initialLng,
  hasExistingPin,
  onConfirm,
  onClose,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    hasExistingPin ? { lat: initialLat, lng: initialLng } : null
  );
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (visible) {
      setPin(hasExistingPin ? { lat: initialLat, lng: initialLng } : null);
      setMapLoaded(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[mapStyles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View
          style={[
            mapStyles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.md,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={mapStyles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={mapStyles.headerCenter}>
            <Text style={[mapStyles.headerTitle, { color: colors.text }]}>
              Pin Job Location
            </Text>
            <Text
              style={[mapStyles.headerSubtitle, { color: colors.textMuted }]}
            >
              {pin
                ? 'Drag the pin to fine-tune'
                : 'Tap anywhere to place a pin'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => pin && onConfirm(pin.lat, pin.lng)}
            disabled={!pin}
            style={[
              mapStyles.confirmButton,
              {
                backgroundColor: pin ? colors.primary : colors.textDisabled,
                borderRadius: radius.md,
              },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={mapStyles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          <MapView
            style={mapStyles.map}
            provider={undefined}
            initialRegion={{
              latitude: initialLat,
              longitude: initialLng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            onMapReady={() => setMapLoaded(true)}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setPin({ lat: latitude, lng: longitude });
            }}
          >
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />
            {pin && (
              <Marker
                coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                title="Job Location"
                pinColor={colors.primary}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setPin({ lat: latitude, lng: longitude });
                }}
              />
            )}
          </MapView>
          {!mapLoaded && (
            <View style={mapStyles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>

        {/* Footer */}
        <View
          style={[
            mapStyles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.lg,
              paddingBottom: spacing.lg + insets.bottom,
            },
          ]}
        >
          {pin ? (
            <View style={mapStyles.coordRow}>
              <View
                style={[
                  mapStyles.coordIcon,
                  {
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Ionicons name="pin" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[mapStyles.coordLabel, { color: colors.textMuted }]}
                >
                  Pinned coordinates
                </Text>
                <Text
                  style={[mapStyles.coordValue, { color: colors.text }]}
                >
                  {pin.lat.toFixed(5)}°N, {pin.lng.toFixed(5)}°E
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPin(null)}
                style={[
                  mapStyles.clearButton,
                  { borderColor: colors.danger, borderRadius: radius.sm },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    mapStyles.clearButtonText,
                    { color: colors.danger },
                  ]}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={mapStyles.instructionRow}>
              <View
                style={[
                  mapStyles.instructionIcon,
                  {
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Ionicons
                  name="hand-left-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[
                  mapStyles.instructionText,
                  { color: colors.textMuted },
                ]}
              >
                Tap anywhere on the map to drop a pin. You can drag it to
                adjust the location.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// ─── Step Indicator Styles ────────────────────────────────────────────────────

const stepStyles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    shadowColor: '#2DD4A0',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  circleText: {
    fontSize: 13,
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  connector: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 16,
  },
});

// ─── Footer Styles ────────────────────────────────────────────────────────────

const footerStyles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  primaryButton: {
    shadowColor: '#2DD4A0',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

// ─── Step Header Styles ───────────────────────────────────────────────────────

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
});

// ─── Card Styles ──────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBg: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
});

// ─── Pill Selector Styles ─────────────────────────────────────────────────────

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  pill: {
    borderWidth: 1.5,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 13,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

// ─── Info Banner Styles ───────────────────────────────────────────────────────

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});

// ─── Setting Row Styles ───────────────────────────────────────────────────────

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

// ─── Location Section Styles ──────────────────────────────────────────────────

const locationStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  coordText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderWidth: 1.5,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

// ─── Preview Styles ───────────────────────────────────────────────────────────

const previewStyles = StyleSheet.create({
  titleCard: {
    borderWidth: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shortDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  section: {
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rowIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 12,
    width: 85,
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  arrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

// ─── Map Styles ───────────────────────────────────────────────────────────────

const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  closeButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  map: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coordIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});