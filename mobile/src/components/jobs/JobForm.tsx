/**
 * src/components/jobs/JobForm.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * COMPANY job create/edit form.
 *  - react-hook-form + Zod — mirrors server createJobValidation exactly
 *  - Every dropdown uses SelectPicker (works on iOS & Android)
 *  - Dynamic arrays for requirements, skills, responsibilities, benefits
 *  - Multi-step: Basic → Details → Salary → Preview
 *  - isEdit mode: populates from initialData
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Platform, Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { SelectPicker } from '../ui/SelectPicker';
import { TagInput } from '../ui/TagInput';
import { FormField } from '../ui/FormField';
import {
  Job, CreateJobData,
  ETHIOPIAN_REGIONS, JOB_TYPES, EXPERIENCE_LEVELS,
  SALARY_MODES, EDUCATION_LEVELS,
} from '../../services/jobService';

// ─── Job Categories (mirrors frontend/src/services/jobService.ts) ─────────────
const JOB_CATEGORIES = [
  // Technology
  { value: 'software-engineer', label: 'Software Engineer', group: 'Technology' },
  { value: 'web-developer', label: 'Web Developer', group: 'Technology' },
  { value: 'mobile-developer', label: 'Mobile Developer', group: 'Technology' },
  { value: 'data-scientist', label: 'Data Scientist', group: 'Technology' },
  { value: 'it-support', label: 'IT Support', group: 'Technology' },
  { value: 'network-engineer', label: 'Network Engineer', group: 'Technology' },
  { value: 'cybersecurity', label: 'Cybersecurity', group: 'Technology' },
  { value: 'ui-ux-designer', label: 'UI/UX Designer', group: 'Technology' },
  { value: 'devops', label: 'DevOps Engineer', group: 'Technology' },
  // Business
  { value: 'accountant', label: 'Accountant', group: 'Business & Finance' },
  { value: 'finance-officer', label: 'Finance Officer', group: 'Business & Finance' },
  { value: 'auditor', label: 'Auditor', group: 'Business & Finance' },
  { value: 'business-analyst', label: 'Business Analyst', group: 'Business & Finance' },
  { value: 'project-manager', label: 'Project Manager', group: 'Business & Finance' },
  { value: 'operations-manager', label: 'Operations Manager', group: 'Business & Finance' },
  // Marketing
  { value: 'marketing-manager', label: 'Marketing Manager', group: 'Marketing & Sales' },
  { value: 'sales-representative', label: 'Sales Representative', group: 'Marketing & Sales' },
  { value: 'digital-marketing', label: 'Digital Marketing', group: 'Marketing & Sales' },
  { value: 'content-creator', label: 'Content Creator', group: 'Marketing & Sales' },
  { value: 'brand-manager', label: 'Brand Manager', group: 'Marketing & Sales' },
  // HR
  { value: 'hr-manager', label: 'HR Manager', group: 'Human Resources' },
  { value: 'recruitment-officer', label: 'Recruitment Officer', group: 'Human Resources' },
  { value: 'training-development', label: 'Training & Development', group: 'Human Resources' },
  // Health
  { value: 'doctor', label: 'Doctor', group: 'Healthcare' },
  { value: 'nurse', label: 'Nurse', group: 'Healthcare' },
  { value: 'pharmacist', label: 'Pharmacist', group: 'Healthcare' },
  { value: 'health-officer', label: 'Health Officer', group: 'Healthcare' },
  // Education
  { value: 'teacher', label: 'Teacher', group: 'Education' },
  { value: 'lecturer', label: 'Lecturer', group: 'Education' },
  { value: 'trainer', label: 'Trainer', group: 'Education' },
  // Engineering
  { value: 'civil-engineer', label: 'Civil Engineer', group: 'Engineering' },
  { value: 'mechanical-engineer', label: 'Mechanical Engineer', group: 'Engineering' },
  { value: 'electrical-engineer', label: 'Electrical Engineer', group: 'Engineering' },
  { value: 'construction-manager', label: 'Construction Manager', group: 'Engineering' },
  // Legal
  { value: 'lawyer', label: 'Lawyer', group: 'Legal' },
  { value: 'legal-advisor', label: 'Legal Advisor', group: 'Legal' },
  // Other
  { value: 'driver', label: 'Driver', group: 'Other' },
  { value: 'security-guard', label: 'Security Guard', group: 'Other' },
  { value: 'receptionist', label: 'Receptionist', group: 'Other' },
  { value: 'office-assistant', label: 'Office Assistant', group: 'Other' },
  { value: 'other', label: 'Other', group: 'Other' },
];

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
  { value: 'ETB', label: 'ETB - Ethiopian Birr' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
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

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const jobSchema = z.object({
  title:              z.string().min(5, 'Title must be at least 5 characters').max(100),
  description:        z.string().min(50, 'Description must be at least 50 characters').max(5000),
  shortDescription:   z.string().max(200).optional(),
  category:           z.string().min(1, 'Category is required'),
  type:               z.string().min(1, 'Job type is required'),
  experienceLevel:    z.string().min(1, 'Experience level is required'),
  educationLevel:     z.string().optional(),
  candidatesNeeded:   z.string().min(1).transform(v => parseInt(v) || 1),
  region:             z.string().min(1, 'Region is required'),
  city:               z.string().optional(),
  applicationDeadline: z.string().min(1, 'Deadline is required'),
  salaryMode:         z.string().min(1),
  salaryMin:          z.string().optional(),
  salaryMax:          z.string().optional(),
  salaryCurrency:     z.string().optional(),
  salaryPeriod:       z.string().optional(),
  remote:             z.string().optional(),
  workArrangement:    z.string().optional(),
  isApplyEnabled:     z.boolean().default(true),
  demographicSex:     z.string().optional(),
  jobNumber:          z.string().optional(),
  requirements:       z.array(z.string()).optional(),
  skills:             z.array(z.string()).optional(),
  responsibilities:   z.array(z.string()).optional(),
  benefits:           z.array(z.string()).optional(),
  featured:           z.boolean().default(false),
  urgent:             z.boolean().default(false),
});

type JobFormValues = z.infer<typeof jobSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: CreateJobData, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isOrg?: boolean;
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['Basic Info', 'Details', 'Salary', 'Preview'];

// ─── Helper: tomorrow ISO string ─────────────────────────────────────────────
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

// ─── toFormValues: Job → FormValues ──────────────────────────────────────────
const toFormValues = (job: Job): Partial<JobFormValues> => ({
  title:              job.title ?? '',
  description:        job.description ?? '',
  shortDescription:   job.shortDescription ?? '',
  category:           job.category ?? '',
  type:               job.type ?? 'full-time',
  experienceLevel:    job.experienceLevel ?? 'mid-level',
  educationLevel:     job.educationLevel ?? '',
  candidatesNeeded:   String(job.candidatesNeeded ?? 1) as any,
  region:             job.location?.region ?? 'addis-ababa',
  city:               job.location?.city ?? '',
  applicationDeadline: job.applicationDeadline
    ? new Date(job.applicationDeadline).toISOString().split('T')[0]
    : tomorrowISO(),
  salaryMode:         job.salaryMode ?? 'range',
  salaryMin:          job.salary?.min ? String(job.salary.min) : '',
  salaryMax:          job.salary?.max ? String(job.salary.max) : '',
  salaryCurrency:     job.salary?.currency ?? 'ETB',
  salaryPeriod:       job.salary?.period ?? 'monthly',
  remote:             job.remote ?? 'on-site',
  workArrangement:    job.workArrangement ?? 'office',
  isApplyEnabled:     job.isApplyEnabled ?? true,
  demographicSex:     job.demographicRequirements?.sex ?? 'any',
  jobNumber:          job.jobNumber ?? '',
  requirements:       job.requirements?.filter(Boolean) ?? [],
  skills:             job.skills?.filter(Boolean) ?? [],
  responsibilities:   job.responsibilities?.filter(Boolean) ?? [],
  benefits:           job.benefits?.filter(Boolean) ?? [],
  featured:           job.featured ?? false,
  urgent:             job.urgent ?? false,
});

// ─── toCreateData: FormValues → CreateJobData ─────────────────────────────────
const toCreateData = (vals: JobFormValues): CreateJobData => ({
  title:              vals.title,
  description:        vals.description,
  shortDescription:   vals.shortDescription,
  category:           vals.category,
  type:               vals.type as any,
  experienceLevel:    vals.experienceLevel as any,
  educationLevel:     vals.educationLevel,
  candidatesNeeded:   typeof vals.candidatesNeeded === 'number' ? vals.candidatesNeeded : parseInt(String(vals.candidatesNeeded)) || 1,
  location: {
    region:  vals.region as any,
    city:    vals.city,
    country: 'Ethiopia',
  },
  applicationDeadline: vals.applicationDeadline,
  salaryMode:         vals.salaryMode as any,
  salary:             vals.salaryMode === 'range' ? {
    min:          vals.salaryMin ? parseFloat(vals.salaryMin) : undefined,
    max:          vals.salaryMax ? parseFloat(vals.salaryMax) : undefined,
    currency:     vals.salaryCurrency,
    period:       vals.salaryPeriod,
    isPublic:     true,
    isNegotiable: false,
  } : undefined,
  remote:             vals.remote as any,
  workArrangement:    vals.workArrangement as any,
  isApplyEnabled:     vals.isApplyEnabled,
  requirements:       vals.requirements?.filter(Boolean),
  skills:             vals.skills?.filter(Boolean),
  responsibilities:   vals.responsibilities?.filter(Boolean),
  benefits:           vals.benefits?.filter(Boolean),
  featured:           vals.featured,
  urgent:             vals.urgent,
  jobNumber:          vals.jobNumber,
  demographicRequirements: { sex: vals.demographicSex as any },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export const JobForm: React.FC<JobFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isOrg = false,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!initialData;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
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

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset(toFormValues(initialData) as any);
    }
  }, [initialData]);

  const salaryMode = watch('salaryMode');

  const doSubmit = async (isDraft: boolean) => {
    handleSubmit(async (vals) => {
      try {
        setSubmitting(true);
        const data = toCreateData(vals);
        await onSubmit(data, isDraft);
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'Failed to save job');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const loading = isLoading || submitting;

  return (
    <View style={[f.root, { backgroundColor: c.background }]}>
      {/* Step indicator */}
      <View style={[f.stepBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {STEPS.map((s, i) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStep(i)}
            style={f.stepItem}
          >
            <View style={[
              f.stepDot,
              { backgroundColor: i <= step ? c.primary : c.border },
            ]}>
              {i < step
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={[f.stepNum, { color: i <= step ? '#fff' : c.textMuted }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[f.stepLabel, { color: i === step ? c.primary : c.textMuted }]} numberOfLines={1}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form content */}
      <KeyboardAwareScrollView
        contentContainerStyle={[f.scroll, { backgroundColor: c.background }]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={80}
      >
        {step === 0 && <StepBasic control={control} errors={errors} watch={watch} setValue={setValue} isOrg={isOrg} />}
        {step === 1 && <StepDetails control={control} errors={errors} watch={watch} setValue={setValue} />}
        {step === 2 && <StepSalary control={control} errors={errors} watch={watch} setValue={setValue} salaryMode={salaryMode} />}
        {step === 3 && <StepPreview watch={watch} />}
      </KeyboardAwareScrollView>

      {/* Navigation buttons */}
      <View style={[f.footer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        <TouchableOpacity
          onPress={step === 0 ? onCancel : prevStep}
          style={[f.footerBtn, f.outlineBtn, { borderColor: c.border }]}
          disabled={loading}
        >
          <Text style={[f.footerBtnText, { color: c.text }]}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {step < STEPS.length - 1 ? (
          <TouchableOpacity
            onPress={nextStep}
            style={[f.footerBtn, f.primaryBtn, { backgroundColor: c.primary }]}
          >
            <Text style={f.primaryBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={f.lastBtns}>
            {!isEdit && (
              <TouchableOpacity
                onPress={() => doSubmit(true)}
                disabled={loading}
                style={[f.footerBtn, f.outlineBtn, { borderColor: c.primary, marginRight: 8 }]}
              >
                <Text style={[f.footerBtnText, { color: c.primary }]}>
                  {loading ? 'Saving…' : 'Save Draft'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => doSubmit(false)}
              disabled={loading}
              style={[f.footerBtn, f.primaryBtn, { backgroundColor: loading ? c.border : c.primary }]}
            >
              <Text style={f.primaryBtnText}>
                {loading ? 'Saving…' : isEdit ? 'Update Job' : 'Publish Job'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── STEP 1: Basic Info ───────────────────────────────────────────────────────
const StepBasic = ({ control, errors, watch, setValue, isOrg }: any) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  return (
    <View>
      <SectionHeader icon="briefcase-outline" title="Basic Information" />

      <Controller name="title" control={control} render={({ field: { value, onChange } }) => (
        <FormField
          label="Job Title"
          required
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Senior Software Engineer"
          error={errors.title?.message}
        />
      )} />

      <Controller name="category" control={control} render={({ field: { value, onChange } }) => (
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
      )} />

      <Controller name="type" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Employment Type"
          required
          value={value}
          options={JOB_TYPES.map(t => ({ value: t.value, label: t.label }))}
          onSelect={onChange}
          placeholder="Select employment type"
          error={errors.type?.message}
        />
      )} />

      <Controller name="shortDescription" control={control} render={({ field: { value, onChange } }) => (
        <FormField
          label="Short Description"
          value={value}
          onChangeText={onChange}
          placeholder="Brief summary (max 200 chars)"
          maxLength={200}
          multiline
          hint={`${(value ?? '').length}/200`}
          error={errors.shortDescription?.message}
        />
      )} />

      <Controller name="description" control={control} render={({ field: { value, onChange } }) => (
        <FormField
          label="Full Description"
          required
          value={value}
          onChangeText={onChange}
          placeholder="Detailed job description (min 50 characters)..."
          multiline
          numberOfLines={6}
          hint={`${(value ?? '').length}/5000 — min 50`}
          error={errors.description?.message}
        />
      )} />

      <Controller name="jobNumber" control={control} render={({ field: { value, onChange } }) => (
        <FormField
          label="Job Reference Number"
          value={value}
          onChangeText={onChange}
          placeholder="e.g. JOB-2024-001 (optional)"
          error={errors.jobNumber?.message}
        />
      )} />

      {/* Flags */}
      <View style={[f2.flagRow, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Controller name="urgent" control={control} render={({ field: { value, onChange } }) => (
          <View style={f2.flagItem}>
            <Ionicons name="flash" size={18} color="#EF4444" />
            <Text style={[f2.flagLabel, { color: c.text }]}>Mark Urgent</Text>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: '#EF4444' }} />
          </View>
        )} />
        <Controller name="featured" control={control} render={({ field: { value, onChange } }) => (
          <View style={[f2.flagItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={[f2.flagLabel, { color: c.text }]}>Feature This Job</Text>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: '#F59E0B' }} />
          </View>
        )} />
        <Controller name="isApplyEnabled" control={control} render={({ field: { value, onChange } }) => (
          <View style={[f2.flagItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={[f2.flagLabel, { color: c.text }]}>Accept Applications</Text>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: '#10B981' }} />
          </View>
        )} />
      </View>
    </View>
  );
};

// ─── STEP 2: Details ─────────────────────────────────────────────────────────
const StepDetails = ({ control, errors, watch, setValue }: any) => {
  return (
    <View>
      <SectionHeader icon="list-outline" title="Job Details" />

      <Controller name="experienceLevel" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Experience Level"
          required
          value={value}
          options={EXPERIENCE_LEVELS.map(e => ({ value: e.value, label: e.label }))}
          onSelect={onChange}
          placeholder="Select experience level"
          error={errors.experienceLevel?.message}
        />
      )} />

      <Controller name="educationLevel" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Education Level"
          value={value ?? ''}
          options={EDUCATION_LEVELS.map(e => ({ value: e.value, label: e.label }))}
          onSelect={onChange}
          placeholder="Select education level"
          error={errors.educationLevel?.message}
        />
      )} />

      <Controller name="remote" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Work Mode"
          value={value ?? 'on-site'}
          options={REMOTE_OPTIONS}
          onSelect={onChange}
          placeholder="Select work mode"
          error={errors.remote?.message}
        />
      )} />

      <Controller name="workArrangement" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Work Arrangement"
          value={value ?? 'office'}
          options={WORK_ARRANGEMENTS}
          onSelect={onChange}
          placeholder="Select arrangement"
          error={errors.workArrangement?.message}
        />
      )} />

      <Controller name="region" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Region"
          required
          value={value}
          options={ETHIOPIAN_REGIONS.map(r => ({ value: r.value, label: r.label }))}
          onSelect={onChange}
          placeholder="Select region"
          error={errors.region?.message}
          searchable
        />
      )} />

      <Controller name="city" control={control} render={({ field: { value, onChange } }) => (
        <FormField
          label="City"
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Addis Ababa"
          error={errors.city?.message}
        />
      )} />

      <Controller name="applicationDeadline" control={control} render={({ field: { value, onChange } }) => (
        <FormField
          label="Application Deadline"
          required
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          hint="Format: YYYY-MM-DD (e.g. 2024-12-31)"
          error={errors.applicationDeadline?.message}
          keyboardType="numbers-and-punctuation"
        />
      )} />

      <Controller name="candidatesNeeded" control={control} render={({ field: { value, onChange } }) => (
        <FormField
          label="Number of Positions"
          required
          value={String(value ?? '1')}
          onChangeText={onChange}
          placeholder="e.g. 3"
          keyboardType="numeric"
          error={errors.candidatesNeeded?.message}
          hint="How many candidates do you need to hire?"
        />
      )} />

      <Controller name="demographicSex" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Gender Requirement"
          value={value ?? 'any'}
          options={DEMOGRAPHIC_SEX}
          onSelect={onChange}
          placeholder="Select gender requirement"
          error={errors.demographicSex?.message}
        />
      )} />

      {/* Dynamic arrays */}
      <Controller name="requirements" control={control} render={({ field: { value, onChange } }) => (
        <TagInput
          label="Requirements"
          values={value ?? []}
          onChange={onChange}
          placeholder="Add a requirement and press Add"
          error={errors.requirements?.message}
        />
      )} />

      <Controller name="responsibilities" control={control} render={({ field: { value, onChange } }) => (
        <TagInput
          label="Responsibilities"
          values={value ?? []}
          onChange={onChange}
          placeholder="Add a responsibility and press Add"
        />
      )} />

      <Controller name="skills" control={control} render={({ field: { value, onChange } }) => (
        <TagInput
          label="Required Skills"
          values={value ?? []}
          onChange={onChange}
          placeholder="Add a skill and press Add"
        />
      )} />

      <Controller name="benefits" control={control} render={({ field: { value, onChange } }) => (
        <TagInput
          label="Benefits & Perks"
          values={value ?? []}
          onChange={onChange}
          placeholder="Add a benefit and press Add"
        />
      )} />
    </View>
  );
};

// ─── STEP 3: Salary ───────────────────────────────────────────────────────────
const StepSalary = ({ control, errors, watch, setValue, salaryMode }: any) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  return (
    <View>
      <SectionHeader icon="cash-outline" title="Salary & Compensation" />

      <Controller name="salaryMode" control={control} render={({ field: { value, onChange } }) => (
        <SelectPicker
          label="Salary Display Mode"
          required
          value={value}
          options={SALARY_MODES.map(m => ({ value: m.value, label: m.label }))}
          onSelect={onChange}
          placeholder="Select salary mode"
          error={errors.salaryMode?.message}
        />
      )} />

      {salaryMode === 'range' && (
        <>
          <Controller name="salaryCurrency" control={control} render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Currency"
              value={value ?? 'ETB'}
              options={CURRENCIES}
              onSelect={onChange}
              placeholder="Select currency"
              error={errors.salaryCurrency?.message}
            />
          )} />

          <View style={f2.salaryRow}>
            <View style={f2.salaryHalf}>
              <Controller name="salaryMin" control={control} render={({ field: { value, onChange } }) => (
                <FormField
                  label="Min Salary"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. 15000"
                  keyboardType="numeric"
                  error={errors.salaryMin?.message}
                />
              )} />
            </View>
            <View style={f2.salaryHalf}>
              <Controller name="salaryMax" control={control} render={({ field: { value, onChange } }) => (
                <FormField
                  label="Max Salary"
                  value={value}
                  onChangeText={onChange}
                  placeholder="e.g. 30000"
                  keyboardType="numeric"
                  error={errors.salaryMax?.message}
                />
              )} />
            </View>
          </View>

          <Controller name="salaryPeriod" control={control} render={({ field: { value, onChange } }) => (
            <SelectPicker
              label="Pay Period"
              value={value ?? 'monthly'}
              options={SALARY_PERIODS}
              onSelect={onChange}
              placeholder="Select pay period"
              error={errors.salaryPeriod?.message}
            />
          )} />
        </>
      )}

      {salaryMode !== 'range' && (
        <View style={[f2.salaryNote, { backgroundColor: `${c.info}15`, borderColor: `${c.info}30` }]}>
          <Ionicons name="information-circle-outline" size={20} color={c.info} />
          <Text style={[f2.salaryNoteText, { color: c.textMuted }]}>
            {salaryMode === 'hidden' && 'Salary will be hidden from candidates.'}
            {salaryMode === 'negotiable' && 'Salary will be shown as "Negotiable".'}
            {salaryMode === 'company-scale' && 'Salary will be shown as "As per company scale".'}
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── STEP 4: Preview ──────────────────────────────────────────────────────────
const StepPreview = ({ watch }: any) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const vals = watch();

  const cat = JOB_CATEGORIES.find(x => x.value === vals.category)?.label ?? vals.category;
  const type = JOB_TYPES.find(x => x.value === vals.type)?.label ?? vals.type;
  const exp = EXPERIENCE_LEVELS.find(x => x.value === vals.experienceLevel)?.label ?? vals.experienceLevel;
  const region = ETHIOPIAN_REGIONS.find(x => x.value === vals.region)?.label ?? vals.region;
  const salMode = SALARY_MODES.find(x => x.value === vals.salaryMode)?.label ?? vals.salaryMode;

  const rows: Array<{ icon: string; label: string; value: string }> = [
    { icon: 'briefcase-outline', label: 'Category', value: cat },
    { icon: 'time-outline', label: 'Type', value: type },
    { icon: 'trending-up-outline', label: 'Experience', value: exp },
    { icon: 'location-outline', label: 'Location', value: `${vals.city ? vals.city + ', ' : ''}${region}` },
    { icon: 'calendar-outline', label: 'Deadline', value: vals.applicationDeadline },
    { icon: 'people-outline', label: 'Positions', value: String(vals.candidatesNeeded ?? 1) },
    { icon: 'cash-outline', label: 'Salary', value: salMode },
  ];

  return (
    <View>
      <SectionHeader icon="eye-outline" title="Preview" />

      <View style={[f2.previewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[f2.previewTitle, { color: c.text }]}>{vals.title || 'No title'}</Text>
        {vals.urgent && (
          <View style={[f2.badge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '700' }}>🔥 URGENT</Text>
          </View>
        )}
        {vals.featured && (
          <View style={[f2.badge, { backgroundColor: '#FEF3C7', marginLeft: 6 }]}>
            <Text style={{ color: '#D97706', fontSize: 11, fontWeight: '700' }}>⭐ FEATURED</Text>
          </View>
        )}
      </View>

      {rows.map(r => (
        <View key={r.label} style={[f2.previewRow, { borderBottomColor: c.border }]}>
          <Ionicons name={r.icon as any} size={16} color={c.textMuted} />
          <Text style={[f2.previewRowLabel, { color: c.textMuted }]}>{r.label}</Text>
          <Text style={[f2.previewRowValue, { color: c.text }]} numberOfLines={1}>{r.value || '—'}</Text>
        </View>
      ))}

      {vals.shortDescription ? (
        <View style={[f2.previewDesc, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[f2.previewDescLabel, { color: c.textMuted }]}>Overview</Text>
          <Text style={[f2.previewDescText, { color: c.text }]}>{vals.shortDescription}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title }: { icon: string; title: string }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  return (
    <View style={[f2.secHeader, { borderBottomColor: c.border }]}>
      <Ionicons name={icon as any} size={20} color={c.primary} />
      <Text style={[f2.secTitle, { color: c.text }]}>{title}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const f = StyleSheet.create({
  root:           { flex: 1 },
  stepBar:        { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  stepItem:       { flex: 1, alignItems: 'center', gap: 4 },
  stepDot:        { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum:        { fontSize: 11, fontWeight: '700' },
  stepLabel:      { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  scroll:         { padding: 16, paddingBottom: 40 },
  footer:         { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 10 },
  footerBtn:      { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  outlineBtn:     { borderWidth: 1.5 },
  primaryBtn:     {},
  footerBtnText:  { fontSize: 15, fontWeight: '600' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  lastBtns:       { flex: 1, flexDirection: 'row' },
});

const f2 = StyleSheet.create({
  flagRow:        { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  flagItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  flagLabel:      { flex: 1, fontSize: 14, fontWeight: '500' },
  salaryRow:      { flexDirection: 'row', gap: 10 },
  salaryHalf:     { flex: 1 },
  salaryNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  salaryNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  secHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1 },
  secTitle:       { fontSize: 17, fontWeight: '700' },
  previewCard:    { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  previewTitle:   { fontSize: 18, fontWeight: '700', flex: 1 },
  badge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  previewRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  previewRowLabel:{ fontSize: 13, width: 90 },
  previewRowValue:{ flex: 1, fontSize: 13, fontWeight: '500', textAlign: 'right' },
  previewDesc:    { marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  previewDescLabel:{ fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewDescText:{ fontSize: 14, lineHeight: 20 },
});
