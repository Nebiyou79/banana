/**
 * mobile/src/components/jobs/JobForm.tsx
 *
 * ── Master-Form-Architect skill applied ──────────────────────────────────────
 * - Zod schema mirrors server/src/models/Job.js + createJobValidation
 * - react-hook-form for all state — no manual useState for inputs
 * - KeyboardAwareScrollView prevents keyboard from covering inputs
 * - isEdit mode: resets form with initialData on mount
 * - Dynamic requirements/skills/benefits arrays
 * - Smart pickers for region, type, experience, salaryMode
 * - Salary fields conditionally shown based on salaryMode
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, Modal, FlatList, Switch,
} from 'react-native';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import {
  Job, CreateJobData, UpdateJobData,
  ETHIOPIAN_REGIONS, JOB_TYPES, EXPERIENCE_LEVELS,
  SALARY_MODES, EDUCATION_LEVELS, SalaryModeValue,
} from '../../services/jobService';

// ─── Zod schema — mirrors server createJobValidation ─────────────────────────

const jobSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  shortDescription: z.string().max(200).optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['full-time','part-time','contract','internship','temporary','volunteer','remote','hybrid']),
  experienceLevel: z.enum(['fresh-graduate','entry-level','mid-level','senior-level','managerial','director','executive']),
  educationLevel: z.string().optional(),
  candidatesNeeded: z.number({ invalid_type_error: 'Must be a number' }).int().min(1, 'At least 1 candidate required'),
  region: z.string().min(1, 'Region is required'),
  city: z.string().optional(),
  country: z.string().default('Ethiopia'),
  applicationDeadline: z.string().min(1, 'Deadline is required'),
  salaryMode: z.enum(['range','hidden','negotiable','company-scale']),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.string().optional(),
  isApplyEnabled: z.boolean().default(true),
  remote: z.enum(['remote','hybrid','on-site']).default('on-site'),
  featured: z.boolean().default(false),
  urgent: z.boolean().default(false),
  status: z.enum(['draft','active']).default('draft'),
  requirements:    z.array(z.object({ value: z.string() })).default([]),
  responsibilities:z.array(z.object({ value: z.string() })).default([]),
  skills:          z.array(z.object({ value: z.string() })).default([]),
  benefits:        z.array(z.object({ value: z.string() })).default([]),
  jobNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.salaryMode === 'range') {
    if (!data.salaryCurrency) {
      ctx.addIssue({ code: 'custom', path: ['salaryCurrency'], message: 'Currency required for salary range' });
    }
    if (data.salaryMin !== undefined && data.salaryMax !== undefined && data.salaryMin > data.salaryMax) {
      ctx.addIssue({ code: 'custom', path: ['salaryMax'], message: 'Max must be greater than min' });
    }
  }
  const dl = new Date(data.applicationDeadline);
  if (isNaN(dl.getTime()) || dl <= new Date()) {
    ctx.addIssue({ code: 'custom', path: ['applicationDeadline'], message: 'Deadline must be a future date' });
  }
});

type FormValues = z.infer<typeof jobSchema>;

// ─── Transform helpers ────────────────────────────────────────────────────────

const toFormValues = (job?: Job | null): Partial<FormValues> => {
  if (!job) return {};
  const dl = job.applicationDeadline
    ? new Date(job.applicationDeadline).toISOString().split('T')[0]
    : '';
  return {
    title:             job.title,
    description:       job.description,
    shortDescription:  job.shortDescription,
    category:          job.category,
    type:              job.type,
    experienceLevel:   job.experienceLevel,
    educationLevel:    job.educationLevel,
    candidatesNeeded:  job.candidatesNeeded,
    region:            job.location?.region,
    city:              job.location?.city,
    country:           job.location?.country ?? 'Ethiopia',
    applicationDeadline: dl,
    salaryMode:        job.salaryMode,
    salaryMin:         job.salary?.min,
    salaryMax:         job.salary?.max,
    salaryCurrency:    job.salary?.currency,
    salaryPeriod:      job.salary?.period ?? 'monthly',
    isApplyEnabled:    job.isApplyEnabled,
    remote:            job.remote,
    featured:          job.featured ?? false,
    urgent:            job.urgent ?? false,
    status:            (job.status === 'active' ? 'active' : 'draft'),
    requirements:      (job.requirements ?? []).map(v => ({ value: v })),
    responsibilities:  (job.responsibilities ?? []).map(v => ({ value: v })),
    skills:            (job.skills ?? []).map(v => ({ value: v })),
    benefits:          (job.benefits ?? []).map(v => ({ value: v })),
    jobNumber:         job.jobNumber,
  };
};

const fromFormValues = (v: FormValues): CreateJobData => {
  const deadline = new Date(v.applicationDeadline);
  deadline.setUTCHours(23, 59, 59, 999);

  const data: CreateJobData = {
    title:               v.title,
    description:         v.description,
    shortDescription:    v.shortDescription,
    category:            v.category,
    type:                v.type,
    experienceLevel:     v.experienceLevel,
    educationLevel:      v.educationLevel,
    candidatesNeeded:    v.candidatesNeeded,
    location:            { region: v.region as any, city: v.city, country: v.country },
    applicationDeadline: deadline.toISOString(),
    salaryMode:          v.salaryMode,
    isApplyEnabled:      v.isApplyEnabled,
    remote:              v.remote,
    featured:            v.featured,
    urgent:              v.urgent,
    status:              v.status,
    requirements:        v.requirements.map(r => r.value).filter(Boolean),
    responsibilities:    v.responsibilities.map(r => r.value).filter(Boolean),
    skills:              v.skills.map(r => r.value).filter(Boolean),
    benefits:            v.benefits.map(r => r.value).filter(Boolean),
    jobNumber:           v.jobNumber,
  };

  if (v.salaryMode === 'range' && (v.salaryMin || v.salaryMax)) {
    data.salary = {
      min:      v.salaryMin,
      max:      v.salaryMax,
      currency: v.salaryCurrency ?? 'ETB',
      period:   v.salaryPeriod ?? 'monthly',
    };
  }

  return data;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface JobFormProps {
  initialData?: Job | null;
  isOrg?:       boolean;
  onSubmit:     (data: CreateJobData, isDraft: boolean) => Promise<void>;
  onCancel?:    () => void;
  isLoading?:   boolean;
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

const FieldLabel: React.FC<{ label: string; required?: boolean; colors: any }> = ({ label, required, colors }) => (
  <Text style={[fld.label, { color: colors.textSecondary }]}>
    {label}{required && <Text style={{ color: colors.error }}> *</Text>}
  </Text>
);

const FieldError: React.FC<{ msg?: string; colors: any }> = ({ msg, colors }) =>
  msg ? <Text style={[fld.error, { color: colors.error }]}>{msg}</Text> : null;

const fld = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  error: { fontSize: 12, marginTop: 4 },
});

// ─── Picker modal ─────────────────────────────────────────────────────────────

interface PickerModalProps<T extends string> {
  visible:   boolean;
  title:     string;
  items:     readonly { value: T; label: string }[];
  value?:    T;
  onChange:  (v: T) => void;
  onClose:   () => void;
  colors:    any;
  isDark:    boolean;
}

function PickerModal<T extends string>({ visible, title, items, value, onChange, onClose, colors, isDark }: PickerModalProps<T>) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[pm.sheet, { backgroundColor: colors.background }]}>
        <View style={[pm.header, { borderBottomColor: colors.border }]}>
          <Text style={[pm.title, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={pm.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items as { value: T; label: string }[]}
          keyExtractor={item => item.value}
          renderItem={({ item }) => {
            const active = item.value === value;
            return (
              <TouchableOpacity
                style={[pm.item, { borderBottomColor: colors.border, backgroundColor: active ? colors.primaryLight : colors.surface }]}>
                <Text style={[pm.itemText, { color: active ? colors.primary : colors.text, fontWeight: active ? '700' : '400' }]}>{item.label}</Text>
                {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  sheet:    { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title:    { fontSize: 17, fontWeight: '700' },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  item:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  itemText: { fontSize: 15 },
});

// ─── Dynamic array field ──────────────────────────────────────────────────────

interface DynamicArrayProps {
  label:    string;
  name:     'requirements' | 'responsibilities' | 'skills' | 'benefits';
  control:  any;
  colors:   any;
}

const DynamicArray: React.FC<DynamicArrayProps> = ({ label, name, control, colors }) => {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <View style={da.wrap}>
      <View style={da.header}>
        <Text style={[da.label, { color: colors.textSecondary }]}>{label}</Text>
        <TouchableOpacity
          style={[da.addBtn, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={[da.addText, { color: colors.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>
      {fields.map((field, index) => (
        <Controller
          key={field.id}
          control={control}
          name={`${name}.${index}.value`}
          render={({ field: f }) => (
            <View style={[da.row, { borderColor: colors.border }]}>
              <View style={[da.bullet, { backgroundColor: colors.primary }]} />
              <TextInput
                style={[da.input, { color: colors.text }]}>
                {f.value}
              </TextInput>
              <TouchableOpacity
                onPress={() => remove(index)}
                style={da.removeBtn}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        />
      ))}
      {fields.length === 0 && (
        <Text style={[da.empty, { color: colors.textMuted }]}>No {label.toLowerCase()} added yet</Text>
      )}
    </View>
  );
};

const da = StyleSheet.create({
  wrap:      { marginBottom: 20 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label:     { fontSize: 13, fontWeight: '600' },
  addBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  addText:   { fontSize: 13, fontWeight: '600' },
  row:       { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8, gap: 8 },
  bullet:    { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  input:     { flex: 1, fontSize: 14, lineHeight: 20, minHeight: 36 },
  removeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty:     { fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
});

// ─── Category picker data (abbreviated — top categories) ─────────────────────

const TOP_CATEGORIES = [
  { value: 'software-developer',         label: 'Software Developer' },
  { value: 'frontend-developer',         label: 'Frontend Developer' },
  { value: 'backend-developer',          label: 'Backend Developer' },
  { value: 'fullstack-developer',        label: 'Fullstack Developer' },
  { value: 'data-analyst',               label: 'Data Analyst' },
  { value: 'ui-designer',                label: 'UI Designer' },
  { value: 'product-manager',            label: 'Product Manager' },
  { value: 'accountant',                 label: 'Accountant' },
  { value: 'hr-officer',                 label: 'HR Officer' },
  { value: 'project-manager',            label: 'Project Manager' },
  { value: 'sales-representative',       label: 'Sales Representative' },
  { value: 'marketing-officer',          label: 'Marketing Officer' },
  { value: 'civil-engineer',             label: 'Civil Engineer' },
  { value: 'electrical-engineer',        label: 'Electrical Engineer' },
  { value: 'nurse',                      label: 'Nurse' },
  { value: 'general-practitioner',       label: 'General Practitioner' },
  { value: 'university-lecturer',        label: 'University Lecturer' },
  { value: 'primary-teacher',            label: 'Primary Teacher' },
  { value: 'driver',                     label: 'Driver' },
  { value: 'security-guard',             label: 'Security Guard' },
  { value: 'program-officer',            label: 'Program Officer' },
  { value: 'procurement-officer',        label: 'Procurement Officer' },
  { value: 'logistics-officer',          label: 'Logistics Officer' },
  { value: 'intern',                     label: 'Intern' },
  { value: 'other',                      label: 'Other' },
] as const;

// ─── Section card wrapper ─────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon?: string; colors: any; children: React.ReactNode }> =
  ({ title, icon, colors, children }) => (
    <View style={[sec.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={sec.header}>
        {icon && <Ionicons name={icon as any} size={18} color={colors.primary} />}
        <Text style={[sec.title, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

const sec = StyleSheet.create({
  card:   { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title:  { fontSize: 16, fontWeight: '700' },
});

// ─── Main Form Component ──────────────────────────────────────────────────────

export const JobForm: React.FC<JobFormProps> = ({
  initialData, isOrg = false, onSubmit, onCancel, isLoading = false,
}) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const isEdit = !!initialData;

  // Picker visibility state
  const [picker, setPicker] = useState<null | 'type' | 'experienceLevel' | 'region' | 'salaryMode' | 'category' | 'educationLevel' | 'remote'>(null);

  const defaultValues: Partial<FormValues> = {
    title: '', description: '', category: 'software-developer',
    type: 'full-time', experienceLevel: 'mid-level',
    educationLevel: 'none-required', candidatesNeeded: 1,
    region: 'addis-ababa', city: '', country: 'Ethiopia',
    applicationDeadline: (() => {
      const d = new Date(); d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })(),
    salaryMode: 'negotiable', salaryCurrency: 'ETB', salaryPeriod: 'monthly',
    isApplyEnabled: true, remote: 'on-site', featured: false, urgent: false,
    status: 'draft', requirements: [], responsibilities: [], skills: [], benefits: [],
  };

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: isEdit ? { ...defaultValues, ...toFormValues(initialData) } : defaultValues,
  });

  // isEdit: pre-populate form
  useEffect(() => {
    if (isEdit && initialData) {
      reset({ ...defaultValues, ...toFormValues(initialData) });
    }
  }, [initialData]);

  const salaryMode = watch('salaryMode');
  const showSalary = salaryMode === 'range';

  // ── Typed input helper ───────────────────────────────────────────────────

  const inputStyle = useCallback((hasError?: boolean) => [
    s.input,
    { color: c.text, backgroundColor: c.inputBg, borderColor: hasError ? c.error : c.border },
  ], [c, theme.isDark]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const doSubmit = useCallback((isDraft: boolean): SubmitHandler<FormValues> => async (values) => {
    const payload = fromFormValues({ ...values, status: isDraft ? 'draft' : 'active' });
    await onSubmit(payload, isDraft);
  }, [onSubmit]);

  const onPublish = handleSubmit(doSubmit(false), (errs) => {
    const first = Object.values(errs)[0];
    const msg   = (first as any)?.message ?? 'Please fix the errors and try again';
    Alert.alert('Validation Error', msg);
  });

  const onSaveDraft = handleSubmit(doSubmit(true));

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={s.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.pageHeader}>
        <Text style={[s.pageTitle, { color: c.text }]}>
          {isEdit ? 'Edit Job Posting' : 'Post a New Job'}
        </Text>
        <Text style={[s.pageSubtitle, { color: c.textMuted }]}>
          {isEdit ? 'Update the details below' : 'Fill in the details to attract the right candidates'}
        </Text>
      </View>

      {/* ── Basic Info ── */}
      <Section title="Basic Information" icon="briefcase-outline" colors={c}>
        {/* Title */}
        <View style={s.field}>
          <FieldLabel label="Job Title" required colors={c} />
          <Controller control={control} name="title" render={({ field: f }) => (
            <TextInput style={inputStyle(!!errors.title)} value={f.value} onChangeText={f.onChange}
              placeholder="e.g. Senior Software Engineer" placeholderTextColor={c.placeholder} maxLength={100} />
          )} />
          <FieldError msg={errors.title?.message} colors={c} />
        </View>

        {/* Job Number */}
        <View style={s.field}>
          <FieldLabel label="Job Reference Number" colors={c} />
          <Controller control={control} name="jobNumber" render={({ field: f }) => (
            <TextInput style={inputStyle()} value={f.value} onChangeText={f.onChange}
              placeholder="e.g. HR-2024-001" placeholderTextColor={c.placeholder} />
          )} />
        </View>

        {/* Category */}
        <View style={s.field}>
          <FieldLabel label="Category" required colors={c} />
          <Controller control={control} name="category" render={({ field: f }) => {
            const label = TOP_CATEGORIES.find(x => x.value === f.value)?.label ?? f.value;
            return (
              <TouchableOpacity style={inputStyle(!!errors.category)} onPress={() => setPicker('category')} activeOpacity={0.7}>
                <View style={s.pickerRow}>
                  <Text style={{ color: f.value ? c.text : c.placeholder, fontSize: 15 }}>{f.value ? label : 'Select category'}</Text>
                  <Ionicons name="chevron-down" size={16} color={c.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }} />
          <FieldError msg={errors.category?.message} colors={c} />
          <PickerModal visible={picker === 'category'} title="Job Category"
            items={TOP_CATEGORIES} value={watch('category') as any}
            onChange={v => setValue('category', v)} onClose={() => setPicker(null)} colors={c} isDark={theme.isDark} />
        </View>

        {/* Employment Type */}
        <View style={s.field}>
          <FieldLabel label="Employment Type" required colors={c} />
          <Controller control={control} name="type" render={({ field: f }) => {
            const label = JOB_TYPES.find(x => x.value === f.value)?.label ?? f.value;
            return (
              <TouchableOpacity style={inputStyle(!!errors.type)} onPress={() => setPicker('type')} activeOpacity={0.7}>
                <View style={s.pickerRow}>
                  <Text style={{ color: c.text, fontSize: 15 }}>{label}</Text>
                  <Ionicons name="chevron-down" size={16} color={c.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }} />
          <PickerModal visible={picker === 'type'} title="Employment Type"
            items={JOB_TYPES} value={watch('type')}
            onChange={v => setValue('type', v)} onClose={() => setPicker(null)} colors={c} isDark={theme.isDark} />
        </View>

        {/* Short description */}
        <View style={s.field}>
          <FieldLabel label="Short Description" colors={c} />
          <Controller control={control} name="shortDescription" render={({ field: f }) => (
            <TextInput style={[inputStyle(), { height: 70 }]} value={f.value} onChangeText={f.onChange}
              placeholder="One-line summary for search results (max 200)" placeholderTextColor={c.placeholder}
              multiline maxLength={200} textAlignVertical="top" />
          )} />
        </View>
      </Section>

      {/* ── Full Description ── */}
      <Section title="Full Job Description" icon="document-text-outline" colors={c}>
        <Controller control={control} name="description" render={({ field: f }) => (
          <TextInput
            style={[inputStyle(!!errors.description), s.descInput]}
            value={f.value} onChangeText={f.onChange}
            placeholder="Describe the role, responsibilities, and what makes this job unique…"
            placeholderTextColor={c.placeholder}
            multiline textAlignVertical="top"
          />
        )} />
        <View style={s.charCount}>
          <Text style={{ color: c.textMuted, fontSize: 11 }}>{watch('description')?.length ?? 0}/5000</Text>
        </View>
        <FieldError msg={errors.description?.message} colors={c} />
      </Section>

      {/* ── Location ── */}
      <Section title="Location" icon="location-outline" colors={c}>
        <View style={s.field}>
          <FieldLabel label="Region" required colors={c} />
          <Controller control={control} name="region" render={({ field: f }) => {
            const label = ETHIOPIAN_REGIONS.find(x => x.value === f.value)?.label ?? 'Select region';
            return (
              <TouchableOpacity style={inputStyle(!!errors.region)} onPress={() => setPicker('region')} activeOpacity={0.7}>
                <View style={s.pickerRow}>
                  <Text style={{ color: f.value ? c.text : c.placeholder, fontSize: 15 }}>{label}</Text>
                  <Ionicons name="chevron-down" size={16} color={c.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }} />
          <FieldError msg={errors.region?.message} colors={c} />
          <PickerModal visible={picker === 'region'} title="Region"
            items={ETHIOPIAN_REGIONS} value={watch('region') as any}
            onChange={v => setValue('region', v)} onClose={() => setPicker(null)} colors={c} isDark={theme.isDark} />
        </View>

        <View style={s.field}>
          <FieldLabel label="City" colors={c} />
          <Controller control={control} name="city" render={({ field: f }) => (
            <TextInput style={inputStyle()} value={f.value} onChangeText={f.onChange}
              placeholder="e.g. Addis Ababa" placeholderTextColor={c.placeholder} />
          )} />
        </View>

        <View style={s.field}>
          <FieldLabel label="Work Arrangement" required colors={c} />
          <Controller control={control} name="remote" render={({ field: f }) => {
            const opts = [{ value: 'on-site', label: 'On-Site' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'remote', label: 'Remote' }];
            return (
              <View style={s.segmented}>
                {opts.map(opt => {
                  const active = f.value === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.segment, { backgroundColor: active ? c.primary : c.inputBg, borderColor: active ? c.primary : c.border }]}>
                      <Text style={[s.segmentText, { color: active ? '#fff' : c.textSecondary }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }} />
        </View>
      </Section>

      {/* ── Requirements ── */}
      <Section title="Position Requirements" icon="checkmark-circle-outline" colors={c}>
        <DynamicArray label="Requirements"    name="requirements"    control={control} colors={c} />
        <DynamicArray label="Responsibilities" name="responsibilities" control={control} colors={c} />
        <DynamicArray label="Skills"          name="skills"          control={control} colors={c} />
        <DynamicArray label="Benefits"        name="benefits"        control={control} colors={c} />
      </Section>

      {/* ── Candidate Profile ── */}
      <Section title="Candidate Profile" icon="people-outline" colors={c}>
        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Experience Level" required colors={c} />
            <Controller control={control} name="experienceLevel" render={({ field: f }) => {
              const label = EXPERIENCE_LEVELS.find(x => x.value === f.value)?.label ?? f.value;
              return (
                <TouchableOpacity style={inputStyle(!!errors.experienceLevel)} onPress={() => setPicker('experienceLevel')} activeOpacity={0.7}>
                  <View style={s.pickerRow}>
                    <Text style={{ color: c.text, fontSize: 14 }} numberOfLines={1}>{label}</Text>
                    <Ionicons name="chevron-down" size={14} color={c.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            }} />
            <PickerModal visible={picker === 'experienceLevel'} title="Experience Level"
              items={EXPERIENCE_LEVELS} value={watch('experienceLevel')}
              onChange={v => setValue('experienceLevel', v)} onClose={() => setPicker(null)} colors={c} isDark={theme.isDark} />
          </View>

          <View style={{ flex: 1 }}>
            <FieldLabel label="Education" colors={c} />
            <Controller control={control} name="educationLevel" render={({ field: f }) => {
              const label = EDUCATION_LEVELS.find(x => x.value === f.value)?.label ?? 'Any';
              return (
                <TouchableOpacity style={inputStyle()} onPress={() => setPicker('educationLevel')} activeOpacity={0.7}>
                  <View style={s.pickerRow}>
                    <Text style={{ color: c.text, fontSize: 14 }} numberOfLines={1}>{label}</Text>
                    <Ionicons name="chevron-down" size={14} color={c.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            }} />
            <PickerModal visible={picker === 'educationLevel'} title="Education Level"
              items={EDUCATION_LEVELS} value={watch('educationLevel') as any}
              onChange={v => setValue('educationLevel', v)} onClose={() => setPicker(null)} colors={c} isDark={theme.isDark} />
          </View>
        </View>

        <View style={s.field}>
          <FieldLabel label="Candidates Needed" required colors={c} />
          <Controller control={control} name="candidatesNeeded" render={({ field: f }) => (
            <View style={s.counterRow}>
              <TouchableOpacity
                style={[s.counterBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}>
                <Ionicons name="remove" size={18} color={c.text} />
              </TouchableOpacity>
              <Text style={[s.counterVal, { color: c.text }]}>{f.value ?? 1}</Text>
              <TouchableOpacity
                style={[s.counterBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}>
                <Ionicons name="add" size={18} color={c.text} />
              </TouchableOpacity>
            </View>
          )} />
          <FieldError msg={errors.candidatesNeeded?.message} colors={c} />
        </View>
      </Section>

      {/* ── Salary ── */}
      <Section title="Compensation" icon="cash-outline" colors={c}>
        <View style={s.field}>
          <FieldLabel label="Salary Display Mode" required colors={c} />
          <Controller control={control} name="salaryMode" render={({ field: f }) => (
            <View style={s.salaryModeGrid}>
              {SALARY_MODES.map(mode => {
                const active = f.value === mode.value;
                return (
                  <TouchableOpacity
                    key={mode.value}
                    style={[s.salaryModeBtn, {
                      backgroundColor: active ? c.primaryLight : c.inputBg,
                      borderColor: active ? c.primary : c.border,
                      borderWidth: active ? 2 : 1,
                    }]}>
                    <Text style={[s.salaryModeTxt, { color: active ? c.primary : c.textSecondary, fontWeight: active ? '700' : '500' }]}>{mode.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )} />
        </View>

        {showSalary && (
          <>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Min Salary" colors={c} />
                <Controller control={control} name="salaryMin" render={({ field: f }) => (
                  <TextInput style={inputStyle()} value={f.value?.toString() ?? ''}
                    onChangeText={v => f.onChange(v ? Number(v) : undefined)}
                    placeholder="0" placeholderTextColor={c.placeholder} keyboardType="numeric" />
                )} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Max Salary" colors={c} />
                <Controller control={control} name="salaryMax" render={({ field: f }) => (
                  <TextInput style={inputStyle(!!errors.salaryMax)} value={f.value?.toString() ?? ''}
                    onChangeText={v => f.onChange(v ? Number(v) : undefined)}
                    placeholder="0" placeholderTextColor={c.placeholder} keyboardType="numeric" />
                )} />
                <FieldError msg={errors.salaryMax?.message} colors={c} />
              </View>
            </View>

            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Currency *" colors={c} />
                <Controller control={control} name="salaryCurrency" render={({ field: f }) => (
                  <View style={s.segmented}>
                    {['ETB','USD','EUR'].map(cur => {
                      const active = f.value === cur;
                      return (
                        <TouchableOpacity key={cur}
                          style={[s.segment, { backgroundColor: active ? c.primary : c.inputBg, borderColor: active ? c.primary : c.border }]}>
                          <Text style={[s.segmentText, { color: active ? '#fff' : c.textSecondary }]}>{cur}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )} />
                <FieldError msg={errors.salaryCurrency?.message} colors={c} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Period" colors={c} />
                <Controller control={control} name="salaryPeriod" render={({ field: f }) => (
                  <View style={s.segmented}>
                    {[{v:'monthly',l:'Monthly'},{v:'yearly',l:'Yearly'}].map(p => {
                      const active = f.value === p.v;
                      return (
                        <TouchableOpacity key={p.v}
                          style={[s.segment, { backgroundColor: active ? c.primary : c.inputBg, borderColor: active ? c.primary : c.border }]}>
                          <Text style={[s.segmentText, { color: active ? '#fff' : c.textSecondary }]}>{p.l}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )} />
              </View>
            </View>
          </>
        )}
      </Section>

      {/* ── Settings ── */}
      <Section title="Posting Settings" icon="settings-outline" colors={c}>
        <View style={s.field}>
          <FieldLabel label="Application Deadline" required colors={c} />
          <Controller control={control} name="applicationDeadline" render={({ field: f }) => (
            <TextInput style={inputStyle(!!errors.applicationDeadline)} value={f.value} onChangeText={f.onChange}
              placeholder="YYYY-MM-DD" placeholderTextColor={c.placeholder} keyboardType="numbers-and-punctuation" />
          )} />
          <FieldError msg={errors.applicationDeadline?.message} colors={c} />
          <Text style={[s.hint, { color: c.textMuted }]}>Format: YYYY-MM-DD (e.g. 2025-03-15)</Text>
        </View>

        {/* Toggles */}
        {([
          { name: 'isApplyEnabled' as const, label: 'Accept Applications',  sub: 'Candidates can submit applications' },
          { name: 'featured'       as const, label: 'Featured Listing',     sub: 'Highlighted in search results' },
          { name: 'urgent'         as const, label: 'Urgent Hiring',        sub: 'Marked as urgent position' },
        ]).map((row, i) => (
          <Controller key={row.name} control={control} name={row.name} render={({ field: f }) => (
            <View style={[s.toggle, { borderTopColor: c.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.toggleLabel, { color: c.text }]}>{row.label}</Text>
                <Text style={[s.toggleSub, { color: c.textMuted }]}>{row.sub}</Text>
              </View>
              <Switch
                value={!!f.value}
                onValueChange={f.onChange}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
                ios_backgroundColor={c.border}
              />
            </View>
          )} />
        ))}
      </Section>

      {/* ── Action Buttons ── */}
      <View style={s.actions}>
        {onCancel && (
          <TouchableOpacity style={[s.cancelBtn, { borderColor: c.border }]} onPress={onCancel} activeOpacity={0.7}>
            <Text style={[s.cancelText, { color: c.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.draftBtn, { borderColor: c.primary }]}>
          <Ionicons name="save-outline" size={18} color={c.primary} />
          <Text style={[s.draftText, { color: c.primary }]}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.publishBtn, { backgroundColor: c.primary, opacity: isLoading ? 0.6 : 1 }]}>
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={s.publishText}>{isEdit ? 'Update Job' : 'Publish Job'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:      { padding: 16, paddingBottom: 48 },
  pageHeader:     { marginBottom: 20 },
  pageTitle:      { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  pageSubtitle:   { fontSize: 14, lineHeight: 20 },
  field:          { marginBottom: 16 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, minHeight: 48,
  },
  descInput:      { minHeight: 180, textAlignVertical: 'top', paddingTop: 12 },
  charCount:      { alignItems: 'flex-end', marginTop: 4 },
  pickerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row2:           { flexDirection: 'row', gap: 12, marginBottom: 16 },
  segmented:      { flexDirection: 'row', gap: 8 },
  segment:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10, borderWidth: 1 },
  segmentText:    { fontSize: 13, fontWeight: '600' },
  counterRow:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn:     { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  counterVal:     { fontSize: 22, fontWeight: '700', minWidth: 48, textAlign: 'center' },
  salaryModeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  salaryModeBtn:  { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, minWidth: 120 },
  salaryModeTxt:  { fontSize: 13, textAlign: 'center' },
  toggle:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  toggleLabel:    { fontSize: 14, fontWeight: '600' },
  toggleSub:      { fontSize: 12, marginTop: 2 },
  hint:           { fontSize: 11, marginTop: 4 },
  actions:        { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn:      { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelText:     { fontSize: 15, fontWeight: '600' },
  draftBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 2, gap: 6 },
  draftText:      { fontSize: 15, fontWeight: '700' },
  publishBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 6 },
  publishText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
});