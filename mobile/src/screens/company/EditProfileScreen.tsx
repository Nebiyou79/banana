/**
 * screens/company/EditProfileScreen.tsx
 *
 * Company profile editor.
 * ─ react-hook-form + Zod
 * ─ Logo upload via multipart/form-data → PUT /profile/avatar (matches backend)
 * ─ Fields: tagline, bio, HQ, phone, website, industry, TIN, mission, specialties
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';

import { useThemeStore }    from '../../store/themeStore';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { Input }            from '../../components/ui/Input';
import { toast }            from '../../lib/toast';
import api                  from '../../lib/api';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Nav  = NativeStackNavigationProp<CompanyStackParamList>;
const ACC = '#3B82F6';

// ─── Zod schema ───────────────────────────────────────────────────────────────

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

type Form = z.infer<typeof schema>;

// ─── Logo upload button ───────────────────────────────────────────────────────

const LogoUpload: React.FC = () => {
  const { theme }  = useThemeStore();
  const [busy, setBusy] = React.useState(false);
  const qc         = useQueryClient();

  const handlePick = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast.warning('Camera roll permission required.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setBusy(true);
    try {
      const form = new FormData();
      form.append('avatar', {
        uri:  asset.uri,
        name: `logo-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      await api.post('/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      });
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Logo updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Logo upload failed.');
    } finally {
      setBusy(false);
    }
  }, [qc]);

  return (
    <TouchableOpacity
      style={[lu.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={handlePick}
      disabled={busy}
      activeOpacity={0.8}
    >
      {busy ? <ActivityIndicator color={ACC} /> : <Ionicons name="image-outline" size={22} color={ACC} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>
          {busy ? 'Uploading logo…' : 'Upload Company Logo'}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>JPG, PNG, WebP · Max 5 MB · Square</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </TouchableOpacity>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CompanyEditProfileScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const qc         = useQueryClient();
  const { data: profile } = useProfile();
  const updateProfile     = useUpdateProfile();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      headline: profile?.headline ?? '',
      bio:      profile?.bio      ?? '',
      location: profile?.location ?? '',
      phone:    profile?.phone    ?? '',
      website:  profile?.website  ?? '',
      industry: (profile as any)?.roleSpecific?.companyInfo?.industry ?? '',
      tin:      (profile as any)?.roleSpecific?.companyInfo?.tin       ?? '',
      mission:  (profile as any)?.roleSpecific?.companyInfo?.mission   ?? '',
    },
  });

  const onSave = handleSubmit((data) => {
    updateProfile.mutate(data as any, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['profile'] });
        navigation.goBack();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message ?? 'Save failed. Try again.');
      },
    });
  });

  const inp = { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.lg }}>Edit Company Profile</Text>
        <TouchableOpacity onPress={onSave} disabled={isSubmitting} style={s.saveArea}>
          {isSubmitting
            ? <ActivityIndicator color={ACC} />
            : <Text style={{ color: ACC, fontWeight: '700', fontSize: typography.base }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5] }} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <Text style={[s.label, { color: colors.textMuted }]}>COMPANY LOGO</Text>
        <LogoUpload />

        {/* Basic */}
        <Text style={[s.label, { color: colors.textMuted }]}>COMPANY INFO</Text>

        <Controller control={control} name="headline"
          render={({ field }) => (
            <Field label="Tagline" error={errors.headline?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. Building the future of work" style={inp} />
            </Field>
          )}
        />
        <Controller control={control} name="bio"
          render={({ field }) => (
            <Field label="Description" error={errors.bio?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="About your company…" multiline numberOfLines={4} style={inp} />
            </Field>
          )}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="location"
            render={({ field }) => (
              <Field label="Headquarters" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="City, Country" style={inp} leftIcon={<Ionicons name="location-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
          <Controller control={control} name="industry"
            render={({ field }) => (
              <Field label="Industry" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="Technology" style={inp} leftIcon={<Ionicons name="business-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="phone"
            render={({ field }) => (
              <Field label="Phone" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="+1 555 000" keyboardType="phone-pad" style={inp} leftIcon={<Ionicons name="call-outline" size={15} color={colors.textMuted} />} />
              </Field>
            )}
          />
          <Controller control={control} name="tin"
            render={({ field }) => (
              <Field label="TIN (10 digits)" half error={errors.tin?.message}>
                <Input value={field.value} onChangeText={field.onChange} placeholder="0000000000" keyboardType="number-pad" style={inp} />
              </Field>
            )}
          />
        </View>

        <Controller control={control} name="website"
          render={({ field }) => (
            <Field label="Website" error={errors.website?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="https://company.com" keyboardType="url" autoCapitalize="none" style={inp} leftIcon={<Ionicons name="globe-outline" size={15} color={colors.textMuted} />} />
            </Field>
          )}
        />

        <Controller control={control} name="mission"
          render={({ field }) => (
            <Field label="Mission Statement">
              <Input value={field.value} onChangeText={field.onChange} placeholder="Our mission is to…" multiline numberOfLines={3} style={inp} />
            </Field>
          )}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn:  { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveArea: { minWidth: 60, alignItems: 'flex-end', justifyContent: 'center', height: 44 },
  label:    { fontWeight: '700', fontSize: 10, letterSpacing: 1, marginTop: 24, marginBottom: 10 },
});

const lu = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4 },
});