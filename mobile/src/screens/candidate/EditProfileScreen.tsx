/**
 * screens/candidate/EditProfileScreen.tsx
 *
 * Fully-validated profile editor for the Candidate role.
 * ─ react-hook-form + Zod validation
 * ─ Dynamic arrays for Skills, Experience, Education, Certifications
 * ─ CV upload via multipart/form-data (matches backend /candidate/cv)
 * ─ KeyboardAvoidingView + ScrollView so nothing is hidden behind keyboard
 * ─ Full dark/light compatibility via theme tokens
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as DocumentPicker from 'expo-document-picker';
import { useQueryClient } from '@tanstack/react-query';

import { useThemeStore }  from '../../store/themeStore';
import { useProfile, useCandidateRoleProfile, useUpdateProfile } from '../../hooks/useProfile';
import { Input }          from '../../components/ui/Input';
import { toast }          from '../../lib/toast';
import api                from '../../lib/api';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;
const ACCENT = '#F59E0B';

// ─── Zod schema ──────────────────────────────────────────────────────────────

const expSchema = z.object({
  company:   z.string().min(1, 'Company required'),
  position:  z.string().min(1, 'Position required'),
  startDate: z.string().min(1, 'Start date required'),
  endDate:   z.string().optional(),
  current:   z.boolean(),
  description: z.string().max(1000).optional(),
});

const eduSchema = z.object({
  institution: z.string().min(1, 'Institution required'),
  degree:      z.string().min(1, 'Degree required'),
  field:       z.string().optional(),
  startDate:   z.string().min(1, 'Start date required'),
  endDate:     z.string().optional(),
  current:     z.boolean(),
  description: z.string().max(500).optional(),
});

const certSchema = z.object({
  name:          z.string().min(1, 'Name required'),
  issuer:        z.string().min(1, 'Issuer required'),
  issueDate:     z.string().min(1, 'Issue date required'),
  expiryDate:    z.string().optional(),
  credentialId:  z.string().optional(),
  credentialUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

const profileSchema = z.object({
  headline:       z.string().max(200).optional(),
  bio:            z.string().max(2000).optional(),
  location:       z.string().max(100).optional(),
  phone:          z.string().max(20).optional(),
  website:        z.string().url('Invalid URL').optional().or(z.literal('')),
  skills:         z.array(z.string().max(50)),
  experience:     z.array(expSchema),
  education:      z.array(eduSchema),
  certifications: z.array(certSchema),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ─── Section header with Add button ──────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; onAdd: () => void; color: string }> = ({
  title, onAdd, color,
}) => {
  const { theme } = useThemeStore();
  return (
    <View style={sh.row}>
      <Text style={[sh.title, { color: theme.colors.text }]}>{title}</Text>
      <TouchableOpacity style={[sh.btn, { backgroundColor: color + '18' }]} onPress={onAdd}>
        <Ionicons name="add" size={16} color={color} />
        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>Add</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Labeled input wrapper ────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  half?: boolean;
}> = ({ label, error, children, half }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[{ marginBottom: 12 }, half && { flex: 1 }]}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      {children}
      {error ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>{error}</Text> : null}
    </View>
  );
};

// ─── Skills Chip editor ───────────────────────────────────────────────────────

const SkillsEditor: React.FC<{
  skills: string[];
  onAdd: (s: string) => void;
  onRemove: (i: number) => void;
}> = ({ skills, onAdd, onRemove }) => {
  const { theme } = useThemeStore();
  const [draft, setDraft] = React.useState('');

  return (
    <View>
      <View style={se.row}>
        <Input
          placeholder="Add a skill…"
          value={draft}
          onChangeText={setDraft}
          style={{ flex: 1 }}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (draft.trim()) { onAdd(draft.trim()); setDraft(''); }
          }}
        />
        <TouchableOpacity
          style={[se.addBtn, { backgroundColor: ACCENT }]}
          onPress={() => { if (draft.trim()) { onAdd(draft.trim()); setDraft(''); } }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={se.chips}>
        {skills.map((sk, i) => (
          <TouchableOpacity key={i} style={se.chip} onPress={() => onRemove(i)}>
            <Text style={se.chipText}>{sk}</Text>
            <Ionicons name="close" size={12} color={ACCENT} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 4 }}>
        {skills.length}/50 · Tap a skill to remove
      </Text>
    </View>
  );
};

// ─── CV Upload Row ────────────────────────────────────────────────────────────

const CVUploadRow: React.FC = () => {
  const { theme } = useThemeStore();
  const [uploading, setUploading] = React.useState(false);

  const handlePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf',
               'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);

      const form = new FormData();
      form.append('cv', {
        uri:  asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/pdf',
      } as any);

      await api.post('/candidate/cv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });

      toast.success('CV uploaded successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <TouchableOpacity
      style={[cv.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={handlePick}
      disabled={uploading}
      activeOpacity={0.8}
    >
      {uploading
        ? <ActivityIndicator color={ACCENT} />
        : <Ionicons name="cloud-upload-outline" size={22} color={ACCENT} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>
          {uploading ? 'Uploading…' : 'Upload CV / Resume'}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>PDF, DOC, DOCX · Max 100 MB</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CandidateEditProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();

  const { data: profile }     = useProfile();
  const { data: roleProfile } = useCandidateRoleProfile();
  const updateProfile         = useUpdateProfile();

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        headline:       profile?.headline ?? '',
        bio:            profile?.bio      ?? '',
        location:       profile?.location ?? '',
        phone:          profile?.phone    ?? '',
        website:        profile?.website  ?? '',
        skills:         roleProfile?.skills ?? [],
        experience:     (roleProfile?.experience ?? []).map((e: any) => ({
          company:   e.company ?? '',
          position:  e.title ?? e.position ?? '',
          startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '',
          endDate:   e.endDate   ? new Date(e.endDate).toISOString().split('T')[0]   : '',
          current:   e.current ?? false,
          description: e.description ?? '',
        })),
        education: (roleProfile?.education ?? []).map((e: any) => ({
          institution: e.institution ?? '',
          degree:      e.degree      ?? '',
          field:       e.field       ?? '',
          startDate:   e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '',
          endDate:     e.endDate   ? new Date(e.endDate).toISOString().split('T')[0]   : '',
          current:     e.current ?? false,
          description: e.description ?? '',
        })),
        certifications: (roleProfile?.certifications ?? []).map((c: any) => ({
          name:          c.name          ?? '',
          issuer:        c.issuer        ?? '',
          issueDate:     c.issueDate ? new Date(c.issueDate).toISOString().split('T')[0] : '',
          expiryDate:    c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
          credentialId:  c.credentialId  ?? '',
          credentialUrl: c.credentialUrl ?? '',
        })),
      },
    });

  const { fields: expFields,  append: addExp,  remove: rmExp  } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields,  append: addEdu,  remove: rmEdu  } = useFieldArray({ control, name: 'education' });
  const { fields: certFields, append: addCert, remove: rmCert } = useFieldArray({ control, name: 'certifications' });

  const skills = watch('skills');

  const addSkill    = (s: string) => skills.length < 50 && setValue('skills', [...skills, s]);
  const removeSkill = (i: number) => setValue('skills', skills.filter((_, j) => j !== i));

  const onSave = handleSubmit(async (data) => {
    updateProfile.mutate(data as any, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['profile'] });
        qc.invalidateQueries({ queryKey: ['candidate', 'roleProfile'] });
        navigation.goBack();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message ?? 'Save failed. Try again.');
      },
    });
  });

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor:     colors.border,
    color:           colors.text,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Sticky header bar ─────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.lg }}>Edit Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={isSubmitting} style={s.saveBtn}>
          {isSubmitting
            ? <ActivityIndicator color={ACCENT} />
            : <Text style={{ color: ACCENT, fontWeight: '700', fontSize: typography.base }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5] }} keyboardShouldPersistTaps="handled">

        {/* ── Basic info ──────────────────────────────────────────────── */}
        <Text style={[s.groupLabel, { color: colors.textMuted }]}>BASIC INFO</Text>

        <Controller control={control} name="headline"
          render={({ field }) => (
            <Field label="Headline" error={errors.headline?.message}>
              <Input placeholder="e.g. Senior React Developer" value={field.value ?? ''} onChangeText={field.onChange} style={inputStyle} />
            </Field>
          )}
        />
        <Controller control={control} name="bio"
          render={({ field }) => (
            <Field label="Bio" error={errors.bio?.message}>
              <Input placeholder="Tell recruiters about yourself…" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4} style={inputStyle} />
            </Field>
          )}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="location"
            render={({ field }) => (
              <Field label="Location" half error={errors.location?.message}>
                <Input placeholder="City, Country" value={field.value} onChangeText={field.onChange} style={inputStyle} leftIcon={<Ionicons name="location-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
          <Controller control={control} name="phone"
            render={({ field }) => (
              <Field label="Phone" half error={errors.phone?.message}>
                <Input placeholder="+1 555 000" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" style={inputStyle} leftIcon={<Ionicons name="call-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
        </View>

        <Controller control={control} name="website"
          render={({ field }) => (
            <Field label="Website / Portfolio" error={errors.website?.message}>
              <Input placeholder="https://yoursite.com" value={field.value} onChangeText={field.onChange} keyboardType="url" autoCapitalize="none" style={inputStyle} leftIcon={<Ionicons name="globe-outline" size={15} color={colors.textMuted} />} />
            </Field>
          )}
        />

        {/* ── CV Upload ───────────────────────────────────────────────── */}
        <Text style={[s.groupLabel, { color: colors.textMuted, marginTop: 8 }]}>CV / RESUME</Text>
        <CVUploadRow />

        {/* ── Skills ──────────────────────────────────────────────────── */}
        <Text style={[s.groupLabel, { color: colors.textMuted }]}>SKILLS</Text>
        <SkillsEditor skills={skills} onAdd={addSkill} onRemove={removeSkill} />

        {/* ── Experience ──────────────────────────────────────────────── */}
        <SectionHeader title="Experience" onAdd={() => addExp({ company: '', position: '', startDate: '', endDate: '', current: false, description: '' })} color="#6366F1" />

        {expFields.map((field, i) => (
          <View key={field.id} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Experience #{i + 1}</Text>
              <TouchableOpacity onPress={() => rmExp(i)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Controller control={control} name={`experience.${i}.company`}
                render={({ field: f }) => (
                  <Field label="Company *" half error={errors.experience?.[i]?.company?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="Company Inc." style={inputStyle} />
                  </Field>
                )}
              />
              <Controller control={control} name={`experience.${i}.position`}
                render={({ field: f }) => (
                  <Field label="Position *" half error={errors.experience?.[i]?.position?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="Job Title" style={inputStyle} />
                  </Field>
                )}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Controller control={control} name={`experience.${i}.startDate`}
                render={({ field: f }) => (
                  <Field label="Start (YYYY-MM-DD)" half error={errors.experience?.[i]?.startDate?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="2022-01-01" keyboardType="numbers-and-punctuation" style={inputStyle} />
                  </Field>
                )}
              />
              <Controller control={control} name={`experience.${i}.endDate`}
                render={({ field: f }) => (
                  <Field label="End (leave blank if current)" half>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="2024-01-01" keyboardType="numbers-and-punctuation" style={inputStyle} />
                  </Field>
                )}
              />
            </View>
            <Controller control={control} name={`experience.${i}.description`}
              render={({ field: f }) => (
                <Field label="Description">
                  <Input value={f.value} onChangeText={f.onChange} placeholder="Describe key responsibilities…" multiline numberOfLines={3} style={inputStyle} />
                </Field>
              )}
            />
          </View>
        ))}

        {/* ── Education ───────────────────────────────────────────────── */}
        <SectionHeader title="Education" onAdd={() => addEdu({ institution: '', degree: '', field: '', startDate: '', endDate: '', current: false, description: '' })} color="#10B981" />

        {eduFields.map((field, i) => (
          <View key={field.id} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Education #{i + 1}</Text>
              <TouchableOpacity onPress={() => rmEdu(i)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Controller control={control} name={`education.${i}.institution`}
                render={({ field: f }) => (
                  <Field label="Institution *" half error={errors.education?.[i]?.institution?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="University…" style={inputStyle} />
                  </Field>
                )}
              />
              <Controller control={control} name={`education.${i}.degree`}
                render={({ field: f }) => (
                  <Field label="Degree *" half error={errors.education?.[i]?.degree?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="B.Sc." style={inputStyle} />
                  </Field>
                )}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Controller control={control} name={`education.${i}.field`}
                render={({ field: f }) => (
                  <Field label="Field" half>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="Computer Science" style={inputStyle} />
                  </Field>
                )}
              />
              <Controller control={control} name={`education.${i}.startDate`}
                render={({ field: f }) => (
                  <Field label="Start (YYYY-MM-DD)" half error={errors.education?.[i]?.startDate?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="2018-09-01" keyboardType="numbers-and-punctuation" style={inputStyle} />
                  </Field>
                )}
              />
            </View>
          </View>
        ))}

        {/* ── Certifications ──────────────────────────────────────────── */}
        <SectionHeader title="Certifications" onAdd={() => addCert({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' })} color="#8B5CF6" />

        {certFields.map((field, i) => (
          <View key={field.id} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Certification #{i + 1}</Text>
              <TouchableOpacity onPress={() => rmCert(i)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Controller control={control} name={`certifications.${i}.name`}
                render={({ field: f }) => (
                  <Field label="Name *" half error={errors.certifications?.[i]?.name?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="AWS Solutions…" style={inputStyle} />
                  </Field>
                )}
              />
              <Controller control={control} name={`certifications.${i}.issuer`}
                render={({ field: f }) => (
                  <Field label="Issuer *" half error={errors.certifications?.[i]?.issuer?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="Amazon" style={inputStyle} />
                  </Field>
                )}
              />
            </View>
            <Controller control={control} name={`certifications.${i}.credentialUrl`}
              render={({ field: f }) => (
                <Field label="Credential URL" error={errors.certifications?.[i]?.credentialUrl?.message}>
                  <Input value={f.value} onChangeText={f.onChange} placeholder="https://…" keyboardType="url" autoCapitalize="none" style={inputStyle} />
                </Field>
              )}
            />
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { minWidth: 60, alignItems: 'flex-end', justifyContent: 'center', height: 44 },
  groupLabel: { fontWeight: '700', fontSize: 10, letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  card:       { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
});

const sh = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  title: { fontWeight: '700', fontSize: 14 },
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
});

const se = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addBtn:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ACCENT + '18', borderColor: ACCENT + '40', borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: ACCENT, fontSize: 12, fontWeight: '600' },
});

const cv = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
});

// re-export to satisfy the navigation map in CandidateNavigator
export default CandidateEditProfileScreen;