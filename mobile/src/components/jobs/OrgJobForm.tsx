// src/components/jobs/OrgJobForm.tsx
// REFACTORED: Premium Mint-themed redesign with full theme integration.
// Reuses shared components from JobForm refactor while preserving
// all organization-specific fields and logic.

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
} from '../../services/jobService';

// ─── Constants ────────────────────────────────────────────────────────────────

const OPPORTUNITY_TYPES = [
  { value: 'job', label: 'Job', icon: 'briefcase-outline', description: 'Traditional employment' },
  { value: 'volunteer', label: 'Volunteer', icon: 'heart-outline', description: 'Unpaid social impact' },
  { value: 'internship', label: 'Internship', icon: 'school-outline', description: 'Learning-focused role' },
  { value: 'fellowship', label: 'Fellowship', icon: 'ribbon-outline', description: 'Competitive program' },
  { value: 'training', label: 'Training', icon: 'book-outline', description: 'Skill development' },
  { value: 'grant', label: 'Grant', icon: 'cash-outline', description: 'Funding opportunity' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', description: 'Other type' },
];

const DURATION_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];
type DetailRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

const COMMITMENT_LEVELS = [
  { value: 'casual', label: 'Casual — flexible hours' },
  { value: 'regular', label: 'Regular — part-time' },
  { value: 'intensive', label: 'Intensive — full-time' },
];

const JOB_CATEGORIES = [
  { value: 'software-engineer', label: 'Software Engineer', group: 'Technology' },
  { value: 'web-developer', label: 'Web Developer', group: 'Technology' },
  { value: 'data-scientist', label: 'Data Scientist', group: 'Technology' },
  { value: 'accountant', label: 'Accountant', group: 'Business' },
  { value: 'finance-officer', label: 'Finance Officer', group: 'Business' },
  { value: 'project-manager', label: 'Project Manager', group: 'Business' },
  { value: 'marketing-manager', label: 'Marketing Manager', group: 'Marketing' },
  { value: 'hr-manager', label: 'HR Manager', group: 'Human Resources' },
  { value: 'doctor', label: 'Doctor', group: 'Healthcare' },
  { value: 'nurse', label: 'Nurse', group: 'Healthcare' },
  { value: 'teacher', label: 'Teacher', group: 'Education' },
  { value: 'lecturer', label: 'Lecturer', group: 'Education' },
  { value: 'civil-engineer', label: 'Civil Engineer', group: 'Engineering' },
  { value: 'social-worker', label: 'Social Worker', group: 'NGO / Social' },
  { value: 'program-coordinator', label: 'Program Coordinator', group: 'NGO / Social' },
  { value: 'field-officer', label: 'Field Officer', group: 'NGO / Social' },
  { value: 'monitoring-evaluation', label: 'M&E Officer', group: 'NGO / Social' },
  { value: 'communications-officer', label: 'Communications Officer', group: 'NGO / Social' },
  { value: 'other', label: 'Other', group: 'Other' },
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

const STEPS = ['Opportunity', 'Details', 'Salary & Location', 'Preview'];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const orgJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  shortDescription: z.string().max(200).optional(),
  category: z.string().min(1, 'Category is required'),
  opportunityType: z.string().min(1, 'Opportunity type is required'),
  type: z.string().min(1, 'Job type is required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  educationLevel: z.string().optional(),
  candidatesNeeded: z.string().transform((v) => parseInt(v) || 1),
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
  isApplyEnabled: z.boolean().default(true),
  durationValue: z.string().optional(),
  durationUnit: z.string().optional(),
  isOngoing: z.boolean().default(false),
  hoursPerWeek: z.string().optional(),
  commitmentLevel: z.string().optional(),
  providesAccommodation: z.boolean().default(false),
  providesStipend: z.boolean().default(false),
  requirements: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  missionAlignment: z.string().optional(),
  impactStatement: z.string().optional(),
  featured: z.boolean().default(false),
  urgent: z.boolean().default(false),
});

type OrgJobFormValues = z.infer<typeof orgJobSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrgJobFormProps {
  initialData?: Job;
  onSubmit: (data: CreateJobData, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const toFormValues = (job: Job): Partial<OrgJobFormValues> => ({
  title: job.title ?? '',
  description: job.description ?? '',
  shortDescription: job.shortDescription ?? '',
  category: job.category ?? '',
  opportunityType: (job as any).opportunityType ?? 'job',
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
  salaryMode: job.salaryMode ?? 'hidden',
  salaryMin: job.salary?.min ? String(job.salary.min) : '',
  salaryMax: job.salary?.max ? String(job.salary.max) : '',
  salaryCurrency: job.salary?.currency ?? 'ETB',
  salaryPeriod: job.salary?.period ?? 'monthly',
  remote: job.remote ?? 'on-site',
  isApplyEnabled: job.isApplyEnabled ?? true,
  durationValue: (job as any).durationValue ?? '',
  durationUnit: (job as any).durationUnit ?? 'months',
  isOngoing: (job as any).isOngoing ?? false,
  hoursPerWeek: (job as any).hoursPerWeek ?? '',
  commitmentLevel: (job as any).commitmentLevel ?? 'regular',
  providesAccommodation: (job as any).providesAccommodation ?? false,
  providesStipend: (job as any).providesStipend ?? false,
  requirements: job.requirements?.filter(Boolean) ?? [],
  skills: job.skills?.filter(Boolean) ?? [],
  responsibilities: job.responsibilities?.filter(Boolean) ?? [],
  benefits: job.benefits?.filter(Boolean) ?? [],
  missionAlignment: (job as any).missionAlignment ?? '',
  impactStatement: (job as any).impactStatement ?? '',
  featured: job.featured ?? false,
  urgent: job.urgent ?? false,
});

const toCreateData = (vals: OrgJobFormValues): CreateJobData => {
  const lat = parseFloat(vals.locationLat ?? '');
  const lng = parseFloat(vals.locationLng ?? '');
  const hasCoords = !isNaN(lat) && !isNaN(lng);
  return {
    title: vals.title,
    description: vals.description,
    shortDescription: vals.shortDescription,
    category: vals.category,
    type: vals.type as any,
    opportunityType: vals.opportunityType as any,
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
        ? { coordinates: { type: 'Point' as const, coordinates: [lng, lat] } }
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
    isApplyEnabled: vals.isApplyEnabled,
    requirements: vals.requirements?.filter(Boolean),
    skills: vals.skills?.filter(Boolean),
    responsibilities: vals.responsibilities?.filter(Boolean),
    benefits: vals.benefits?.filter(Boolean),
    featured: vals.featured,
    urgent: vals.urgent,
    ...(vals.durationValue
      ? { durationValue: parseInt(vals.durationValue) || undefined, durationUnit: vals.durationUnit }
      : {}),
    ...(vals.isOngoing ? { isOngoing: true } : {}),
    ...(vals.hoursPerWeek ? { hoursPerWeek: parseInt(vals.hoursPerWeek) || undefined } : {}),
    ...(vals.commitmentLevel ? { commitmentLevel: vals.commitmentLevel } : {}),
    ...(vals.providesAccommodation ? { providesAccommodation: true } : {}),
    ...(vals.providesStipend ? { providesStipend: true } : {}),
    ...(vals.missionAlignment ? { missionAlignment: vals.missionAlignment } : {}),
    ...(vals.impactStatement ? { impactStatement: vals.impactStatement } : {}),
  } as any;
};

const STEP_FIELDS: Record<number, (keyof OrgJobFormValues)[]> = {
  0: ['title', 'description', 'category', 'opportunityType', 'type'],
  1: ['experienceLevel'],
  2: ['salaryMode', 'region', 'applicationDeadline'],
  3: [],
};

// ─── REUSABLE SHARED COMPONENTS (from JobForm refactor) ───────────────────────

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
                      color: isActive
                        ? colors.primary
                        : isCompleted
                        ? colors.textSecondary
                        : colors.textMuted,
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

  return (
    <View
      style={[
        footerStyles.container,
        {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg),
          ...shadows.md,
        },
      ]}
    >
      <View style={footerStyles.row}>
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
                    {isEdit ? 'Update' : 'Publish'}
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

const StepHeader: React.FC<{ icon: string; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => {
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
          style={[pillStyles.label, { color: colors.text, marginBottom: spacing.sm }]}
        >
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
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
            {sublabel ? (
              <Text style={[settingStyles.sublabel, { color: colors.textMuted }]}>
                {sublabel}
              </Text>
            ) : null}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export const OrgJobForm: React.FC<OrgJobFormProps> = ({
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
  } = useForm<OrgJobFormValues>({
    resolver: zodResolver(orgJobSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      shortDescription: '',
      category: '',
      opportunityType: 'job',
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
      salaryMode: 'hidden',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'ETB',
      salaryPeriod: 'monthly',
      remote: 'on-site',
      isApplyEnabled: true,
      durationValue: '',
      durationUnit: 'months',
      isOngoing: false,
      hoursPerWeek: '',
      commitmentLevel: 'regular',
      providesAccommodation: false,
      providesStipend: false,
      requirements: [],
      skills: [],
      responsibilities: [],
      benefits: [],
      missionAlignment: '',
      impactStatement: '',
      featured: false,
      urgent: false,
    },
  });

  useEffect(() => {
    if (initialData) reset(toFormValues(initialData) as any);
  }, [initialData]);

  const opportunityType = watch('opportunityType');
  const salaryMode = watch('salaryMode');
  const isOngoing = watch('isOngoing');
  const showDuration = ['volunteer', 'internship', 'fellowship', 'training'].includes(
    opportunityType
  );
  const showVolunteerFields = ['volunteer', 'internship'].includes(opportunityType);

  const animateStep = useCallback(
    (next: number) => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
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
        Alert.alert('Error', e?.message ?? 'Failed to save');
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
          {step === 0 && (
            <StepOpportunity
              {...sharedProps}
              opportunityType={opportunityType}
            />
          )}
          {step === 1 && <StepDetails {...sharedProps} />}
          {step === 2 && (
            <StepSalaryLocation
              {...sharedProps}
              salaryMode={salaryMode}
              showDuration={showDuration}
              showVolunteerFields={showVolunteerFields}
              isOngoing={isOngoing}
            />
          )}
          {step === 3 && (
            <StepPreview
              watch={watch}
              isEdit={isEdit}
              opportunityType={opportunityType}
            />
          )}
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
// STEP 1 — Opportunity Type + Basic Info
// ═══════════════════════════════════════════════════════════════════════════════

const StepOpportunity = ({ control, errors, opportunityType }: any) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View>
      <StepHeader
        icon="heart-outline"
        title="Opportunity Type"
        subtitle="What kind of opportunity are you posting?"
      />

      {/* Opportunity type grid */}
      <PremiumCard title="Select Type" icon="apps-outline">
        <Controller
          name="opportunityType"
          control={control}
          render={({ field: { value, onChange } }) => (
            <View style={orgStyles.typeGrid}>
              {OPPORTUNITY_TYPES.map((opt) => {
                const active = value === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onChange(opt.value)}
                    style={[
                      orgStyles.typeCard,
                      {
                        backgroundColor: active
                          ? `${colors.primary}15`
                          : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                        borderWidth: active ? 1.5 : 1,
                        borderRadius: radius.lg,
                        padding: spacing.md,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        orgStyles.typeIcon,
                        {
                          backgroundColor: active
                            ? `${colors.primary}20`
                            : `${colors.border}60`,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={18}
                        color={active ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        orgStyles.typeLabel,
                        { color: active ? colors.primary : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        orgStyles.typeDesc,
                        { color: colors.textMuted },
                      ]}
                      numberOfLines={2}
                    >
                      {opt.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
        {errors.opportunityType && (
          <Text style={[orgStyles.error, { color: colors.danger }]}>
            {errors.opportunityType.message}
          </Text>
        )}
      </PremiumCard>

      {/* Basic info */}
      <PremiumCard title="Basic Information" icon="briefcase-outline">
        <Controller
          name="title"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Opportunity Title"
              required
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Community Health Volunteer"
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
              placeholder="Select category"
              error={errors.category?.message}
              searchable
            />
          )}
        />

        <Controller
          name="type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Employment Type"
              required
              value={value}
              options={JOB_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              onSelect={onChange}
              placeholder="Select type"
              error={errors.type?.message}
            />
          )}
        />
      </PremiumCard>

      {/* Description */}
      <PremiumCard title="Description" icon="document-text-outline">
        <Controller
          name="shortDescription"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Short Description"
              value={value}
              onChangeText={onChange}
              placeholder="Brief overview (max 200 chars)"
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
              placeholder="Detailed description of the opportunity, responsibilities, and what candidates can expect..."
              multiline
              numberOfLines={7}
              hint={`${(value ?? '').length}/5000 — min 50`}
              error={errors.description?.message}
            />
          )}
        />

        <Controller
          name="missionAlignment"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Mission Alignment"
              value={value}
              onChangeText={onChange}
              placeholder="How does this align with your organization's mission?"
              multiline
            />
          )}
        />

        <Controller
          name="impactStatement"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Impact Statement"
              value={value}
              onChangeText={onChange}
              placeholder="What positive impact will this role create?"
              multiline
            />
          )}
        />
      </PremiumCard>

      {/* Listing Options */}
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
        <View style={orgStyles.divider(colors)} />
        <SettingRow
          icon="star"
          iconColor="#F59E0B"
          label="Feature This"
          sublabel="Boosts visibility with FEATURED badge"
          name="featured"
          control={control}
          trackColor="#F59E0B"
        />
        <View style={orgStyles.divider(colors)} />
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

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Details
// ═══════════════════════════════════════════════════════════════════════════════

const StepDetails = ({ control, errors }: any) => {
  const { colors } = useTheme();

  return (
    <View>
      <StepHeader
        icon="list-outline"
        title="Role Details"
        subtitle="Requirements and what you're looking for in candidates"
      />

      <PremiumCard title="Candidate Requirements" icon="person-outline">
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

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Salary, Location, Deadline, Duration, Volunteer
// ═══════════════════════════════════════════════════════════════════════════════

const StepSalaryLocation = ({
  control,
  errors,
  watch,
  setValue,
  salaryMode,
  showDuration,
  showVolunteerFields,
  isOngoing,
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
        subtitle="Compensation, where and when"
      />

      {/* Salary */}
      <PremiumCard title="Compensation" icon="cash-outline">
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
                      label="Min"
                      value={value}
                      onChangeText={onChange}
                      placeholder="e.g. 5000"
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
                      label="Max"
                      value={value}
                      onChangeText={onChange}
                      placeholder="e.g. 15000"
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
            {salaryMode === 'hidden' && 'Salary will be hidden from applicants.'}
            {salaryMode === 'negotiable' && 'Salary shown as "Negotiable".'}
            {salaryMode === 'company-scale' &&
              'Salary shown as "As per organization scale".'}
          </InfoBanner>
        )}
      </PremiumCard>

      {/* Duration */}
      {showDuration && (
        <PremiumCard title="Duration" icon="time-outline">
          <SettingRow
            icon="infinite-outline"
            iconColor={colors.primary}
            label="Ongoing (no fixed end date)"
            name="isOngoing"
            control={control}
            trackColor={colors.primary}
          />
          {!isOngoing && (
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                marginTop: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Controller
                  name="durationValue"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <FormField
                      label="Duration"
                      value={value}
                      onChangeText={onChange}
                      placeholder="e.g. 6"
                      keyboardType="numeric"
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  name="durationUnit"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <SelectPicker
                      label="Unit"
                      value={value ?? 'months'}
                      options={DURATION_UNITS}
                      onSelect={onChange}
                      placeholder="Unit"
                    />
                  )}
                />
              </View>
            </View>
          )}
        </PremiumCard>
      )}

      {/* Volunteer fields */}
      {showVolunteerFields && (
        <PremiumCard title="Volunteer Details" icon="heart-outline">
          <Controller
            name="hoursPerWeek"
            control={control}
            render={({ field: { value, onChange } }) => (
              <FormField
                label="Hours per Week"
                value={value}
                onChangeText={onChange}
                placeholder="e.g. 20"
                keyboardType="numeric"
              />
            )}
          />
          <Controller
            name="commitmentLevel"
            control={control}
            render={({ field: { value, onChange } }) => (
              <SelectPicker
                label="Commitment Level"
                value={value ?? 'regular'}
                options={COMMITMENT_LEVELS}
                onSelect={onChange}
                placeholder="Select commitment"
              />
            )}
          />
          <SettingRow
            icon="cash-outline"
            iconColor="#10B981"
            label="Provides Stipend"
            name="providesStipend"
            control={control}
            trackColor="#10B981"
          />
          <View style={orgStyles.divider(colors)} />
          <SettingRow
            icon="home-outline"
            iconColor="#3B82F6"
            label="Provides Accommodation"
            name="providesAccommodation"
            control={control}
            trackColor="#3B82F6"
          />
        </PremiumCard>
      )}

      {/* Location */}
      <PremiumCard title="Opportunity Location" icon="location-outline">
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
              placeholder="e.g. Near Bole Medhanialem Church"
              hint="Helps candidates find your office"
            />
          )}
        />

        {/* Map pin */}
        <View
          style={[
            locationStyles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.md,
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
              <Text style={[locationStyles.title, { color: colors.text }]}>
                Pin Exact Location
              </Text>
              <Text style={[locationStyles.subtitle, { color: colors.textMuted }]}>
                Shows on the "Jobs Near Me" map
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
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[locationStyles.coordText, { color: colors.primary }]}>
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
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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

      {/* Deadline + positions */}
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

        <Controller
          name="candidatesNeeded"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormField
              label="Number of Positions"
              required
              value={String(value ?? '1')}
              onChangeText={onChange}
              placeholder="e.g. 5"
              keyboardType="numeric"
              error={errors.candidatesNeeded?.message}
            />
          )}
        />
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

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Preview
// ═══════════════════════════════════════════════════════════════════════════════

const StepPreview = ({
  watch,
  isEdit,
  opportunityType,
}: {
  watch: any;
  isEdit: boolean;
  opportunityType: string;
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const vals = watch();

  const oppType = OPPORTUNITY_TYPES.find((o) => o.value === vals.opportunityType);
  const exp = EXPERIENCE_LEVELS.find((x) => x.value === vals.experienceLevel)?.label ?? vals.experienceLevel;
  const region = ETHIOPIAN_REGIONS.find((x) => x.value === vals.region)?.label ?? vals.region;
  const sal = SALARY_MODES.find((x) => x.value === vals.salaryMode)?.label ?? vals.salaryMode;
  const salaryDisplay =
    vals.salaryMode === 'range' && vals.salaryMin
      ? `${vals.salaryCurrency ?? 'ETB'} ${vals.salaryMin}–${vals.salaryMax} / ${vals.salaryPeriod ?? 'month'}`
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

const detailRows: DetailRow[] = [
  {
    icon: 'location-outline',
    label: 'Location',
    value: locationParts.join(', ') || '—',
  },
  {
    icon: 'calendar-outline',
    label: 'Deadline',
    value: vals.applicationDeadline || '—',
  },
  {
    icon: 'people-outline',
    label: 'Positions',
    value: String(vals.candidatesNeeded ?? 1),
  },
  {
    icon: 'trending-up-outline',
    label: 'Experience',
    value: exp,
  },
  {
    icon: 'cash-outline',
    label: 'Salary',
    value: salaryDisplay,
  },
  {
    icon: 'pin-outline',
    label: 'Map Pin',
    value: hasPin
      ? `${parseFloat(vals.locationLat).toFixed(4)}°N, ${parseFloat(vals.locationLng).toFixed(4)}°E`
      : 'Not set',
  },
];

  // Add duration row if applicable
  if (vals.isOngoing) {
    detailRows.splice(1, 0, { icon: 'timer-outline' as const, label: 'Duration', value: 'Ongoing' });
  } else if (vals.durationValue) {
    const unit = DURATION_UNITS.find((u) => u.value === vals.durationUnit)?.label ?? vals.durationUnit;
    detailRows.splice(1, 0, { icon: 'timer-outline' as const, label: 'Duration', value: `${vals.durationValue} ${unit}` });
  }

  // Add volunteer rows if applicable
  if (['volunteer', 'internship'].includes(opportunityType)) {
    if (vals.hoursPerWeek) {
      detailRows.push({ icon: 'timer-outline' as const, label: 'Hours/Week', value: vals.hoursPerWeek });
    }
    if (vals.commitmentLevel) {
      const commLevel = COMMITMENT_LEVELS.find((c) => c.value === vals.commitmentLevel)?.label ?? vals.commitmentLevel;
      detailRows.push({ icon: 'flash-outline' as const, label: 'Commitment', value: commLevel });
    }
    if (vals.providesStipend) {
      detailRows.push({ icon: 'cash-outline' as const, label: 'Stipend', value: 'Yes' });
    }
    if (vals.providesAccommodation) {
      detailRows.push({ icon: 'business-outline' as const, label: 'Accommodation', value: 'Yes' });
    }
  }

  return (
    <View>
      <StepHeader
        icon="eye-outline"
        title="Review & Publish"
        subtitle={isEdit ? 'Review changes before updating' : 'Everything look good?'}
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
        <View style={previewStyles.titleRow}>
          {oppType && (
            <View
              style={[
                previewStyles.oppIconBox,
                {
                  backgroundColor: `${colors.primary}15`,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Ionicons name={oppType.icon as any} size={18} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[previewStyles.jobTitle, { color: colors.text }]} numberOfLines={2}>
              {vals.title || 'No title entered'}
            </Text>
            {oppType && (
              <View
                style={[
                  previewStyles.oppBadge,
                  {
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <Text style={[previewStyles.oppBadgeText, { color: colors.primary }]}>
                  {oppType.label}
                </Text>
              </View>
            )}
          </View>
        </View>

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
                <Text style={[previewStyles.badgeText, { color: colors.danger }]}>URGENT</Text>
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
                <Text style={[previewStyles.badgeText, { color: colors.warning }]}>FEATURED</Text>
              </View>
            )}
          </View>
        )}

        {vals.shortDescription ? (
          <Text style={[previewStyles.shortDesc, { color: colors.textSecondary }]} numberOfLines={3}>
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
          OPPORTUNITY DETAILS
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
            <Text style={[previewStyles.rowValue, { color: colors.text }]} numberOfLines={1}>
              {row.value || '—'}
            </Text>
          </View>
        ))}
      </View>

      {/* Array Sections */}
      {[
        { key: 'skills', icon: 'construct-outline' as const, label: 'Skills' },
        { key: 'requirements', icon: 'checkmark-circle-outline' as const, label: 'Requirements' },
        { key: 'responsibilities', icon: 'list-outline' as const, label: 'Responsibilities' },
        { key: 'benefits', icon: 'heart-outline' as const, label: 'Benefits' },
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
              <Ionicons name={arr.icon} size={14} color={colors.primary} />
              <Text style={[previewStyles.sectionTitle, { color: colors.textMuted }]}>
                {arr.label.toUpperCase()}
              </Text>
            </View>
            <View style={previewStyles.tagContainer}>
              {items.map((item: string, i: number) => (
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
                  <Text style={[previewStyles.tagText, { color: colors.primary }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* Org Context */}
      {vals.missionAlignment || vals.impactStatement ? (
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
            ORGANIZATION CONTEXT
          </Text>
          {vals.missionAlignment ? (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[previewStyles.contextLabel, { color: colors.textMuted }]}>
                Mission Alignment
              </Text>
              <Text style={[previewStyles.contextText, { color: colors.textSecondary }]}>
                {vals.missionAlignment}
              </Text>
            </View>
          ) : null}
          {vals.impactStatement ? (
            <View>
              <Text style={[previewStyles.contextLabel, { color: colors.textMuted }]}>
                Impact Statement
              </Text>
              <Text style={[previewStyles.contextText, { color: colors.textSecondary }]}>
                {vals.impactStatement}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

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
          <Text style={[previewStyles.sectionTitle, { color: colors.textMuted }]}>
            DESCRIPTION PREVIEW
          </Text>
          <Text style={[previewStyles.descText, { color: colors.textSecondary }]} numberOfLines={10}>
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
  const { colors, spacing, radius } = useTheme();
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
              Pin Location
            </Text>
            <Text style={[mapStyles.headerSubtitle, { color: colors.textMuted }]}>
              {pin ? 'Drag the pin to fine-tune' : 'Tap anywhere to place a pin'}
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
                <Text style={[mapStyles.coordLabel, { color: colors.textMuted }]}>
                  Pinned coordinates
                </Text>
                <Text style={[mapStyles.coordValue, { color: colors.text }]}>
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
                <Text style={[mapStyles.clearButtonText, { color: colors.danger }]}>
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
                <Ionicons name="hand-left-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[mapStyles.instructionText, { color: colors.textMuted }]}>
                Tap anywhere on the map to drop a pin. Drag it to adjust the exact location.
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

// ─── Org-Specific Styles ──────────────────────────────────────────────────────

const orgStyles = StyleSheet.create<any>({
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '47%',
    gap: 6,
  },
  typeIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: (colors: any) => ({
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8,
  }),
});

// ─── Location Section Styles ──────────────────────────────────────────────────

const locationStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  oppIconBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 6,
  },
  oppBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  oppBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  contextText: {
    fontSize: 13,
    lineHeight: 19,
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