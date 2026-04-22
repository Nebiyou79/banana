/**
 * src/lib/imagePicker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised wrapper around expo-image-picker.
 *
 * FIX: `ImagePicker.MediaTypeOptions` is deprecated in Expo SDK 53+.
 * Use `ImagePicker.MediaType` (string literal union) instead, or pass an
 * array of MediaType values via `mediaTypes`.
 *
 * Correct usage (SDK 53+):
 *   mediaTypes: ['images']
 *   mediaTypes: ['images', 'videos']
 *   mediaTypes: ['videos']
 *
 * DO NOT use:
 *   mediaTypes: ImagePicker.MediaTypeOptions.Images   // deprecated
 *   mediaTypes: ImagePicker.MediaTypeOptions.All      // deprecated
 */

import * as ImagePicker from 'expo-image-picker';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PickedImage = {
  uri:      string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  width?:   number;
  height?:  number;
};

// ─── Request permissions ──────────────────────────────────────────────────────

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

// ─── Pick from library ────────────────────────────────────────────────────────

/**
 * Open the system image library and return the picked image.
 * Uses `mediaTypes: ['images']` (SDK 53+ API).
 */
export async function pickImage(
  opts: {
    aspect?:  [number, number];
    quality?: number;
    allowsEditing?: boolean;
  } = {},
): Promise<PickedImage | null> {
  const granted = await requestMediaLibraryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:     ['images'],            // ← fixed: array syntax, not MediaTypeOptions
    allowsEditing:  opts.allowsEditing ?? true,
    aspect:         opts.aspect ?? [1, 1],
    quality:        opts.quality ?? 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  return {
    uri:      asset.uri,
    fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileSize: asset.fileSize,
    width:    asset.width,
    height:   asset.height,
  };
}

/**
 * Open the camera and return the captured photo.
 * Uses `mediaTypes: ['images']` (SDK 53+ API).
 */
export async function captureFromCamera(
  opts: {
    aspect?:  [number, number];
    quality?: number;
    allowsEditing?: boolean;
  } = {},
): Promise<PickedImage | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes:     ['images'],            // ← fixed
    allowsEditing:  opts.allowsEditing ?? true,
    aspect:         opts.aspect ?? [4, 3],
    quality:        opts.quality ?? 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  return {
    uri:      asset.uri,
    fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileSize: asset.fileSize,
    width:    asset.width,
    height:   asset.height,
  };
}

/**
 * Pick an image from library or camera.
 * Convenience wrapper used by avatar / logo upload flows.
 */
export async function pickImageWithSource(
  source: 'library' | 'camera' = 'library',
  opts: Parameters<typeof pickImage>[0] = {},
): Promise<PickedImage | null> {
  return source === 'camera'
    ? captureFromCamera(opts)
    : pickImage(opts);
}

/**
 * Pick any file type from library (images + videos).
 * Uses `mediaTypes: ['images', 'videos']` (SDK 53+ API).
 */
export async function pickMedia(): Promise<PickedImage | null> {
  const granted = await requestMediaLibraryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],   // ← fixed: was MediaTypeOptions.All
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  return {
    uri:      asset.uri,
    fileName: asset.fileName ?? `media_${Date.now()}`,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    fileSize: asset.fileSize,
    width:    asset.width,
    height:   asset.height,
  };
}