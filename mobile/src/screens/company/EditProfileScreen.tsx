/**
 * src/screens/company/EditProfileScreen.tsx
 *
 * Full-featured edit form saving to:
 *   - companyService.updateMyCompany() → PUT /company/me (Company model)
 *   - profileService (avatar/cover) → POST /profile/avatar, POST /profile/cover
 * 
 * All fields matching Company.js model + Profile.js avatar/cover
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

import { useProfile, useCompanyProfile } from '../../hooks/useProfile';
import { companyService } from '../../services/companyService';
import { ProfileImageUploader } from '../../components/shared/ProfileImageUploader';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { toast } from '../../lib/toast';
import { useTheme } from '../../hooks/useTheme';
import { FONT_SIZE } from '../../theme/tokens';

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPANY_SIZES = [
  { label: '1-10', value: '1-10' },
  { label: '11-50', value: '11-50' },
  { label: '51-200', value: '51-200' },
  { label: '201-500', value: '201-500' },
  { label: '501-1000', value: '501-1000' },
  { label: '1000+', value: '1000+' },
];

const COMPANY_TYPES = [
  { label: 'Startup', value: 'startup' },
  { label: 'SME', value: 'sme' },
  { label: 'Enterprise', value: 'enterprise' },
  { label: 'Agency', value: 'agency' },
  { label: 'Other', value: 'other' },
];

const VISIBILITY_OPTIONS = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
];

// ── LabeledInput ──────────────────────────────────────────────────────────────

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  maxLength?: number;
  required?: boolean;
  optional?: boolean;
  colors: any;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  label, value, onChangeText, placeholder,
  multiline, numberOfLines, keyboardType, maxLength, required, optional, colors,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={li.wrap}>
      <View style={li.labelRow}>
        <Text style={[li.label, { color: colors.textMuted }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
        {optional && <Text style={[li.optional, { color: colors.textMuted }]}>Optional</Text>}
      </View>
      <TextInput
        style={[
          li.input,
          {
            backgroundColor: colors.inputBg ?? colors.bgCard,
            borderColor: focused ? colors.primary : colors.border,
            color: colors.text,
            height: multiline ? Math.max(44, (numberOfLines ?? 4) * 24) : 48,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingTop: multiline ? 12 : 0,
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
      {maxLength ? (
        <Text style={[li.counter, { color: value.length > maxLength * 0.9 ? colors.danger : colors.textMuted }]}>
          {value.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
};

const li = StyleSheet.create({
  wrap: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
  optional: { fontSize: 10, fontWeight: '500', fontStyle: 'italic' },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: FONT_SIZE.base ?? 14 },
  counter: { fontSize: 11, textAlign: 'right', marginTop: 4 },
});

// ── Pill Selector ─────────────────────────────────────────────────────────────

const PillSelector: React.FC<{
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  colors: any;
  accentColor: string;
}> = ({ label, options, value, onChange, colors, accentColor }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={[li.label, { color: colors.textMuted, marginBottom: 8 }]}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              pill.base,
              { backgroundColor: isSelected ? accentColor : colors.bgCard, borderColor: isSelected ? accentColor : colors.border },
            ]}
          >
            <Text style={[pill.text, { color: isSelected ? '#fff' : colors.textMuted }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const pill = StyleSheet.create({
  base: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  text: { fontSize: 13, fontWeight: '600' },
});

// ── TagEditor ─────────────────────────────────────────────────────────────────

const TagEditor: React.FC<{
  label?: string;
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (i: number) => void;
  placeholder?: string;
  accentColor: string;
  colors: any;
}> = ({ label, tags, onAdd, onRemove, placeholder = 'Add item…', accentColor, colors }) => {
  const [input, setInput] = useState('');
  const commit = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) { onAdd(trimmed); setInput(''); }
  };
  return (
    <View style={{ gap: 10, marginBottom: 16 }}>
      {label && <Text style={[li.label, { color: colors.textMuted }]}>{label}</Text>}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={[li.input, { flex: 1, height: 48, backgroundColor: colors.inputBg ?? colors.bgCard, borderColor: colors.border, color: colors.text, textAlignVertical: 'center' }]}
          value={input} onChangeText={setInput} placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder ?? colors.textMuted}
          returnKeyType="done" onSubmitEditing={commit} maxLength={100}
        />
        <TouchableOpacity onPress={commit} style={[te.addBtn, { backgroundColor: accentColor }]} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View style={te.chips}>
          {tags.map((tag, i) => (
            <TouchableOpacity
              key={i} onPress={() => onRemove(i)}
              style={[te.chip, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]} activeOpacity={0.75}
            >
              <Text style={[te.chipText, { color: accentColor }]}>{tag}</Text>
              <Ionicons name="close" size={12} color={accentColor} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const te = StyleSheet.create({
  addBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
});

// ── Toggle Row ────────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  label: string; description?: string; value: boolean;
  onToggle: (v: boolean) => void; colors: any; accentColor: string;
}> = ({ label, description, value, onToggle, colors, accentColor }) => (
  <View style={toggle.wrap}>
    <View style={{ flex: 1 }}>
      <Text style={[toggle.label, { color: colors.text }]}>{label}</Text>
      {description && <Text style={[toggle.desc, { color: colors.textMuted }]}>{description}</Text>}
    </View>
    <Switch
      value={value} onValueChange={onToggle}
      trackColor={{ false: colors.border, true: `${accentColor}60` }}
      thumbColor={value ? accentColor : colors.textMuted}
    />
  </View>
);

const toggle = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  label: { fontSize: 14, fontWeight: '600' },
  desc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});

// ── Section Card ──────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; children: React.ReactNode; colors: any }> = ({ title, children, colors }) => (
  <View style={[card.wrap, { backgroundColor: colors.bgCard }]}>
    <Text style={[card.title, { color: colors.textMuted }]}>{title}</Text>
    {children}
  </View>
);

const card = StyleSheet.create({
  wrap: { borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 16 },
});

// ── Form Values ───────────────────────────────────────────────────────────────

interface FormValues {
  name: string;
  tin: string;
  industry: string;
  description: string;
  headline: string;
  mission: string;
  culture: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  companySize: string;
  foundedYear: string;
  companyType: string;
  specialties: string[];
  tags: string[];
  values: string[];
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  allowMessages: boolean;
  showContactInfo: boolean;
  allowFollows: boolean;
  profileVisibility: string;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export const CompanyEditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const creationAttemptedRef = useRef(false);

  const { data: profile, isLoading: pLoading } = useProfile();
  const { data: company, isLoading: cLoading, refetch: refetchCompany } = useCompanyProfile();
  const [isCreating, setIsCreating] = useState(false);

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '', tin: '', industry: '', description: '',
      headline: '', mission: '', culture: '',
      address: '', phone: '', website: '', email: '',
      companySize: '11-50', foundedYear: '', companyType: 'sme',
      specialties: [], tags: [], values: [],
      linkedin: '', twitter: '', facebook: '', instagram: '',
      allowMessages: true, showContactInfo: true, allowFollows: true,
      profileVisibility: 'public',
    },
  });

  // ── Auto-create minimal company if none exists ──────────────────────────
  useEffect(() => {
    if (!cLoading && !company && !isCreating && !creationAttemptedRef.current && profile) {
      creationAttemptedRef.current = true;
      setIsCreating(true);
      (async () => {
        try {
          const defaultName = profile.user?.name ? `${profile.user.name}'s Company` : 'My Company';
          const newCompany = await companyService.createCompany({ name: defaultName });
          await refetchCompany();
          await queryClient.invalidateQueries({ queryKey: ['company', 'profileGate'] });
          populateForm(newCompany);
        } catch (error: any) {
          const msg = error?.response?.data?.message || error?.message || 'Failed to create company';
          if (error?.response?.status === 400 && msg.includes('already exists')) {
            await refetchCompany();
          } else {
            toast.error(msg);
          }
        } finally {
          setIsCreating(false);
        }
      })();
      return;
    }
    if (company) populateForm(company);
  }, [company, cLoading, profile]);

  const populateForm = (c: any) => {
    reset({
      name: c.name ?? '',
      tin: c.tin ?? '',
      industry: c.industry ?? '',
      description: c.description ?? '',
      headline: c.headline ?? '',
      mission: c.mission ?? '',
      culture: c.culture ?? '',
      address: c.address ?? '',
      phone: c.phone ?? '',
      website: c.website ?? '',
      email: c.email ?? '',
      companySize: c.companySize ?? '11-50',
      foundedYear: c.foundedYear?.toString() ?? '',
      companyType: c.companyType ?? 'sme',
      specialties: c.specialties ?? [],
      tags: c.tags ?? [],
      values: c.values ?? [],
      linkedin: c.socialLinks?.linkedin ?? '',
      twitter: c.socialLinks?.twitter ?? '',
      facebook: c.socialLinks?.facebook ?? '',
      instagram: c.socialLinks?.instagram ?? '',
      allowMessages: c.settings?.allowMessages ?? true,
      showContactInfo: c.settings?.showContactInfo ?? true,
      allowFollows: c.settings?.allowFollows ?? true,
      profileVisibility: c.settings?.profileVisibility ?? 'public',
    });
  };

  const isSaving = isCreating;
  const isLoading = pLoading || cLoading || isCreating;

  const companySize = watch('companySize');
  const companyType = watch('companyType');
  const profileVisibility = watch('profileVisibility');
  const specialties = watch('specialties');
  const tags = watch('tags');
  const values = watch('values');
  const allowMessages = watch('allowMessages');
  const showContactInfo = watch('showContactInfo');
  const allowFollows = watch('allowFollows');

  const onSave = useCallback(
    handleSubmit(async (formValues) => {
      try {
        // Build socialLinks object
        const socialLinks: any = {};
        if (formValues.linkedin?.trim()) socialLinks.linkedin = formValues.linkedin.trim();
        if (formValues.twitter?.trim()) socialLinks.twitter = formValues.twitter.trim();
        if (formValues.facebook?.trim()) socialLinks.facebook = formValues.facebook.trim();
        if (formValues.instagram?.trim()) socialLinks.instagram = formValues.instagram.trim();

        const payload = {
          name: formValues.name?.trim() || undefined,
          tin: formValues.tin?.trim() || undefined,
          industry: formValues.industry?.trim() || undefined,
          description: formValues.description?.trim() || undefined,
          headline: formValues.headline?.trim() || undefined,
          mission: formValues.mission?.trim() || undefined,
          culture: formValues.culture?.trim() || undefined,
          address: formValues.address?.trim() || undefined,
          phone: formValues.phone?.trim() || undefined,
          website: formValues.website?.trim() || undefined,
          email: formValues.email?.trim() || undefined,
          companySize: formValues.companySize,
          foundedYear: formValues.foundedYear ? parseInt(formValues.foundedYear, 10) : undefined,
          companyType: formValues.companyType,
          specialties: formValues.specialties.length > 0 ? formValues.specialties : undefined,
          tags: formValues.tags.length > 0 ? formValues.tags : undefined,
          values: formValues.values.length > 0 ? formValues.values : undefined,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
          settings: {
            allowMessages: formValues.allowMessages,
            showContactInfo: formValues.showContactInfo,
            allowFollows: formValues.allowFollows,
            profileVisibility: formValues.profileVisibility,
          },
        };

        await companyService.updateMyCompany(payload);
        await queryClient.invalidateQueries({ queryKey: ['company', 'profileGate'] });
        toast.success('Company profile saved!');
        navigation.goBack();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      }
    }),
    [handleSubmit, navigation, queryClient],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
          {isCreating && (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 13 }}>Setting up your company profile...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile?.avatar?.secure_url ?? profile?.user?.avatar ?? null;
  const coverUrl = profile?.cover?.secure_url ?? null;
  const accentColor = colors.primary;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.text }]}>Edit Company</Text>
          <TouchableOpacity onPress={onSave} disabled={isSaving} style={[s.saveBtn, { backgroundColor: accentColor, opacity: isSaving ? 0.6 : 1 }]}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[s.saveBtnText, { color: '#fff' }]}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Branding */}
          <SectionCard title="COMPANY BRANDING" colors={colors}>
            <ProfileImageUploader currentAvatarUrl={avatarUrl} currentCoverUrl={coverUrl} accentColor={accentColor} type="both" avatarShape="square" />
          </SectionCard>

          {/* Company Info */}
          <SectionCard title="COMPANY INFO" colors={colors}>
            <Controller control={control} name="name" render={({ field }) => <LabeledInput label="Company Name" required value={field.value} onChangeText={field.onChange} placeholder="Your company name" colors={colors} />} />
            <Controller control={control} name="tin" render={({ field }) => <LabeledInput label="TIN Number" optional value={field.value} onChangeText={field.onChange} placeholder="10-digit TIN" keyboardType="number-pad" maxLength={10} colors={colors} />} />
            <Controller control={control} name="industry" render={({ field }) => <LabeledInput label="Industry" optional value={field.value} onChangeText={field.onChange} placeholder="e.g. Technology, Finance, Healthcare" colors={colors} />} />
            <Controller control={control} name="headline" render={({ field }) => <LabeledInput label="Headline" optional value={field.value} onChangeText={field.onChange} placeholder="A short tagline for your company" maxLength={200} colors={colors} />} />
            <Controller control={control} name="description" render={({ field }) => <LabeledInput label="Description" optional value={field.value} onChangeText={field.onChange} placeholder="Describe your company…" multiline numberOfLines={5} maxLength={1000} colors={colors} />} />
            <Controller control={control} name="mission" render={({ field }) => <LabeledInput label="Mission Statement" optional value={field.value} onChangeText={field.onChange} placeholder="Our mission is to..." multiline numberOfLines={3} maxLength={500} colors={colors} />} />
            <Controller control={control} name="culture" render={({ field }) => <LabeledInput label="Company Culture" optional value={field.value} onChangeText={field.onChange} placeholder="Describe your company culture..." multiline numberOfLines={4} maxLength={1000} colors={colors} />} />
          </SectionCard>

          {/* Company Details */}
          <SectionCard title="COMPANY DETAILS" colors={colors}>
            <PillSelector label="Company Size" options={COMPANY_SIZES} value={companySize} onChange={(v) => setValue('companySize', v)} colors={colors} accentColor={accentColor} />
            <PillSelector label="Company Type" options={COMPANY_TYPES} value={companyType} onChange={(v) => setValue('companyType', v)} colors={colors} accentColor={accentColor} />
            <Controller control={control} name="foundedYear" render={({ field }) => <LabeledInput label="Founded Year" optional value={field.value} onChangeText={field.onChange} placeholder="e.g. 2020" keyboardType="number-pad" maxLength={4} colors={colors} />} />
          </SectionCard>

          {/* Contact */}
          <SectionCard title="CONTACT" colors={colors}>
            <Controller control={control} name="email" render={({ field }) => <LabeledInput label="Email" optional value={field.value} onChangeText={field.onChange} placeholder="contact@company.com" keyboardType="email-address" colors={colors} />} />
            <Controller control={control} name="phone" render={({ field }) => <LabeledInput label="Phone" optional value={field.value} onChangeText={field.onChange} placeholder="+251 91 000 0000" keyboardType="phone-pad" colors={colors} />} />
            <Controller control={control} name="website" render={({ field }) => <LabeledInput label="Website" optional value={field.value} onChangeText={field.onChange} placeholder="https://yourcompany.com" keyboardType="url" colors={colors} />} />
            <Controller control={control} name="address" render={({ field }) => <LabeledInput label="Address" optional value={field.value} onChangeText={field.onChange} placeholder="Company headquarters address" colors={colors} />} />
          </SectionCard>

          {/* Social Links */}
          <SectionCard title="SOCIAL LINKS" colors={colors}>
            <Controller control={control} name="linkedin" render={({ field }) => <LabeledInput label="LinkedIn" optional value={field.value} onChangeText={field.onChange} placeholder="https://linkedin.com/company/yourcompany" keyboardType="url" colors={colors} />} />
            <Controller control={control} name="twitter" render={({ field }) => <LabeledInput label="Twitter / X" optional value={field.value} onChangeText={field.onChange} placeholder="https://twitter.com/yourcompany" keyboardType="url" colors={colors} />} />
            <Controller control={control} name="facebook" render={({ field }) => <LabeledInput label="Facebook" optional value={field.value} onChangeText={field.onChange} placeholder="https://facebook.com/yourcompany" keyboardType="url" colors={colors} />} />
            <Controller control={control} name="instagram" render={({ field }) => <LabeledInput label="Instagram" optional value={field.value} onChangeText={field.onChange} placeholder="https://instagram.com/yourcompany" keyboardType="url" colors={colors} />} />
          </SectionCard>

          {/* Specialties */}
          <SectionCard title="SPECIALTIES" colors={colors}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>Add areas of expertise that describe your company. Tap a tag to remove it.</Text>
            <TagEditor tags={specialties} onAdd={t => setValue('specialties', [...specialties, t])} onRemove={i => setValue('specialties', specialties.filter((_, idx) => idx !== i))} placeholder="e.g. Cloud Computing, AI, SaaS…" accentColor={accentColor} colors={colors} />
          </SectionCard>

          {/* Values */}
          <SectionCard title="COMPANY VALUES" colors={colors}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>Add your company's core values.</Text>
            <TagEditor tags={values} onAdd={t => setValue('values', [...values, t])} onRemove={i => setValue('values', values.filter((_, idx) => idx !== i))} placeholder="e.g. Innovation, Integrity, Teamwork…" accentColor={accentColor} colors={colors} />
          </SectionCard>

          {/* Tags */}
          <SectionCard title="TAGS" colors={colors}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>Add searchable tags for your company.</Text>
            <TagEditor tags={tags} onAdd={t => setValue('tags', [...tags, t])} onRemove={i => setValue('tags', tags.filter((_, idx) => idx !== i))} placeholder="e.g. B2B, SaaS, Remote…" accentColor={accentColor} colors={colors} />
          </SectionCard>

          {/* Settings */}
          <SectionCard title="SETTINGS" colors={colors}>
            <ToggleRow label="Allow Messages" description="Let other users send you messages" value={allowMessages} onToggle={(v) => setValue('allowMessages', v)} colors={colors} accentColor={accentColor} />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <ToggleRow label="Show Contact Info" description="Display your contact details publicly" value={showContactInfo} onToggle={(v) => setValue('showContactInfo', v)} colors={colors} accentColor={accentColor} />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <ToggleRow label="Allow Follows" description="Let users follow your company" value={allowFollows} onToggle={(v) => setValue('allowFollows', v)} colors={colors} accentColor={accentColor} />
            <View style={{ height: 16 }} />
            <PillSelector label="Profile Visibility" options={VISIBILITY_OPTIONS} value={profileVisibility} onChange={(v) => setValue('profileVisibility', v)} colors={colors} accentColor={accentColor} />
          </SectionCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerTitle: { fontSize: FONT_SIZE.md ?? 16, fontWeight: '700', letterSpacing: -0.2 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, minWidth: 64, alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  saveBtnText: { fontSize: FONT_SIZE.base ?? 14, fontWeight: '700' },
});