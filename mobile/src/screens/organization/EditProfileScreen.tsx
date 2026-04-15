
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, KeyboardAvoidingView, Platform, Linking,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';

import { useThemeStore }  from '../../store/themeStore';
import {
  useProfile,
  useOrganizationRoleProfile,
  useUpdateProfile,
} from '../../hooks/useProfile';
import { Input } from '../../components/ui/Input';
import { toast } from '../../lib/toast';
import api     from '../../lib/api';
import type { OrganizationStackParamList } from '../../navigation/OrganizationNavigator';

type Nav  = NativeStackNavigationProp<OrganizationStackParamList>;
const ACC = '#8B5CF6';

const orgSchema = z.object({
  headline:         z.string().max(200).optional(),
  bio:              z.string().max(1000).optional(),
  location:         z.string().max(100).optional(),
  phone:            z.string().max(20).optional(),
  secondaryPhone:   z.string().max(20).optional(),
  website:          z.string().url('Enter a valid URL').optional().or(z.literal('')),
  mission:          z.string().max(500).optional(),
  organizationType: z.enum(['non-profit', 'government', 'educational', 'healthcare', 'other']).optional(),
  registrationNumber: z.string().regex(/^[0-9]{10}$/, '10 digits required').optional().or(z.literal('')),
});

type OrgForm = z.infer<typeof orgSchema>;

const LogoUpload: React.FC = () => {
  const { theme } = useThemeStore();
  const [busy, setBusy] = React.useState(false);
  const qc = useQueryClient();

  const pick = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast.warning('Permission required to pick an image.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85,
      allowsEditing: true, aspect: [1, 1],
    });
    if (res.canceled || !res.assets?.length) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('avatar', { uri: res.assets[0].uri, name: `logo-${Date.now()}.jpg`, type: 'image/jpeg' } as any);
      await api.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 });
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Logo updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Upload failed.');
    } finally { setBusy(false); }
  }, [qc]);

  return (
    <TouchableOpacity
      style={[ep.logoRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={pick} disabled={busy} activeOpacity={0.8}
    >
      {busy ? <ActivityIndicator color={ACC} /> : <Ionicons name="image-outline" size={22} color={ACC} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>{busy ? 'Uploading…' : 'Upload Organization Logo'}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>JPG, PNG, WebP · Max 5 MB · Square</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
};

const OrgField: React.FC<{ label: string; error?: string; children: React.ReactNode; half?: boolean }> = ({
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

const ORG_TYPES: { value: OrgForm['organizationType']; label: string }[] = [
  { value: 'non-profit',  label: 'Non-Profit' },
  { value: 'government',  label: 'Government' },
  { value: 'educational', label: 'Educational' },
  { value: 'healthcare',  label: 'Healthcare' },
  { value: 'other',       label: 'Other' },
];

export const OrganizationEditProfileScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const qc         = useQueryClient();
  const { data: profile } = useProfile();
  const { data: rp }      = useOrganizationRoleProfile();
  const updateProfile     = useUpdateProfile();

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      headline:           profile?.headline ?? '',
      bio:                profile?.bio      ?? '',
      location:           profile?.location ?? '',
      phone:              profile?.phone    ?? '',
      secondaryPhone:     (profile as any)?.secondaryPhone ?? '',
      website:            profile?.website  ?? '',
      mission:            rp?.mission ?? '',
    },
  });

  const selectedType = watch('organizationType');

  const onSave = handleSubmit((data) => {
    updateProfile.mutate(data as any, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); navigation.goBack(); },
      onError:   (err: any) => toast.error(err?.response?.data?.message ?? 'Save failed.'),
    });
  });

  const inp = { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[ep.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ep.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.lg }}>Edit Organization</Text>
        <TouchableOpacity onPress={onSave} disabled={isSubmitting} style={ep.saveArea}>
          {isSubmitting ? <ActivityIndicator color={ACC} /> : <Text style={{ color: ACC, fontWeight: '700', fontSize: typography.base }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5] }} keyboardShouldPersistTaps="handled">

        <Text style={[ep.group, { color: colors.textMuted }]}>LOGO</Text>
        <LogoUpload />

        <Text style={[ep.group, { color: colors.textMuted }]}>ORGANIZATION TYPE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ORG_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[ep.typePill, {
                backgroundColor: selectedType === t.value ? ACC + '18' : colors.surface,
                borderColor:     selectedType === t.value ? ACC       : colors.border,
              }]}
              onPress={() => setValue('organizationType', t.value)}
            >
              <Text style={{ color: selectedType === t.value ? ACC : colors.textMuted, fontWeight: '600', fontSize: 12 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[ep.group, { color: colors.textMuted }]}>DETAILS</Text>

        <Controller control={control} name="headline"
          render={({ field }) => (
            <OrgField label="Tagline" error={errors.headline?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="e.g. Empowering Communities" style={inp} />
            </OrgField>
          )}
        />
        <Controller control={control} name="bio"
          render={({ field }) => (
            <OrgField label="About your Organization" error={errors.bio?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="What you do and who you serve…" multiline numberOfLines={4} style={inp} />
            </OrgField>
          )}
        />
        <Controller control={control} name="mission"
          render={({ field }) => (
            <OrgField label="Mission Statement">
              <Input value={field.value} onChangeText={field.onChange} placeholder="Our mission is to…" multiline numberOfLines={3} style={inp} />
            </OrgField>
          )}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="location"
            render={({ field }) => (
              <OrgField label="Location" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="City, Country" style={inp} leftIcon={<Ionicons name="location-outline" size={15} color={colors.textMuted} />} />
              </OrgField>
            )}
          />
          <Controller control={control} name="registrationNumber"
            render={({ field }) => (
              <OrgField label="Reg. Number (10 digits)" half error={errors.registrationNumber?.message}>
                <Input value={field.value} onChangeText={field.onChange} placeholder="0000000000" keyboardType="number-pad" style={inp} />
              </OrgField>
            )}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Controller control={control} name="phone"
            render={({ field }) => (
              <OrgField label="Primary Phone" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="+1 555 000" keyboardType="phone-pad" style={inp} leftIcon={<Ionicons name="call-outline" size={15} color={colors.textMuted} />} />
              </OrgField>
            )}
          />
          <Controller control={control} name="secondaryPhone"
            render={({ field }) => (
              <OrgField label="Secondary Phone" half>
                <Input value={field.value} onChangeText={field.onChange} placeholder="+1 555 001" keyboardType="phone-pad" style={inp} leftIcon={<Ionicons name="call-outline" size={15} color={colors.textMuted} />} />
              </OrgField>
            )}
          />
        </View>

        <Controller control={control} name="website"
          render={({ field }) => (
            <OrgField label="Website" error={errors.website?.message}>
              <Input value={field.value} onChangeText={field.onChange} placeholder="https://yourorg.org" keyboardType="url" autoCapitalize="none" style={inp} leftIcon={<Ionicons name="globe-outline" size={15} color={colors.textMuted} />} />
            </OrgField>
          )}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
// ─── Styles ───────────────────────────────────────────────────────────────────

const ep = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn:  { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveArea: { minWidth: 60, alignItems: 'flex-end', justifyContent: 'center', height: 44 },
  group:    { fontWeight: '700', fontSize: 10, letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4 },
  typePill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
});