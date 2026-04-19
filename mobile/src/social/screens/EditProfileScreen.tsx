import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
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
import { Avatar, ErrorState, SectionHeader } from '../components/shared';
import {
  useOwnProfile,
  useUpdateProfile,
  useUpdateSocialLinks,
  useUploadAvatar,
  useUploadCover,
} from '../hooks';
import { SOCIAL_LAYOUT } from '../theme/layout';
import { useSocialTheme } from '../theme/socialTheme';
import type { SocialLinks } from '../types';

interface FormState {
  headline: string;
  bio: string;
  location: string;
  website: string;
}

const EMPTY_FORM: FormState = {
  headline: '',
  bio: '',
  location: '',
  website: '',
};

const EMPTY_LINKS: SocialLinks = {
  linkedin: '',
  github: '',
  twitter: '',
  instagram: '',
  portfolio: '',
};

const EditProfileScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();

  const profileQ = useOwnProfile();
  const updateM = useUpdateProfile();
  const linksM = useUpdateSocialLinks();
  const avatarM = useUploadAvatar();
  const coverM = useUploadCover();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [links, setLinks] = useState<SocialLinks>(EMPTY_LINKS);

  useEffect(() => {
    if (profileQ.data) {
      setForm({
        headline: profileQ.data.headline ?? '',
        bio: profileQ.data.bio ?? '',
        location: profileQ.data.location ?? '',
        website: profileQ.data.website ?? '',
      });
      setLinks({
        linkedin: profileQ.data.socialLinks?.linkedin ?? '',
        github: profileQ.data.socialLinks?.github ?? '',
        twitter: profileQ.data.socialLinks?.twitter ?? '',
        instagram: profileQ.data.socialLinks?.instagram ?? '',
        portfolio: profileQ.data.socialLinks?.portfolio ?? '',
      });
    }
  }, [profileQ.data]);

  const pickImage = async (onPick: (asset: ImagePicker.ImagePickerAsset) => void) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      onPick(result.assets[0]);
    }
  };

  const handleAvatarPick = () =>
    pickImage((asset) => {
      const fileName = asset.fileName ?? `avatar_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      avatarM.mutate({ uri: asset.uri, type: mimeType, name: fileName });
    });

  const handleCoverPick = () =>
    pickImage((asset) => {
      const fileName = asset.fileName ?? `cover_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      coverM.mutate({ uri: asset.uri, type: mimeType, name: fileName });
    });

  const handleSave = () => {
    updateM.mutate(form, {
      onSuccess: () => {
        // Persist social links in a follow-up call so they aren't lost
        const hasLinkChange =
          links.linkedin !== (profileQ.data?.socialLinks?.linkedin ?? '') ||
          links.github !== (profileQ.data?.socialLinks?.github ?? '') ||
          links.twitter !== (profileQ.data?.socialLinks?.twitter ?? '') ||
          links.instagram !== (profileQ.data?.socialLinks?.instagram ?? '') ||
          links.portfolio !== (profileQ.data?.socialLinks?.portfolio ?? '');
        if (hasLinkChange) {
          linksM.mutate(links, {
            onSettled: () => navigation.goBack(),
          });
        } else {
          navigation.goBack();
        }
      },
    });
  };

  if (profileQ.isLoading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: theme.bg }]}
      >
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (profileQ.isError || !profileQ.data) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ErrorState
          message="Couldn't load your profile"
          onRetry={profileQ.refetch}
        />
      </SafeAreaView>
    );
  }

  const profile = profileQ.data;
  const avatarUri = profile.avatar?.secure_url ?? profile.user?.avatar;
  const saving = updateM.isPending || linksM.isPending;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          style={[
            styles.saveBtn,
            { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar / cover pickers */}
          <View style={styles.photosRow}>
            <TouchableOpacity
              onPress={handleAvatarPick}
              activeOpacity={0.85}
              style={styles.photoCard}
              disabled={avatarM.isPending}
            >
              <Avatar
                uri={avatarUri}
                name={profile.user?.name}
                size={SOCIAL_LAYOUT.avatarLg}
              />
              <View
                style={[
                  styles.photoOverlay,
                  { backgroundColor: theme.primary },
                ]}
              >
                {avatarM.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
              <Text style={[styles.photoLabel, { color: theme.subtext }]}>
                Avatar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCoverPick}
              activeOpacity={0.85}
              style={[
                styles.coverCard,
                {
                  backgroundColor: theme.primaryLighter,
                  borderColor: theme.border,
                },
              ]}
              disabled={coverM.isPending}
            >
              {coverM.isPending ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <>
                  <Ionicons
                    name="image-outline"
                    size={22}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.photoLabel,
                      { color: theme.subtext, marginTop: 4 },
                    ]}
                  >
                    Change cover
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic info */}
          <SectionHeader title="About you" />
          <FormField
            label="Headline"
            value={form.headline}
            onChangeText={(v) => setForm({ ...form, headline: v })}
            placeholder="e.g. Senior Product Designer"
            maxLength={200}
          />
          <FormField
            label="Bio"
            value={form.bio}
            onChangeText={(v) => setForm({ ...form, bio: v })}
            placeholder="Tell people a bit about yourself"
            maxLength={2000}
            multiline
          />
          <FormField
            label="Location"
            value={form.location}
            onChangeText={(v) => setForm({ ...form, location: v })}
            placeholder="City, Country"
          />
          <FormField
            label="Website"
            value={form.website}
            onChangeText={(v) => setForm({ ...form, website: v })}
            placeholder="https://…"
            autoCapitalize="none"
          />

          {/* Social links */}
          <SectionHeader title="Social links" />
          <FormField
            label="LinkedIn"
            value={links.linkedin ?? ''}
            onChangeText={(v) => setLinks({ ...links, linkedin: v })}
            placeholder="https://linkedin.com/in/…"
            autoCapitalize="none"
          />
          <FormField
            label="GitHub"
            value={links.github ?? ''}
            onChangeText={(v) => setLinks({ ...links, github: v })}
            placeholder="https://github.com/…"
            autoCapitalize="none"
          />
          <FormField
            label="Twitter"
            value={links.twitter ?? ''}
            onChangeText={(v) => setLinks({ ...links, twitter: v })}
            placeholder="@handle or URL"
            autoCapitalize="none"
          />
          <FormField
            label="Instagram"
            value={links.instagram ?? ''}
            onChangeText={(v) => setLinks({ ...links, instagram: v })}
            placeholder="@handle or URL"
            autoCapitalize="none"
          />
          <FormField
            label="Portfolio"
            value={links.portfolio ?? ''}
            onChangeText={(v) => setLinks({ ...links, portfolio: v })}
            placeholder="https://…"
            autoCapitalize="none"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── FormField ─────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FormField: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  autoCapitalize,
}) => {
  const theme = useSocialTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text style={[fieldStyles.label, { color: theme.subtext }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={[
          fieldStyles.input,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
            color: theme.text,
            minHeight: multiline ? 96 : 44,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingTop: multiline ? 12 : Platform.OS === 'ios' ? 12 : 8,
          },
        ]}
      />
    </View>
  );
};

const fieldStyles = StyleSheet.create({
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    minHeight: 56,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 72,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  photoCard: { alignItems: 'center' },
  photoOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 22,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: { fontSize: 11, marginTop: 4 },
  coverCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 80,
  },
});

export default EditProfileScreen;