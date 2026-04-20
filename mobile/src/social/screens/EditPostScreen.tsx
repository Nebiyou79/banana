// src/social/screens/EditPostScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
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
import { useUpdatePost } from '../hooks';
import type { SocialStackParamList } from '../navigation/types';
import { useSocialTheme } from '../theme/socialTheme';
import type { PostMedia, PostVisibility, UpdatePostData } from '../types';

type MediaFile = { uri: string; type: string; name: string };

const VISIBILITIES: { key: PostVisibility; label: string }[] = [
  { key: 'public', label: 'Public' },
  { key: 'connections', label: 'Connections' },
  { key: 'private', label: 'Only me' },
];

type EditPostRoute = RouteProp<SocialStackParamList, 'EditPost'>;

const EditPostScreen: React.FC = () => {
  const theme = useSocialTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<EditPostRoute>();
  const { post } = route.params;
  const updateM = useUpdatePost();

  const [content, setContent] = useState(post.content ?? '');
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility ?? 'public');
  const [existingMedia, setExistingMedia] = useState<PostMedia[]>(post.media ?? []);
  const [mediaToRemove, setMediaToRemove] = useState<string[]>([]);
  const [newMedia, setNewMedia] = useState<MediaFile[]>([]);

  const canSubmit =
    (content.trim().length > 0 || existingMedia.length > 0 || newMedia.length > 0) &&
    !updateM.isPending;

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
    setNewMedia((prev) => [...prev, ...picked].slice(0, 5));
  }, []);

  const removeExisting = useCallback((m: PostMedia) => {
    if (m.public_id) setMediaToRemove((prev) => [...prev, m.public_id]);
    setExistingMedia((prev) => prev.filter((x) => x.public_id !== m.public_id));
  }, []);

  const removeNew = useCallback((uri: string) => {
    setNewMedia((prev) => prev.filter((m) => m.uri !== uri));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const payload: UpdatePostData = {
      content: content.trim(),
      visibility,
      media: existingMedia,
      mediaToRemove: mediaToRemove.length > 0 ? mediaToRemove : undefined,
      mediaFiles: newMedia.length > 0 ? newMedia : undefined,
    };
    updateM.mutate(
      { id: post._id, data: payload },
      { onSuccess: () => navigation.goBack() }
    );
  }, [
    canSubmit,
    content,
    visibility,
    existingMedia,
    mediaToRemove,
    newMedia,
    updateM,
    post._id,
    navigation,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
          style={[
            styles.saveBtn,
            { backgroundColor: theme.primary, opacity: canSubmit ? 1 : 0.4 },
          ]}
        >
          {updateM.isPending ? (
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
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Update your post…"
            placeholderTextColor={theme.muted}
            multiline
            maxLength={5000}
            style={[styles.input, { color: theme.text, backgroundColor: theme.bg }]}
            autoFocus
          />

          {(existingMedia.length > 0 || newMedia.length > 0) ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaRow}
            >
              {existingMedia.map((m) => (
                <View key={m.public_id ?? m.url} style={styles.mediaTile}>
                  <Image
                    source={{ uri: m.thumbnail || m.url || m.secure_url }}
                    style={[styles.mediaImage, { backgroundColor: theme.skeleton }]}
                  />
                  <TouchableOpacity
                    onPress={() => removeExisting(m)}
                    style={styles.mediaRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {newMedia.map((m) => (
                <View key={m.uri} style={styles.mediaTile}>
                  <Image
                    source={{ uri: m.uri }}
                    style={[styles.mediaImage, { backgroundColor: theme.skeleton }]}
                  />
                  <TouchableOpacity
                    onPress={() => removeNew(m.uri)}
                    style={styles.mediaRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={[styles.section, { borderTopColor: theme.border }]}>
            <Text style={[styles.sectionLabel, { color: theme.subtext }]}>Visibility</Text>
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

        <View style={[styles.toolbar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity
            onPress={pickMedia}
            disabled={existingMedia.length + newMedia.length >= 5}
            style={[
              styles.toolBtn,
              { opacity: existingMedia.length + newMedia.length >= 5 ? 0.4 : 1 },
            ]}
            accessibilityLabel="Add media"
          >
            <Ionicons name="image-outline" size={22} color={theme.primary} />
            <Text style={[styles.toolBtnText, { color: theme.primary }]}>
              Add media
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
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 72,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  input: {
    fontSize: 16,
    lineHeight: 23,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    minHeight: 180,
    textAlignVertical: 'top',
  },
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

export default EditPostScreen;