/**
 * screens/freelancer/EditProfileScreen.tsx
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';

import { useTheme }          from '../../hooks/useTheme';
import {
  useProfile, useUpdateProfile,
  useFreelancerProfile, useUpdateFreelancerProfile,
} from '../../hooks/useProfile';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { toast } from '../../lib/toast';

const ACCENT = '#8B5CF6';

const inputStyles = StyleSheet.create({
  label: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
});

const LabeledInput: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean; numberOfLines?: number;
  keyboardType?: any; maxLength?: number; colors: any;
}> = ({ label, value, onChangeText, placeholder, multiline, numberOfLines, keyboardType, maxLength, colors }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={[inputStyles.label, { color: colors.textMuted }]}>{label}</Text>
    <TextInput
      style={[
        inputStyles.input,
        {
          backgroundColor: colors.inputBg, borderColor: colors.inputBorder,
          color: colors.textPrimary,
          height: multiline ? (numberOfLines ?? 4) * 22 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
        },
      ]}
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={colors.inputPlaceholder}
      multiline={multiline} numberOfLines={numberOfLines}
      keyboardType={keyboardType} maxLength={maxLength}
    />
  </View>
);

const TagEditor: React.FC<{
  tags: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void;
  placeholder?: string; accentColor: string; colors: any;
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
          value={input} onChangeText={setInput} placeholder={placeholder}
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
            key={i} onPress={() => onRemove(i)}
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

type PillOption<T extends string> = { label: string; value: T };

const PillSelector = <T extends string>({
  label, value, options, onChange, colors, accentColor,
}: {
  label: string; value: T; options: PillOption<T>[];
  onChange: (v: T) => void; colors: any; accentColor: string;
}) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={[inputStyles.label, { color: colors.textMuted }]}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
            backgroundColor: value === opt.value ? accentColor : colors.bgSurface,
          }}
        >
          <Text style={{
            fontSize: 13, fontWeight: '600',
            color: value === opt.value ? '#fff' : colors.textSecondary,
          }}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { key: 'github', label: 'GitHub', icon: 'logo-github', color: '#181717' },
  { key: 'twitter', label: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#010101' },
  { key: 'telegram', label: 'Telegram', icon: 'paper-plane-outline', color: '#26A5E4' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { key: 'behance', label: 'Behance', icon: 'color-palette-outline', color: '#1769FF' },
  { key: 'dribbble', label: 'Dribbble', icon: 'basketball-outline', color: '#EA4C89' },
  { key: 'medium', label: 'Medium', icon: 'book-outline', color: '#00AB6C' },
  { key: 'devto', label: 'Dev.to', icon: 'terminal-outline', color: '#0A0A0A' },
  { key: 'stackoverflow', label: 'Stack Overflow', icon: 'code-outline', color: '#F58025' },
  { key: 'codepen', label: 'CodePen', icon: 'code-slash-outline', color: '#000000' },
  { key: 'gitlab', label: 'GitLab', icon: 'git-branch-outline', color: '#FCA121' },
  { key: 'discord', label: 'Discord', icon: 'logo-discord', color: '#5865F2' },
];

interface FormValues {
  headline: string; bio: string; location: string; phone: string; website: string;
  availability: 'available' | 'not-available' | 'part-time';
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  englishProficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  hourlyRate: string; timezone: string;
  skills: string[]; specialization: string[];
  socialLinks: Record<string, string>;
}

export const FreelancerEditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
const { colors, type, spacing, isDark } = useTheme();

  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: fpData, isLoading: fLoading } = useFreelancerProfile();
  const updateProfile = useUpdateProfile();
  const updateFP = useUpdateFreelancerProfile();

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      headline: '', bio: '', location: '', phone: '', website: '',
      availability: 'available', experienceLevel: 'intermediate',
      englishProficiency: 'fluent', hourlyRate: '', timezone: '',
      skills: [], specialization: [], socialLinks: {},
    },
  });

  useEffect(() => {
    if (!profile) return;
    const fp = fpData?.freelancerProfile;
    reset({
      headline: fp?.headline ?? profile.headline ?? '',
      bio: (fpData as any)?.bio ?? profile.bio ?? '',
      location: profile.location ?? '',
      phone: profile.phone ?? '',
      website: profile.website ?? '',
      availability: (fp?.availability as any) ?? 'available',
      experienceLevel: (fp?.experienceLevel as any) ?? 'intermediate',
      englishProficiency: (fp?.englishProficiency as any) ?? 'fluent',
      hourlyRate: fp?.hourlyRate?.toString() ?? '',
      timezone: fp?.timezone ?? '',
      skills: (fpData?.skills ?? []).map(s => typeof s === 'string' ? s : s.name),
      specialization: fp?.specialization ?? [],
      socialLinks: (fp?.socialLinks ?? profile.socialLinks ?? {}) as Record<string, string>,
    });
  }, [profile, fpData, reset]);

  const isSaving = updateProfile.isPending || updateFP.isPending;
  const isLoading = pLoading || fLoading;

  const skills = watch('skills');
  const specialization = watch('specialization');
  const socialLinks = watch('socialLinks');

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
            socialLinks: values.socialLinks,
          }),
          updateFP.mutateAsync({
            skills: values.skills.map(name => ({ name, level: 'intermediate' as const })),
            freelancerProfile: {
              headline: values.headline || undefined,
              hourlyRate: values.hourlyRate ? parseFloat(values.hourlyRate) : undefined,
              availability: values.availability,
              experienceLevel: values.experienceLevel,
              englishProficiency: values.englishProficiency,
              timezone: values.timezone || undefined,
              specialization: values.specialization,
              socialLinks: values.socialLinks,
            },
          }),
        ]);
        navigation.goBack();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      }
    }),
    [handleSubmit, updateProfile, updateFP, navigation]
  );

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ padding: 16 }}>
        <SkeletonCard  />
        <SkeletonCard  />
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
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>Edit Profile</Text>
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
        <ProfileImageUploader
          currentAvatarUrl={avatarUrl}
          currentCoverUrl={coverUrl}
          accentColor={ACCENT}
          type="both"
          avatarShape="circle"
        />

        <View style={{ padding: 16, gap: 14 }}>
          {/* Basic */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>BASIC INFO</Text>
            <Controller control={control} name="headline"
              render={({ field }) => (
                <LabeledInput label="Headline" value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. Full Stack Developer" colors={colors} />
              )} />
            <Controller control={control} name="bio"
              render={({ field }) => (
                <LabeledInput label="Bio" value={field.value} onChangeText={field.onChange}
                  placeholder="Tell clients about yourself..." multiline numberOfLines={4}
                  maxLength={2000} colors={colors} />
              )} />
            <Controller control={control} name="location"
              render={({ field }) => (
                <LabeledInput label="Location" value={field.value} onChangeText={field.onChange}
                  placeholder="City, Country" colors={colors} />
              )} />
            <Controller control={control} name="phone"
              render={({ field }) => (
                <LabeledInput label="Phone" value={field.value} onChangeText={field.onChange}
                  placeholder="+1 555 000 0000" keyboardType="phone-pad" colors={colors} />
              )} />
            <Controller control={control} name="website"
              render={({ field }) => (
                <LabeledInput label="Website" value={field.value} onChangeText={field.onChange}
                  placeholder="https://yoursite.com" keyboardType="url" colors={colors} />
              )} />
          </View>

          {/* Professional */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PROFESSIONAL</Text>
            <Controller control={control} name="availability"
              render={({ field }) => (
                <PillSelector
                  label="Availability"
                  value={field.value}
                  options={[
                    { label: 'Available', value: 'available' },
                    { label: 'Part-time', value: 'part-time' },
                    { label: 'Not Available', value: 'not-available' },
                  ]}
                  onChange={field.onChange}
                  colors={colors}
                  accentColor={ACCENT}
                />
              )} />
            <Controller control={control} name="experienceLevel"
              render={({ field }) => (
                <PillSelector
                  label="Experience Level"
                  value={field.value}
                  options={[
                    { label: 'Entry', value: 'entry' },
                    { label: 'Intermediate', value: 'intermediate' },
                    { label: 'Expert', value: 'expert' },
                  ]}
                  onChange={field.onChange}
                  colors={colors}
                  accentColor={ACCENT}
                />
              )} />
            <Controller control={control} name="englishProficiency"
              render={({ field }) => (
                <PillSelector
                  label="English Proficiency"
                  value={field.value}
                  options={[
                    { label: 'Basic', value: 'basic' },
                    { label: 'Conversational', value: 'conversational' },
                    { label: 'Fluent', value: 'fluent' },
                    { label: 'Native', value: 'native' },
                  ]}
                  onChange={field.onChange}
                  colors={colors}
                  accentColor={ACCENT}
                />
              )} />
            <Controller control={control} name="hourlyRate"
              render={({ field }) => (
                <LabeledInput label="Hourly Rate (USD)" value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. 45" keyboardType="numeric" colors={colors} />
              )} />
            <Controller control={control} name="timezone"
              render={({ field }) => (
                <LabeledInput label="Timezone" value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. UTC+3, EST, GMT" colors={colors} />
              )} />
          </View>

          {/* Skills */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SKILLS</Text>
            <TagEditor
              tags={skills}
              onAdd={t => setValue('skills', [...skills, t])}
              onRemove={i => setValue('skills', skills.filter((_, idx) => idx !== i))}
              placeholder="Add a skill..."
              accentColor={ACCENT}
              colors={colors}
            />
          </View>

          {/* Specializations */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SPECIALIZATIONS</Text>
            <TagEditor
              tags={specialization}
              onAdd={t => setValue('specialization', [...specialization, t])}
              onRemove={i => setValue('specialization', specialization.filter((_, idx) => idx !== i))}
              placeholder="e.g. React, Node.js, UI/UX..."
              accentColor={ACCENT}
              colors={colors}
            />
          </View>

          {/* Social links — two-column grid */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SOCIAL LINKS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {SOCIAL_PLATFORMS.map(p => (
                <View key={p.key} style={{ width: '48%', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Ionicons name={p.icon as any} size={14} color={p.color} />
                    <Text style={[inputStyles.label, { color: colors.textMuted, marginBottom: 0 }]}>
                      {p.label.toUpperCase()}
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      inputStyles.input,
                      { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary, height: 40 },
                    ]}
                    value={socialLinks[p.key] ?? ''}
                    onChangeText={v => setValue('socialLinks', { ...socialLinks, [p.key]: v })}
                    placeholder="URL..."
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    minWidth: 68, alignItems: 'center',
  },
  section: { borderRadius: 14, padding: 16 },
  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 14,
  },
});