/**
 * src/services/cvGeneratorService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX: Migrated downloadCVToDevice from the deprecated top-level
 * `FileSystem.downloadAsync` to `import * as FileSystem from 'expo-file-system/legacy'`
 * which is the correct import path for Expo SDK 54 / RN 0.81.
 *
 * The legacy import keeps the exact same API surface (downloadAsync, documentDirectory)
 * so no call-site changes are needed. The deprecation warning is silenced.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import api from '../lib/api';
import { API_BASE } from '../constants/api';
import { getToken } from '../lib/storage';
// ✅ FIX: use legacy import to silence the "Method downloadAsync is deprecated" warning
import * as FileSystem from 'expo-file-system/legacy';

// ─── Types (1-to-1 with web) ─────────────────────────────────────────────────

export interface CVTemplate {
  id:                string;
  name:              string;
  description:       string;
  primaryColor:      string;
  style:             string;
  thumbnailGradient: string;
}

export interface GeneratedCV {
  _id:            string;
  fileName:       string;
  originalName?:  string;
  size?:          number;
  uploadedAt:     string;
  isPrimary:      boolean;
  mimetype?:      string;
  fileExtension?: string;
  isGenerated:    boolean;
  templateId:     string;
  generatedAt:    string;
  fileUrl?:       string;
  downloadUrl?:   string;
  downloadCount?: number;
  viewCount?:     number;
  description?:   string;
}

/** Matches web GeneratePayload */
export interface GenerateCVPayload {
  templateId:    string;
  description?:  string;
  setAsPrimary?: boolean;
}

/** Matches web RegeneratePayload */
export interface RegenerateCVPayload {
  templateId: string;
}

// ─── Template label map ───────────────────────────────────────────────────────

export const TEMPLATE_LABELS: Record<string, string> = {
  executive:    'Executive Classic',
  modern:       'Modern Minimal',
  creative:     'Creative Bold',
  professional: 'Professional',
  elegant:      'Elegant Serif',
  tech:         'Tech Developer',
  infographic:  'Infographic',
  compact:      'Compact One-Page',
  academic:     'Academic',
  freelancer:   'Freelancer Portfolio',
  startup:      'Startup Ready',
  minimal:      'Minimal',
  geometric:    'Geometric',
  timeline:     'Timeline',
  nordic:       'Nordic',
  impact:       'Impact',
  retro:        'Retro',
  healthcare:   'Healthcare',
  magazine:     'Magazine',
  glass:        'Glass',
};

export const getTemplateLabel = (id: string): string =>
  TEMPLATE_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);

// ─── Service ──────────────────────────────────────────────────────────────────

export const cvGeneratorService = {
  /**
   * GET /candidate/cv-generator/templates
   */
  getTemplates: async (): Promise<CVTemplate[]> => {
    const res = await api.get<{ success: boolean; data: { templates: CVTemplate[] } }>(
      '/candidate/cv-generator/templates',
    );
    if (!res.data.success) throw new Error('Failed to fetch CV templates');
    return res.data.data.templates;
  },

  /**
   * GET /candidate/cv-generator/list
   */
  listGeneratedCVs: async (): Promise<GeneratedCV[]> => {
    const res = await api.get<{ success: boolean; data: { cvs: GeneratedCV[] } }>(
      '/candidate/cv-generator/list',
    );
    if (!res.data.success) throw new Error('Failed to fetch generated CVs');
    return res.data.data.cvs;
  },

  /**
   * POST /candidate/cv-generator/preview  { templateId }
   * Returns RAW HTML STRING — pass directly to <WebView source={{ html }} />
   */
  previewCV: async (templateId: string): Promise<string> => {
    const res = await api.post<string>(
      '/candidate/cv-generator/preview',
      { templateId },
      { responseType: 'text' },
    );
    return res.data as unknown as string;
  },

  /**
   * POST /candidate/cv-generator/generate
   * SLOW (3–15 s). Always show a blocking loading overlay.
   */
  generateCV: async (payload: GenerateCVPayload): Promise<GeneratedCV> => {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: { cv: GeneratedCV; totalCVs: number; primaryCVId?: string };
    }>(
      '/candidate/cv-generator/generate',
      payload,
      { timeout: 90_000 },
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'CV generation failed');
    return res.data.data.cv;
  },

  /**
   * POST /candidate/cv-generator/regenerate/:cvId  { templateId }
   */
  regenerateCV: async (cvId: string, templateId: string): Promise<GeneratedCV> => {
    const res = await api.post<{ success: boolean; data: { cv: GeneratedCV } }>(
      `/candidate/cv-generator/regenerate/${cvId}`,
      { templateId },
      { timeout: 90_000 },
    );
    if (!res.data.success) throw new Error('CV regeneration failed');
    return res.data.data.cv;
  },

  /**
   * Mobile-only: download PDF binary to device.
   *
   * ✅ FIX: Uses `expo-file-system/legacy` import (same API, no deprecation warning).
   * FileSystem.downloadAsync and FileSystem.documentDirectory are both available
   * on the legacy import in Expo SDK 54.
   *
   * Returns local file URI suitable for expo-sharing or WebView display.
   */
  downloadCVToDevice: async (cvId: string, fileName?: string): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('Authentication required');

    const remoteUrl = `${API_BASE}/candidate/cv-generator/download/${cvId}`;
    const safeName  = (fileName ?? `cv-${cvId}.pdf`).replace(/[^a-zA-Z0-9._\-() ]/g, '_');
    const localUri  = `${FileSystem.documentDirectory}${safeName}`;

    const result = await FileSystem.downloadAsync(remoteUrl, localUri, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (result.status !== 200) {
      throw new Error(`Download failed with HTTP ${result.status}`);
    }

    return result.uri;
  },
};