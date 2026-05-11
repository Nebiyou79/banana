// src/social/screens/CreatePostScreen.tsx
// ✅ role-theme-migrated
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { Chip } from '../components/shared';
import { useCreatePost } from '../hooks';
import { useSocialTheme } from '../theme/socialTheme';
import type { CreatePostData, PostVisibility } from '../types';

type MediaFile = { uri: string; type: string; name: string };

const VISIBILITIES: { key: PostVisibility; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'public', label: 'Public', icon: 'earth-outline' },
  { key: 'connections', label: 'Connections', icon: 'people-outline' },
  { key: 'private', label: 'Only me', icon: 'lock-closed-outline' },
];

const CreatePostScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();
  const createM = useCreatePost();

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [media, setMedia] = useState<MediaFile[]>([]);

  const canSubmit = (content.trim().length > 0 || media.length > 0) && !createM.isPending;

  const pickMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5,
    });
    if (result.canceled) return;
    const picked: MediaFile[] = result.assets.map((a, i) => ({
      uri: a.uri,
      type: a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      name: a.fileName ?? `media_${Date.now()}_${i}.${a.type === 'video' ? 'mp4' : 'jpg'}`,
    }));
    setMedia((prev) => [...prev, ...picked].slice(0, 5));
  }, []);

  const removeMedia = useCallback((uri: string) => {
    setMedia((prev) => prev.filter((m) => m.uri !== uri));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const payload: CreatePostData = {
      content: content.trim(),
      visibility,
      mediaFiles: media.length > 0 ? media : undefined,
    };
    createM.mutate(payload, {
      onSuccess: () => navigation.goBack(),
    });
  }, [canSubmit, content, visibility, media, createM, navigation]);

  return (
    <SafeAreaView style={[styles.container, theme.getPageBgStyle()]} edges={['top']}>
      {/* Role-tinted accent strip at top for brand anchoring */}
      <View style={[styles.accentStrip, { backgroundColor: theme.colors.primary }]} />

      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: theme.withAlpha(theme.colors.primary, 0.03),
        borderBottomColor: theme.border,
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New post</Text>

        {/* Gradient post button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Post"
          style={{ opacity: canSubmit ? 1 : 0.4 }}
        >
          <LinearGradient
            colors={
              canSubmit
                ? [theme.colors.primary, theme.colors.primaryDark]
                : [theme.colors.cardAlt, theme.colors.cardAlt]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postBtn}
          >
            {createM.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Text style={[styles.postBtnText, { color: theme.colors.white }]}>Post</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Text input */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.muted}
            multiline
            maxLength={5000}
            style={[
              styles.input,
              { color: theme.text },
            ]}
            autoFocus
          />

          {/* Media preview row */}
          {media.length > 0 ? (
            <View style={[styles.mediaContainer, {
              backgroundColor: theme.withAlpha(theme.colors.primary, 0.04),
            }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaRow}
              >
                {media.map((m) => (
                  <View key={m.uri} style={styles.mediaTile}>
                    <Image
                      source={{ uri: m.uri }}
                      style={[styles.mediaImage, { backgroundColor: theme.skeleton }]}
                    />
                    <TouchableOpacity
                      onPress={() => removeMedia(m.uri)}
                      style={styles.mediaRemove}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Remove media"
                    >
                      <Ionicons name="close-circle" size={22} color={theme.colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Visibility section */}
          <View style={[styles.section, { borderTopColor: theme.border }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.primary }]}>
              Visibility
            </Text>
            <View style={styles.chipRow}>
              {VISIBILITIES.map((v) => (
                <Chip
                  key={v.key}
                  label={v.label}
                  selected={visibility === v.key}
                  onPress={() => setVisibility(v.key)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Toolbar */}
        <View style={[styles.toolbar, {
          backgroundColor: theme.withAlpha(theme.colors.primary, 0.03),
          borderTopColor: theme.border,
        }]}>
          <TouchableOpacity
            onPress={pickMedia}
            disabled={media.length >= 5}
            style={[styles.toolBtn, { opacity: media.length >= 5 ? 0.4 : 1 }]}
            accessibilityLabel="Add media"
            accessibilityRole="button"
          >
            <Ionicons name="image-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.toolBtnText, { color: theme.colors.primary }]}>
              Photo / Video
            </Text>
          </TouchableOpacity>
          <Text style={[styles.counter, { color: theme.muted }]}>
            {content.length}/5000
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  accentStrip: {
    height: 2,
    opacity: 0.7,
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
  headerBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  postBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 72,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnText: { fontSize: 13, fontWeight: '700' },
  input: {
    fontSize: 16,
    lineHeight: 23,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  mediaContainer: {},
  mediaRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  mediaTile: { width: 96, height: 96, marginRight: 8 },
  mediaImage: { width: '100%', height: '100%', borderRadius: 10 },
  mediaRemove: { position: 'absolute', top: 4, right: 4 },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    minHeight: 52,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  toolBtnText: { fontSize: 13, fontWeight: '600' },
  counter: { fontSize: 11 },
});

export default CreatePostScreen;