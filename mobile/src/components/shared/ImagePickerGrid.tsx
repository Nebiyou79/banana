/**
 * ImagePickerGrid.tsx
 *
 * Full-featured image picker that:
 *   1. Opens device gallery OR camera
 *   2. Uploads selected images to Cloudinary via the backend
 *   3. Shows upload progress per image
 *   4. Displays previews in a scrollable grid with remove buttons
 *   5. Returns Cloudinary URLs to the parent form
 *
 * Requires:
 *   expo-image-picker    – npm install expo-image-picker
 *   expo-image-manipulator (optional for compression) – already in most Expo apps
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { uploadToCloudinary, optimizeCloudinaryUrl } from '../../utils/cloudinaryUpload';

interface UploadingItem {
  localUri: string;
  uploading: boolean;
  error: boolean;
  cloudUrl?: string;
}

interface ImagePickerGridProps {
  /** Current Cloudinary URLs already saved */
  value: string[];
  /** Called with the updated array of Cloudinary URLs */
  onChange: (urls: string[]) => void;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Error message from parent form validation */
  error?: string;
  label?: string;
}

export const ImagePickerGrid: React.FC<ImagePickerGridProps> = ({
  value,
  onChange,
  maxImages = 8,
  error,
  label = 'Project Images *',
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing } = theme;

  const [queue, setQueue] = useState<UploadingItem[]>([]);

  // ─── Permissions ────────────────────────────────────────────────────────────

  const requestPermissions = async (source: 'library' | 'camera') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required to select images.');
        return false;
      }
    }
    return true;
  };

  // ─── Pick images ─────────────────────────────────────────────────────────────

  const pickImages = async (source: 'library' | 'camera') => {
    const remaining = maxImages - value.length - queue.filter(q => q.uploading).length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `Maximum ${maxImages} images allowed.`);
      return;
    }

    const ok = await requestPermissions(source);
    if (!ok) return;

    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });
    }

    if (result.canceled || !result.assets?.length) return;

    // Add each picked image to the queue as "uploading"
    const newItems: UploadingItem[] = result.assets.map(a => ({
      localUri: a.uri,
      uploading: true,
      error: false,
    }));

    setQueue(prev => [...prev, ...newItems]);

    // Upload each image individually so we can track per-image progress
    for (const asset of result.assets) {
      try {
        const uploaded = await uploadToCloudinary([asset.uri], 'portfolio');
        const cloudUrl = uploaded[0].url;

        // Mark this item as done
        setQueue(prev =>
          prev.map(q =>
            q.localUri === asset.uri ? { ...q, uploading: false, cloudUrl } : q
          )
        );

        // Add the Cloudinary URL to the parent's value list
        onChange([...value, cloudUrl]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setQueue(prev =>
          prev.map(q =>
            q.localUri === asset.uri ? { ...q, uploading: false, error: true } : q
          )
        );
        Alert.alert('Upload failed', message);
      }
    }

    // Prune finished (non-error) items from queue after a short delay
    setTimeout(() => {
      setQueue(prev => prev.filter(q => q.uploading || q.error));
    }, 500);
  };

  // ─── Remove an image ─────────────────────────────────────────────────────────

  const removeCloudUrl = (url: string) => {
    onChange(value.filter(u => u !== url));
  };

  const retryItem = async (item: UploadingItem) => {
    setQueue(prev =>
      prev.map(q => q.localUri === item.localUri ? { ...q, uploading: true, error: false } : q)
    );
    try {
      const uploaded = await uploadToCloudinary([item.localUri], 'portfolio');
      const cloudUrl = uploaded[0].url;
      setQueue(prev => prev.filter(q => q.localUri !== item.localUri));
      onChange([...value, cloudUrl]);
    } catch {
      setQueue(prev =>
        prev.map(q => q.localUri === item.localUri ? { ...q, uploading: false, error: true } : q)
      );
    }
  };

  const removeQueueItem = (uri: string) => {
    setQueue(prev => prev.filter(q => q.localUri !== uri));
  };

  // ─── Source picker ───────────────────────────────────────────────────────────

  const showSourcePicker = () => {
    Alert.alert('Add Photo', 'Choose image source', [
      { text: 'Camera', onPress: () => pickImages('camera') },
      { text: 'Photo Library', onPress: () => pickImages('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const totalCount = value.length + queue.filter(q => q.uploading).length;
  const canAdd = totalCount < maxImages;

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {/* Label */}
      <Text style={{ fontSize: typography.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
        {label}
      </Text>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg }]}>
        <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />
        <Text style={{ fontSize: typography.xs, color: colors.primary, marginLeft: 6, flex: 1 }}>
          Images are uploaded directly to Cloudinary CDN. Max {maxImages} images, 50MB each.
        </Text>
      </View>

      {/* Image grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={styles.grid}>
          {/* Saved Cloudinary images */}
          {value.map((url, i) => (
            <View key={url + i} style={[styles.thumb, { borderRadius: borderRadius.md, borderColor: colors.border }]}>
              <Image
                source={{ uri: optimizeCloudinaryUrl(url, 200, 200) }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: borderRadius.md }]}
                resizeMode="cover"
              />
              {/* Remove button */}
              <TouchableOpacity
                onPress={() => removeCloudUrl(url)}
                style={[styles.removeBtn, { backgroundColor: colors.error }]}
              >
                <Ionicons name="close" size={10} color="#fff" />
              </TouchableOpacity>
              {/* Cloudinary badge */}
              <View style={[styles.cloudBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                <Ionicons name="cloud-done-outline" size={9} color="#fff" />
              </View>
            </View>
          ))}

          {/* Queued / uploading items */}
          {queue.map(item => (
            <View
              key={item.localUri}
              style={[
                styles.thumb,
                {
                  borderRadius: borderRadius.md,
                  borderColor: item.error ? colors.error : colors.border,
                },
              ]}
            >
              <Image
                source={{ uri: item.localUri }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: borderRadius.md, opacity: 0.4 }]}
                resizeMode="cover"
              />
              {item.uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 9, marginTop: 4 }}>Uploading…</Text>
                </View>
              )}
              {item.error && (
                <View style={styles.uploadOverlay}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <TouchableOpacity onPress={() => retryItem(item)} style={{ marginTop: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 9, textDecorationLine: 'underline' }}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                onPress={() => removeQueueItem(item.localUri)}
                style={[styles.removeBtn, { backgroundColor: item.error ? colors.error : 'rgba(0,0,0,0.6)' }]}
              >
                <Ionicons name="close" size={10} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add button */}
          {canAdd && (
            <TouchableOpacity
              onPress={showSourcePicker}
              style={[
                styles.addBtn,
                {
                  borderRadius: borderRadius.md,
                  borderColor: error && !value.length ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color={colors.primary} />
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Count */}
      <Text style={{ fontSize: typography.xs, color: colors.textMuted }}>
        {value.length}/{maxImages} images
      </Text>

      {/* Error */}
      {error && !value.length && (
        <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

const THUMB_SIZE = 90;

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  addBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cloudBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    borderRadius: 4,
    padding: 2,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
