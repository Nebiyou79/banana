/**
 * ProfileImageUploader.tsx
 *
 * React Native equivalent of the web AvatarUploader.tsx.
 * Matches the backend API contract exactly:
 *   POST /profile/avatar  field: 'avatar'  → { data: { avatar: {public_id, secure_url}, thumbnailUrl } }
 *   POST /profile/cover   field: 'cover'   → { data: { cover:  {public_id, secure_url}, thumbnailUrl } }
 *   DELETE /profile/avatar
 *   DELETE /profile/cover
 *
 * Constraints:
 *  - expo-image-picker only (no react-native-image-picker)
 *  - No web APIs (File, FileReader, URL.createObjectURL)
 *  - Full dark/light support via useThemeStore
 *  - Separate upload states for avatar and cover
 *  - Optimistic local preview while uploading
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { toast } from '../../lib/toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudinaryResult {
  public_id: string;
  secure_url: string;
}

interface UploadApiResponse {
  success: boolean;
  data: {
    avatar?: CloudinaryResult & { thumbnailUrl?: string };
    cover?: CloudinaryResult & { thumbnailUrl?: string };
  };
}

export interface ProfileImageUploaderProps {
  currentAvatarUrl?: string | null;
  currentCoverUrl?: string | null;
  accentColor: string;
  onAvatarUploaded?: (result: CloudinaryResult) => void;
  onCoverUploaded?: (result: CloudinaryResult) => void;
  onAvatarDeleted?: () => void;
  onCoverDeleted?: () => void;
  /** default: 'both' */
  type?: 'avatar' | 'cover' | 'both';
  /** default: 'circle' */
  avatarShape?: 'circle' | 'square';
  /** default: true */
  showDeleteButtons?: boolean;
  /** When true the verified green checkmark badge shows on avatar */
  verifiedFull?: boolean;
}

// ─── useImageUploader hook ────────────────────────────────────────────────────

interface UploaderState {
  uploadingAvatar: boolean;
  uploadingCover: boolean;
  localAvatarUri: string | null;
  localCoverUri: string | null;
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
    uploadingAvatar: false,
    uploadingCover:  false,
    localAvatarUri:  initialAvatarUrl ?? null,
    localCoverUri:   initialCoverUrl  ?? null,
  });

  // Keep local URI in sync when parent prop changes (e.g. after query refetch)
  // We only update if we're not currently uploading to avoid flicker.
  const syncAvatar = useCallback((url: string | null | undefined) => {
    setState((s) => s.uploadingAvatar ? s : { ...s, localAvatarUri: url ?? null });
  }, []);
  const syncCover = useCallback((url: string | null | undefined) => {
    setState((s) => s.uploadingCover ? s : { ...s, localCoverUri: url ?? null });
  }, []);

  // ── Request permission ────────────────────────────────────────────────────

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Camera roll access is required to upload images.');
      return false;
    }
    return true;
  }, []);

  // ── Pick & upload avatar ──────────────────────────────────────────────────

  const pickAndUploadAvatar = useCallback(async () => {
    if (!(await requestPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    // Validate size (max 5 MB)
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      toast.error('Avatar image must be under 5 MB.');
      return;
    }

    // Optimistic preview
    setState((s) => ({ ...s, uploadingAvatar: true, localAvatarUri: asset.uri }));

    try {
      const form = new FormData();
      // Cast required: React Native FormData accepts this shape but TS types differ from web
      (form as FormData).append('avatar', {
        uri:  asset.uri,
        name: `avatar-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as unknown as Blob);

      const res = await api.post<UploadApiResponse>('/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });

      const uploaded = res.data.data.avatar;
      if (!uploaded) throw new Error('NO_FILE_PROVIDED');

      setState((s) => ({ ...s, localAvatarUri: uploaded.secure_url }));
      qc.invalidateQueries({ queryKey: ['profile'] });
      callbacks.onAvatarUploaded?.(uploaded);
      toast.success('Profile photo updated!');
    } catch (err: unknown) {
      // Revert optimistic preview on error
      setState((s) => ({ ...s, localAvatarUri: initialAvatarUrl ?? null }));
      const msg = resolveUploadError(err);
      toast.error(msg);
    } finally {
      setState((s) => ({ ...s, uploadingAvatar: false }));
    }
  }, [requestPermission, qc, callbacks, initialAvatarUrl]);

  // ── Pick & upload cover ───────────────────────────────────────────────────

  const pickAndUploadCover = useCallback(async () => {
    if (!(await requestPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 1],
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    // Validate size (max 10 MB)
    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      toast.error('Cover image must be under 10 MB.');
      return;
    }

    setState((s) => ({ ...s, uploadingCover: true, localCoverUri: asset.uri }));

    try {
      const form = new FormData();
      (form as FormData).append('cover', {
        uri:  asset.uri,
        name: `cover-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as unknown as Blob);

      const res = await api.post<UploadApiResponse>('/profile/cover', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      });

      const uploaded = res.data.data.cover;
      if (!uploaded) throw new Error('NO_FILE_PROVIDED');

      setState((s) => ({ ...s, localCoverUri: uploaded.secure_url }));
      qc.invalidateQueries({ queryKey: ['profile'] });
      callbacks.onCoverUploaded?.(uploaded);
      toast.success('Cover photo updated!');
    } catch (err: unknown) {
      setState((s) => ({ ...s, localCoverUri: initialCoverUrl ?? null }));
      const msg = resolveUploadError(err);
      toast.error(msg);
    } finally {
      setState((s) => ({ ...s, uploadingCover: false }));
    }
  }, [requestPermission, qc, callbacks, initialCoverUrl]);

  // ── Delete avatar ─────────────────────────────────────────────────────────

  const deleteAvatar = useCallback(() => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/profile/avatar', { timeout: 60_000 });
            setState((s) => ({ ...s, localAvatarUri: null }));
            qc.invalidateQueries({ queryKey: ['profile'] });
            callbacks.onAvatarDeleted?.();
            toast.success('Profile photo removed.');
          } catch {
            toast.error('Could not remove photo. Please try again.');
          }
        },
      },
    ]);
  }, [qc, callbacks]);

  // ── Delete cover ──────────────────────────────────────────────────────────

  const deleteCover = useCallback(() => {
    Alert.alert('Remove Cover', 'Are you sure you want to remove your cover photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/profile/cover', { timeout: 60_000 });
            setState((s) => ({ ...s, localCoverUri: null }));
            qc.invalidateQueries({ queryKey: ['profile'] });
            callbacks.onCoverDeleted?.();
            toast.success('Cover photo removed.');
          } catch {
            toast.error('Could not remove cover. Please try again.');
          }
        },
      },
    ]);
  }, [qc, callbacks]);

  return {
    ...state,
    syncAvatar,
    syncCover,
    pickAndUploadAvatar,
    pickAndUploadCover,
    deleteAvatar,
    deleteCover,
  };
}

// ─── Error helper ─────────────────────────────────────────────────────────────

function resolveUploadError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'NO_FILE_PROVIDED')  return 'No file was received by the server.';
    if (err.message === 'FILE_TOO_LARGE')    return 'File is too large. Please choose a smaller image.';
    if (err.message.includes('timeout'))     return 'Upload timed out. Check your connection and try again.';
    if (err.message.includes('Network'))     return 'Network error. Please check your connection.';
  }
  return 'Upload failed. Please try again.';
}

// ─── ProfileImageUploader component ──────────────────────────────────────────

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  currentAvatarUrl,
  currentCoverUrl,
  accentColor,
  onAvatarUploaded,
  onCoverUploaded,
  onAvatarDeleted,
  onCoverDeleted,
  type = 'both',
  avatarShape = 'circle',
  showDeleteButtons = true,
  verifiedFull = false,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const { user }  = useAuthStore();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const {
    uploadingAvatar,
    uploadingCover,
    localAvatarUri,
    localCoverUri,
    pickAndUploadAvatar,
    pickAndUploadCover,
    deleteAvatar,
    deleteCover,
  } = useImageUploader(currentAvatarUrl, currentCoverUrl, {
    onAvatarUploaded,
    onCoverUploaded,
    onAvatarDeleted,
    onCoverDeleted,
  });

  const showCover  = type === 'cover'  || type === 'both';
  const showAvatar = type === 'avatar' || type === 'both';

  const avatarRadius = avatarShape === 'circle' ? AVATAR_SIZE / 2 : 16;

  return (
    <View style={s.root}>
      {/* ── Cover section ─────────────────────────────────────────────── */}
      {showCover && (
        <View style={[s.coverWrap, { backgroundColor: accentColor + '28' }]}>
          {localCoverUri ? (
            <Image
              source={{ uri: localCoverUri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, s.coverPlaceholder]}>
              <Ionicons name="image-outline" size={28} color={accentColor + '80'} />
              <Text style={[s.coverPlaceholderText, { color: accentColor + '80' }]}>
                Tap to add cover photo
              </Text>
            </View>
          )}

          {/* Semi-transparent overlay while uploading */}
          {uploadingCover && (
            <View style={s.uploadingOverlay}>
              <ActivityIndicator color="#fff" />
              <Text style={s.uploadingText}>Uploading cover…</Text>
            </View>
          )}

          {/* Camera tap target */}
          {!uploadingCover && (
            <TouchableOpacity
              style={s.coverTapTarget}
              onPress={pickAndUploadCover}
              activeOpacity={0.85}
            >
              <View style={[s.cameraBadge, { backgroundColor: colors.surface }]}>
                <Ionicons name="camera" size={16} color={accentColor} />
              </View>
            </TouchableOpacity>
          )}

          {/* Delete cover button */}
          {showDeleteButtons && localCoverUri && !uploadingCover && (
            <TouchableOpacity style={s.coverDeleteBtn} onPress={deleteCover} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Avatar section ────────────────────────────────────────────── */}
      {showAvatar && (
        <View
          style={[
            s.avatarRow,
            showCover && s.avatarOverlap,
            !showCover && { paddingHorizontal: 20, paddingTop: 16 },
          ]}
        >
          <View style={{ position: 'relative' }}>
            {/* Avatar image or initials */}
            <TouchableOpacity
              onPress={pickAndUploadAvatar}
              activeOpacity={0.85}
              disabled={uploadingAvatar}
              style={[
                s.avatarWrap,
                { borderRadius: avatarRadius, borderColor: colors.background },
              ]}
            >
              {localAvatarUri ? (
                <Image
                  source={{ uri: localAvatarUri }}
                  style={[s.avatarImg, { borderRadius: avatarRadius }]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    s.avatarImg,
                    { borderRadius: avatarRadius, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' },
                  ]}
                >
                  <Text style={s.initialsText}>{initials}</Text>
                </View>
              )}

              {/* Upload overlay */}
              {uploadingAvatar && (
                <View style={[s.avatarUploadOverlay, { borderRadius: avatarRadius }]}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
            </TouchableOpacity>

            {/* Camera badge */}
            {!uploadingAvatar && (
              <TouchableOpacity
                style={[s.avatarCameraBadge, { backgroundColor: accentColor }]}
                onPress={pickAndUploadAvatar}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="camera" size={11} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Verified badge */}
            {verifiedFull && (
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>

          {/* Delete avatar button */}
          {showDeleteButtons && localAvatarUri && !uploadingAvatar && (
            <TouchableOpacity
              style={[s.avatarDeleteBtn, { backgroundColor: '#EF4444' }]}
              onPress={deleteAvatar}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={12} color="#fff" />
              <Text style={s.avatarDeleteText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_SIZE   = 88;
const COVER_HEIGHT  = 140;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { position: 'relative' },

  // Cover
  coverWrap: {
    width: '100%',
    height: COVER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverPlaceholderText: { fontSize: 12, fontWeight: '500' },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  coverTapTarget: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  cameraBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  coverDeleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  avatarOverlap: { marginTop: -(AVATAR_SIZE / 2), paddingHorizontal: 16 },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderWidth: 3,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  initialsText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    marginBottom: 4,
  },
  avatarDeleteText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

export default ProfileImageUploader;
