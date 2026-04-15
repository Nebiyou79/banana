/**
 * EditProfileScreen.tsx
 *
 * Complete freelancer profile editor:
 *  - Avatar upload via ImagePicker → Cloudinary
 *  - All basic fields: name, headline, bio, location, phone, website
 *  - Professional: hourly rate, availability, experience level, English proficiency, timezone
 *  - Date of birth (calendar picker) + gender
 *  - Skills (add/remove)
 *  - Specializations (add/remove)
 *  - Social media links (all platforms from the backend model)
 *  - Full form validation with react-hook-form + inline errors
 *  - Sectioned scrollable layout with sticky Save header
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { uploadToCloudinary, optimizeCloudinaryUrl } from '../../utils/cloudinaryUpload';
import { DatePickerField } from '../../components/shared/DatePickerField';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

const ACCENT = '#10B981';

// ─── Select helper ─────────────────────────────────────────────────────────────

interface Option { label: string; value: string }

const InlineSelect: React.FC<{
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sm, fontWeight: '600', marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.optBtn,
              {
                backgroundColor: value === opt.value ? ACCENT : colors.surface,
                borderColor: value === opt.value ? ACCENT : colors.border,
              },
            ]}
          >
            <Text style={{ color: value === opt.value ? '#fff' : colors.text, fontSize: typography.xs, fontWeight: '600' }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ label: string; icon: keyof typeof Ionicons.glyphMap }> = ({ label, icon }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[styles.sectionTitle, { borderBottomColor: theme.colors.border }]}>
      <View style={[styles.sectionIconBox, { backgroundColor: ACCENT + '18' }]}>
        <Ionicons name={icon} size={14} color={ACCENT} />
      </View>
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: theme.typography.sm, marginLeft: 8 }}>
        {label}
      </Text>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

type FormValues = {
  name: string;
  headline: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  dateOfBirth: string;
  gender: string;
  hourlyRate: string;
  availability: string;
  experienceLevel: string;
  englishProficiency: string;
  timezone: string;
  // social links
  linkedin: string;
  github: string;
  twitter: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  telegram: string;
  youtube: string;
  whatsapp: string;
  discord: string;
  behance: string;
  dribbble: string;
  medium: string;
  devto: string;
  stackoverflow: string;
};

export const FreelancerEditProfileScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const fp = (profile as any)?.freelancerProfile ?? {};
  const rawSocial = fp?.socialLinks ?? (profile as any)?.socialLinks ?? {};

  // Local state for non-string fields
  const [skills, setSkills]           = useState<string[]>([]);
  const [specializations, setSpecs]   = useState<string[]>([]);
  const [skillInput, setSkillInput]   = useState('');
  const [specInput, setSpecInput]     = useState('');
  const [avatarUri, setAvatarUri]     = useState<string>(
    profile?.avatar?.secure_url ?? (profile as any)?.user?.avatar ?? ''
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name:               user?.name ?? '',
      headline:           fp?.headline ?? '',
      bio:                (profile as any)?.bio ?? '',
      location:           (profile as any)?.location ?? '',
      phone:              (profile as any)?.phone ?? '',
      website:            (profile as any)?.website ?? '',
      dateOfBirth:        (profile as any)?.dateOfBirth?.split('T')[0] ?? '',
      gender:             (profile as any)?.gender ?? 'prefer-not-to-say',
      hourlyRate:         fp?.hourlyRate?.toString() ?? '',
      availability:       fp?.availability ?? 'available',
      experienceLevel:    fp?.experienceLevel ?? 'intermediate',
      englishProficiency: fp?.englishProficiency ?? 'conversational',
      timezone:           fp?.timezone ?? '',
      linkedin:           rawSocial.linkedin ?? '',
      github:             rawSocial.github ?? '',
      twitter:            rawSocial.twitter ?? '',
      instagram:          rawSocial.instagram ?? '',
      facebook:           rawSocial.facebook ?? '',
      tiktok:             rawSocial.tiktok ?? '',
      telegram:           rawSocial.telegram ?? '',
      youtube:            rawSocial.youtube ?? '',
      whatsapp:           rawSocial.whatsapp ?? '',
      discord:            rawSocial.discord ?? '',
      behance:            rawSocial.behance ?? '',
      dribbble:           rawSocial.dribbble ?? '',
      medium:             rawSocial.medium ?? '',
      devto:              rawSocial.devto ?? '',
      stackoverflow:      rawSocial.stackoverflow ?? '',
    },
  });

  // Populate dynamic fields once profile loads
  useEffect(() => {
    if (!profile) return;
    const rawSkills = (profile as any)?.skills ?? [];
    setSkills(rawSkills.map((s: string | { name: string }) => (typeof s === 'string' ? s : s.name)));
    setSpecs(fp?.specialization ?? []);
    setAvatarUri(profile?.avatar?.secure_url ?? (profile as any)?.user?.avatar ?? '');
  }, [profile]);

  // ─── Avatar upload ──────────────────────────────────────────────────────────

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri); // show immediately
    setUploadingAvatar(true);
    try {
      const [uploaded] = await uploadToCloudinary([localUri], 'avatars');
      setAvatarUri(uploaded.url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      Alert.alert('Avatar upload failed', msg);
      setAvatarUri(profile?.avatar?.secure_url ?? (profile as any)?.user?.avatar ?? '');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ─── Skills & specs ─────────────────────────────────────────────────────────

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const addSpec = () => {
    const s = specInput.trim();
    if (s && !specializations.includes(s)) setSpecs(prev => [...prev, s]);
    setSpecInput('');
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const onSave = handleSubmit(data => {
    const payload: Record<string, unknown> = {
      name:             data.name,
      bio:              data.bio,
      location:         data.location,
      phone:            data.phone,
      website:          data.website,
      dateOfBirth:      data.dateOfBirth || undefined,
      gender:           data.gender,
      skills:           skills.map(s => ({ name: s, level: 'intermediate', yearsOfExperience: 1 })),
      avatar:           avatarUri.includes('cloudinary.com') ? avatarUri : undefined,
      freelancerProfile: {
        headline:           data.headline,
        hourlyRate:         data.hourlyRate ? Number(data.hourlyRate) : 0,
        availability:       data.availability,
        experienceLevel:    data.experienceLevel,
        englishProficiency: data.englishProficiency,
        timezone:           data.timezone,
        specialization:     specializations,
        socialLinks: {
          linkedin:      data.linkedin  || undefined,
          github:        data.github    || undefined,
          twitter:       data.twitter   || undefined,
          instagram:     data.instagram || undefined,
          facebook:      data.facebook  || undefined,
          tiktok:        data.tiktok    || undefined,
          telegram:      data.telegram  || undefined,
          youtube:       data.youtube   || undefined,
          whatsapp:      data.whatsapp  || undefined,
          discord:       data.discord   || undefined,
          behance:       data.behance   || undefined,
          dribbble:      data.dribbble  || undefined,
          medium:        data.medium    || undefined,
          devto:         data.devto     || undefined,
          stackoverflow: data.stackoverflow || undefined,
        },
      },
    };

    // Validate age (min 16)
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 16) {
        Alert.alert('Invalid Date of Birth', 'You must be at least 16 years old.');
        return;
      }
    }

    updateProfile.mutate(payload, { onSuccess: () => navigation.goBack() });
  });

  // ─── Field component shorthand ──────────────────────────────────────────────

  const Field: React.FC<{
    name: keyof FormValues;
    label: string;
    placeholder?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'url' | 'email-address';
    required?: boolean;
  }> = ({ name, label, placeholder, icon, multiline = false, keyboardType = 'default', required = false }) => (
    <Controller
      control={control}
      name={name}
      rules={required ? { required: `${label} is required` } : undefined}
      render={({ field: { value, onChange } }) => (
        <View style={{ marginBottom: spacing[4] }}>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sm, fontWeight: '600', marginBottom: 6 }}>
            {label}{required && <Text style={{ color: colors.error }}> *</Text>}
          </Text>
          <View style={[
            styles.inputBox,
            {
              backgroundColor: colors.surface,
              borderColor: errors[name] ? colors.error : colors.border,
              minHeight: multiline ? 90 : 50,
            },
          ]}>
            {icon && <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: 8 }} />}
            <TextInputField
              value={value}
              onChangeText={onChange}
              placeholder={placeholder ?? ''}
              placeholderTextColor={colors.placeholder}
              multiline={multiline}
              keyboardType={keyboardType}
              style={[
                styles.inputText,
                { color: colors.text, textAlignVertical: multiline ? 'top' : 'center', paddingTop: multiline ? 8 : 0 },
              ]}
            />
          </View>
          {errors[name] && (
            <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 3 }}>
              {errors[name]?.message}
            </Text>
          )}
        </View>
      )}
    />
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Sticky header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.lg }}>Edit Profile</Text>
        <TouchableOpacity
          onPress={onSave}
          disabled={updateProfile.isPending}
          style={[styles.saveBtn, { backgroundColor: ACCENT }]}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ──────────────────────────────────────────────── */}
        <SectionTitle label="Profile Photo" icon="camera-outline" />
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: optimizeCloudinaryUrl(avatarUri, 200, 200) }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarImg, { backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="person-outline" size={36} color={ACCENT} />
            </View>
          )}
          <View style={[styles.avatarEditOverlay, { backgroundColor: uploadingAvatar ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)' }]}>
            {uploadingAvatar
              ? <ActivityIndicator color="#fff" />
              : <Ionicons name="camera" size={22} color="#fff" />}
          </View>
        </TouchableOpacity>
        <Text style={{ color: colors.textMuted, fontSize: typography.xs, textAlign: 'center', marginBottom: spacing[5] }}>
          {uploadingAvatar ? 'Uploading to Cloudinary…' : 'Tap to change photo'}
        </Text>

        {/* ── Basic Info ──────────────────────────────────────────── */}
        <SectionTitle label="Basic Information" icon="person-outline" />
        <Field name="name"     label="Full Name"     placeholder="Your full name"         icon="person-outline"   required />
        <Field name="headline" label="Headline"      placeholder="e.g. Full-Stack Developer · React Native" icon="briefcase-outline" />
        <Field name="bio"      label="Professional Bio" placeholder="Describe your expertise, what you offer, and your experience…" multiline />
        <Field name="location" label="Location"      placeholder="City, Country"          icon="location-outline" />

        {/* Date of birth + gender */}
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { value, onChange } }) => (
            <DatePickerField
              label="Date of Birth"
              value={value}
              onChange={onChange}
              maxDate={new Date(Date.now() - 16 * 365.25 * 24 * 60 * 60 * 1000)}
              placeholder="Select date of birth"
              optional
            />
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field: { value, onChange } }) => (
            <InlineSelect
              label="Gender"
              value={value}
              options={[
                { label: 'Male',   value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other',  value: 'other' },
                { label: 'Prefer not to say', value: 'prefer-not-to-say' },
              ]}
              onChange={onChange}
            />
          )}
        />

        {/* ── Contact ────────────────────────────────────────────── */}
        <SectionTitle label="Contact Details" icon="call-outline" />
        <Field name="phone"   label="Phone Number"    placeholder="+1 555 000 0000"         icon="call-outline"   keyboardType="phone-pad" />
        <Field name="website" label="Website / Portfolio" placeholder="https://yoursite.com" icon="globe-outline"  keyboardType="url" />

        {/* ── Professional ───────────────────────────────────────── */}
        <SectionTitle label="Professional Details" icon="star-outline" />
        <Field name="hourlyRate" label="Hourly Rate (USD)" placeholder="e.g. 35" icon="pricetag-outline" keyboardType="numeric" />

        <Controller
          control={control}
          name="availability"
          render={({ field: { value, onChange } }) => (
            <InlineSelect
              label="Availability"
              value={value}
              options={[
                { label: '✅ Full-Time', value: 'available' },
                { label: '⏰ Part-Time', value: 'part-time' },
                { label: '🔴 Unavailable', value: 'not-available' },
              ]}
              onChange={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="experienceLevel"
          render={({ field: { value, onChange } }) => (
            <InlineSelect
              label="Experience Level"
              value={value}
              options={[
                { label: 'Entry (0–2 yrs)',    value: 'entry' },
                { label: 'Mid (2–5 yrs)',      value: 'intermediate' },
                { label: 'Expert (5+ yrs)',    value: 'expert' },
              ]}
              onChange={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="englishProficiency"
          render={({ field: { value, onChange } }) => (
            <InlineSelect
              label="English Proficiency"
              value={value}
              options={[
                { label: 'Basic',          value: 'basic' },
                { label: 'Conversational', value: 'conversational' },
                { label: 'Fluent',         value: 'fluent' },
                { label: 'Native',         value: 'native' },
              ]}
              onChange={onChange}
            />
          )}
        />

        <Field name="timezone" label="Timezone" placeholder="e.g. UTC+3, EST, GMT" icon="time-outline" />

        {/* ── Skills ─────────────────────────────────────────────── */}
        <SectionTitle label="Skills" icon="flash-outline" />
        <View style={[styles.tagInputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInputField
            value={skillInput}
            onChangeText={setSkillInput}
            placeholder="Add a skill…"
            placeholderTextColor={colors.placeholder}
            style={[styles.tagInput, { color: colors.text }]}
            returnKeyType="done"
            onSubmitEditing={addSkill}
          />
          <TouchableOpacity onPress={addSkill} style={[styles.addTagBtn, { backgroundColor: ACCENT }]}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.tagWrap}>
          {skills.map(sk => (
            <TouchableOpacity
              key={sk}
              onPress={() => setSkills(prev => prev.filter(x => x !== sk))}
              style={[styles.tag, { backgroundColor: '#6366F118', borderColor: '#6366F130' }]}
            >
              <Text style={{ color: '#6366F1', fontSize: typography.xs, fontWeight: '600' }}>{sk}</Text>
              <Ionicons name="close" size={10} color="#6366F1" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Specializations ────────────────────────────────────── */}
        <SectionTitle label="Specializations" icon="layers-outline" />
        <View style={[styles.tagInputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInputField
            value={specInput}
            onChangeText={setSpecInput}
            placeholder="Add a specialization…"
            placeholderTextColor={colors.placeholder}
            style={[styles.tagInput, { color: colors.text }]}
            returnKeyType="done"
            onSubmitEditing={addSpec}
          />
          <TouchableOpacity onPress={addSpec} style={[styles.addTagBtn, { backgroundColor: ACCENT }]}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.tagWrap}>
          {specializations.map(sp => (
            <TouchableOpacity
              key={sp}
              onPress={() => setSpecs(prev => prev.filter(x => x !== sp))}
              style={[styles.tag, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}
            >
              <Text style={{ color: ACCENT, fontSize: typography.xs, fontWeight: '600' }}>{sp}</Text>
              <Ionicons name="close" size={10} color={ACCENT} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Social Links ────────────────────────────────────────── */}
        <SectionTitle label="Social & Professional Links" icon="share-social-outline" />

        {(
          [
            { name: 'linkedin' as const,      label: 'LinkedIn',       icon: 'logo-linkedin'   as const },
            { name: 'github' as const,        label: 'GitHub',         icon: 'logo-github'     as const },
            { name: 'twitter' as const,       label: 'Twitter / X',    icon: 'logo-twitter'    as const },
            { name: 'instagram' as const,     label: 'Instagram',      icon: 'logo-instagram'  as const },
            { name: 'facebook' as const,      label: 'Facebook',       icon: 'logo-facebook'   as const },
            { name: 'tiktok' as const,        label: 'TikTok',         icon: 'musical-notes-outline' as const },
            { name: 'telegram' as const,      label: 'Telegram',       icon: 'paper-plane-outline'   as const },
            { name: 'youtube' as const,       label: 'YouTube',        icon: 'logo-youtube'    as const },
            { name: 'whatsapp' as const,      label: 'WhatsApp',       icon: 'logo-whatsapp'   as const },
            { name: 'discord' as const,       label: 'Discord',        icon: 'logo-discord'    as const },
            { name: 'behance' as const,       label: 'Behance',        icon: 'globe-outline'   as const },
            { name: 'dribbble' as const,      label: 'Dribbble',       icon: 'basketball-outline' as const },
            { name: 'medium' as const,        label: 'Medium',         icon: 'newspaper-outline'  as const },
            { name: 'devto' as const,         label: 'Dev.to',         icon: 'code-outline'    as const },
            { name: 'stackoverflow' as const, label: 'Stack Overflow', icon: 'help-circle-outline' as const },
          ] as { name: keyof FormValues; label: string; icon: keyof typeof Ionicons.glyphMap }[]
        ).map(({ name, label, icon }) => (
          <Field key={name} name={name} label={label} placeholder={`https://${name}.com/…`} icon={icon} keyboardType="url" />
        ))}

        {/* Bottom save button */}
        <TouchableOpacity
          onPress={onSave}
          disabled={updateProfile.isPending}
          style={[styles.bottomSave, { backgroundColor: ACCENT }]}
        >
          {updateProfile.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.base }}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Thin wrapper so we don't import TextInput everywhere ─────────────────────

import { TextInput, TextInputProps } from 'react-native';
const TextInputField: React.FC<TextInputProps> = (props) => <TextInput {...props} />;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', overflow: 'hidden', marginBottom: 6 },
  avatarImg: { width: '100%', height: '100%' },
  avatarEditOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionIconBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12 },
  inputText: { flex: 1, fontSize: 15 },
  optBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingLeft: 12, marginBottom: 10 },
  tagInput: { flex: 1, height: 44, fontSize: 14 },
  addTagBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  bottomSave: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});