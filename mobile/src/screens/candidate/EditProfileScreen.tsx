/**
 * screens/candidate/EditProfileScreen.tsx
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Switch, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

import { useTheme }          from '../../hooks/useTheme';
import {
  useProfile, useUpdateProfile,
  useCandidateRoleProfile, useUpdateCandidateRoleProfile,
  useCandidateCVs, useUploadCV, useDeleteCV, useSetPrimaryCV,
} from '../../hooks/useProfile';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { toast } from '../../lib/toast';
import * as DocumentPicker from 'expo-document-picker';

const ACCENT = '#3B82F6';

interface FormValues {
  headline: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    skills: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    credentialId: string;
    credentialUrl: string;
    description: string;
  }>;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const LabeledInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  maxLength?: number;
  colors: any;
}> = ({ label, value, onChangeText, placeholder, multiline, numberOfLines, keyboardType, maxLength, colors }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={[inputStyles.label, { color: colors.textMuted }]}>{label}</Text>
    <TextInput
      style={[
        inputStyles.input,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.textPrimary,
          height: multiline ? (numberOfLines ?? 4) * 22 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.inputPlaceholder}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      maxLength={maxLength}
    />
  </View>
);

const inputStyles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});

const TagEditor: React.FC<{
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (i: number) => void;
  placeholder?: string;
  accentColor: string;
  colors: any;
}> = ({ tags, onAdd, onRemove, placeholder = 'Add...', accentColor, colors }) => {
  const [input, setInput] = useState('');
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          style={[
            inputStyles.input,
            { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary, height: 44 },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          returnKeyType="done"
          onSubmitEditing={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}
        />
        <TouchableOpacity
          style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((tag, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onRemove(i)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: accentColor + '18', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}
          >
            <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600' }}>{tag}</Text>
            <Ionicons name="close" size={12} color={accentColor} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const CandidateEditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, type, spacing, isDark } = useTheme();

  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: roleProfile, isLoading: rLoading } = useCandidateRoleProfile();
  const { data: cvData } = useCandidateCVs();
  const updateProfile = useUpdateProfile();
  const updateRoleProfile = useUpdateCandidateRoleProfile();
  const uploadCV = useUploadCV();
  const deleteCV = useDeleteCV();
  const setPrimaryCV = useSetPrimaryCV();

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      headline: '', bio: '', location: '', phone: '', website: '',
      skills: [], education: [], experience: [], certifications: [],
    },
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: 'certifications' });

  // Fix: populate form only after data resolves
  useEffect(() => {
    if (!profile) return;
    reset({
      headline: profile.headline ?? '',
      bio: profile.bio ?? '',
      location: profile.location ?? '',
      phone: profile.phone ?? '',
      website: profile.website ?? '',
      skills: roleProfile?.skills ?? [],
      education: (roleProfile?.education ?? []).map(e => ({
        institution: e.institution ?? '',
        degree: e.degree ?? '',
        field: e.field ?? '',
        startDate: e.startDate?.slice(0, 10) ?? '',
        endDate: e.endDate?.slice(0, 10) ?? '',
        current: e.current ?? false,
        description: e.description ?? '',
      })),
      experience: (roleProfile?.experience ?? []).map(e => ({
        company: e.company ?? '',
        position: e.position ?? '',
        startDate: e.startDate?.slice(0, 10) ?? '',
        endDate: e.endDate?.slice(0, 10) ?? '',
        current: e.current ?? false,
        description: e.description ?? '',
        skills: e.skills ?? [],
      })),
      certifications: (roleProfile?.certifications ?? []).map(c => ({
        name: c.name ?? '',
        issuer: c.issuer ?? '',
        issueDate: c.issueDate?.slice(0, 10) ?? '',
        expiryDate: c.expiryDate?.slice(0, 10) ?? '',
        credentialId: c.credentialId ?? '',
        credentialUrl: c.credentialUrl ?? '',
        description: c.description ?? '',
      })),
    });
  }, [profile, roleProfile, reset]);

  const isSaving = updateProfile.isPending || updateRoleProfile.isPending;
  const isLoading = pLoading || rLoading;

  const onSave = useCallback(
    handleSubmit(async (values) => {
      try {
        await Promise.all([
          updateProfile.mutateAsync({
            headline: values.headline || undefined,
            bio: values.bio || undefined,
            location: values.location || undefined,
            phone: values.phone || undefined,
            website: values.website || undefined,
          }),
          updateRoleProfile.mutateAsync({
            skills: values.skills,
            education: values.education.map(e => ({
              ...e,
              startDate: e.startDate,
              endDate: e.current ? undefined : e.endDate || undefined,
            })),
            experience: values.experience.map(e => ({
              ...e,
              startDate: e.startDate,
              endDate: e.current ? undefined : e.endDate || undefined,
              skills: e.skills,
            })),
            certifications: values.certifications.map(c => ({
              ...c,
              issueDate: c.issueDate,
              expiryDate: c.expiryDate || undefined,
              credentialId: c.credentialId || undefined,
              credentialUrl: c.credentialUrl || undefined,
            })),
          }),
        ]);
        navigation.goBack();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      }
    }),
    [handleSubmit, updateProfile, updateRoleProfile, navigation]
  );

  const handlePickCV = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    await uploadCV.mutateAsync({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
    });
  }, [uploadCV]);

  const skillsValue = watch('skills');

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ padding: 16 }}>
        <SkeletonCard  />
        <SkeletonCard />
      </ScrollView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Sticky header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="close-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>
          Edit Profile
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: ACCENT, opacity: isSaving ? 0.65 : 1 }]}
          onPress={onSave}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
        contentContainerStyle={{ paddingTop: 64 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Image uploader */}
        <ProfileImageUploader
          currentAvatarUrl={avatarUrl}
          currentCoverUrl={coverUrl}
          accentColor={ACCENT}
          type="both"
          avatarShape="circle"
        />

        <View style={{ padding: 16, gap: 14 }}>
          {/* ── Basic Info ─────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>BASIC INFO</Text>
            <Controller
              control={control}
              name="headline"
              render={({ field }) => (
                <LabeledInput label="Headline" value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. Senior Software Engineer" colors={colors} />
              )}
            />
            <Controller
              control={control}
              name="bio"
              render={({ field }) => (
                <LabeledInput label="Bio" value={field.value} onChangeText={field.onChange}
                  placeholder="Tell us about yourself..." multiline numberOfLines={4}
                  maxLength={2000} colors={colors} />
              )}
            />
            <Controller
              control={control}
              name="location"
              render={({ field }) => (
                <LabeledInput label="Location" value={field.value} onChangeText={field.onChange}
                  placeholder="City, Country" colors={colors} />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <LabeledInput label="Phone" value={field.value} onChangeText={field.onChange}
                  placeholder="+1 555 000 0000" keyboardType="phone-pad" colors={colors} />
              )}
            />
            <Controller
              control={control}
              name="website"
              render={({ field }) => (
                <LabeledInput label="Website / Portfolio" value={field.value} onChangeText={field.onChange}
                  placeholder="https://..." keyboardType="url" colors={colors} />
              )}
            />
          </View>

          {/* ── Skills ────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SKILLS</Text>
            <TagEditor
              tags={skillsValue}
              onAdd={t => setValue('skills', [...skillsValue, t])}
              onRemove={i => setValue('skills', skillsValue.filter((_, idx) => idx !== i))}
              placeholder="Add a skill..."
              accentColor={ACCENT}
              colors={colors}
            />
          </View>

          {/* ── Education ─────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>EDUCATION</Text>
              <TouchableOpacity
                onPress={() => appendEdu({
                  institution: '', degree: '', field: '', startDate: '',
                  endDate: '', current: false, description: '',
                })}
                style={[styles.addBtn, { backgroundColor: ACCENT + '18' }]}
              >
                <Ionicons name="add" size={16} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
            {eduFields.map((field, i) => {
              const isCurrent = watch(`education.${i}.current`);
              return (
                <View key={field.id} style={[styles.arrayItem, { borderColor: colors.borderPrimary }]}>
                  <View style={styles.arrayItemHeader}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                      Education {i + 1}
                    </Text>
                    <TouchableOpacity onPress={() => removeEdu(i)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Controller control={control} name={`education.${i}.institution`}
                    render={({ field: f }) => (
                      <LabeledInput label="Institution" value={f.value} onChangeText={f.onChange}
                        placeholder="University name" colors={colors} />
                    )} />
                  <Controller control={control} name={`education.${i}.degree`}
                    render={({ field: f }) => (
                      <LabeledInput label="Degree" value={f.value} onChangeText={f.onChange}
                        placeholder="Bachelor of Science" colors={colors} />
                    )} />
                  <Controller control={control} name={`education.${i}.field`}
                    render={({ field: f }) => (
                      <LabeledInput label="Field of Study" value={f.value} onChangeText={f.onChange}
                        placeholder="Computer Science" colors={colors} />
                    )} />
                  <Controller control={control} name={`education.${i}.startDate`}
                    render={({ field: f }) => (
                      <LabeledInput label="Start Date (YYYY-MM-DD)" value={f.value} onChangeText={f.onChange}
                        placeholder="2019-09-01" colors={colors} />
                    )} />
                  <Controller control={control} name={`education.${i}.current`}
                    render={({ field: f }) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Switch
                          value={f.value}
                          onValueChange={f.onChange}
                          trackColor={{ true: ACCENT }}
                        />
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Currently studying</Text>
                      </View>
                    )} />
                  {!isCurrent && (
                    <Controller control={control} name={`education.${i}.endDate`}
                      render={({ field: f }) => (
                        <LabeledInput label="End Date (YYYY-MM-DD)" value={f.value} onChangeText={f.onChange}
                          placeholder="2023-06-30" colors={colors} />
                      )} />
                  )}
                  <Controller control={control} name={`education.${i}.description`}
                    render={({ field: f }) => (
                      <LabeledInput label="Description" value={f.value} onChangeText={f.onChange}
                        placeholder="Relevant coursework, achievements..." multiline numberOfLines={3}
                        maxLength={500} colors={colors} />
                    )} />
                </View>
              );
            })}
          </View>

          {/* ── Experience ─────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>EXPERIENCE</Text>
              <TouchableOpacity
                onPress={() => appendExp({
                  company: '', position: '', startDate: '',
                  endDate: '', current: false, description: '', skills: [],
                })}
                style={[styles.addBtn, { backgroundColor: ACCENT + '18' }]}
              >
                <Ionicons name="add" size={16} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
            {expFields.map((field, i) => {
              const isCurrent = watch(`experience.${i}.current`);
              const expSkills = watch(`experience.${i}.skills`) ?? [];
              return (
                <View key={field.id} style={[styles.arrayItem, { borderColor: colors.borderPrimary }]}>
                  <View style={styles.arrayItemHeader}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                      Experience {i + 1}
                    </Text>
                    <TouchableOpacity onPress={() => removeExp(i)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Controller control={control} name={`experience.${i}.company`}
                    render={({ field: f }) => (
                      <LabeledInput label="Company" value={f.value} onChangeText={f.onChange}
                        placeholder="Company name" colors={colors} />
                    )} />
                  <Controller control={control} name={`experience.${i}.position`}
                    render={({ field: f }) => (
                      <LabeledInput label="Position" value={f.value} onChangeText={f.onChange}
                        placeholder="Job title" colors={colors} />
                    )} />
                  <Controller control={control} name={`experience.${i}.startDate`}
                    render={({ field: f }) => (
                      <LabeledInput label="Start Date (YYYY-MM-DD)" value={f.value} onChangeText={f.onChange}
                        placeholder="2021-01-01" colors={colors} />
                    )} />
                  <Controller control={control} name={`experience.${i}.current`}
                    render={({ field: f }) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Switch value={f.value} onValueChange={f.onChange} trackColor={{ true: ACCENT }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Current position</Text>
                      </View>
                    )} />
                  {!isCurrent && (
                    <Controller control={control} name={`experience.${i}.endDate`}
                      render={({ field: f }) => (
                        <LabeledInput label="End Date (YYYY-MM-DD)" value={f.value} onChangeText={f.onChange}
                          placeholder="2023-12-31" colors={colors} />
                      )} />
                  )}
                  <Controller control={control} name={`experience.${i}.description`}
                    render={({ field: f }) => (
                      <LabeledInput label="Description" value={f.value} onChangeText={f.onChange}
                        placeholder="Responsibilities and achievements..." multiline numberOfLines={3}
                        maxLength={1000} colors={colors} />
                    )} />
                  <Text style={[inputStyles.label, { color: colors.textMuted }]}>SKILLS USED</Text>
                  <TagEditor
                    tags={expSkills}
                    onAdd={t => setValue(`experience.${i}.skills`, [...expSkills, t])}
                    onRemove={idx => setValue(`experience.${i}.skills`, expSkills.filter((_, ii) => ii !== idx))}
                    placeholder="Add skill..."
                    accentColor={ACCENT}
                    colors={colors}
                  />
                </View>
              );
            })}
          </View>

          {/* ── Certifications ────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CERTIFICATIONS</Text>
              <TouchableOpacity
                onPress={() => appendCert({
                  name: '', issuer: '', issueDate: '', expiryDate: '',
                  credentialId: '', credentialUrl: '', description: '',
                })}
                style={[styles.addBtn, { backgroundColor: ACCENT + '18' }]}
              >
                <Ionicons name="add" size={16} color={ACCENT} />
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
            {certFields.map((field, i) => (
              <View key={field.id} style={[styles.arrayItem, { borderColor: colors.borderPrimary }]}>
                <View style={styles.arrayItemHeader}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                    Certification {i + 1}
                  </Text>
                  <TouchableOpacity onPress={() => removeCert(i)}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Controller control={control} name={`certifications.${i}.name`}
                  render={({ field: f }) => (
                    <LabeledInput label="Certification Name" value={f.value} onChangeText={f.onChange}
                      placeholder="AWS Solutions Architect" colors={colors} />
                  )} />
                <Controller control={control} name={`certifications.${i}.issuer`}
                  render={({ field: f }) => (
                    <LabeledInput label="Issuing Organization" value={f.value} onChangeText={f.onChange}
                      placeholder="Amazon Web Services" colors={colors} />
                  )} />
                <Controller control={control} name={`certifications.${i}.issueDate`}
                  render={({ field: f }) => (
                    <LabeledInput label="Issue Date (YYYY-MM-DD)" value={f.value} onChangeText={f.onChange}
                      placeholder="2023-01-15" colors={colors} />
                  )} />
                <Controller control={control} name={`certifications.${i}.expiryDate`}
                  render={({ field: f }) => (
                    <LabeledInput label="Expiry Date (optional)" value={f.value} onChangeText={f.onChange}
                      placeholder="2026-01-15" colors={colors} />
                  )} />
                <Controller control={control} name={`certifications.${i}.credentialId`}
                  render={({ field: f }) => (
                    <LabeledInput label="Credential ID (optional)" value={f.value} onChangeText={f.onChange}
                      placeholder="ABC-123456" colors={colors} />
                  )} />
                <Controller control={control} name={`certifications.${i}.credentialUrl`}
                  render={({ field: f }) => (
                    <LabeledInput label="Credential URL (optional)" value={f.value} onChangeText={f.onChange}
                      placeholder="https://verify.example.com/..." keyboardType="url" colors={colors} />
                  )} />
              </View>
            ))}
          </View>

          {/* ── CVs ──────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                CVs ({cvData?.cvs?.length ?? 0}/10)
              </Text>
              <TouchableOpacity
                onPress={handlePickCV}
                disabled={uploadCV.isPending}
                style={[styles.addBtn, { backgroundColor: ACCENT + '18' }]}
              >
                {uploadCV.isPending
                  ? <ActivityIndicator size="small" color={ACCENT} />
                  : <>
                    <Ionicons name="add" size={16} color={ACCENT} />
                    <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700' }}>Upload</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
            {(cvData?.cvs ?? []).map(cv => (
              <View
                key={cv._id}
                style={[styles.cvRow, { borderColor: colors.borderPrimary }]}
              >
                <Ionicons name="document-text-outline" size={20} color={ACCENT} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                    {cv.originalName}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    {cv.isPrimary ? 'Primary · ' : ''}{(cv.size / 1024).toFixed(0)} KB
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {!cv.isPrimary && (
                    <TouchableOpacity onPress={() => setPrimaryCV.mutate(cv._id)}>
                      <Ionicons name="star-outline" size={18} color={ACCENT} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => deleteCV.mutate(cv._id)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 68,
    alignItems: 'center',
  },
  section: {
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  arrayItem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  arrayItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});