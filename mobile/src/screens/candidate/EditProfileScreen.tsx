/**
 * screens/candidate/EditProfileScreen.tsx
 *
 * Candidate profile editor — production-grade.
 * Fixes:
 *  - ProfileImageUploader replaces old inline upload logic
 *  - useEffect reset() when profile/roleProfile loads (fixes empty-default flash)
 *  - Skeleton while loading
 *  - Sticky header with paddingTop on ScrollView
 *  - Collapse/expand per array section
 *  - "current" checkbox hides end-date field
 *  - CV upload via expo-document-picker → POST /candidate/cv
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as DocumentPicker from 'expo-document-picker';
import { useQueryClient } from '@tanstack/react-query';

import { useThemeStore } from '../../store/themeStore';
import { useProfile, useCandidateRoleProfile, useUpdateProfile } from '../../hooks/useProfile';
import { Input } from '../../components/ui/Input';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { toast } from '../../lib/toast';
import api  from '../../lib/api';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;
const ACCENT = '#F59E0B';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const expSchema = z.object({
  company:     z.string().min(1, 'Required'),
  position:    z.string().min(1, 'Required'),
  startDate:   z.string().min(1, 'Required'),
  endDate:     z.string().optional(),
  current:     z.boolean(),
  description: z.string().max(1000).optional(),
});

const eduSchema = z.object({
  institution: z.string().min(1, 'Required'),
  degree:      z.string().min(1, 'Required'),
  field:       z.string().optional(),
  startDate:   z.string().min(1, 'Required'),
  endDate:     z.string().optional(),
  current:     z.boolean(),
  description: z.string().max(500).optional(),
});

const certSchema = z.object({
  name:          z.string().min(1, 'Required'),
  issuer:        z.string().min(1, 'Required'),
  issueDate:     z.string().min(1, 'Required'),
  expiryDate:    z.string().optional(),
  credentialId:  z.string().optional(),
  credentialUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

const schema = z.object({
  headline:       z.string().max(200).optional(),
  bio:            z.string().max(2000).optional(),
  location:       z.string().max(100).optional(),
  phone:          z.string().max(20).optional(),
  website:        z.string().url('Enter a valid URL').optional().or(z.literal('')),
  skills:         z.array(z.string()),
  experience:     z.array(expSchema),
  education:      z.array(eduSchema),
  certifications: z.array(certSchema),
});

type FormValues = z.infer<typeof schema>;

// ─── Section label ────────────────────────────────────────────────────────────

const SecLabel: React.FC<{ children: string }> = ({ children }) => {
  const { theme } = useThemeStore();
  return (
    <Text style={{
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 10,
    }}>
      {children}
    </Text>
  );
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode; half?: boolean }> = ({
  label, error, children, half,
}) => {
  const { theme } = useThemeStore();
  return (
    <View style={[{ marginBottom: 12 }, half && { flex: 1 }]}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
        {label}
      </Text>
      {children}
      {error ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>{error}</Text> : null}
    </View>
  );
};

// ─── Skills editor ────────────────────────────────────────────────────────────

const SkillsEditor: React.FC<{
  skills: string[];
  onAdd: (s: string) => void;
  onRemove: (i: number) => void;
}> = ({ skills, onAdd, onRemove }) => {
  const { theme } = useThemeStore();
  const [draft, setDraft] = useState('');

  const submit = () => {
    const s = draft.trim();
    if (s && !skills.includes(s) && skills.length < 50) {
      onAdd(s);
      setDraft('');
    }
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <Input
          placeholder="Add a skill…"
          value={draft}
          onChangeText={setDraft}
          style={{ flex: 1 }}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <TouchableOpacity
          style={[se.addBtn, { backgroundColor: ACCENT }]}
          onPress={submit}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={se.chips}>
        {skills.map((sk, i) => (
          <TouchableOpacity key={i} style={se.chip} onPress={() => onRemove(i)}>
            <Text style={se.chipText}>{sk}</Text>
            <Ionicons name="close" size={11} color={ACCENT} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 4 }}>
        {skills.length}/50 · Tap to remove
      </Text>
    </View>
  );
};

// ─── CV upload row ────────────────────────────────────────────────────────────

const CVUploadRow: React.FC = () => {
  const { theme } = useThemeStore();
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      (form as FormData).append('cv', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/pdf',
      } as unknown as Blob);
      await api.post('/candidate/cv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });
      toast.success('CV uploaded successfully!');
    } catch {
      toast.error('CV upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[cv.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={pick}
      disabled={uploading}
      activeOpacity={0.8}
    >
      {uploading ? <ActivityIndicator color={ACCENT} /> : <Ionicons name="cloud-upload-outline" size={22} color={ACCENT} />}
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

// ─── Array section header ──────────────────────────────────────────────────────

const ArrayHeader: React.FC<{
  title: string;
  color: string;
  onAdd: () => void;
  open: boolean;
  onToggle: () => void;
}> = ({ title, color, onAdd, open, onToggle }) => {
  const { theme } = useThemeStore();
  return (
    <View style={ah.row}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onToggle}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[ah.btn, { backgroundColor: color + '18' }]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={16} color={color} />
        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>Add</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const CandidateEditProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation  = useNavigation<Nav>();
  const qc          = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: rp,      isLoading: rpLoading }      = useCandidateRoleProfile();
  const updateProfile = useUpdateProfile();

  // Section open/close
  const [openExp,  setOpenExp]  = useState(true);
  const [openEdu,  setOpenEdu]  = useState(true);
  const [openCert, setOpenCert] = useState(true);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        headline: '', bio: '', location: '', phone: '', website: '',
        skills: [], experience: [], education: [], certifications: [],
      },
    });

  // ── Fix: reset when data loads ────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const rpData = rp as Record<string, unknown> | undefined;

    const mapDate = (d?: string) => d ? new Date(d).toISOString().split('T')[0] : '';

    reset({
      headline: profile.headline ?? '',
      bio:      profile.bio      ?? '',
      location: profile.location ?? '',
      phone:    profile.phone    ?? '',
      website:  profile.website  ?? '',
      skills:   (rpData?.skills as string[]) ?? [],
      experience: ((rpData?.experience as Array<Record<string, unknown>>) ?? []).map((e) => ({
        company:     e.company as string ?? '',
        position:    (e.title ?? e.position) as string ?? '',
        startDate:   mapDate(e.startDate as string),
        endDate:     mapDate(e.endDate as string),
        current:     (e.current as boolean) ?? false,
        description: e.description as string ?? '',
      })),
      education: ((rpData?.education as Array<Record<string, unknown>>) ?? []).map((e) => ({
        institution: e.institution as string ?? '',
        degree:      e.degree as string ?? '',
        field:       e.field as string ?? '',
        startDate:   mapDate(e.startDate as string),
        endDate:     mapDate(e.endDate as string),
        current:     (e.current as boolean) ?? false,
        description: e.description as string ?? '',
      })),
      certifications: ((rpData?.certifications as Array<Record<string, unknown>>) ?? []).map((c) => ({
        name:          c.name as string ?? '',
        issuer:        c.issuer as string ?? '',
        issueDate:     mapDate(c.issueDate as string),
        expiryDate:    mapDate(c.expiryDate as string),
        credentialId:  c.credentialId as string ?? '',
        credentialUrl: c.credentialUrl as string ?? '',
      })),
    });
  }, [profile, rp, reset]);

  const { fields: expFields,  append: addExp,  remove: rmExp  } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields,  append: addEdu,  remove: rmEdu  } = useFieldArray({ control, name: 'education' });
  const { fields: certFields, append: addCert, remove: rmCert } = useFieldArray({ control, name: 'certifications' });

  const skills = watch('skills');
  const addSkill    = useCallback((s: string) => setValue('skills', [...skills, s]), [skills, setValue]);
  const removeSkill = useCallback((i: number) => setValue('skills', skills.filter((_, j) => j !== i)), [skills, setValue]);

  const onSave = handleSubmit((data) => {
    updateProfile.mutate(data as unknown as Parameters<typeof updateProfile.mutate>[0], {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['profile'] });
        qc.invalidateQueries({ queryKey: ['candidate', 'roleProfile'] });
        navigation.goBack();
      },
      onError: (err: unknown) => {
        const msg = (err as Record<string, Record<string, string>>)?.response?.data ?? 'Save failed.';
        toast.error(msg);
      },
    });
  });

  const inp = { backgroundColor: colors.inputBg, borderColor: colors.border };

  if (profileLoading || rpLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 80, paddingHorizontal: spacing[5], gap: 16 }}>
        <SkeletonCard height={140} radius={12} />
        <SkeletonCard height={44} radius={10} />
        <SkeletonCard height={44} radius={10} />
        <SkeletonCard height={88} radius={10} />
        <SkeletonCard height={88} radius={10} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Sticky header */}
      <View style={[hdr.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={hdr.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.lg }}>Edit Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={isSubmitting} style={hdr.saveBtn}>
          {isSubmitting
            ? <ActivityIndicator color={ACCENT} />
            : <Text style={{ color: ACCENT, fontWeight: '700', fontSize: typography.base }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing[5], paddingTop: 64 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Cover uploader */}
        <ProfileImageUploader
          currentAvatarUrl={(profile as Record<string, Record<string, string>> | undefined)?.avatar?.secure_url}
          currentCoverUrl={(profile as Record<string, Record<string, string>> | undefined)?.cover?.secure_url}
          accentColor={ACCENT}
          type="both"
          avatarShape="circle"
          showDeleteButtons
        />

        {/* Basic info */}
        <SecLabel>Basic Info</SecLabel>
        <Controller control={control} name="headline"
          render={({ field }) => (
            <Field label="Headline" error={errors.headline?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. Senior React Developer" inputStyle={inp} />
            </Field>
          )}
        />
        <Controller control={control} name="bio"
          render={({ field }) => (
            <Field label="Bio" error={errors.bio?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="Tell recruiters about yourself…" multiline numberOfLines={4} inputStyle={inp} />
            </Field>
          )}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="location"
            render={({ field }) => (
              <Field label="Location" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="City, Country" inputStyle={inp} leftIcon={<Ionicons name="location-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
          <Controller control={control} name="phone"
            render={({ field }) => (
              <Field label="Phone" half error={errors.phone?.message}>
                <Input value={field.value} onChangeText={field.onChange} placeholder="+1 555 000" keyboardType="phone-pad" inputStyle={inp} leftIcon={<Ionicons name="call-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
        </View>
        <Controller control={control} name="website"
          render={({ field }) => (
            <Field label="Website" error={errors.website?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="https://yoursite.com" keyboardType="url" autoCapitalize="none" inputStyle={inp} leftIcon={<Ionicons name="globe-outline" size={15} color={colors.textMuted} />} />
            </Field>
          )}
        />

        {/* CV upload */}
        <SecLabel>CV / Resume</SecLabel>
        <CVUploadRow />

        {/* Skills */}
        <SecLabel>Skills</SecLabel>
        <SkillsEditor skills={skills} onAdd={addSkill} onRemove={removeSkill} />

        {/* Experience */}
        <ArrayHeader
          title="Experience"
          color="#6366F1"
          onAdd={() => addExp({ company: '', position: '', startDate: '', endDate: '', current: false, description: '' })}
          open={openExp}
          onToggle={() => setOpenExp((v) => !v)}
        />
        {openExp && expFields.map((field, i) => {
          const isCurrent = watch(`experience.${i}.current`);
          return (
            <View key={field.id} style={[arr.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={arr.cardHeader}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Experience #{i + 1}</Text>
                <TouchableOpacity onPress={() => rmExp(i)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Controller control={control} name={`experience.${i}.company`}
                  render={({ field: f }) => (
                    <Field label="Company *" half error={errors.experience?.[i]?.company?.message}>
                      <Input value={f.value} onChangeText={f.onChange} placeholder="Company Inc." inputStyle={inp} />
                    </Field>
                  )}
                />
                <Controller control={control} name={`experience.${i}.position`}
                  render={({ field: f }) => (
                    <Field label="Position *" half error={errors.experience?.[i]?.position?.message}>
                      <Input value={f.value} onChangeText={f.onChange} placeholder="Job Title" inputStyle={inp} />
                    </Field>
                  )}
                />
              </View>
              <Controller control={control} name={`experience.${i}.startDate`}
                render={({ field: f }) => (
                  <Field label="Start Date (YYYY-MM-DD)" error={errors.experience?.[i]?.startDate?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="2022-01-01" keyboardType="numbers-and-punctuation" inputStyle={inp} />
                  </Field>
                )}
              />
              {/* Current toggle */}
              <Controller control={control} name={`experience.${i}.current`}
                render={({ field: f }) => (
                  <View style={arr.switchRow}>
                    <Text style={{ color: colors.text, fontSize: typography.sm }}>Currently working here</Text>
                    <Switch
                      value={f.value}
                      onValueChange={f.onChange}
                      trackColor={{ false: colors.border, true: '#6366F1' }}
                      thumbColor="#fff"
                    />
                  </View>
                )}
              />
              {!isCurrent && (
                <Controller control={control} name={`experience.${i}.endDate`}
                  render={({ field: f }) => (
                    <Field label="End Date (YYYY-MM-DD)">
                      <Input value={f.value} onChangeText={f.onChange} placeholder="2024-06-01" keyboardType="numbers-and-punctuation" inputStyle={inp} />
                    </Field>
                  )}
                />
              )}
              <Controller control={control} name={`experience.${i}.description`}
                render={({ field: f }) => (
                  <Field label="Description">
                    <Input value={f.value} onChangeText={f.onChange} placeholder="Key responsibilities…" multiline numberOfLines={3} inputStyle={inp} />
                  </Field>
                )}
              />
            </View>
          );
        })}

        {/* Education */}
        <ArrayHeader
          title="Education"
          color="#10B981"
          onAdd={() => addEdu({ institution: '', degree: '', field: '', startDate: '', endDate: '', current: false, description: '' })}
          open={openEdu}
          onToggle={() => setOpenEdu((v) => !v)}
        />
        {openEdu && eduFields.map((field, i) => {
          const isCurrent = watch(`education.${i}.current`);
          return (
            <View key={field.id} style={[arr.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={arr.cardHeader}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Education #{i + 1}</Text>
                <TouchableOpacity onPress={() => rmEdu(i)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Controller control={control} name={`education.${i}.institution`}
                  render={({ field: f }) => (
                    <Field label="Institution *" half error={errors.education?.[i]?.institution?.message}>
                      <Input value={f.value} onChangeText={f.onChange} placeholder="University…" inputStyle={inp} />
                    </Field>
                  )}
                />
                <Controller control={control} name={`education.${i}.degree`}
                  render={({ field: f }) => (
                    <Field label="Degree *" half error={errors.education?.[i]?.degree?.message}>
                      <Input value={f.value} onChangeText={f.onChange} placeholder="B.Sc." inputStyle={inp} />
                    </Field>
                  )}
                />
              </View>
              <Controller control={control} name={`education.${i}.field`}
                render={({ field: f }) => (
                  <Field label="Field of Study">
                    <Input value={f.value} onChangeText={f.onChange} placeholder="Computer Science" inputStyle={inp} />
                  </Field>
                )}
              />
              <Controller control={control} name={`education.${i}.startDate`}
                render={({ field: f }) => (
                  <Field label="Start Date (YYYY-MM-DD)" error={errors.education?.[i]?.startDate?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="2018-09-01" keyboardType="numbers-and-punctuation" inputStyle={inp} />
                  </Field>
                )}
              />
              <Controller control={control} name={`education.${i}.current`}
                render={({ field: f }) => (
                  <View style={arr.switchRow}>
                    <Text style={{ color: colors.text, fontSize: typography.sm }}>Currently studying here</Text>
                    <Switch
                      value={f.value}
                      onValueChange={f.onChange}
                      trackColor={{ false: colors.border, true: '#10B981' }}
                      thumbColor="#fff"
                    />
                  </View>
                )}
              />
              {!isCurrent && (
                <Controller control={control} name={`education.${i}.endDate`}
                  render={({ field: f }) => (
                    <Field label="End Date (YYYY-MM-DD)">
                      <Input value={f.value} onChangeText={f.onChange} placeholder="2022-06-01" keyboardType="numbers-and-punctuation" inputStyle={inp} />
                    </Field>
                  )}
                />
              )}
            </View>
          );
        })}

        {/* Certifications */}
        <ArrayHeader
          title="Certifications"
          color="#8B5CF6"
          onAdd={() => addCert({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' })}
          open={openCert}
          onToggle={() => setOpenCert((v) => !v)}
        />
        {openCert && certFields.map((field, i) => (
          <View key={field.id} style={[arr.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={arr.cardHeader}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Cert #{i + 1}</Text>
              <TouchableOpacity onPress={() => rmCert(i)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Controller control={control} name={`certifications.${i}.name`}
                render={({ field: f }) => (
                  <Field label="Name *" half error={errors.certifications?.[i]?.name?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="AWS Solutions…" inputStyle={inp} />
                  </Field>
                )}
              />
              <Controller control={control} name={`certifications.${i}.issuer`}
                render={({ field: f }) => (
                  <Field label="Issuer *" half error={errors.certifications?.[i]?.issuer?.message}>
                    <Input value={f.value} onChangeText={f.onChange} placeholder="Amazon" inputStyle={inp} />
                  </Field>
                )}
              />
            </View>
            <Controller control={control} name={`certifications.${i}.credentialUrl`}
              render={({ field: f }) => (
                <Field label="Credential URL" error={errors.certifications?.[i]?.credentialUrl?.message}>
                  <Input value={f.value} onChangeText={f.onChange} placeholder="https://…" keyboardType="url" autoCapitalize="none" inputStyle={inp} />
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

const hdr = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: 16, paddingTop: Platform.OS === 'ios' ? 52 : 20, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { minWidth: 60, alignItems: 'flex-end', justifyContent: 'center', height: 44 },
});

const arr = StyleSheet.create({
  card:       { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 4 },
});

const ah = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
});

const se = StyleSheet.create({
  addBtn:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}40`, borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: ACCENT, fontSize: 12, fontWeight: '600' },
});

const cv = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
});