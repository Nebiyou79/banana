/**
 * screens/organization/EditProfileScreen.tsx
 *
 * Full-featured edit form with all Organization model fields:
 *  - Organization Info: name, registrationNumber, organizationType, industry
 *  - Content: description, mission
 *  - Contact: phone, secondaryPhone, website, email, address
 *  - Details: size, foundedYear, socialMedia links
 *  - Branding: logo + cover image
 *  - Values & Specialties
 *  - Settings: allowMessages, showContactInfo, jobAlerts
 *  - Auto-creates minimal org profile if none exists
 */
import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, TextInput,
  Switch, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';

import {
  useProfile, useOrganizationProfile, useUpdateOrganizationProfile,
} from '../../hooks/useProfile';
import { organizationService } from '../../services/organizationService';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { toast } from '../../lib/toast';
import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

const ACCENT = '#10B981';

// ── Constants ─────────────────────────────────────────────────────────────────

const ORG_TYPES = [
  { label: 'Non-Profit', value: 'non-profit' },
  { label: 'Government', value: 'government' },
  { label: 'Educational', value: 'educational' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Other', value: 'other' },
];

const ORG_SIZES = [
  { label: '1-10', value: '1-10' },
  { label: '11-50', value: '11-50' },
  { label: '51-200', value: '51-200' },
  { label: '201-500', value: '201-500' },
  { label: '501-1000', value: '501-1000' },
  { label: '1000+', value: '1000+' },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  optional: { fontSize: 10, fontWeight: '500', fontStyle: 'italic' },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14,
    height: 48, textAlignVertical: 'center',
  },
  inputMultiline: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingTop: 12,
    fontSize: 14, textAlignVertical: 'top',
  },
  counter: { fontSize: 11, textAlign: 'right', marginTop: 4 },
});

// ── LabeledInput ──────────────────────────────────────────────────────────────

const LabeledInput: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean; numberOfLines?: number;
  keyboardType?: any; maxLength?: number; required?: boolean; optional?: boolean;
  colors: any;
}> = ({ label, value, onChangeText, placeholder, multiline, numberOfLines, keyboardType, maxLength, required, optional, colors }) => {
  const [focused, setFocused] = useState(false);
  const inputStyle = multiline
    ? { ...inputStyles.inputMultiline, height: (numberOfLines ?? 4) * 24 }
    : inputStyles.input;
  
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={inputStyles.labelRow}>
        <Text style={[inputStyles.label, { color: colors.textMuted }]}>
          {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
        {optional && <Text style={[inputStyles.optional, { color: colors.textMuted }]}>Optional</Text>}
      </View>
      <TextInput
        style={[
          inputStyle,
          {
            backgroundColor: colors.inputBg ?? colors.bgCard,
            borderColor: focused ? ACCENT : colors.border,
            color: colors.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder ?? colors.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {maxLength && (
        <Text style={[inputStyles.counter, { color: value.length > maxLength * 0.9 ? colors.danger : colors.textMuted }]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

// ── Pill Selector ─────────────────────────────────────────────────────────────

const PillSelector: React.FC<{
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
  colors: any;
}> = ({ label, options, value, onChange, colors }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={[inputStyles.label, { color: colors.textMuted, marginBottom: 8 }]}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5,
              backgroundColor: isSelected ? ACCENT : colors.bgCard,
              borderColor: isSelected ? ACCENT : colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? '#fff' : colors.textMuted }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ── TagEditor ─────────────────────────────────────────────────────────────────

const TagEditor: React.FC<{
  label?: string; tags: string[]; onAdd: (t: string) => void;
  onRemove: (i: number) => void; placeholder?: string; colors: any;
}> = ({ label, tags, onAdd, onRemove, placeholder = 'Add...', colors }) => {
  const [input, setInput] = useState('');
  const commit = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) { onAdd(trimmed); setInput(''); }
  };
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={[inputStyles.label, { color: colors.textMuted, marginBottom: 8 }]}>{label}</Text>}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          style={[inputStyles.input, { flex: 1, backgroundColor: colors.inputBg ?? colors.bgCard, borderColor: colors.border, color: colors.text }]}
          value={input} onChangeText={setInput} placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder ?? colors.textMuted}
          returnKeyType="done" onSubmitEditing={commit} maxLength={50}
        />
        <TouchableOpacity
          style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}
          onPress={commit}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag, i) => (
          <TouchableOpacity
            key={i} onPress={() => onRemove(i)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: ACCENT + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: ACCENT + '30' }}
          >
            <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>{tag}</Text>
            <Ionicons name="close" size={12} color={ACCENT} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ── Toggle Row ────────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  label: string; description?: string; value: boolean;
  onToggle: (v: boolean) => void; colors: any;
}> = ({ label, description, value, onToggle, colors }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }}>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      {description && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.border, true: ACCENT + '60' }}
      thumbColor={value ? ACCENT : colors.textMuted}
    />
  </View>
);

// ── Section Card ──────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; children: React.ReactNode; colors: any }> = ({ title, children, colors }) => (
  <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
    {children}
  </View>
);

// ── Form Values ───────────────────────────────────────────────────────────────

interface FormValues {
  name: string;
  registrationNumber: string;
  organizationType: string;
  industry: string;
  description: string;
  mission: string;
  address: string;
  phone: string;
  secondaryPhone: string;
  website: string;
  email: string;
  size: string;
  foundedYear: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  values: string[];
  specialties: string[];
  allowMessages: boolean;
  showContactInfo: boolean;
  jobAlerts: boolean;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export const OrganizationEditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const creationAttemptedRef = useRef(false);

  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: org, isLoading: oLoading, refetch: refetchOrg } = useOrganizationProfile();
  const updateOrg = useUpdateOrganizationProfile();

  const [isCreating, setIsCreating] = useState(false);

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '', registrationNumber: '', organizationType: 'non-profit',
      industry: '', description: '', mission: '',
      address: '', phone: '', secondaryPhone: '', website: '', email: '',
      size: '', foundedYear: '',
      linkedin: '', twitter: '', facebook: '', instagram: '',
      values: [], specialties: [],
      allowMessages: true, showContactInfo: true, jobAlerts: true,
    },
  });

  // ── Auto-create minimal org if none exists ──────────────────────────────
  useEffect(() => {
    if (!oLoading && !org && !isCreating && !creationAttemptedRef.current && profile) {
      creationAttemptedRef.current = true;
      setIsCreating(true);

      const createMinimalOrg = async () => {
        try {
          const defaultName = profile.user?.name
            ? `${profile.user.name}'s Organization`
            : 'My Organization';

          const newOrg = await organizationService.createOrganization({
            name: defaultName,
            organizationType: 'non-profit',
          });

          await refetchOrg();
          await queryClient.invalidateQueries({ queryKey: ['org', 'profileGate'] });

          reset({
            name: newOrg.name ?? defaultName,
            registrationNumber: newOrg.registrationNumber ?? '',
            organizationType: newOrg.organizationType ?? 'non-profit',
            industry: newOrg.industry ?? '',
            description: newOrg.description ?? '',
            mission: newOrg.mission ?? '',
            address: newOrg.address ?? '',
            phone: newOrg.phone ?? '',
            secondaryPhone: newOrg.secondaryPhone ?? '',
            website: newOrg.website ?? '',
            email: newOrg.email ?? '',
            size: newOrg.size ?? '',
            foundedYear: newOrg.foundedYear?.toString() ?? '',
            linkedin: newOrg.socialMedia?.linkedin ?? '',
            twitter: newOrg.socialMedia?.twitter ?? '',
            facebook: newOrg.socialMedia?.facebook ?? '',
            instagram: newOrg.socialMedia?.instagram ?? '',
            values: newOrg.values ?? [],
            specialties: newOrg.specialties ?? [],
            allowMessages: newOrg.settings?.allowMessages ?? true,
            showContactInfo: newOrg.settings?.showContactInfo ?? true,
            jobAlerts: newOrg.settings?.jobAlerts ?? true,
          });
        } catch (error: any) {
          const errorMsg = error?.response?.data?.message || error?.message || 'Failed to create organization';
          if (error?.response?.status === 400 && errorMsg.includes('already exists')) {
            await refetchOrg();
          } else {
            toast.error(errorMsg);
          }
        } finally {
          setIsCreating(false);
        }
      };

      createMinimalOrg();
      return;
    }

    if (org) {
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
        email: org.email ?? '',
        size: org.size ?? '',
        foundedYear: org.foundedYear?.toString() ?? '',
        linkedin: org.socialMedia?.linkedin ?? '',
        twitter: org.socialMedia?.twitter ?? '',
        facebook: org.socialMedia?.facebook ?? '',
        instagram: org.socialMedia?.instagram ?? '',
        values: org.values ?? [],
        specialties: org.specialties ?? [],
        allowMessages: org.settings?.allowMessages ?? true,
        showContactInfo: org.settings?.showContactInfo ?? true,
        jobAlerts: org.settings?.jobAlerts ?? true,
      });
    }
  }, [org, oLoading, profile, reset, refetchOrg, queryClient, isCreating]);

  const isSaving = updateOrg.isPending || isCreating;
  const isLoading = pLoading || oLoading || isCreating;
  const orgType = watch('organizationType');
  const orgSize = watch('size');
  const values = watch('values');
  const specialties = watch('specialties');
  const allowMessages = watch('allowMessages');
  const showContactInfo = watch('showContactInfo');
  const jobAlerts = watch('jobAlerts');

  const onSave = useCallback(
    handleSubmit(async (formValues) => {
      try {
        const socialMedia: any = {};
        if (formValues.linkedin) socialMedia.linkedin = formValues.linkedin;
        if (formValues.twitter) socialMedia.twitter = formValues.twitter;
        if (formValues.facebook) socialMedia.facebook = formValues.facebook;
        if (formValues.instagram) socialMedia.instagram = formValues.instagram;

        const payload = {
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
          email: formValues.email || undefined,
          size: formValues.size || undefined,
          foundedYear: formValues.foundedYear ? parseInt(formValues.foundedYear, 10) : undefined,
          socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
          values: formValues.values.length > 0 ? formValues.values : undefined,
          specialties: formValues.specialties.length > 0 ? formValues.specialties : undefined,
          settings: {
            allowMessages: formValues.allowMessages,
            showContactInfo: formValues.showContactInfo,
            jobAlerts: formValues.jobAlerts,
          },
        };

        await updateOrg.mutateAsync(payload);
        await queryClient.invalidateQueries({ queryKey: ['org', 'profileGate'] });
        toast.success('Organization profile saved!');
        navigation.goBack();
      } catch (err: unknown) {
        const error = err as any;
        toast.error(error?.response?.data?.message || error?.message || 'Failed to save');
      }
    }),
    [handleSubmit, updateOrg, navigation, queryClient],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <SkeletonCard /><SkeletonCard />
          {isCreating && (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 13 }}>
                Setting up your organization profile...
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="close-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Edit Organization</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: ACCENT, opacity: isSaving ? 0.65 : 1 }]}
            onPress={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <SectionCard title="ORGANIZATION BRANDING" colors={colors}>
              <ProfileImageUploader
                currentAvatarUrl={avatarUrl}
                currentCoverUrl={coverUrl}
                accentColor={ACCENT}
                type="both"
                avatarShape="square"
              />
            </SectionCard>
          </View>

          <View style={{ padding: spacing.lg, gap: 14 }}>
            {/* Organization Info */}
            <SectionCard title="ORGANIZATION INFO" colors={colors}>
              <Controller control={control} name="name"
                render={({ field }) => (
                  <LabeledInput label="Organization Name" required value={field.value} onChangeText={field.onChange}
                    placeholder="Your organization name" colors={colors} />
                )} />
              <Controller control={control} name="registrationNumber"
                render={({ field }) => (
                  <LabeledInput label="Registration Number" optional value={field.value} onChangeText={field.onChange}
                    placeholder="Official reg. number" keyboardType="number-pad" maxLength={10} colors={colors} />
                )} />
              <Controller control={control} name="industry"
                render={({ field }) => (
                  <LabeledInput label="Industry / Sector" optional value={field.value} onChangeText={field.onChange}
                    placeholder="e.g. Education, Healthcare" colors={colors} />
                )} />
              <PillSelector
                label="Organization Type"
                options={ORG_TYPES}
                value={orgType}
                onChange={(v) => setValue('organizationType', v)}
                colors={colors}
              />
            </SectionCard>

            {/* Content */}
            <SectionCard title="CONTENT" colors={colors}>
              <Controller control={control} name="mission"
                render={({ field }) => (
                  <LabeledInput label="Mission Statement" optional value={field.value} onChangeText={field.onChange}
                    placeholder="Our mission is to..." multiline numberOfLines={3} maxLength={500} colors={colors} />
                )} />
              <Controller control={control} name="description"
                render={({ field }) => (
                  <LabeledInput label="Description" optional value={field.value} onChangeText={field.onChange}
                    placeholder="Tell people about your organization..." multiline numberOfLines={5} maxLength={1000} colors={colors} />
                )} />
            </SectionCard>

            {/* Contact */}
            <SectionCard title="CONTACT" colors={colors}>
              <Controller control={control} name="email"
                render={({ field }) => (
                  <LabeledInput label="Email" optional value={field.value} onChangeText={field.onChange}
                    placeholder="contact@organization.org" keyboardType="email-address" colors={colors} />
                )} />
              <Controller control={control} name="phone"
                render={({ field }) => (
                  <LabeledInput label="Primary Phone" optional value={field.value} onChangeText={field.onChange}
                    placeholder="+1 555 000 0000" keyboardType="phone-pad" colors={colors} />
                )} />
              <Controller control={control} name="secondaryPhone"
                render={({ field }) => (
                  <LabeledInput label="Secondary Phone" optional value={field.value} onChangeText={field.onChange}
                    placeholder="+1 555 000 0001" keyboardType="phone-pad" colors={colors} />
                )} />
              <Controller control={control} name="website"
                render={({ field }) => (
                  <LabeledInput label="Website" optional value={field.value} onChangeText={field.onChange}
                    placeholder="https://yourorg.org" keyboardType="url" colors={colors} />
                )} />
              <Controller control={control} name="address"
                render={({ field }) => (
                  <LabeledInput label="Address" optional value={field.value} onChangeText={field.onChange}
                    placeholder="Organization address" colors={colors} />
                )} />
            </SectionCard>

            {/* Details */}
            <SectionCard title="DETAILS" colors={colors}>
              <PillSelector
                label="Organization Size"
                options={ORG_SIZES}
                value={orgSize}
                onChange={(v) => setValue('size', v)}
                colors={colors}
              />
              <Controller control={control} name="foundedYear"
                render={({ field }) => (
                  <LabeledInput label="Founded Year" optional value={field.value} onChangeText={field.onChange}
                    placeholder="e.g. 2015" keyboardType="number-pad" maxLength={4} colors={colors} />
                )} />
            </SectionCard>

            {/* Social Links */}
            <SectionCard title="SOCIAL MEDIA" colors={colors}>
              <Controller control={control} name="linkedin"
                render={({ field }) => (
                  <LabeledInput label="LinkedIn" optional value={field.value} onChangeText={field.onChange}
                    placeholder="https://linkedin.com/company/yourorg" keyboardType="url" colors={colors} />
                )} />
              <Controller control={control} name="twitter"
                render={({ field }) => (
                  <LabeledInput label="Twitter / X" optional value={field.value} onChangeText={field.onChange}
                    placeholder="https://twitter.com/yourorg" keyboardType="url" colors={colors} />
                )} />
              <Controller control={control} name="facebook"
                render={({ field }) => (
                  <LabeledInput label="Facebook" optional value={field.value} onChangeText={field.onChange}
                    placeholder="https://facebook.com/yourorg" keyboardType="url" colors={colors} />
                )} />
              <Controller control={control} name="instagram"
                render={({ field }) => (
                  <LabeledInput label="Instagram" optional value={field.value} onChangeText={field.onChange}
                    placeholder="https://instagram.com/yourorg" keyboardType="url" colors={colors} />
                )} />
            </SectionCard>

            {/* Values */}
            <SectionCard title="VALUES" colors={colors}>
              <TagEditor
                tags={values}
                onAdd={t => setValue('values', [...values, t])}
                onRemove={i => setValue('values', values.filter((_, idx) => idx !== i))}
                placeholder="e.g. Integrity, Innovation..."
                colors={colors}
              />
            </SectionCard>

            {/* Specialties */}
            <SectionCard title="SPECIALTIES" colors={colors}>
              <TagEditor
                tags={specialties}
                onAdd={t => setValue('specialties', [...specialties, t])}
                onRemove={i => setValue('specialties', specialties.filter((_, idx) => idx !== i))}
                placeholder="e.g. Community Development, Grants..."
                colors={colors}
              />
            </SectionCard>

            {/* Settings */}
            <SectionCard title="SETTINGS" colors={colors}>
              <ToggleRow
                label="Allow Messages"
                description="Let other users send you messages"
                value={allowMessages}
                onToggle={(v) => setValue('allowMessages', v)}
                colors={colors}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <ToggleRow
                label="Show Contact Info"
                description="Display your contact details publicly"
                value={showContactInfo}
                onToggle={(v) => setValue('showContactInfo', v)}
                colors={colors}
              />
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <ToggleRow
                label="Job Alerts"
                description="Receive notifications about new opportunities"
                value={jobAlerts}
                onToggle={(v) => setValue('jobAlerts', v)}
                colors={colors}
              />
            </SectionCard>

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
  section: { borderRadius: 14, padding: 16 },
  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 14,
  },
});