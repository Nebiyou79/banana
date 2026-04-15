/**
 * mobile/src/screens/candidate/ApplyJobScreen.tsx
 * Master-Form-Architect skill: apply workflow with Zod + react-hook-form.
 */

import React, { useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useJob } from '../../hooks/useJobs';
import { useApplyForJob, useMyCVs } from '../../hooks/useApplications';
import { ScreenHeader } from '../../components/shared/ScreenHeader';

// ─── Schema ───────────────────────────────────────────────────────────────────

const applySchema = z.object({
  coverLetter: z.string()
    .min(100, 'Cover letter must be at least 100 characters')
    .max(2000, 'Cover letter cannot exceed 2000 characters'),
  skills: z.array(z.object({ value: z.string().min(1) }))
    .min(1, 'Add at least one skill'),
  contactEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactTelegram: z.string().optional(),
  selectedCvId: z.string().optional(),
});

type ApplyForm = z.infer<typeof applySchema>;

interface Props {
  navigation: any;
  route: { params: { jobId: string; jobTitle: string } };
}

export const ApplyJobScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId, jobTitle } = route.params;
  const { theme } = useThemeStore();
  const c = theme.colors;

  const jobQ  = useJob(jobId);
  const cvsQ  = useMyCVs();
  const apply = useApplyForJob();
  const job   = jobQ.data;

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { coverLetter: '', skills: [{ value: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'skills' });

  const inputStyle = (hasError?: boolean) => [
    s.input,
    {
      color: c.text,
      backgroundColor: c.inputBg,
      borderColor: hasError ? c.error : c.border,
    },
  ];

  const onSubmit = useCallback(async (values: ApplyForm) => {
    const payload = {
      coverLetter: values.coverLetter,
      skills: values.skills.map(s => s.value).filter(Boolean),
      contactInfo: {
        email:    values.contactEmail || undefined,
        phone:    values.contactPhone || undefined,
        telegram: values.contactTelegram || undefined,
      },
      selectedCVs: values.selectedCvId ? [{ cvId: values.selectedCvId }] : [],
    };
    try {
      await apply.mutateAsync({ jobId, data: payload });
      navigation.goBack();
    } catch { /* handled by hook */ }
  }, [jobId, apply, navigation]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: c.background }]} edges={['top']}>
      <ScreenHeader title="Apply" subtitle={jobTitle} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Job summary ── */}
        {job && (
          <View style={[s.jobCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.jobTitle, { color: c.text }]}>{job.title}</Text>
            <Text style={[s.jobCompany, { color: c.textSecondary }]}>
              {job.company?.name ?? job.organization?.name}
            </Text>
            <View style={[s.requirementsBadge, { backgroundColor: c.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={14} color={c.primary} />
              <Text style={[s.requirementsText, { color: c.primary }]}>
                {(job.requirements ?? []).length} requirements · {job.experienceLevel} experience
              </Text>
            </View>
          </View>
        )}

        {/* ── CV Selection ── */}
        {cvsQ.data && cvsQ.data.length > 0 && (
          <View style={s.section}>
            <Text style={[s.label, { color: c.textSecondary }]}>SELECT CV <Text style={{ color: c.error }}>*</Text></Text>
            <Controller control={control} name="selectedCvId" render={({ field: f }) => (
              <View style={{ gap: 8 }}>
                {cvsQ.data!.map((cv: any) => {
                  const active = f.value === cv._id;
                  return (
                    <TouchableOpacity
                      key={cv._id}
                      style={[s.cvRow, {
                        backgroundColor: active ? c.primaryLight : c.card,
                        borderColor: active ? c.primary : c.border,
                        borderWidth: active ? 2 : 1,
                      }]}
                      onPress={() => f.onChange(active ? undefined : cv._id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="document-outline" size={18} color={active ? c.primary : c.textMuted} />
                      <Text style={[s.cvName, { color: active ? c.primary : c.text }]} numberOfLines={1}>
                        {cv.originalName ?? cv.filename ?? 'CV Document'}
                      </Text>
                      {active && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )} />
          </View>
        )}

        {/* ── Cover Letter ── */}
        <View style={s.section}>
          <Text style={[s.label, { color: c.textSecondary }]}>COVER LETTER <Text style={{ color: c.error }}>*</Text></Text>
          <Controller control={control} name="coverLetter" render={({ field: f }) => (
            <TextInput
              style={[inputStyle(!!errors.coverLetter), s.coverInput]}
              value={f.value}
              onChangeText={f.onChange}
              placeholder="Introduce yourself and explain why you're the perfect fit for this role…"
              placeholderTextColor={c.placeholder}
              multiline
              textAlignVertical="top"
            />
          )} />
          <View style={s.charRow}>
            {errors.coverLetter && <Text style={{ color: c.error, fontSize: 12 }}>{errors.coverLetter.message}</Text>}
            <Text style={[s.charCount, { color: c.textMuted }]}>{watch('coverLetter')?.length ?? 0}/2000</Text>
          </View>
        </View>

        {/* ── Skills ── */}
        <View style={s.section}>
          <View style={s.rowHeader}>
            <Text style={[s.label, { color: c.textSecondary }]}>YOUR SKILLS <Text style={{ color: c.error }}>*</Text></Text>
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: c.primaryLight }]}
              onPress={() => append({ value: '' })}
            >
              <Ionicons name="add" size={14} color={c.primary} />
              <Text style={[s.addBtnText, { color: c.primary }]}>Add Skill</Text>
            </TouchableOpacity>
          </View>
          {errors.skills && (
            <Text style={{ color: c.error, fontSize: 12, marginBottom: 8 }}>
              {(errors.skills as any).message ?? 'Add at least one skill'}
            </Text>
          )}
          <View style={{ gap: 8 }}>
            {fields.map((field, i) => (
              <Controller key={field.id} control={control} name={`skills.${i}.value`} render={({ field: f }) => (
                <View style={[s.skillRow, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                  <View style={[s.skillBullet, { backgroundColor: c.primary }]} />
                  <TextInput
                    style={[s.skillInput, { color: c.text }]}
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder="e.g. React Native, Node.js"
                    placeholderTextColor={c.placeholder}
                  />
                  {fields.length > 1 && (
                    <TouchableOpacity onPress={() => remove(i)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Ionicons name="close-circle" size={18} color={c.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              )} />
            ))}
          </View>
        </View>

        {/* ── Contact Info ── */}
        <View style={s.section}>
          <Text style={[s.label, { color: c.textSecondary }]}>CONTACT INFORMATION</Text>
          <View style={{ gap: 10 }}>
            {([
              { name: 'contactEmail' as const,    icon: 'mail-outline',      placeholder: 'Email address',   keyboard: 'email-address' as const },
              { name: 'contactPhone' as const,    icon: 'call-outline',      placeholder: 'Phone number',    keyboard: 'phone-pad' as const },
              { name: 'contactTelegram' as const, icon: 'paper-plane-outline',placeholder: 'Telegram handle', keyboard: 'default' as const },
            ]).map(field => (
              <Controller key={field.name} control={control} name={field.name} render={({ f: fld }: any) => {
                const { field: f } = require('react-hook-form').useController({ name: field.name, control });
                return (
                  <View style={[s.contactRow, { backgroundColor: c.inputBg, borderColor: (errors as any)[field.name] ? c.error : c.border }]}>
                    <Ionicons name={field.icon as any} size={18} color={c.textMuted} />
                    <TextInput
                      style={[s.contactInput, { color: c.text }]}
                      value={f.value}
                      onChangeText={f.onChange}
                      placeholder={field.placeholder}
                      placeholderTextColor={c.placeholder}
                      keyboardType={field.keyboard}
                      autoCapitalize="none"
                    />
                  </View>
                );
              }} />
            ))}
          </View>
        </View>

        {/* ── Submit ── */}
        <View style={s.actionArea}>
          <TouchableOpacity style={[s.cancelBtn, { borderColor: c.border }]} onPress={() => navigation.goBack()}>
            <Text style={[s.cancelText, { color: c.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: c.primary, opacity: apply.isPending ? 0.7 : 1 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={apply.isPending}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={s.submitText}>{apply.isPending ? 'Submitting…' : 'Submit Application'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { padding: 16, paddingBottom: 40 },
  jobCard:     { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  jobTitle:    { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  jobCompany:  { fontSize: 14, marginBottom: 10 },
  requirementsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  requirementsText:  { fontSize: 12, fontWeight: '600' },
  section:     { marginBottom: 24 },
  label:       { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  input:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  coverInput:  { minHeight: 160, textAlignVertical: 'top', paddingTop: 12 },
  charRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  charCount:   { fontSize: 11, marginLeft: 'auto' },
  rowHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  addBtnText:  { fontSize: 13, fontWeight: '600' },
  skillRow:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  skillBullet: { width: 6, height: 6, borderRadius: 3 },
  skillInput:  { flex: 1, fontSize: 14 },
  contactRow:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  contactInput:{ flex: 1, fontSize: 14 },
  cvRow:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, gap: 10 },
  cvName:      { flex: 1, fontSize: 14 },
  actionArea:  { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:   { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 14, borderWidth: 1 },
  cancelText:  { fontSize: 15, fontWeight: '600' },
  submitBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14, gap: 8 },
  submitText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});