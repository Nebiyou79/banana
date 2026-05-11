/**
 * src/screens/company/EditProfileScreen.tsx
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import {
  useProfile, useCompanyProfile, useUpdateCompanyProfile,
} from '../../hooks/useProfile';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { toast } from '../../lib/toast';
import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

const inputStyles = StyleSheet.create({
  label: {
    fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: FONT_SIZE.base,
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
  placeholder?: string; colors: any;
}> = ({ tags, onAdd, onRemove, placeholder = 'Add...', colors }) => {
  const [input, setInput] = useState('');
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          style={[inputStyles.input, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, height: 44 }]}
          value={input} onChangeText={setInput} placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder} returnKeyType="done"
          onSubmitEditing={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}
        />
        <TouchableOpacity
          style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}
        >
          <Ionicons name="add" size={22} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((tag, i) => (
          <TouchableOpacity
            key={i} onPress={() => onRemove(i)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${colors.primary}18`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}
          >
            <Text style={{ color: colors.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>{tag}</Text>
            <Ionicons name="close" size={12} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

interface FormValues {
  name: string; tin: string; industry: string; description: string;
  address: string; phone: string; website: string;
  specialties: string[];
}

export const CompanyEditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: company, isLoading: cLoading } = useCompanyProfile();
  const updateCompany = useUpdateCompanyProfile();

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '', tin: '', industry: '', description: '',
      address: '', phone: '', website: '', specialties: [],
    },
  });

  useEffect(() => {
    if (!company) return;
    reset({
      name:        company.name        ?? '',
      tin:         company.tin         ?? '',
      industry:    company.industry    ?? '',
      description: company.description ?? '',
      address:     company.address     ?? '',
      phone:       company.phone       ?? '',
      website:     company.website     ?? '',
      specialties: [],
    });
  }, [company, reset]);

  const isSaving  = updateCompany.isPending;
  const isLoading = pLoading || cLoading;
  const specialties = watch('specialties');

  const onSave = useCallback(
    handleSubmit(async (values) => {
      try {
        await updateCompany.mutateAsync({
          name:        values.name        || undefined,
          tin:         values.tin         || undefined,
          industry:    values.industry    || undefined,
          description: values.description || undefined,
          address:     values.address     || undefined,
          phone:       values.phone       || undefined,
          website:     values.website     || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ['company', 'profileGate'] });
        navigation.goBack();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      }
    }),
    [handleSubmit, updateCompany, navigation, queryClient],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* In-flow header */}
        <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="close-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.md }}>Edit Company</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.65 : 1 }]}
            onPress={onSave}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Text style={{ color: colors.textInverse, fontSize: FONT_SIZE.base, fontWeight: '700' }}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <ProfileImageUploader
              currentAvatarUrl={avatarUrl}
              currentCoverUrl={coverUrl}
              accentColor={colors.primary}
              type="both"
              avatarShape="square"
            />
          </View>

          <View style={{ padding: spacing.lg, gap: 14 }}>
            {/* Company info */}
            <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>COMPANY INFO</Text>
              <Controller control={control} name="name"
                render={({ field }) => (
                  <LabeledInput label="Company Name *" value={field.value} onChangeText={field.onChange}
                    placeholder="Your company name" colors={colors} />
                )} />
              <Controller control={control} name="tin"
                render={({ field }) => (
                  <LabeledInput label="TIN Number" value={field.value} onChangeText={field.onChange}
                    placeholder="10-digit TIN" keyboardType="number-pad" maxLength={10} colors={colors} />
                )} />
              <Controller control={control} name="industry"
                render={({ field }) => (
                  <LabeledInput label="Industry" value={field.value} onChangeText={field.onChange}
                    placeholder="e.g. Technology, Finance" colors={colors} />
                )} />
              <Controller control={control} name="description"
                render={({ field }) => (
                  <LabeledInput label="Description" value={field.value} onChangeText={field.onChange}
                    placeholder="Describe your company..." multiline numberOfLines={5}
                    maxLength={1000} colors={colors} />
                )} />
            </View>

            {/* Contact */}
            <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CONTACT</Text>
              <Controller control={control} name="phone"
                render={({ field }) => (
                  <LabeledInput label="Phone" value={field.value} onChangeText={field.onChange}
                    placeholder="+1 555 000 0000" keyboardType="phone-pad" colors={colors} />
                )} />
              <Controller control={control} name="website"
                render={({ field }) => (
                  <LabeledInput label="Website" value={field.value} onChangeText={field.onChange}
                    placeholder="https://yourcompany.com" keyboardType="url" colors={colors} />
                )} />
              <Controller control={control} name="address"
                render={({ field }) => (
                  <LabeledInput label="Address" value={field.value} onChangeText={field.onChange}
                    placeholder="Company address" colors={colors} />
                )} />
            </View>

            {/* Specialties */}
            <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SPECIALTIES</Text>
              <TagEditor
                tags={specialties}
                onAdd={t => setValue('specialties', [...specialties, t])}
                onRemove={i => setValue('specialties', specialties.filter((_, idx) => idx !== i))}
                placeholder="e.g. Cloud Computing, AI, SaaS..."
                colors={colors}
              />
            </View>

            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    minWidth: 68, alignItems: 'center',
  },
  section:      { borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },
});