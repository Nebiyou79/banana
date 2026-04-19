/**
 * screens/organization/EditProfileScreen.tsx
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';

import {
  useProfile, useOrganizationProfile, useUpdateOrganizationProfile,
  useOrganizationRoleProfile,
} from '../../hooks/useProfile';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { toast } from '../../lib/toast';
import { useTheme } from '../../hooks/useTheme';

const ACCENT = '#10B981';

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
  label?: string; tags: string[]; onAdd: (t: string) => void;
  onRemove: (i: number) => void; placeholder?: string;
  accentColor: string; colors: any;
}> = ({ label, tags, onAdd, onRemove, placeholder = 'Add...', accentColor, colors }) => {
  const [input, setInput] = useState('');
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={[inputStyles.label, { color: colors.textMuted }]}>{label}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          style={[inputStyles.input, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary, height: 44 }]}
          value={input} onChangeText={setInput} placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder} returnKeyType="done"
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

const ORG_TYPES: Array<{ label: string; value: 'non-profit' | 'government' | 'educational' | 'healthcare' | 'other' }> = [
  { label: 'Non-Profit', value: 'non-profit' },
  { label: 'Government', value: 'government' },
  { label: 'Educational', value: 'educational' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Other', value: 'other' },
];

interface FormValues {
  name: string;
  registrationNumber: string;
  organizationType: 'non-profit' | 'government' | 'educational' | 'healthcare' | 'other';
  industry: string;
  description: string;
  mission: string;
  address: string;
  phone: string;
  secondaryPhone: string;
  website: string;
  values: string[];
  specialties: string[];
}

export const OrganizationEditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();


  const { colors, type, spacing, isDark } = useTheme();

  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: org, isLoading: oLoading } = useOrganizationProfile();
  const { data: roleProfile, isLoading: rLoading } = useOrganizationRoleProfile();
  const updateOrg = useUpdateOrganizationProfile();

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '', registrationNumber: '', organizationType: 'non-profit',
      industry: '', description: '', mission: '',
      address: '', phone: '', secondaryPhone: '', website: '',
      values: [], specialties: [],
    },
  });

  // Fix: reset after data loads
  useEffect(() => {
    if (!org) return;
    reset({
      name: org.name ?? '',
      registrationNumber: org.registrationNumber ?? '',
      organizationType: org.organizationType ?? 'non-profit',
      industry: org.industry ?? '',
      description: org.description ?? '',
      mission: org.mission ?? '',
      address: org.address ?? '',
      phone: org.phone ?? '',
      secondaryPhone: org.secondaryPhone ?? '',
      website: org.website ?? '',
      values: roleProfile?.values ?? [],
      specialties: roleProfile?.specialties ?? [],
    });
  }, [org, roleProfile, reset]);

  const isSaving = updateOrg.isPending;
  const isLoading = pLoading || oLoading || rLoading;

  const orgType = watch('organizationType');
  const values = watch('values');
  const specialties = watch('specialties');

  const onSave = useCallback(
    handleSubmit(async (formValues) => {
      try {
        await updateOrg.mutateAsync({
          name: formValues.name || undefined,
          registrationNumber: formValues.registrationNumber || undefined,
          organizationType: formValues.organizationType,
          industry: formValues.industry || undefined,
          description: formValues.description || undefined,
          mission: formValues.mission || undefined,
          address: formValues.address || undefined,
          phone: formValues.phone || undefined,
          secondaryPhone: formValues.secondaryPhone || undefined,
          website: formValues.website || undefined,
        });
        navigation.goBack();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      }
    }),
    [handleSubmit, updateOrg, navigation]
  );

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }} contentContainerStyle={{ padding: 16 }}>
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Sticky header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.borderPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="close-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>Edit Organization</Text>
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
        {/* Square logo — no cover */}
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <ProfileImageUploader
            currentAvatarUrl={avatarUrl}
            currentCoverUrl={null}
            accentColor={ACCENT}
            type="avatar"
            avatarShape="square"
          />
        </View>

        <View style={{ padding: 16, gap: 14 }}>
          {/* Basic info */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ORGANIZATION INFO</Text>
            <Controller control={control} name="name"
              render={({ field }) => (
                <LabeledInput label="Organization Name *" value={field.value} onChangeText={field.onChange}
                  placeholder="Your organization name" colors={colors} />
              )} />
            <Controller control={control} name="registrationNumber"
              render={({ field }) => (
                <LabeledInput label="Registration Number" value={field.value} onChangeText={field.onChange}
                  placeholder="Official reg. number (optional)" colors={colors} />
              )} />
            <Controller control={control} name="industry"
              render={({ field }) => (
                <LabeledInput label="Industry / Sector" value={field.value} onChangeText={field.onChange}
                  placeholder="e.g. Education, Healthcare" colors={colors} />
              )} />

            {/* Organization type pill selector */}
            <Text style={[inputStyles.label, { color: colors.textMuted, marginBottom: 8 }]}>
              ORGANIZATION TYPE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {ORG_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setValue('organizationType', t.value)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
                    backgroundColor: orgType === t.value ? ACCENT : colors.bgSurface,
                  }}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: '600',
                    color: orgType === t.value ? '#fff' : colors.textSecondary,
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Controller control={control} name="mission"
              render={({ field }) => (
                <LabeledInput label="Mission Statement" value={field.value} onChangeText={field.onChange}
                  placeholder="Our mission is to..." multiline numberOfLines={3}
                  maxLength={500} colors={colors} />
              )} />
            <Controller control={control} name="description"
              render={({ field }) => (
                <LabeledInput label="Description" value={field.value} onChangeText={field.onChange}
                  placeholder="Tell people about your organization..." multiline numberOfLines={5}
                  maxLength={1000} colors={colors} />
              )} />
          </View>

          {/* Contact */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CONTACT</Text>
            <Controller control={control} name="phone"
              render={({ field }) => (
                <LabeledInput label="Primary Phone" value={field.value} onChangeText={field.onChange}
                  placeholder="+1 555 000 0000" keyboardType="phone-pad" colors={colors} />
              )} />
            <Controller control={control} name="secondaryPhone"
              render={({ field }) => (
                <LabeledInput label="Secondary Phone (optional)" value={field.value} onChangeText={field.onChange}
                  placeholder="+1 555 000 0001" keyboardType="phone-pad" colors={colors} />
              )} />
            <Controller control={control} name="website"
              render={({ field }) => (
                <LabeledInput label="Website" value={field.value} onChangeText={field.onChange}
                  placeholder="https://yourorg.org" keyboardType="url" colors={colors} />
              )} />
            <Controller control={control} name="address"
              render={({ field }) => (
                <LabeledInput label="Address" value={field.value} onChangeText={field.onChange}
                  placeholder="Organization address" colors={colors} />
              )} />
          </View>

          {/* Values */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>VALUES</Text>
            <TagEditor
              tags={values}
              onAdd={t => setValue('values', [...values, t])}
              onRemove={i => setValue('values', values.filter((_, idx) => idx !== i))}
              placeholder="e.g. Integrity, Innovation..."
              accentColor={ACCENT}
              colors={colors}
            />
          </View>

          {/* Specialties */}
          <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SPECIALTIES</Text>
            <TagEditor
              tags={specialties}
              onAdd={t => setValue('specialties', [...specialties, t])}
              onRemove={i => setValue('specialties', specialties.filter((_, idx) => idx !== i))}
              placeholder="e.g. Community Development, Grants..."
              accentColor={ACCENT}
              colors={colors}
            />
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