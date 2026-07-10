/**
 * screens/freelancer/EditProfileScreen.tsx
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import { useFreelancerProfile, useUpdateFreelancerProfile } from '../../hooks/useFreelancer';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { toast } from '../../lib/toast';

const SOCIAL_PLATFORMS = [
  { key: 'linkedin',      label: 'LinkedIn',       icon: 'logo-linkedin',       color: '#0A66C2' },
  { key: 'github',        label: 'GitHub',          icon: 'logo-github',         color: '#181717' },
  { key: 'twitter',       label: 'Twitter/X',       icon: 'logo-twitter',        color: '#1DA1F2' },
  { key: 'tiktok',        label: 'TikTok',          icon: 'logo-tiktok',         color: '#010101' },
  { key: 'telegram',      label: 'Telegram',        icon: 'paper-plane-outline', color: '#26A5E4' },
  { key: 'youtube',       label: 'YouTube',         icon: 'logo-youtube',        color: '#FF0000' },
  { key: 'behance',       label: 'Behance',         icon: 'color-palette-outline', color: '#1769FF' },
  { key: 'dribbble',      label: 'Dribbble',        icon: 'basketball-outline',  color: '#EA4C89' },
  { key: 'medium',        label: 'Medium',          icon: 'book-outline',        color: '#00AB6C' },
  { key: 'devto',         label: 'Dev.to',          icon: 'terminal-outline',    color: '#0A0A0A' },
  { key: 'stackoverflow', label: 'Stack Overflow',  icon: 'code-outline',        color: '#F58025' },
  { key: 'codepen',       label: 'CodePen',         icon: 'code-slash-outline',  color: '#000000' },
  { key: 'gitlab',        label: 'GitLab',          icon: 'git-branch-outline',  color: '#FCA121' },
  { key: 'discord',       label: 'Discord',         icon: 'chatbubbles-outline', color: '#5865F2' },
] as const;

interface FormValues {
  headline: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  availability: 'available' | 'not-available' | 'part-time';
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  englishProficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  hourlyRate: string;
  timezone: string;
  skills: string[];
  specialization: string[];
  socialLinks: Record<string, string>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputSt = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
});

const LabeledInput: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean; numberOfLines?: number;
  keyboardType?: any; maxLength?: number; colors: any;
}> = ({ label, value, onChangeText, placeholder, multiline, numberOfLines, keyboardType, maxLength, colors }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={[inputSt.label, { color: colors.textMuted }]}>{label}</Text>
    <TextInput
      style={[
        inputSt.input,
        {
          backgroundColor: colors.inputBg, borderColor: colors.inputBorder,
          color: colors.text,
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
            inputSt.input,
            { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, height: 44 },
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
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: withAlpha(accentColor, 0.10), paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}
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
    <Text style={[inputSt.label, { color: colors.textMuted }]}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
            backgroundColor: value === opt.value ? accentColor : colors.bgCard,
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export const FreelancerEditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: profile, isLoading: pLoading } = useFreelancerProfile();
  const updateProfile = useUpdateFreelancerProfile();

  const { control, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: {
      headline: '', bio: '', location: '', phone: '', website: '',
      availability: 'available', experienceLevel: 'intermediate',
      englishProficiency: 'fluent', hourlyRate: '', timezone: '',
      skills: [], specialization: [], socialLinks: {},
    },
  });

  // beforeRemove guard for dirty form
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!formState.isDirty) return;
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, formState.isDirty]);

  useEffect(() => {
    if (!profile) return;
    const fp = profile.freelancerProfile;
    reset({
      headline: fp?.headline ?? '',
      bio: profile.bio ?? '',
      location: profile.location ?? '',
      phone: profile.phone ?? '',
      website: profile.website ?? '',
      availability: fp?.availability ?? 'available',
      experienceLevel: fp?.experienceLevel ?? 'intermediate',
      englishProficiency: fp?.englishProficiency ?? 'fluent',
      hourlyRate: fp?.hourlyRate?.toString() ?? '',
      timezone: fp?.timezone ?? '',
      skills: (profile.skills ?? []).map((s: any) => typeof s === 'string' ? s : s.name),
      specialization: fp?.specialization ?? [],
      socialLinks: (fp?.socialLinks ?? profile.socialLinks ?? {}) as Record<string, string>,
    });
  }, [profile, reset]);

  const isSaving = updateProfile.isPending;
  const isLoading = pLoading;

  const skills = watch('skills');
  const specialization = watch('specialization');
  const socialLinks = watch('socialLinks');

  const accentColor = colors.organization; // purple accent for edit profile

  const onSave = useCallback(
    handleSubmit(async (values) => {
      try {
        await updateProfile.mutateAsync({
          bio: values.bio || undefined,
          location: values.location || undefined,
          phone: values.phone || undefined,
          website: values.website || undefined,
          socialLinks: values.socialLinks,
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
        });
        navigation.goBack();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      }
    }),
    [handleSubmit, updateProfile, navigation],
  );

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg }}>
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  const avatarUrl = profile?.avatar ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Sticky header */}
        <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="close-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.base }}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor, opacity: isSaving ? 0.65 : 1 }]}
            onPress={onSave}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProfileImageUploader
            currentAvatarUrl={avatarUrl}
            currentCoverUrl={null}
            accentColor={accentColor}
            type="both"
            avatarShape="circle"
          />

          <View style={{ padding: spacing.lg, gap: 14 }}>
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
                    label="Availability" value={field.value}
                    options={[
                      { label: 'Available', value: 'available' },
                      { label: 'Part-time', value: 'part-time' },
                      { label: 'Not Available', value: 'not-available' },
                    ]}
                    onChange={field.onChange} colors={colors} accentColor={accentColor}
                  />
                )} />
              <Controller control={control} name="experienceLevel"
                render={({ field }) => (
                  <PillSelector
                    label="Experience Level" value={field.value}
                    options={[
                      { label: 'Entry', value: 'entry' },
                      { label: 'Intermediate', value: 'intermediate' },
                      { label: 'Expert', value: 'expert' },
                    ]}
                    onChange={field.onChange} colors={colors} accentColor={accentColor}
                  />
                )} />
              <Controller control={control} name="englishProficiency"
                render={({ field }) => (
                  <PillSelector
                    label="English Proficiency" value={field.value}
                    options={[
                      { label: 'Basic', value: 'basic' },
                      { label: 'Conversational', value: 'conversational' },
                      { label: 'Fluent', value: 'fluent' },
                      { label: 'Native', value: 'native' },
                    ]}
                    onChange={field.onChange} colors={colors} accentColor={accentColor}
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
                accentColor={accentColor}
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
                accentColor={accentColor}
                colors={colors}
              />
            </View>

            {/* Social links */}
            <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SOCIAL LINKS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {SOCIAL_PLATFORMS.map(p => (
                  <View key={p.key} style={{ width: '48%', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Ionicons name={p.icon as any} size={14} color={p.color} />
                      <Text style={[inputSt.label, { color: colors.textMuted, marginBottom: 0 }]}>
                        {p.label.toUpperCase()}
                      </Text>
                    </View>
                    <TextInput
                      style={[
                        inputSt.input,
                        { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, height: 40 },
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
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