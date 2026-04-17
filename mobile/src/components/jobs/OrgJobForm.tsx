/**
 * src/components/jobs/OrgJobForm.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ORGANIZATION opportunity create/edit form.
 * Extends JobForm logic with:
 *  - opportunityType selector (job/volunteer/internship/fellowship/training/grant)
 *  - duration fields
 *  - volunteer-specific fields (hoursPerWeek, commitmentLevel, stipend, accommodation)
 *  - Organization-specific defaults (jobType='organization')
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert,
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

// ─── Constants ────────────────────────────────────────────────────────────────
const OPPORTUNITY_TYPES = [
  { value: 'job',         label: '💼 Job Opportunity',     description: 'Traditional employment position' },
  { value: 'volunteer',   label: '❤️ Volunteer Position',  description: 'Unpaid social impact role' },
  { value: 'internship',  label: '🎓 Internship',          description: 'Learning-focused temporary role' },
  { value: 'fellowship',  label: '🏅 Fellowship',          description: 'Competitive funded program' },
  { value: 'training',    label: '📚 Training Program',    description: 'Skill development program' },
  { value: 'grant',       label: '💰 Grant',               description: 'Funding opportunity' },
  { value: 'other',       label: '📌 Other',               description: 'Other opportunity type' },
];

const DURATION_UNITS = [
  { value: 'days',   label: 'Days' },
  { value: 'weeks',  label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years',  label: 'Years' },
];

const COMMITMENT_LEVELS = [
  { value: 'casual',    label: 'Casual (Flexible hours)' },
  { value: 'regular',   label: 'Regular (Part-time)' },
  { value: 'intensive', label: 'Intensive (Full-time)' },
];

const JOB_CATEGORIES = [
  { value: 'software-engineer', label: 'Software Engineer', group: 'Technology' },
  { value: 'web-developer', label: 'Web Developer', group: 'Technology' },
  { value: 'data-scientist', label: 'Data Scientist', group: 'Technology' },
  { value: 'accountant', label: 'Accountant', group: 'Business & Finance' },
  { value: 'finance-officer', label: 'Finance Officer', group: 'Business & Finance' },
  { value: 'project-manager', label: 'Project Manager', group: 'Business & Finance' },
  { value: 'marketing-manager', label: 'Marketing Manager', group: 'Marketing & Sales' },
  { value: 'hr-manager', label: 'HR Manager', group: 'Human Resources' },
  { value: 'doctor', label: 'Doctor', group: 'Healthcare' },
  { value: 'nurse', label: 'Nurse', group: 'Healthcare' },
  { value: 'teacher', label: 'Teacher', group: 'Education' },
  { value: 'lecturer', label: 'Lecturer', group: 'Education' },
  { value: 'civil-engineer', label: 'Civil Engineer', group: 'Engineering' },
  { value: 'social-worker', label: 'Social Worker', group: 'NGO / Social' },
  { value: 'community-organizer', label: 'Community Organizer', group: 'NGO / Social' },
  { value: 'program-coordinator', label: 'Program Coordinator', group: 'NGO / Social' },
  { value: 'field-officer', label: 'Field Officer', group: 'NGO / Social' },
  { value: 'monitoring-evaluation', label: 'M&E Officer', group: 'NGO / Social' },
  { value: 'communications-officer', label: 'Communications Officer', group: 'NGO / Social' },
  { value: 'other', label: 'Other', group: 'Other' },
];

const REMOTE_OPTIONS = [
  { value: 'on-site', label: 'On-Site' },
  { value: 'hybrid',  label: 'Hybrid' },
  { value: 'remote',  label: 'Fully Remote' },
];

const CURRENCIES = [
  { value: 'ETB', label: 'ETB - Ethiopian Birr' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
];

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const orgJobSchema = z.object({
  title:              z.string().min(5, 'Title must be at least 5 characters').max(100),
  description:        z.string().min(50, 'Description must be at least 50 characters').max(5000),
  shortDescription:   z.string().max(200).optional(),
  category:           z.string().min(1, 'Category is required'),
  opportunityType:    z.string().min(1, 'Opportunity type is required'),
  type:               z.string().min(1, 'Job type is required'),
  experienceLevel:    z.string().min(1, 'Experience level is required'),
  educationLevel:     z.string().optional(),
  candidatesNeeded:   z.string().transform(v => parseInt(v) || 1),
  region:             z.string().min(1, 'Region is required'),
  city:               z.string().optional(),
  applicationDeadline: z.string().min(1, 'Deadline is required'),
  salaryMode:         z.string().min(1),
  salaryMin:          z.string().optional(),
  salaryMax:          z.string().optional(),
  salaryCurrency:     z.string().optional(),
  salaryPeriod:       z.string().optional(),
  remote:             z.string().optional(),
  isApplyEnabled:     z.boolean().default(true),
  // Duration
  durationValue:      z.string().optional(),
  durationUnit:       z.string().optional(),
  isOngoing:          z.boolean().default(false),
  // Volunteer
  hoursPerWeek:       z.string().optional(),
  commitmentLevel:    z.string().optional(),
  providesAccommodation: z.boolean().default(false),
  providesStipend:    z.boolean().default(false),
  // Dynamic
  requirements:       z.array(z.string()).optional(),
  skills:             z.array(z.string()).optional(),
  responsibilities:   z.array(z.string()).optional(),
  benefits:           z.array(z.string()).optional(),
  // Org context
  missionAlignment:   z.string().optional(),
  impactStatement:    z.string().optional(),
  featured:           z.boolean().default(false),
  urgent:             z.boolean().default(false),
});

type OrgJobFormValues = z.infer<typeof orgJobSchema>;

interface OrgJobFormProps {
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

const toFormValues = (job: Job): Partial<OrgJobFormValues> => ({
  title:              job.title ?? '',
  description:        job.description ?? '',
  shortDescription:   job.shortDescription ?? '',
  category:           job.category ?? '',
  opportunityType:    job.opportunityType ?? 'job',
  type:               job.type ?? 'full-time',
  experienceLevel:    job.experienceLevel ?? 'mid-level',
  educationLevel:     job.educationLevel ?? '',
  candidatesNeeded:   String(job.candidatesNeeded ?? 1) as any,
  region:             job.location?.region ?? 'addis-ababa',
  city:               job.location?.city ?? '',
  applicationDeadline: job.applicationDeadline
    ? new Date(job.applicationDeadline).toISOString().split('T')[0]
    : tomorrowISO(),
  salaryMode:         job.salaryMode ?? 'hidden',
  salaryMin:          job.salary?.min ? String(job.salary.min) : '',
  salaryMax:          job.salary?.max ? String(job.salary.max) : '',
  salaryCurrency:     job.salary?.currency ?? 'ETB',
  salaryPeriod:       job.salary?.period ?? 'monthly',
  remote:             job.remote ?? 'on-site',
  isApplyEnabled:     job.isApplyEnabled ?? true,
  requirements:       job.requirements?.filter(Boolean) ?? [],
  skills:             job.skills?.filter(Boolean) ?? [],
  responsibilities:   job.responsibilities?.filter(Boolean) ?? [],
  benefits:           job.benefits?.filter(Boolean) ?? [],
  featured:           job.featured ?? false,
  urgent:             job.urgent ?? false,
});

const toCreateData = (vals: OrgJobFormValues): CreateJobData => ({
  title:            vals.title,
  description:      vals.description,
  shortDescription: vals.shortDescription,
  category:         vals.category,
  type:             vals.type as any,
  opportunityType:  vals.opportunityType as any,
  experienceLevel:  vals.experienceLevel as any,
  educationLevel:   vals.educationLevel,
  candidatesNeeded: typeof vals.candidatesNeeded === 'number' ? vals.candidatesNeeded : parseInt(String(vals.candidatesNeeded)) || 1,
  location: {
    region:  vals.region as any,
    city:    vals.city,
    country: 'Ethiopia',
  },
  applicationDeadline: vals.applicationDeadline,
  salaryMode:       vals.salaryMode as any,
  salary:           vals.salaryMode === 'range' ? {
    min:      vals.salaryMin ? parseFloat(vals.salaryMin) : undefined,
    max:      vals.salaryMax ? parseFloat(vals.salaryMax) : undefined,
    currency: vals.salaryCurrency,
    period:   vals.salaryPeriod,
    isPublic: true,
    isNegotiable: false,
  } : undefined,
  remote:           vals.remote as any,
  isApplyEnabled:   vals.isApplyEnabled,
  requirements:     vals.requirements?.filter(Boolean),
  skills:           vals.skills?.filter(Boolean),
  responsibilities: vals.responsibilities?.filter(Boolean),
  benefits:         vals.benefits?.filter(Boolean),
  featured:         vals.featured,
  urgent:           vals.urgent,
});

const STEPS = ['Opportunity', 'Details', 'Salary', 'Preview'];

export const OrgJobForm: React.FC<OrgJobFormProps> = ({
  initialData, onSubmit, onCancel, isLoading = false,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!initialData;

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<OrgJobFormValues>({
    resolver: zodResolver(orgJobSchema) as any,
    defaultValues: {
      title: '', description: '', shortDescription: '',
      category: '', opportunityType: 'job', type: 'full-time',
      experienceLevel: 'mid-level', educationLevel: 'none-required',
      candidatesNeeded: '1' as any,
      region: 'addis-ababa', city: '',
      applicationDeadline: tomorrowISO(),
      salaryMode: 'hidden',
      salaryMin: '', salaryMax: '', salaryCurrency: 'ETB', salaryPeriod: 'monthly',
      remote: 'on-site', isApplyEnabled: true,
      durationValue: '', durationUnit: 'months', isOngoing: false,
      hoursPerWeek: '', commitmentLevel: 'regular',
      providesAccommodation: false, providesStipend: false,
      requirements: [], skills: [], responsibilities: [], benefits: [],
      missionAlignment: '', impactStatement: '',
      featured: false, urgent: false,
    },
  });

  useEffect(() => {
    if (initialData) reset(toFormValues(initialData) as any);
  }, [initialData]);

  const opportunityType = watch('opportunityType');
  const salaryMode = watch('salaryMode');
  const isOngoing = watch('isOngoing');
  const showVolunteerFields = ['volunteer', 'internship'].includes(opportunityType);
  const showDuration = ['volunteer', 'internship', 'fellowship', 'training'].includes(opportunityType);

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

  return (
    <View style={[s.root, { backgroundColor: c.background }]}>
      {/* Step bar */}
      <View style={[s.stepBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {STEPS.map((st, i) => (
          <TouchableOpacity key={st} onPress={() => setStep(i)} style={s.stepItem}>
            <View style={[s.stepDot, { backgroundColor: i <= step ? c.primary : c.border }]}>
              {i < step
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={[s.stepNum, { color: i <= step ? '#fff' : c.textMuted }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[s.stepLabel, { color: i === step ? c.primary : c.textMuted }]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[s.scroll, { backgroundColor: c.background }]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={80}
      >
        {/* STEP 0 */}
        {step === 0 && (
          <View>
            <SectionTitle icon="heart-outline" title="Opportunity Type & Basic Info" c={c} />

            {/* Opportunity type cards */}
            <Text style={[s.fieldLabel, { color: c.text }]}>
              Opportunity Type <Text style={{ color: c.error }}>*</Text>
            </Text>
            <Controller name="opportunityType" control={control} render={({ field: { value, onChange } }) => (
              <View style={s.typeGrid}>
                {OPPORTUNITY_TYPES.map(ot => (
                  <TouchableOpacity
                    key={ot.value}
                    onPress={() => onChange(ot.value)}
                    style={[
                      s.typeCard,
                      { backgroundColor: value === ot.value ? `${c.primary}18` : c.surface, borderColor: value === ot.value ? c.primary : c.border },
                    ]}
                  >
                    <Text style={[s.typeCardTitle, { color: value === ot.value ? c.primary : c.text }]}>{ot.label}</Text>
                    <Text style={[s.typeCardDesc, { color: c.textMuted }]} numberOfLines={2}>{ot.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )} />
            {errors.opportunityType && <Text style={{ color: c.error, fontSize: 12, marginBottom: 8 }}>{errors.opportunityType.message}</Text>}

            <Controller name="title" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="Opportunity Title" required value={value} onChangeText={onChange}
                placeholder="e.g. Community Health Volunteer" error={errors.title?.message} />
            )} />

            <Controller name="category" control={control} render={({ field: { value, onChange } }) => (
              <SelectPicker label="Category" required value={value}
                options={JOB_CATEGORIES} onSelect={onChange}
                placeholder="Select category" error={errors.category?.message} searchable />
            )} />

            <Controller name="type" control={control} render={({ field: { value, onChange } }) => (
              <SelectPicker label="Employment Type" required value={value}
                options={JOB_TYPES.map(t => ({ value: t.value, label: t.label }))}
                onSelect={onChange} placeholder="Select type" error={errors.type?.message} />
            )} />

            <Controller name="shortDescription" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="Short Description" value={value} onChangeText={onChange}
                placeholder="Brief overview (max 200 chars)" maxLength={200} multiline
                hint={`${(value ?? '').length}/200`} />
            )} />

            <Controller name="description" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="Full Description" required value={value} onChangeText={onChange}
                placeholder="Detailed description (min 50 characters)..." multiline numberOfLines={6}
                hint={`${(value ?? '').length}/5000 — min 50`} error={errors.description?.message} />
            )} />

            <Controller name="missionAlignment" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="Mission Alignment" value={value} onChangeText={onChange}
                placeholder="How does this align with your organization's mission?" multiline />
            )} />

            <Controller name="impactStatement" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="Impact Statement" value={value} onChangeText={onChange}
                placeholder="What impact will this role have?" multiline />
            )} />
          </View>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <View>
            <SectionTitle icon="list-outline" title="Details & Requirements" c={c} />

            <Controller name="experienceLevel" control={control} render={({ field: { value, onChange } }) => (
              <SelectPicker label="Experience Level" required value={value}
                options={EXPERIENCE_LEVELS.map(e => ({ value: e.value, label: e.label }))}
                onSelect={onChange} placeholder="Select level" error={errors.experienceLevel?.message} />
            )} />

            <Controller name="educationLevel" control={control} render={({ field: { value, onChange } }) => (
              <SelectPicker label="Education Level" value={value ?? ''}
                options={EDUCATION_LEVELS.map(e => ({ value: e.value, label: e.label }))}
                onSelect={onChange} placeholder="Select education" />
            )} />

            <Controller name="remote" control={control} render={({ field: { value, onChange } }) => (
              <SelectPicker label="Work Mode" value={value ?? 'on-site'}
                options={REMOTE_OPTIONS} onSelect={onChange} placeholder="Select work mode" />
            )} />

            <Controller name="region" control={control} render={({ field: { value, onChange } }) => (
              <SelectPicker label="Region" required value={value}
                options={ETHIOPIAN_REGIONS.map(r => ({ value: r.value, label: r.label }))}
                onSelect={onChange} placeholder="Select region" error={errors.region?.message} searchable />
            )} />

            <Controller name="city" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="City" value={value} onChangeText={onChange} placeholder="e.g. Addis Ababa" />
            )} />

            <Controller name="applicationDeadline" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="Application Deadline" required value={value} onChangeText={onChange}
                placeholder="YYYY-MM-DD" hint="Format: YYYY-MM-DD" error={errors.applicationDeadline?.message}
                keyboardType="numbers-and-punctuation" />
            )} />

            <Controller name="candidatesNeeded" control={control} render={({ field: { value, onChange } }) => (
              <FormField label="Number of Positions" required value={String(value ?? '1')}
                onChangeText={onChange} placeholder="e.g. 5" keyboardType="numeric"
                error={errors.candidatesNeeded?.message} />
            )} />

            {/* Duration */}
            {showDuration && (
              <>
                <SectionTitle icon="time-outline" title="Duration" c={c} />
                <Controller name="isOngoing" control={control} render={({ field: { value, onChange } }) => (
                  <View style={[s.switchRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[s.switchLabel, { color: c.text }]}>Ongoing (No fixed end date)</Text>
                    <Switch value={value} onValueChange={onChange} trackColor={{ true: c.primary }} />
                  </View>
                )} />
                {!isOngoing && (
                  <View style={s.durationRow}>
                    <View style={{ flex: 1 }}>
                      <Controller name="durationValue" control={control} render={({ field: { value, onChange } }) => (
                        <FormField label="Duration" value={value} onChangeText={onChange}
                          placeholder="e.g. 6" keyboardType="numeric" />
                      )} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Controller name="durationUnit" control={control} render={({ field: { value, onChange } }) => (
                        <SelectPicker label="Unit" value={value ?? 'months'}
                          options={DURATION_UNITS} onSelect={onChange} placeholder="Unit" />
                      )} />
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Volunteer-specific */}
            {showVolunteerFields && (
              <>
                <SectionTitle icon="heart-outline" title="Volunteer Details" c={c} />
                <Controller name="hoursPerWeek" control={control} render={({ field: { value, onChange } }) => (
                  <FormField label="Hours per Week" value={value} onChangeText={onChange}
                    placeholder="e.g. 20" keyboardType="numeric" />
                )} />
                <Controller name="commitmentLevel" control={control} render={({ field: { value, onChange } }) => (
                  <SelectPicker label="Commitment Level" value={value ?? 'regular'}
                    options={COMMITMENT_LEVELS} onSelect={onChange} placeholder="Select commitment" />
                )} />
                <View style={[s.flagsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Controller name="providesStipend" control={control} render={({ field: { value, onChange } }) => (
                    <View style={s.flagItem}>
                      <Ionicons name="cash-outline" size={18} color="#10B981" />
                      <Text style={[s.flagLabel, { color: c.text }]}>Provides Stipend</Text>
                      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#10B981' }} />
                    </View>
                  )} />
                  <Controller name="providesAccommodation" control={control} render={({ field: { value, onChange } }) => (
                    <View style={[s.flagItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                      <Ionicons name="home-outline" size={18} color="#3B82F6" />
                      <Text style={[s.flagLabel, { color: c.text }]}>Provides Accommodation</Text>
                      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#3B82F6' }} />
                    </View>
                  )} />
                </View>
              </>
            )}

            {/* Dynamic arrays */}
            <Controller name="requirements" control={control} render={({ field: { value, onChange } }) => (
              <TagInput label="Requirements" values={value ?? []} onChange={onChange}
                placeholder="Add requirement and press Add" />
            )} />
            <Controller name="responsibilities" control={control} render={({ field: { value, onChange } }) => (
              <TagInput label="Responsibilities" values={value ?? []} onChange={onChange}
                placeholder="Add responsibility and press Add" />
            )} />
            <Controller name="skills" control={control} render={({ field: { value, onChange } }) => (
              <TagInput label="Required Skills" values={value ?? []} onChange={onChange}
                placeholder="Add skill and press Add" />
            )} />
            <Controller name="benefits" control={control} render={({ field: { value, onChange } }) => (
              <TagInput label="Benefits & Perks" values={value ?? []} onChange={onChange}
                placeholder="Add benefit and press Add" />
            )} />

            {/* Flags */}
            <View style={[s.flagsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Controller name="urgent" control={control} render={({ field: { value, onChange } }) => (
                <View style={s.flagItem}>
                  <Ionicons name="flash" size={18} color="#EF4444" />
                  <Text style={[s.flagLabel, { color: c.text }]}>Mark Urgent</Text>
                  <Switch value={value} onValueChange={onChange} trackColor={{ true: '#EF4444' }} />
                </View>
              )} />
              <Controller name="featured" control={control} render={({ field: { value, onChange } }) => (
                <View style={[s.flagItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <Ionicons name="star" size={18} color="#F59E0B" />
                  <Text style={[s.flagLabel, { color: c.text }]}>Feature This</Text>
                  <Switch value={value} onValueChange={onChange} trackColor={{ true: '#F59E0B' }} />
                </View>
              )} />
              <Controller name="isApplyEnabled" control={control} render={({ field: { value, onChange } }) => (
                <View style={[s.flagItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={[s.flagLabel, { color: c.text }]}>Accept Applications</Text>
                  <Switch value={value} onValueChange={onChange} trackColor={{ true: '#10B981' }} />
                </View>
              )} />
            </View>
          </View>
        )}

        {/* STEP 2: Salary */}
        {step === 2 && (
          <View>
            <SectionTitle icon="cash-outline" title="Compensation" c={c} />

            <Controller name="salaryMode" control={control} render={({ field: { value, onChange } }) => (
              <SelectPicker label="Salary Display Mode" required value={value}
                options={SALARY_MODES.map(m => ({ value: m.value, label: m.label }))}
                onSelect={onChange} placeholder="Select salary mode" />
            )} />

            {salaryMode === 'range' && (
              <>
                <Controller name="salaryCurrency" control={control} render={({ field: { value, onChange } }) => (
                  <SelectPicker label="Currency" value={value ?? 'ETB'}
                    options={CURRENCIES} onSelect={onChange} placeholder="Select currency" />
                )} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Controller name="salaryMin" control={control} render={({ field: { value, onChange } }) => (
                      <FormField label="Min" value={value} onChangeText={onChange}
                        placeholder="e.g. 5000" keyboardType="numeric" />
                    )} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Controller name="salaryMax" control={control} render={({ field: { value, onChange } }) => (
                      <FormField label="Max" value={value} onChangeText={onChange}
                        placeholder="e.g. 15000" keyboardType="numeric" />
                    )} />
                  </View>
                </View>
              </>
            )}

            {salaryMode !== 'range' && (
              <View style={[s.infoBox, { backgroundColor: `${c.info}15`, borderColor: `${c.info}30` }]}>
                <Ionicons name="information-circle-outline" size={20} color={c.info} />
                <Text style={[s.infoText, { color: c.textMuted }]}>
                  {salaryMode === 'hidden' && 'Salary will be hidden from applicants.'}
                  {salaryMode === 'negotiable' && 'Salary shown as "Negotiable".'}
                  {salaryMode === 'company-scale' && 'Salary shown as "As per organization scale".'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 3: Preview */}
        {step === 3 && (
          <View>
            <SectionTitle icon="eye-outline" title="Review Before Publishing" c={c} />
            <View style={[s.previewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[s.previewTitle, { color: c.text }]}>{watch('title') || '—'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {watch('urgent') && <View style={s.badge}><Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '700' }}>🔥 URGENT</Text></View>}
                {watch('featured') && <View style={[s.badge, { backgroundColor: '#FEF3C7' }]}><Text style={{ color: '#D97706', fontSize: 11, fontWeight: '700' }}>⭐ FEATURED</Text></View>}
                <View style={[s.badge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '700' }}>
                    {OPPORTUNITY_TYPES.find(o => o.value === watch('opportunityType'))?.label ?? watch('opportunityType')}
                  </Text>
                </View>
              </View>
            </View>
            {[
              { icon: 'location-outline', label: 'Location', value: `${watch('city') ? watch('city') + ', ' : ''}${ETHIOPIAN_REGIONS.find(r => r.value === watch('region'))?.label ?? ''}` },
              { icon: 'calendar-outline', label: 'Deadline', value: watch('applicationDeadline') },
              { icon: 'people-outline', label: 'Positions', value: String(watch('candidatesNeeded') ?? 1) },
              { icon: 'trending-up-outline', label: 'Experience', value: EXPERIENCE_LEVELS.find(e => e.value === watch('experienceLevel'))?.label ?? '' },
            ].map(row => (
              <View key={row.label} style={[s.previewRow, { borderBottomColor: c.border }]}>
                <Ionicons name={row.icon as any} size={16} color={c.textMuted} />
                <Text style={[s.previewLabel, { color: c.textMuted }]}>{row.label}</Text>
                <Text style={[s.previewValue, { color: c.text }]} numberOfLines={1}>{row.value || '—'}</Text>
              </View>
            ))}
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={[s.footer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        <TouchableOpacity
          onPress={step === 0 ? onCancel : () => setStep(p => p - 1)}
          style={[s.btn, s.outline, { borderColor: c.border }]}
          disabled={loading}
        >
          <Text style={[s.btnText, { color: c.text }]}>{step === 0 ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>

        {step < STEPS.length - 1 ? (
          <TouchableOpacity onPress={() => setStep(p => p + 1)} style={[s.btn, s.filled, { backgroundColor: c.primary }]}>
            <Text style={s.filledText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
            {!isEdit && (
              <TouchableOpacity onPress={() => doSubmit(true)} disabled={loading}
                style={[s.btn, s.outline, { borderColor: c.primary, flex: 0.8 }]}>
                <Text style={[s.btnText, { color: c.primary }]}>{loading ? 'Saving…' : 'Draft'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => doSubmit(false)} disabled={loading}
              style={[s.btn, s.filled, { backgroundColor: loading ? c.border : c.primary }]}>
              <Text style={s.filledText}>{loading ? 'Saving…' : isEdit ? 'Update' : 'Publish'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const SectionTitle = ({ icon, title, c }: { icon: string; title: string; c: any }) => (
  <View style={[s.secHeader, { borderBottomColor: c.border }]}>
    <Ionicons name={icon as any} size={20} color={c.primary} />
    <Text style={[s.secTitle, { color: c.text }]}>{title}</Text>
  </View>
);

const s = StyleSheet.create({
  root:        { flex: 1 },
  stepBar:     { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  stepItem:    { flex: 1, alignItems: 'center', gap: 4 },
  stepDot:     { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum:     { fontSize: 11, fontWeight: '700' },
  stepLabel:   { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  scroll:      { padding: 16, paddingBottom: 40 },
  footer:      { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 10 },
  btn:         { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  outline:     { borderWidth: 1.5 },
  filled:      {},
  btnText:     { fontSize: 15, fontWeight: '600' },
  filledText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  typeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  typeCard:    { width: '47%', padding: 12, borderRadius: 12, borderWidth: 1.5 },
  typeCardTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 2 },
  typeCardDesc: { fontSize: 11, lineHeight: 15 },
  switchRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  switchLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  durationRow: { flexDirection: 'row', gap: 10 },
  flagsCard:   { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  flagItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  flagLabel:   { flex: 1, fontSize: 14, fontWeight: '500' },
  infoBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  infoText:    { flex: 1, fontSize: 13, lineHeight: 18 },
  secHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1 },
  secTitle:    { fontSize: 17, fontWeight: '700' },
  previewCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  previewTitle:{ fontSize: 18, fontWeight: '700' },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FEE2E2' },
  previewRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  previewLabel:{ fontSize: 13, width: 90 },
  previewValue:{ flex: 1, fontSize: 13, fontWeight: '500', textAlign: 'right' },
  fieldLabel:  { fontSize: 13, fontWeight: '600', marginBottom: 8 },
});
