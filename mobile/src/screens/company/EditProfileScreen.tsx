/**
 * screens/company/EditProfileScreen.tsx
 *
 * Company profile editor.
 * - ProfileImageUploader replaces old LogoUpload (square avatar, type="avatar")
 * - useEffect reset() fix
 * - Specialties tag chip editor
 * - TIN: number-pad, maxLength 10
 * - Sticky header
 */

import React, { useState, useEffect } from 'react';
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

import { useThemeStore }    from '../../store/themeStore';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { Input }            from '../../components/ui/Input';
import { SkeletonCard }     from '../../components/shared/ProfileAtoms';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { toast }            from '../../lib/toast';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Nav  = NativeStackNavigationProp<CompanyStackParamList>;
const ACC = '#3B82F6';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  headline:  z.string().max(200).optional(),
  bio:       z.string().max(1000).optional(),
  location:  z.string().max(100).optional(),
  phone:     z.string().max(20).optional(),
  website:   z.string().url('Enter a valid URL').optional().or(z.literal('')),
  industry:  z.string().max(100).optional(),
  tin:       z.string().regex(/^[0-9]{10}$/, 'TIN must be exactly 10 digits').optional().or(z.literal('')),
  mission:   z.string().max(500).optional(),
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
    <View style={[{ marginBottom: 12 }, half && { flex: 1 }]}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{label}</Text>
      {children}
      {error ? <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 2 }}>{error}</Text> : null}
    </View>
  );
};

// ─── Specialties tag editor ───────────────────────────────────────────────────

const SpecialtiesEditor: React.FC<{
  tags: string[];
  onAdd: (s: string) => void;
  onRemove: (i: number) => void;
}> = ({ tags, onAdd, onRemove }) => {
  const { theme } = useThemeStore();
  const [draft, setDraft] = useState('');
  const submit = () => {
    const s = draft.trim();
    if (s && !tags.includes(s) && tags.length < 20) { onAdd(s); setDraft(''); }
  };
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Input placeholder="Add specialty…" value={draft} onChangeText={setDraft} style={{ flex: 1 }} returnKeyType="done" onSubmitEditing={submit} />
        <TouchableOpacity style={[te.addBtn, { backgroundColor: ACC }]} onPress={submit}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={te.chips}>
        {tags.map((t, i) => (
          <TouchableOpacity key={i} style={[te.chip, { backgroundColor: `${ACC}18`, borderColor: `${ACC}30` }]} onPress={() => onRemove(i)}>
            <Text style={{ color: ACC, fontSize: 12, fontWeight: '600' }}>{t}</Text>
            <Ionicons name="close" size={11} color={ACC} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 4 }}>{tags.length}/20 · Tap to remove</Text>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const CompanyEditProfileScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const qc         = useQueryClient();

  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [specialties, setSpecialties] = useState<string[]>([]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { headline: '', bio: '', location: '', phone: '', website: '', industry: '', tin: '', mission: '' },
  });

  useEffect(() => {
    if (!profile) return;
    const prof = profile as unknown as Record<string, unknown>;
    const rp   = (prof.roleSpecific ?? {}) as Record<string, unknown>;
    const ci   = (rp.companyInfo   ?? rp) as Record<string, unknown>;

    setSpecialties((ci.specialties as string[]) ?? []);

    reset({
      headline: profile.headline  ?? '',
      bio:      profile.bio       ?? '',
      location: profile.location  ?? '',
      phone:    profile.phone     ?? '',
      website:  profile.website   ?? '',
      industry: (ci.industry as string) ?? '',
      tin:      (ci.tin       as string) ?? '',
      mission:  (ci.mission   as string) ?? (rp.mission as string) ?? '',
    });
  }, [profile, reset]);

  const onSave = handleSubmit((data) => {
    const payload = { ...data, specialties };
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
        <SkeletonCard height={88} radius={16} style={{ width: 88 }} />
        <SkeletonCard height={44} radius={10} />
        <SkeletonCard height={44} radius={10} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Sticky header */}
      <View style={[hdr.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={hdr.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.lg }}>Edit Company Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={isSubmitting} style={hdr.saveBtn}>
          {isSubmitting ? <ActivityIndicator color={ACC} /> : <Text style={{ color: ACC, fontWeight: '700', fontSize: typography.base }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5], paddingTop: 64 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Square logo uploader */}
        <ProfileImageUploader
          currentAvatarUrl={(profile as Record<string, Record<string, string>> | undefined)?.avatar?.secure_url}
          accentColor={ACC}
          type="avatar"
          avatarShape="square"
          showDeleteButtons
        />

        {/* Company info */}
        <SecLabel>Company Info</SecLabel>
        <Controller control={control} name="headline"
          render={({ field }) => (
            <Field label="Tagline" error={errors.headline?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. Building the future of work" inputStyle={inp} />
            </Field>
          )}
        />
        <Controller control={control} name="bio"
          render={({ field }) => (
            <Field label="Description" error={errors.bio?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="About your company…" multiline numberOfLines={4} inputStyle={inp} />
            </Field>
          )}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="location"
            render={({ field }) => (
              <Field label="Headquarters" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="City, Country" inputStyle={inp} leftIcon={<Ionicons name="location-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
          <Controller control={control} name="industry"
            render={({ field }) => (
              <Field label="Industry" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="Technology" inputStyle={inp} leftIcon={<Ionicons name="business-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="phone"
            render={({ field }) => (
              <Field label="Phone" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="+1 555 000" keyboardType="phone-pad" inputStyle={inp} leftIcon={<Ionicons name="call-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
          <Controller control={control} name="tin"
            render={({ field }) => (
              <Field label="TIN (10 digits)" half error={errors.tin?.message}>
                <Input value={field.value} onChangeText={field.onChange} placeholder="0000000000" keyboardType="number-pad" maxLength={10} inputStyle={inp} />
              </Field>
            )}
          />
        </View>
        <Controller control={control} name="website"
          render={({ field }) => (
            <Field label="Website" error={errors.website?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="https://company.com" keyboardType="url" autoCapitalize="none" inputStyle={inp} leftIcon={<Ionicons name="globe-outline" size={15} color={colors.textMuted} />} />
            </Field>
          )}
        />
        <Controller control={control} name="mission"
          render={({ field }) => (
            <Field label="Mission Statement">
              <Input value={field.value} onChangeText={field.onChange} placeholder="Our mission is to…" multiline numberOfLines={3} inputStyle={inp} />
            </Field>
          )}
        />

        {/* Specialties */}
        <SecLabel>Specialties</SecLabel>
        <SpecialtiesEditor
          tags={specialties}
          onAdd={(s) => setSpecialties((prev) => [...prev, s])}
          onRemove={(i) => setSpecialties((prev) => prev.filter((_, j) => j !== i))}
        />

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

const te = StyleSheet.create({
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
});