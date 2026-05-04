// ProfileImageUploader.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { toast } from '../../lib/toast';
import { PROFILE_KEYS } from '../../hooks/useProfile';

export interface CloudinaryResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
}

interface UploadApiResponse {
  success: boolean;
  data: {
    avatar?: CloudinaryResult & { thumbnailUrl?: string };
    cover?: CloudinaryResult & { thumbnailUrl?: string };
  };
  message?: string;
  code?: string;
}

export interface ProfileImageUploaderProps {
  currentAvatarUrl?: string | null;
  currentCoverUrl?: string | null;
  accentColor?: string;
  onAvatarUploaded?: (result: CloudinaryResult) => void;
  onCoverUploaded?: (result: CloudinaryResult) => void;
  onAvatarDeleted?: () => void;
  onCoverDeleted?: () => void;
  type?: 'avatar' | 'cover' | 'both';
  avatarShape?: 'circle' | 'square';
  showDeleteButtons?: boolean;
  verifiedFull?: boolean;
}

interface UploaderState {
  uploadingAvatar: boolean;
  uploadingCover: boolean;
  localAvatarUri: string | null;
  localCoverUri: string | null;
}

function resolveErrorMessage(err: unknown, type: 'avatar' | 'cover'): string {
  const label = type === 'avatar' ? 'photo' : 'cover';
  if (!(err instanceof Error)) return `Failed to upload ${label}. Please try again.`;
  if (err.message.includes('timeout') || err.message.includes('ECONNABORTED')) return `Upload timed out. Check your connection and try again.`;
  if (err.message.includes('Network') || err.message.includes('network')) return 'Network error. Please check your connection.';
  if (err.message.includes('NO_FILE_PROVIDED')) return 'No file received. Please try selecting again.';
  if (err.message.includes('FILE_TOO_LARGE')) return type === 'avatar' ? 'Image must be under 5 MB.' : 'Cover must be under 10 MB.';
  if (err.message.includes('VALIDATION_ERROR')) return 'Invalid file format. Use JPEG, PNG or WebP.';
  return err.message || `Failed to upload ${label}.`;
}

function useImageUploader(
  initialAvatarUrl: string | null | undefined,
  initialCoverUrl: string | null | undefined,
  callbacks: {
    onAvatarUploaded?: (r: CloudinaryResult) => void;
    onCoverUploaded?: (r: CloudinaryResult) => void;
    onAvatarDeleted?: () => void;
    onCoverDeleted?: () => void;
  },
) {
  const qc = useQueryClient();
  const [state, setState] = useState<UploaderState>({
    uploadingAvatar: false, uploadingCover: false,
    localAvatarUri: initialAvatarUrl ?? null, localCoverUri: initialCoverUrl ?? null,
  });

  useEffect(() => {
    setState(s => s.uploadingAvatar ? s : { ...s, localAvatarUri: initialAvatarUrl ?? null });
  }, [initialAvatarUrl]);

  useEffect(() => {
    setState(s => s.uploadingCover ? s : { ...s, localCoverUri: initialCoverUrl ?? null });
  }, [initialCoverUrl]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Photo library access is required to upload images.');
      return false;
    }
    return true;
  }, []);

  const pickAndUploadAvatar = useCallback(async () => {
    if (!(await requestPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
      toast.error('Profile photo must be under 5 MB.');
      return;
    }
    setState(s => ({ ...s, uploadingAvatar: true, localAvatarUri: asset.uri }));
    try {
      const form = new FormData();
      (form as FormData).append('avatar', { uri: asset.uri, name: `avatar-${Date.now()}.jpg`, type: 'image/jpeg' } as unknown as Blob);
      const res = await api.post<UploadApiResponse>('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 });
      if (!res.data.success || !res.data.data?.avatar) throw new Error(res.data.code ?? res.data.message ?? 'Upload failed');
      const uploaded = res.data.data.avatar;
      setState(s => ({ ...s, localAvatarUri: uploaded.secure_url }));
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.profile });
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.completion });
      callbacks.onAvatarUploaded?.(uploaded);
      toast.success('Profile photo updated!');
    } catch (err) {
      setState(s => ({ ...s, localAvatarUri: initialAvatarUrl ?? null }));
      toast.error(resolveErrorMessage(err, 'avatar'));
    } finally {
      setState(s => ({ ...s, uploadingAvatar: false }));
    }
  }, [requestPermission, qc, callbacks, initialAvatarUrl]);

  const pickAndUploadCover = useCallback(async () => {
    if (!(await requestPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [3, 1], quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const MAX_COVER_BYTES = 10 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > MAX_COVER_BYTES) {
      toast.error('Cover photo must be under 10 MB.');
      return;
    }
    setState(s => ({ ...s, uploadingCover: true, localCoverUri: asset.uri }));
    try {
      const form = new FormData();
      (form as FormData).append('cover', { uri: asset.uri, name: `cover-${Date.now()}.jpg`, type: 'image/jpeg' } as unknown as Blob);
      const res = await api.post<UploadApiResponse>('/profile/cover', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180_000 });
      if (!res.data.success || !res.data.data?.cover) throw new Error(res.data.code ?? res.data.message ?? 'Upload failed');
      const uploaded = res.data.data.cover;
      setState(s => ({ ...s, localCoverUri: uploaded.secure_url }));
      qc.invalidateQueries({ queryKey: PROFILE_KEYS.profile });
      callbacks.onCoverUploaded?.(uploaded);
      toast.success('Cover photo updated!');
    } catch (err) {
      setState(s => ({ ...s, localCoverUri: initialCoverUrl ?? null }));
      toast.error(resolveErrorMessage(err, 'cover'));
    } finally {
      setState(s => ({ ...s, uploadingCover: false }));
    }
  }, [requestPermission, qc, callbacks, initialCoverUrl]);

  const deleteAvatar = useCallback(() => {
    Alert.alert('Remove Photo', 'Remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/profile/avatar', { timeout: 60_000 });
          setState(s => ({ ...s, localAvatarUri: null }));
          qc.invalidateQueries({ queryKey: PROFILE_KEYS.profile });
          callbacks.onAvatarDeleted?.();
          toast.success('Profile photo removed.');
        } catch { toast.error('Could not remove photo. Please try again.'); }
      }},
    ]);
  }, [qc, callbacks]);

  const deleteCover = useCallback(() => {
    Alert.alert('Remove Cover', 'Remove your cover photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/profile/cover', { timeout: 60_000 });
          setState(s => ({ ...s, localCoverUri: null }));
          qc.invalidateQueries({ queryKey: PROFILE_KEYS.profile });
          callbacks.onCoverDeleted?.();
          toast.success('Cover photo removed.');
        } catch { toast.error('Could not remove cover. Please try again.'); }
      }},
    ]);
  }, [qc, callbacks]);

  return { ...state, pickAndUploadAvatar, pickAndUploadCover, deleteAvatar, deleteCover };
}

const AVATAR_SIZE = 88;
const COVER_HEIGHT = 140;

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  currentAvatarUrl, currentCoverUrl, accentColor,
  onAvatarUploaded, onCoverUploaded, onAvatarDeleted, onCoverDeleted,
  type = 'both', avatarShape = 'circle', showDeleteButtons = true, verifiedFull = false,
}) => {
  const { colors, radius, type: typography, shadows } = useTheme();
  const { user } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const initials = (user?.name ?? 'U').split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2);
  const resolvedAccentColor = accentColor ?? colors.accent;

  const { uploadingAvatar, uploadingCover, localAvatarUri, localCoverUri, pickAndUploadAvatar, pickAndUploadCover, deleteAvatar, deleteCover } = useImageUploader(currentAvatarUrl, currentCoverUrl, { onAvatarUploaded, onCoverUploaded, onAvatarDeleted, onCoverDeleted });

  const showCover = type === 'cover' || type === 'both';
  const showAvatar = type === 'avatar' || type === 'both';
  const avatarRadius = avatarShape === 'circle' ? AVATAR_SIZE / 2 : radius.lg;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {showCover && (
        <View style={[s.coverWrap, { backgroundColor: resolvedAccentColor + '28' }]}>
          {localCoverUri ? (
            <Image source={{ uri: localCoverUri }} style={StyleSheet.absoluteFillObject as object} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFillObject as object, s.coverPlaceholder]}>
              <Ionicons name="image-outline" size={30} color={resolvedAccentColor + 'AA'} />
              <Text style={[s.coverPlaceholderText, typography.caption, { color: resolvedAccentColor + 'AA' }]}>Tap camera to add cover</Text>
            </View>
          )}
          {uploadingCover && (
            <View style={s.uploadOverlay}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[s.uploadingLabel, typography.caption]}>Uploading cover…</Text>
            </View>
          )}
          {!uploadingCover && (
            <TouchableOpacity style={s.coverCameraBtn} onPress={pickAndUploadCover} activeOpacity={0.8}>
              <View style={[s.cameraBadge, { backgroundColor: colors.accentBg, borderRadius: radius.full }]}>
                <Ionicons name="camera" size={16} color={resolvedAccentColor} />
              </View>
            </TouchableOpacity>
          )}
          {showDeleteButtons && !!localCoverUri && !uploadingCover && (
            <TouchableOpacity style={s.coverDeleteBtn} onPress={deleteCover} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={13} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {showAvatar && (
        <View style={[s.avatarRow, showCover && s.avatarOverlapCover]}>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={pickAndUploadAvatar} disabled={uploadingAvatar} activeOpacity={0.8}
              style={[s.avatarWrap, { borderRadius: avatarRadius, borderColor: colors.accent, width: AVATAR_SIZE, height: AVATAR_SIZE }]}
            >
              {localAvatarUri ? (
                <Image source={{ uri: localAvatarUri }} style={[s.avatarImg, { borderRadius: avatarRadius }]} resizeMode="cover" />
              ) : (
                <View style={[s.avatarImg, { borderRadius: avatarRadius, backgroundColor: resolvedAccentColor, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={s.initials}>{initials}</Text>
                </View>
              )}
              {uploadingAvatar && <View style={[s.uploadOverlay, { borderRadius: avatarRadius }]}><ActivityIndicator color="#fff" size="small" /></View>}
            </TouchableOpacity>
            {!uploadingAvatar && (
              <TouchableOpacity style={[s.avatarCameraBadge, { backgroundColor: resolvedAccentColor, borderRadius: radius.full }]} onPress={pickAndUploadAvatar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="camera" size={11} color="#fff" />
              </TouchableOpacity>
            )}
            {verifiedFull && (
              <View style={[s.verifiedBadge, { backgroundColor: colors.success, borderRadius: radius.full }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>
          {showDeleteButtons && !!localAvatarUri && !uploadingAvatar && (
            <TouchableOpacity style={[s.removeAvatarBtn, { borderColor: colors.borderPrimary, borderRadius: radius.full }]} onPress={deleteAvatar} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={13} color={colors.textMuted} />
              <Text style={[s.removeAvatarText, typography.caption, { color: colors.textMuted }]}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  root: {},
  coverWrap: { width: '100%', height: COVER_HEIGHT, borderRadius: 0, overflow: 'hidden', position: 'relative' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverPlaceholderText: { fontWeight: '500' },
  coverCameraBtn: { position: 'absolute', bottom: 10, right: 12 },
  cameraBadge: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  coverDeleteBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 16, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadingLabel: { color: '#fff', fontWeight: '600' },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 16 },
  avatarOverlapCover: { marginTop: -(AVATAR_SIZE / 2) },
  avatarWrap: { borderWidth: 3, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  initials: { color: '#fff', fontSize: 26, fontWeight: '800' },
  avatarCameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  verifiedBadge: { position: 'absolute', bottom: 2, left: 2, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  removeAvatarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, marginBottom: 4 },
  removeAvatarText: { fontWeight: '500' },
});

export default ProfileImageUploader;