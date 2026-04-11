import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, TextInput, Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CreateJobData } from '../../services/jobService';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title:           z.string().min(3, 'Title must be at least 3 characters'),
  category:        z.string().min(1, 'Category is required'),
  jobType:         z.string().min(1, 'Job type is required'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  educationLevel:  z.string().optional(),
  description:     z.string().min(50, 'Description must be at least 50 characters'),
});

type SchemaData = z.infer<typeof schema>;

// ─── Options ─────────────────────────────────────────────────────────────────

const JOB_TYPES    = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const EXP_LEVELS   = [
  { value: 'entry',     label: 'Entry Level' },
  { value: 'mid',       label: 'Mid Level' },
  { value: 'senior',    label: 'Senior Level' },
  { value: 'executive', label: 'Executive' },
];
const EDU_LEVELS   = [
  { value: 'none-required',         label: 'No requirement' },
  { value: 'high-school',           label: 'High School' },
  { value: 'diploma',               label: 'Diploma' },
  { value: 'undergraduate-bachelors', label: "Bachelor's" },
  { value: 'postgraduate-masters',  label: "Master's" },
  { value: 'doctoral-phd',          label: 'PhD' },
];
const CURRENCIES   = ['USD', 'ETB', 'GBP'];

// ─── Props ───────────────────────────────────────────────────────────────────

interface JobFormProps {
  initialData?: Partial<CreateJobData>;
  onSubmit: (data: CreateJobData) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const JobForm: React.FC<JobFormProps> = ({ initialData, onSubmit, isLoading, mode }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;

  // Accordion open/close
  const [open, setOpen] = useState<Record<string, boolean>>({
    basics: true, description: false, skills: false,
    salary: false, location: false, settings: false,
  });
  const toggle = (key: string) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  // Extra form state not in react-hook-form
  const [requirements, setRequirements] = useState<string[]>(initialData?.requirements ?? []);
  const [reqInput,     setReqInput]     = useState('');
  const [skills,       setSkills]       = useState<string[]>(initialData?.skills ?? []);
  const [skillInput,   setSkillInput]   = useState('');
  const [salaryMin,    setSalaryMin]    = useState(String(initialData?.salary?.min ?? ''));
  const [salaryMax,    setSalaryMax]    = useState(String(initialData?.salary?.max ?? ''));
  const [currency,     setCurrency]     = useState(initialData?.salary?.currency ?? 'USD');
  const [negotiable,   setNegotiable]   = useState(initialData?.salary?.negotiable ?? false);
  const [city,         setCity]         = useState(initialData?.location?.city ?? '');
  const [region,       setRegion]       = useState(initialData?.location?.region ?? '');
  const [remote,       setRemote]       = useState(initialData?.location?.remote ?? false);
  const [deadline,     setDeadline]     = useState(initialData?.applicationDeadline ?? '');
  const [applyEnabled, setApplyEnabled] = useState(initialData?.isApplyEnabled ?? true);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<SchemaData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:           initialData?.title ?? '',
      category:        initialData?.category ?? '',
      jobType:         initialData?.jobType ?? '',
      experienceLevel: initialData?.experienceLevel ?? '',
      educationLevel:  initialData?.educationLevel ?? '',
      description:     initialData?.description ?? '',
    },
  });

  const jobTypeValue = watch('jobType');
  const expValue     = watch('experienceLevel');

  // ── Dynamic lists ────────────────────────────────────────────────────────

  const addReq = () => {
    if (reqInput.trim()) {
      setRequirements((r) => [...r, reqInput.trim()]);
      setReqInput('');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills((s) => [...s, skillInput.trim()]);
      setSkillInput('');
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      title:              data.title,
      category:           data.category,
      jobType:            data.jobType,
      experienceLevel:    data.experienceLevel,
      educationLevel:     data.educationLevel,
      description:        data.description,
      requirements,
      skills,
      salary: {
        min:        salaryMin ? Number(salaryMin) : undefined,
        max:        salaryMax ? Number(salaryMax) : undefined,
        currency,
        negotiable,
      },
      location: { city: city || undefined, region: region || undefined, remote },
      applicationDeadline: deadline || undefined,
      isApplyEnabled:      applyEnabled,
    });
  });

  // ─── Section component ────────────────────────────────────────────────────

  const Section: React.FC<{ id: string; title: string; children: React.ReactNode; badge?: number }> = ({
    id, title, children, badge,
  }) => (
    <View style={[sec.wrap, { borderColor: colors.border }]}>
      <TouchableOpacity style={sec.header} onPress={() => toggle(id)} activeOpacity={0.8}>
        <Text style={[sec.title, { color: colors.text, fontSize: typography.base }]}>{title}</Text>
        <View style={sec.headerRight}>
          {badge !== undefined && badge > 0 && (
            <View style={[sec.badge, { backgroundColor: colors.primary }]}>
              <Text style={sec.badgeText}>{badge}</Text>
            </View>
          )}
          <Ionicons name={open[id] ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
      {open[id] && <View style={sec.body}>{children}</View>}
    </View>
  );

  // ─── Chip row ─────────────────────────────────────────────────────────────

  const ChipRow: React.FC<{
    options: { value: string; label: string }[];
    selected: string;
    onSelect: (v: string) => void;
  }> = ({ options, selected, onSelect }) => (
    <View style={cr.row}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          onPress={() => onSelect(o.value)}
          style={[cr.chip, {
            backgroundColor: selected === o.value ? colors.primary + '18' : colors.surface,
            borderColor:     selected === o.value ? colors.primary : colors.border,
            borderWidth:     selected === o.value ? 2 : 1,
          }]}
        >
          <Text style={[cr.chipText, { color: selected === o.value ? colors.primary : colors.textMuted, fontSize: typography.sm }]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], paddingBottom: 60 }}>

      {/* ── Section 1: Basics ──────────────────────────────────────────────── */}
      <Section id="basics" title="1. Basic Details">
        <Controller control={control} name="title"
          render={({ field, fieldState }) => (
            <Input label="Job Title *" placeholder="e.g. Senior React Developer"
              value={field.value} onChangeText={field.onChange}
              error={fieldState.error?.message} returnKeyType="next" />
          )} />

        <Controller control={control} name="category"
          render={({ field, fieldState }) => (
            <Input label="Category *" placeholder="e.g. software-development"
              value={field.value} onChangeText={field.onChange}
              error={fieldState.error?.message} returnKeyType="next" />
          )} />

        <Text style={[f.label, { color: colors.text, fontSize: typography.sm }]}>Job Type *</Text>
        <ChipRow
          options={JOB_TYPES.map((t) => ({ value: t, label: t.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }))}
          selected={jobTypeValue}
          onSelect={(v) => setValue('jobType', v, { shouldValidate: true })}
        />
        {errors.jobType && <Text style={[f.err, { color: colors.error }]}>{errors.jobType.message}</Text>}

        <Text style={[f.label, { color: colors.text, fontSize: typography.sm, marginTop: 14 }]}>Experience Level *</Text>
        <ChipRow options={EXP_LEVELS} selected={expValue}
          onSelect={(v) => setValue('experienceLevel', v, { shouldValidate: true })} />
        {errors.experienceLevel && <Text style={[f.err, { color: colors.error }]}>{errors.experienceLevel.message}</Text>}

        <Text style={[f.label, { color: colors.text, fontSize: typography.sm, marginTop: 14 }]}>Education Level</Text>
        <ChipRow
          options={EDU_LEVELS}
          selected={watch('educationLevel') ?? ''}
          onSelect={(v) => setValue('educationLevel', v)}
        />
      </Section>

      {/* ── Section 2: Description ─────────────────────────────────────────── */}
      <Section id="description" title="2. Description & Requirements">
        <Controller control={control} name="description"
          render={({ field, fieldState }) => (
            <Input label="Job Description *" placeholder="Describe the role in detail…"
              value={field.value} onChangeText={field.onChange}
              error={fieldState.error?.message} multiline numberOfLines={6} />
          )} />

        <Text style={[f.label, { color: colors.text, fontSize: typography.sm }]}>Requirements</Text>
        <View style={f.addRow}>
          <TextInput
            style={[f.addInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, flex: 1 }]}
            placeholder="Add a requirement"
            placeholderTextColor={colors.textMuted}
            value={reqInput}
            onChangeText={setReqInput}
            onSubmitEditing={addReq}
            returnKeyType="done"
          />
          <TouchableOpacity style={[f.addBtn, { backgroundColor: colors.primary }]} onPress={addReq}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {requirements.map((r, i) => (
          <View key={i} style={[f.listItem, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[{ color: colors.text, flex: 1, fontSize: typography.sm }]}>• {r}</Text>
            <TouchableOpacity onPress={() => setRequirements((prev) => prev.filter((_, j) => j !== i))}>
              <Ionicons name="close-circle" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </Section>

      {/* ── Section 3: Skills ──────────────────────────────────────────────── */}
      <Section id="skills" title="3. Skills" badge={skills.length}>
        <View style={f.addRow}>
          <TextInput
            style={[f.addInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, flex: 1 }]}
            placeholder="Add a skill (e.g. React Native)"
            placeholderTextColor={colors.textMuted}
            value={skillInput}
            onChangeText={setSkillInput}
            onSubmitEditing={addSkill}
            returnKeyType="done"
          />
          <TouchableOpacity style={[f.addBtn, { backgroundColor: colors.primary }]} onPress={addSkill}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={f.chipsWrap}>
          {skills.map((s) => (
            <View key={s} style={[f.chip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
              <Text style={[{ color: colors.primary, fontSize: typography.xs, fontWeight: '600' }]}>{s}</Text>
              <TouchableOpacity onPress={() => setSkills((prev) => prev.filter((x) => x !== s))} style={{ marginLeft: 4 }}>
                <Ionicons name="close" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </Section>

      {/* ── Section 4: Salary ──────────────────────────────────────────────── */}
      <Section id="salary" title="4. Salary">
        <View style={f.salaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={[f.label, { color: colors.text, fontSize: typography.sm }]}>Min ($)</Text>
            <TextInput
              style={[f.numInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={salaryMin}
              onChangeText={setSalaryMin}
            />
          </View>
          <Text style={{ color: colors.textMuted, marginTop: 28 }}>–</Text>
          <View style={{ flex: 1 }}>
            <Text style={[f.label, { color: colors.text, fontSize: typography.sm }]}>Max ($)</Text>
            <TextInput
              style={[f.numInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={salaryMax}
              onChangeText={setSalaryMax}
            />
          </View>
        </View>
        <Text style={[f.label, { color: colors.text, fontSize: typography.sm, marginTop: 10 }]}>Currency</Text>
        <ChipRow
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          selected={currency}
          onSelect={setCurrency}
        />
        <View style={[f.switchRow, { marginTop: 14 }]}>
          <Text style={[{ color: colors.text, fontSize: typography.base }]}>Negotiable</Text>
          <Switch
            value={negotiable}
            onValueChange={setNegotiable}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </Section>

      {/* ── Section 5: Location ────────────────────────────────────────────── */}
      <Section id="location" title="5. Location">
        <Input label="City" placeholder="e.g. Addis Ababa"
          value={city} onChangeText={setCity} />
        <Input label="Region" placeholder="e.g. addis-ababa"
          value={region} onChangeText={setRegion} />
        <View style={f.switchRow}>
          <Text style={[{ color: colors.text, fontSize: typography.base }]}>Remote position</Text>
          <Switch value={remote} onValueChange={setRemote} trackColor={{ true: colors.primary }} />
        </View>
      </Section>

      {/* ── Section 6: Settings ────────────────────────────────────────────── */}
      <Section id="settings" title="6. Settings">
        <Input label="Application Deadline" placeholder="YYYY-MM-DD"
          value={deadline} onChangeText={setDeadline} />
        <View style={f.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.text, fontSize: typography.base, fontWeight: '600' }]}>Enable Applications</Text>
            <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]}>Allow candidates to apply</Text>
          </View>
          <Switch value={applyEnabled} onValueChange={setApplyEnabled} trackColor={{ true: colors.primary }} />
        </View>
      </Section>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <Button
        title={mode === 'create' ? 'Post Job' : 'Update Job'}
        onPress={handleFormSubmit}
        loading={isLoading}
        fullWidth
        size="lg"
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const sec = StyleSheet.create({
  wrap:       { borderWidth: 1, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  title:      { fontWeight: '700' },
  headerRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:      { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText:  { color: '#fff', fontSize: 10, fontWeight: '700' },
  body:       { paddingHorizontal: 14, paddingBottom: 14 },
});

const cr = StyleSheet.create({
  row:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99 },
  chipText: { fontWeight: '600' },
});

const f = StyleSheet.create({
  label:    { fontWeight: '600', marginBottom: 6, marginTop: 8 },
  err:      { fontSize: 12, marginTop: 2 },
  addRow:   { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  addBtn:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listItem: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6 },
  chipsWrap:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:     { flexDirection: 'row', alignItems: 'center', borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  salaryRow:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  numInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 4 },
  switchRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});
