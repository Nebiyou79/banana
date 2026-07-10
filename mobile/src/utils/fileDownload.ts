// src/utils/fileDownload.ts
// Shared utility for downloading bid documents on mobile
// Handles expo-file-system + expo-sharing with proper API usage
// ─────────────────────────────────────────────────────────────────────────────

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Download a blob to the device and open the share sheet.
 * Uses expo-file-system (SDK 49+) API.
 */
export async function downloadAndShareBlob(
  blob: Blob,
  fileName: string,
  mimeType: string = 'application/octet-stream',
): Promise<void> {
  try {
    // Convert Blob to base64
    const base64 = await blobToBase64(blob);
    
    // Get cache directory
    const fs = FileSystem as typeof FileSystem & { cacheDirectory?: string | null };
    const cacheDir = fs.cacheDirectory;
    if (!cacheDir) {
      throw new Error('Cache directory not available');
    }
    
    const fileUri = `${cacheDir}${fileName}`;
    
    // Write file to cache
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: 'base64',
    });
    
    // Check if sharing is available
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: fileName,
        UTI: mimeType,
      });
    } else {
      Alert.alert(
        'File Saved',
        `File saved to your device. You can find it in your files app.`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert(
      'Download Failed',
      'Could not download the file. Please try again.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Convert a Blob to base64 string.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}