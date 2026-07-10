// src/social/screens/EditProfileScreen.tsx  (EditPublicProfileScreen)
// ✅ role-theme-migrated — FIXED
/**
 * FIXES:
 *  - hitSlop={10} → hitSlop={{ top:10, bottom:10, left:10, right:10 }} (correct RN type)
 *  - KeyboardAvoidingView behavior: undefined on Android → 'height'
 *  - ActivityIndicator color: was hardcoded '#fff' in save button → theme.colors.white
 *  - LinearGradient colors tuple: added type assertion so TS is satisfied
 *  - saveBtnText color: was hardcoded '#fff' → theme.colors.white (inline override)
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorState, SectionHeader } from '../components/shared';
import {
  useMyPublicProfile,
  useUpdatePublicProfile,
  useSyncPublicProfile,
} from '../hooks/usePublicProfileNew';
import VisibilitySheet, {
  type VisibilityState,
} from '../components/publicProfile/VisibilitySheet';
import { useSocialTheme } from '../theme/socialTheme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BasicForm {
  displayName: string;
  username:    string;
  headline:    string;
  bio:         string;
  location:    string;
  website:     string;
  phone:       string;
  email:       string;
}

interface SocialForm {
  linkedin:  string;
  github:    string;
  twitter:   string;
  instagram: string;
  tiktok:    string;
  telegram:  string;
  youtube:   string;
}

const EMPTY_BASIC: BasicForm = {
  displayName: '', username: '', headline: '', bio: '',
  location: '', website: '', phone: '', email: '',
};

const EMPTY_SOCIAL: SocialForm = {
  linkedin: '', github: '', twitter: '', instagram: '',
  tiktok: '', telegram: '', youtube: '',
};

// ── Screen ────────────────────────────────────────────────────────────────────

const EditPublicProfileScreen: React.FC = () => {
  const theme      = useSocialTheme();
  const navigation = useNavigation<any>();

  const profileQ = useMyPublicProfile();
  const updateM  = useUpdatePublicProfile();
  const syncM    = useSyncPublicProfile();

  const [basic,        setBasic]        = useState<BasicForm>(EMPTY_BASIC);
  const [social,       setSocial]       = useState<SocialForm>(EMPTY_SOCIAL);
  const [skills,       setSkills]       = useState<string>('');
  const [availability, setAvailability] = useState<
    'available' | 'partially-available' | 'not-available'
  >('available');
  const [visSheetOpen, setVisSheetOpen] = useState(false);

  useEffect(() => {
    const p = profileQ.data;
    if (!p) return;
    setBasic({
      displayName: p.displayName ?? '',
      username:    p.username    ?? '',
      headline:    p.headline    ?? '',
      bio:         p.bio         ?? '',
      location:    p.location    ?? '',
      website:     p.website     ?? '',
      phone:       p.phone       ?? '',
      email:       p.email       ?? '',
    });
    setSocial({
      linkedin:  p.socialLinks?.linkedin  ?? '',
      github:    p.socialLinks?.github    ?? '',
      twitter:   p.socialLinks?.twitter   ?? '',
      instagram: p.socialLinks?.instagram ?? '',
      tiktok:    p.socialLinks?.tiktok    ?? '',
      telegram:  p.socialLinks?.telegram  ?? '',
      youtube:   p.socialLinks?.youtube   ?? '',
    });
    setSkills(Array.isArray(p.skills) ? p.skills.join(', ') : '');
    if (p.availability) setAvailability(p.availability);
  }, [profileQ.data]);

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    const parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    updateM.mutate(
      { ...basic, socialLinks: social, skills: parsedSkills, availability },
      { onSuccess: () => navigation.goBack() },
    );
  }, [basic, social, skills, availability, updateM, navigation]);

  const handleSync = useCallback(() => {
    syncM.mutate(undefined, {
      onSuccess: () => profileQ.refetch(),
    });
  }, [syncM, profileQ]);

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (profileQ.isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (profileQ.isError || !profileQ.data) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ErrorState message="Couldn't load public profile" onRetry={profileQ.refetch} />
      </SafeAreaView>
    );
  }

  const p       = profileQ.data;
  const role    = p.role ?? p.user?.role ?? 'candidate';
  const saving  = updateM.isPending;
  const syncing = syncM.isPending;

  // FIX: LinearGradient colors must be a tuple with valid strings
  const gradientColors: [string, string] = saving
    ? [theme.colors.cardAlt, theme.colors.cardAlt]
    : [theme.colors.primary, theme.colors.primaryDark ?? theme.colors.primary];

  const visibilityState: VisibilityState = {
    isPubliclyVisible: p.isPubliclyVisible ?? true,
    visibility: {
      profile:        p.visibility?.profile        ?? 'public',
      email:          p.visibility?.email          ?? false,
      phone:          p.visibility?.phone          ?? false,
      location:       p.visibility?.location       ?? true,
      education:      p.visibility?.education      ?? true,
      experience:     p.visibility?.experience     ?? true,
      certifications: p.visibility?.certifications ?? true,
      portfolio:      p.visibility?.portfolio      ?? true,
      services:       p.visibility?.services       ?? true,
      socialLinks:    p.visibility?.socialLinks    ?? true,
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            backgroundColor: theme.withAlpha(theme.colors.primary, 0.03),
          },
        ]}
      >
        {/* FIX: hitSlop={10} → object form */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Edit public profile
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          style={{ opacity: saving ? 0.6 : 1 }}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {saving ? (
              // FIX: was hardcoded '#fff' → theme.colors.white
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              // FIX: was hardcoded '#fff' in saveBtnText → override inline
              <Text style={[styles.saveBtnText, { color: theme.colors.white }]}>Save</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* FIX: behavior undefined on Android → 'height' */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Sync & Visibility quick actions ──────────────────────────── */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              onPress={handleSync}
              disabled={syncing}
              activeOpacity={0.85}
              style={[
                styles.quickBtn,
                {
                  backgroundColor: theme.withAlpha(theme.colors.primary, 0.1),
                  borderColor: theme.withAlpha(theme.colors.primary, 0.3),
                },
              ]}
              accessibilityRole="button"
            >
              {syncing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="sync-outline" size={16} color={theme.colors.primary} />
              )}
              <Text style={[styles.quickBtnText, { color: theme.colors.primary }]}>
                Sync from profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVisSheetOpen(true)}
              activeOpacity={0.85}
              style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              accessibilityRole="button"
            >
              <Ionicons name="eye-outline" size={16} color={theme.text} />
              <Text style={[styles.quickBtnText, { color: theme.text }]}>
                Visibility
              </Text>
              <View
                style={[
                  styles.visIndicator,
                  { backgroundColor: p.isPubliclyVisible ? '#16a34a' : theme.muted },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* ── Basic info ─────────────────────────────────────────────────── */}
          <SectionHeader title="Basic info" />
          <Field
            label="Display name"
            value={basic.displayName}
            onChange={(v) => setBasic({ ...basic, displayName: v })}
            placeholder="How your name appears publicly"
            maxLength={100}
          />
          <Field
            label="Username"
            value={basic.username}
            onChange={(v) => setBasic({ ...basic, username: v.toLowerCase().trim() })}
            placeholder="e.g. johndoe"
            autoCapitalize="none"
            maxLength={50}
          />
          <Field
            label="Headline"
            value={basic.headline}
            onChange={(v) => setBasic({ ...basic, headline: v })}
            placeholder="e.g. Senior Product Designer"
            maxLength={200}
          />
          <Field
            label="Bio"
            value={basic.bio}
            onChange={(v) => setBasic({ ...basic, bio: v })}
            placeholder="Tell people about yourself"
            maxLength={2000}
            multiline
          />
          <Field
            label="Location"
            value={basic.location}
            onChange={(v) => setBasic({ ...basic, location: v })}
            placeholder="City, Country"
          />
          <Field
            label="Website"
            value={basic.website}
            onChange={(v) => setBasic({ ...basic, website: v })}
            placeholder="https://…"
            autoCapitalize="none"
          />

          {/* ── Contact ────────────────────────────────────────────────────── */}
          <SectionHeader title="Contact (visibility-controlled)" />
          <Field
            label="Phone"
            value={basic.phone}
            onChange={(v) => setBasic({ ...basic, phone: v })}
            placeholder="+251…"
            autoCapitalize="none"
          />
          <Field
            label="Public email"
            value={basic.email}
            onChange={(v) => setBasic({ ...basic, email: v })}
            placeholder="public@email.com"
            autoCapitalize="none"
          />

          {/* ── Skills ─────────────────────────────────────────────────────── */}
          {['candidate', 'freelancer'].includes(role) ? (
            <>
              <SectionHeader title="Skills" />
              <Field
                label="Skills (comma-separated)"
                value={skills}
                onChange={setSkills}
                placeholder="React, Node.js, Design…"
                multiline
              />
            </>
          ) : null}

          {/* ── Availability (freelancer only) ─────────────────────────────── */}
          {role === 'freelancer' ? (
            <>
              <SectionHeader title="Availability" />
              <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                {(['available', 'partially-available', 'not-available'] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setAvailability(opt)}
                    activeOpacity={0.8}
                    style={[
                      styles.radioRow,
                      {
                        borderColor:
                          availability === opt ? theme.colors.primary : theme.border,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: availability === opt }}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor:
                            availability === opt ? theme.colors.primary : theme.border,
                          backgroundColor:
                            availability === opt ? theme.colors.primary : 'transparent',
                        },
                      ]}
                    />
                    <Text style={[styles.radioLabel, { color: theme.text }]}>
                      {opt === 'available'
                        ? '🟢 Available for work'
                        : opt === 'partially-available'
                        ? '🟡 Partially available'
                        : '🔴 Not available'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {/* ── Social links ───────────────────────────────────────────────── */}
          <SectionHeader title="Social links" />
          <Field label="LinkedIn"  value={social.linkedin}  onChange={(v) => setSocial({ ...social, linkedin: v })}  placeholder="https://linkedin.com/in/…" autoCapitalize="none" />
          <Field label="GitHub"    value={social.github}    onChange={(v) => setSocial({ ...social, github: v })}    placeholder="https://github.com/…"    autoCapitalize="none" />
          <Field label="Twitter/X" value={social.twitter}   onChange={(v) => setSocial({ ...social, twitter: v })}   placeholder="@handle"                 autoCapitalize="none" />
          <Field label="Instagram" value={social.instagram} onChange={(v) => setSocial({ ...social, instagram: v })} placeholder="@handle"                 autoCapitalize="none" />
          <Field label="TikTok"    value={social.tiktok}    onChange={(v) => setSocial({ ...social, tiktok: v })}    placeholder="@handle"                 autoCapitalize="none" />
          <Field label="Telegram"  value={social.telegram}  onChange={(v) => setSocial({ ...social, telegram: v })}  placeholder="@username"               autoCapitalize="none" />
          <Field label="YouTube"   value={social.youtube}   onChange={(v) => setSocial({ ...social, youtube: v })}   placeholder="https://youtube.com/…"   autoCapitalize="none" />
        </ScrollView>
      </KeyboardAvoidingView>

      <VisibilitySheet
        visible={visSheetOpen}
        onClose={() => setVisSheetOpen(false)}
        current={visibilityState}
        role={role}
      />
    </SafeAreaView>
  );
};

// ── FormField sub-component ───────────────────────────────────────────────────

interface FieldProps {
  label:           string;
  value:           string;
  onChange:        (v: string) => void;
  placeholder?:    string;
  multiline?:      boolean;
  maxLength?:      number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const Field: React.FC<FieldProps> = ({
  label, value, onChange, placeholder, multiline, maxLength, autoCapitalize,
}) => {
  const theme = useSocialTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text style={[fStyles.label, { color: theme.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={[
          fStyles.input,
          {
            backgroundColor: theme.inputBg ?? theme.card,
            borderColor:     theme.border,
            color:           theme.text,
            minHeight:       multiline ? 96 : 44,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingTop:      multiline ? 12 : Platform.OS === 'ios' ? 12 : 8,
          },
        ]}
      />
    </View>
  );
};

const fStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderBottomWidth: 0.5,
    minHeight: 56,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderRadius:      18,
    minWidth:          72,
    minHeight:         36,
    alignItems:        'center',
    justifyContent:    'center',
  },
  // FIX: removed hardcoded color: '#fff' — now applied inline via theme.colors.white
  saveBtnText: { fontSize: 13, fontWeight: '700' },
  quickActions: {
    flexDirection: 'row',
    gap:           10,
    paddingHorizontal: 16,
    paddingTop:    16,
    paddingBottom: 8,
  },
  quickBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingVertical:   10,
    borderRadius:   12,
    borderWidth:    1,
    minHeight:      44,
  },
  quickBtnText: { fontSize: 13, fontWeight: '600' },
  visIndicator: { width: 8, height: 8, borderRadius: 4 },
  radioRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    padding:        12,
    borderRadius:   10,
    borderWidth:    1.5,
    marginBottom:   8,
    minHeight:      48,
  },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  radioLabel:  { fontSize: 14 },
});

export default EditPublicProfileScreen;