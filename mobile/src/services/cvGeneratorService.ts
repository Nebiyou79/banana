/**
 * src/services/cvGeneratorService.ts
 * CV Generator — typed API layer.
 * All endpoints: /api/v1/candidate/cv-generator/*
 */

import api from '../lib/api';
import { API_BASE } from '../constants/api';
import { getToken } from '../lib/storage';
import * as FileSystem from 'expo-file-system';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  style: string;
  thumbnailGradient: string;
}

export interface GeneratedCV {
  _id: string;
  fileName: string;
  originalName?: string;
  size?: number;
  uploadedAt: string;
  isPrimary: boolean;
  mimetype?: string;
  isGenerated: boolean;
  templateId: string;
  generatedAt: string;
  fileUrl?: string;
  downloadUrl?: string;
  downloadCount?: number;
  viewCount?: number;
  description?: string;
}

export interface GenerateCVPayload {
  templateId: string;
  description?: string;
  setAsPrimary?: boolean;
}

// ─── Template label mapping ───────────────────────────────────────────────────

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
};

export const getTemplateLabel = (id: string): string =>
  TEMPLATE_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);

// ─── Service ──────────────────────────────────────────────────────────────────

export const cvGeneratorService = {
  /** List all available templates. Stale-time: 1 hour. */
  getTemplates: async (): Promise<CVTemplate[]> => {
    const res = await api.get<{ success: boolean; data: { templates: CVTemplate[] } }>(
      '/candidate/cv-generator/templates',
    );
    if (!res.data.success) throw new Error('Failed to fetch CV templates');
    return res.data.data.templates;
  },

  /** List generated CVs for current user. */
  listGeneratedCVs: async (): Promise<GeneratedCV[]> => {
    const res = await api.get<{ success: boolean; data: { cvs: GeneratedCV[] } }>(
      '/candidate/cv-generator/list',
    );
    if (!res.data.success) throw new Error('Failed to fetch generated CVs');
    return res.data.data.cvs;
  },

  /**
   * Fetch HTML preview for a template.
   * ⚠️  Returns RAW HTML STRING — not JSON.
   *     Pass directly to <WebView source={{ html }} />.
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
   * Generate a PDF from the user's profile.
   * ⚠️  SLOW — 3–15 seconds. Always show a blocking loading overlay.
   */
  generateCV: async (payload: GenerateCVPayload): Promise<GeneratedCV> => {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: { cv: GeneratedCV; totalCVs: number; primaryCVId?: string };
    }>(
      '/candidate/cv-generator/generate',
      payload,
      { timeout: 90_000 }, // generous timeout for PDF generation
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'CV generation failed');
    return res.data.data.cv;
  },

  /** Regenerate an existing CV with a (possibly different) template. */
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
   * Download the PDF binary to the device document directory.
   * Returns the local file URI (suitable for expo-sharing).
   * Uses expo-file-system — cannot use fetch() for binary files.
   */
  downloadCVToDevice: async (cvId: string, fileName?: string): Promise<string> => {
    const token = await getToken();
    if (!token) throw new Error('Authentication required');

    const remoteUrl = `${API_BASE}/candidate/cv-generator/download/${cvId}`;
    // Sanitise filename for file system
    const safeName = (fileName ?? `cv-${cvId}.pdf`).replace(/[^a-zA-Z0-9._\-() ]/g, '_');
    const localUri = `${FileSystem.documentDirectory}${safeName}`;

    const result = await FileSystem.downloadAsync(remoteUrl, localUri, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (result.status !== 200) {
      throw new Error(`Download failed with HTTP ${result.status}`);
    }
    return result.uri;
  },
};