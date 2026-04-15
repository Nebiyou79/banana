/**
 * cloudinaryUpload.ts
 * Handles uploading images picked from the device directly to Cloudinary
 * via the existing backend endpoint: POST /api/v1/freelancer/upload/portfolio
 *
 * The backend uses cloudinaryMediaUpload middleware which returns
 * { success, data: [{ url, cloudinary: { secure_url, public_id, ... } }] }
 */

import { getToken } from '../lib/storage';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface CloudinaryUploadResult {
  url: string;          // secure_url from Cloudinary
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  originalName?: string;
}

/**
 * Upload one or more local file URIs to Cloudinary via the backend.
 * @param fileUris  Array of local file URIs (from ImagePicker / ImageManipulator)
 * @param folder    Backend folder hint ('portfolio' | 'avatars')
 */
export async function uploadToCloudinary(
  fileUris: string[],
  folder: 'portfolio' | 'avatars' = 'portfolio',
): Promise<CloudinaryUploadResult[]> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const endpoint =
    folder === 'avatars'
      ? `${API_BASE}/freelancer/upload/avatar`
      : `${API_BASE}/freelancer/upload/portfolio`;

  const formData = new FormData();

  for (const uri of fileUris) {
    // React Native FormData accepts { uri, name, type }
    const filename = uri.split('/').pop() ?? `image_${Date.now()}.jpg`;
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append(folder === 'avatars' ? 'avatar' : 'media', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — fetch sets multipart/form-data with boundary automatically
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? `Upload failed (${response.status})`);
  }

  const json = await response.json();

  if (!json.success) throw new Error(json.message ?? 'Upload failed');

  // Backend returns array of uploaded file objects
  const files: CloudinaryUploadResult[] = (json.data as Array<{
    url?: string;
    path?: string;
    filename?: string;
    originalName?: string;
    cloudinary?: {
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
      format?: string;
    };
  }>)
    .filter(f => f.url?.includes('cloudinary.com') || f.cloudinary?.secure_url)
    .map(f => ({
      url:          f.cloudinary?.secure_url ?? f.url ?? '',
      publicId:     f.cloudinary?.public_id ?? f.filename ?? '',
      width:        f.cloudinary?.width,
      height:       f.cloudinary?.height,
      format:       f.cloudinary?.format,
      originalName: f.originalName,
    }));

  if (!files.length) throw new Error('No valid Cloudinary URLs returned');
  return files;
}

/** Build an optimised Cloudinary URL with resize transforms */
export function optimizeCloudinaryUrl(
  url: string,
  width = 800,
  height = 600,
  quality: 'auto' | number = 'auto',
): string {
  if (!url?.includes('cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  return `${parts[0]}/upload/w_${width},h_${height},c_fill,g_auto,q_${quality},f_auto/${parts[1]}`;
}
