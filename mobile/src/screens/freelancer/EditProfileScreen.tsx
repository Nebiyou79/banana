/**
 * screens/freelancer/EditProfileScreen.tsx
 *
 * Freelancer profile editor.
 * - ProfileImageUploader at top (both avatar + cover)
 * - useEffect reset() fix for default values
 * - Skeleton while loading
 * - Skills and Specializations as separate tag editors
 * - Social links in two-column grid
 * - Availability/ExperienceLevel/EnglishProficiency as pill selectors
 * - Hourly rate numeric field
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';

import { useThemeStore }  from '../../store/themeStore';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { Input }          from '../../components/ui/Input';
import { SkeletonCard }   from '../../components/shared/ProfileAtoms';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { toast }          from '../../lib/toast';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav  = NativeStackNavigationProp<FreelancerStackParamList>;
const ACC = '#10B981';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  headline:           z.string().max(200).optional(),
  bio:                z.string().max(2000).optional(),
  location:           z.string().max(100).optional(),
  phone:              z.string().max(20).optional(),
  website:            z.string().url('Invalid URL').optional().or(z.literal('')),
  hourlyRate:         z.string().optional(),
  availability:       z.enum(['available', 'not-available', 'part-time']).optional(),
  experienceLevel:    z.enum(['entry', 'intermediate', 'expert']).optional(),
  englishProficiency: z.enum(['basic', 'conversational', 'fluent', 'native']).optional(),
  timezone:           z.string().max(80).optional(),
  // Social links
  linkedin:      z.string().url().optional().or(z.literal('')),
  github:        z.string().url().optional().or(z.literal('')),
  twitter:       z.string().url().optional().or(z.literal('')),
  instagram:     z.string().url().optional().or(z.literal('')),
  tiktok:        z.string().url().optional().or(z.literal('')),
  telegram:      z.string().url().optional().or(z.literal('')),
  youtube:       z.string().url().optional().or(z.literal('')),
  behance:       z.string().url().optional().or(z.literal('')),
  dribbble:      z.string().url().optional().or(z.literal('')),
  medium:        z.string().url().optional().or(z.literal('')),
  devto:         z.string().url().optional().or(z.literal('')),
  stackoverflow: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

// ─── Reusable sub-components ──────────────────────────────────────────────────

const SecLabel: React.FC<{ children: string }> = ({ children }) => {
  const { theme } = useThemeStore();
  return (
    <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>
      {children}
    </Text>
  );
};

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode; half?: boolean }> = ({
  label, error, children, half,
}) => {
  const { theme } = useThemeStore();
  return (
    <View style={[{ marginBottom: 10 }, half && { flex: 1 }]}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      {children}
      {error ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>{error}</Text> : null}
    </View>
  );
};

interface PillSelectorProps<T extends string> {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  color: string;
}

function PillSelector<T extends string>({ label, value, options, onChange, color }: PillSelectorProps<T>) {
  const { theme } = useThemeStore();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[pill.btn, {
              backgroundColor: value === opt.value ? `${color}18` : theme.colors.surface,
              borderColor:     value === opt.value ? color : theme.colors.border,
            }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={{ color: value === opt.value ? color : theme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Tag chip editor (skills / specializations) ───────────────────────────────

const TagEditor: React.FC<{
  tags: string[];
  placeholder: string;
  color: string;
  onAdd: (s: string) => void;
  onRemove: (i: number) => void;
  max?: number;
}> = ({ tags, placeholder, color, onAdd, onRemove, max = 50 }) => {
  const { theme } = useThemeStore();
  const [draft, setDraft] = useState('');
  const submit = () => {
    const s = draft.trim();
    if (s && !tags.includes(s) && tags.length < max) { onAdd(s); setDraft(''); }
  };
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Input placeholder={placeholder} value={draft} onChangeText={setDraft} style={{ flex: 1 }} returnKeyType="done" onSubmitEditing={submit} />
        <TouchableOpacity style={[te.addBtn, { backgroundColor: color }]} onPress={submit}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={te.chips}>
        {tags.map((t, i) => (
          <TouchableOpacity key={i} style={[te.chip, { backgroundColor: `${color}18`, borderColor: `${color}30` }]} onPress={() => onRemove(i)}>
            <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{t}</Text>
            <Ionicons name="close" size={11} color={color} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 4 }}>{tags.length}/{max} · Tap to remove</Text>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const FreelancerEditProfileScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const qc         = useQueryClient();

  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [skills,   setSkills]   = useState<string[]>([]);
  const [specs,    setSpecs]    = useState<string[]>([]);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        headline: '', bio: '', location: '', phone: '', website: '',
        hourlyRate: '', availability: 'available', experienceLevel: 'intermediate',
        englishProficiency: 'conversational', timezone: '',
        linkedin: '', github: '', twitter: '', instagram: '', tiktok: '',
        telegram: '', youtube: '', behance: '', dribbble: '', medium: '', devto: '', stackoverflow: '',
      },
    });

  useEffect(() => {
    if (!profile) return;
    const prof = profile as unknown as Record<string, unknown>;
    const fp   = (prof.freelancerProfile ?? prof.roleSpecific) as Record<string, unknown> | undefined ?? {};
    const sl   = (fp.socialLinks ?? prof.socialLinks) as Record<string, string> | undefined ?? {};

    // Update tag arrays
    const rawSkills = (prof.skills as Array<string | Record<string, string>>) ?? [];
    setSkills(rawSkills.map((s) => (typeof s === 'string' ? s : s.name ?? '')));
    setSpecs((fp.specialization as string[]) ?? []);

    reset({
      headline:           profile.headline ?? '',
      bio:                profile.bio      ?? '',
      location:           profile.location ?? '',
      phone:              profile.phone    ?? '',
      website:            profile.website  ?? '',
      hourlyRate:         String(fp.hourlyRate ?? ''),
      availability:       (fp.availability as FormValues['availability']) ?? 'available',
      experienceLevel:    (fp.experienceLevel as FormValues['experienceLevel']) ?? 'intermediate',
      englishProficiency: (fp.englishProficiency as FormValues['englishProficiency']) ?? 'conversational',
      timezone:           (fp.timezone as string) ?? '',
      linkedin:      sl.linkedin      ?? '',
      github:        sl.github        ?? '',
      twitter:       sl.twitter       ?? '',
      instagram:     sl.instagram     ?? '',
      tiktok:        sl.tiktok        ?? '',
      telegram:      sl.telegram      ?? '',
      youtube:       sl.youtube       ?? '',
      behance:       sl.behance       ?? '',
      dribbble:      sl.dribbble      ?? '',
      medium:        sl.medium        ?? '',
      devto:         sl.devto         ?? '',
      stackoverflow: sl.stackoverflow ?? '',
    });
  }, [profile, reset]);

  const onSave = handleSubmit((data) => {
    const payload = {
      ...data,
      skills: skills.map((s) => ({ name: s, level: 'intermediate', yearsOfExperience: 1 })),
      freelancerProfile: {
        headline:           data.headline,
        hourlyRate:         data.hourlyRate ? Number(data.hourlyRate) : 0,
        availability:       data.availability,
        experienceLevel:    data.experienceLevel,
        englishProficiency: data.englishProficiency,
        timezone:           data.timezone,
        specialization:     specs,
        socialLinks: {
          linkedin:      data.linkedin      || undefined,
          github:        data.github        || undefined,
          twitter:       data.twitter       || undefined,
          instagram:     data.instagram     || undefined,
          tiktok:        data.tiktok        || undefined,
          telegram:      data.telegram      || undefined,
          youtube:       data.youtube       || undefined,
          behance:       data.behance       || undefined,
          dribbble:      data.dribbble      || undefined,
          medium:        data.medium        || undefined,
          devto:         data.devto         || undefined,
          stackoverflow: data.stackoverflow || undefined,
        },
      },
    };

    updateProfile.mutate(payload as unknown as Parameters<typeof updateProfile.mutate>[0], {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['profile'] });
        navigation.goBack();
      },
      onError: (err: unknown) => {
        const msg = (err as Record<string, Record<string, string>>)?.response?.data ?? 'Save failed.';
        toast.error(msg);
      },
    });
  });

  const inp = { backgroundColor: colors.inputBg, borderColor: colors.border };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 80, paddingHorizontal: spacing[5], gap: 16 }}>
        <SkeletonCard height={140} radius={12} />
        <SkeletonCard height={44} radius={10} />
        <SkeletonCard height={44} radius={10} />
      </View>
    );
  }

  const AVAIL_OPTIONS: { value: FormValues['availability']; label: string }[] = [
    { value: 'available',     label: '✅ Available' },
    { value: 'part-time',     label: '⏰ Part-Time' },
    { value: 'not-available', label: '🔴 Unavailable' },
  ];
  const EXP_OPTIONS:   { value: FormValues['experienceLevel']; label: string }[] = [
    { value: 'entry',         label: 'Entry (0–2 yrs)' },
    { value: 'intermediate',  label: 'Mid (2–5 yrs)' },
    { value: 'expert',        label: 'Expert (5+ yrs)' },
  ];
  const PROF_OPTIONS:  { value: FormValues['englishProficiency']; label: string }[] = [
    { value: 'basic',         label: 'Basic' },
    { value: 'conversational',label: 'Conversational' },
    { value: 'fluent',        label: 'Fluent' },
    { value: 'native',        label: 'Native' },
  ];

  const SOCIAL_FIELDS: { key: keyof FormValues; label: string; placeholder: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'linkedin',      label: 'LinkedIn',    placeholder: 'https://linkedin.com/in/…', icon: 'logo-linkedin' },
    { key: 'github',        label: 'GitHub',      placeholder: 'https://github.com/…',     icon: 'logo-github' },
    { key: 'twitter',       label: 'Twitter/X',   placeholder: 'https://x.com/…',          icon: 'logo-twitter' },
    { key: 'instagram',     label: 'Instagram',   placeholder: 'https://instagram.com/…',  icon: 'logo-instagram' },
    { key: 'tiktok',        label: 'TikTok',      placeholder: 'https://tiktok.com/@…',    icon: 'musical-notes-outline' },
    { key: 'telegram',      label: 'Telegram',    placeholder: 'https://t.me/…',           icon: 'paper-plane-outline' },
    { key: 'youtube',       label: 'YouTube',     placeholder: 'https://youtube.com/…',    icon: 'logo-youtube' },
    { key: 'behance',       label: 'Behance',     placeholder: 'https://behance.net/…',    icon: 'globe-outline' },
    { key: 'dribbble',      label: 'Dribbble',    placeholder: 'https://dribbble.com/…',   icon: 'basketball-outline' },
    { key: 'medium',        label: 'Medium',      placeholder: 'https://medium.com/@…',    icon: 'newspaper-outline' },
    { key: 'devto',         label: 'Dev.to',      placeholder: 'https://dev.to/…',         icon: 'code-outline' },
    { key: 'stackoverflow', label: 'Stack Overflow', placeholder: 'https://stackoverflow.com/users/…', icon: 'help-circle-outline' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Sticky header */}
      <View style={[hdr.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={hdr.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.lg }}>Edit Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={isSubmitting} style={hdr.saveBtn}>
          {isSubmitting ? <ActivityIndicator color={ACC} /> : <Text style={{ color: ACC, fontWeight: '700', fontSize: typography.base }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingTop: 64 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Uploader */}
        <ProfileImageUploader
          currentAvatarUrl={(profile as Record<string, Record<string, string>> | undefined)?.avatar?.secure_url}
          currentCoverUrl={(profile as Record<string, Record<string, string>> | undefined)?.cover?.secure_url}
          accentColor={ACC}
          type="both"
          avatarShape="circle"
          showDeleteButtons
        />

        {/* Basic info */}
        <SecLabel>Basic Info</SecLabel>
        <Controller control={control} name="headline"
          render={({ field }) => (
            <Field label="Headline" error={errors.headline?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. Full-Stack Developer" inputStyle={inp} />
            </Field>
          )}
        />
        <Controller control={control} name="bio"
          render={({ field }) => (
            <Field label="Professional Bio" error={errors.bio?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="Describe your expertise…" multiline numberOfLines={4} inputStyle={inp} />
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
              <Field label="Phone" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="+1 555 000" keyboardType="phone-pad" inputStyle={inp} leftIcon={<Ionicons name="call-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="website"
            render={({ field }) => (
              <Field label="Website" half error={errors.website?.message}>
                <Input value={field.value} onChangeText={field.onChange} placeholder="https://…" keyboardType="url" autoCapitalize="none" inputStyle={inp} leftIcon={<Ionicons name="globe-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
          <Controller control={control} name="hourlyRate"
            render={({ field }) => (
              <Field label="Hourly Rate (USD)" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. 35" keyboardType="numeric" inputStyle={inp} leftIcon={<Ionicons name="pricetag-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
        </View>
        <Controller control={control} name="timezone"
          render={({ field }) => (
            <Field label="Timezone">
              <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. UTC+3, EST" inputStyle={inp} leftIcon={<Ionicons name="time-outline" size={15} color={colors.textMuted} />} />
            </Field>
          )}
        />

        {/* Professional */}
        <SecLabel>Professional Details</SecLabel>
        <Controller control={control} name="availability"
          render={({ field }) => (
            <PillSelector label="Availability" value={field.value} options={AVAIL_OPTIONS as { value: FormValues['availability']; label: string }[]} onChange={field.onChange} color={ACC} />
          )}
        />
        <Controller control={control} name="experienceLevel"
          render={({ field }) => (
            <PillSelector label="Experience Level" value={field.value} options={EXP_OPTIONS as { value: FormValues['experienceLevel']; label: string }[]} onChange={field.onChange} color="#6366F1" />
          )}
        />
        <Controller control={control} name="englishProficiency"
          render={({ field }) => (
            <PillSelector label="English Proficiency" value={field.value} options={PROF_OPTIONS as { value: FormValues['englishProficiency']; label: string }[]} onChange={field.onChange} color="#F59E0B" />
          )}
        />

        {/* Skills */}
        <SecLabel>Skills</SecLabel>
        <TagEditor
          tags={skills}
          placeholder="Add a skill…"
          color="#6366F1"
          onAdd={(s) => setSkills((prev) => [...prev, s])}
          onRemove={(i) => setSkills((prev) => prev.filter((_, j) => j !== i))}
        />

        {/* Specializations */}
        <SecLabel>Specializations</SecLabel>
        <TagEditor
          tags={specs}
          placeholder="Add a specialization…"
          color={ACC}
          onAdd={(s) => setSpecs((prev) => [...prev, s])}
          onRemove={(i) => setSpecs((prev) => prev.filter((_, j) => j !== i))}
        />

        {/* Social links — two-column grid */}
        <SecLabel>Social & Professional Links</SecLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SOCIAL_FIELDS.map(({ key, label, placeholder, icon }) => (
            <Controller key={key} control={control} name={key}
              render={({ field }) => (
                <View style={{ width: '48%' }}>
                  <Field label={label} error={(errors as Record<string, { message?: string }>)[key]?.message}>
                    <Input
                      value={field.value as string}
                      onChangeText={field.onChange}
                      placeholder={placeholder}
                      keyboardType="url"
                      autoCapitalize="none"
                      inputStyle={inp}
                      leftIcon={<Ionicons name={icon} size={14} color={colors.textMuted} />}
                    />
                  </Field>
                </View>
              )}
            />
          ))}
        </View>

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

const pill = StyleSheet.create({
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5 },
});

const te = StyleSheet.create({
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
});