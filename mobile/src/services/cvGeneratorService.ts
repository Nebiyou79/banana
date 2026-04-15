/**
 * src/services/cvGeneratorService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Parity: Aligned with frontend/src/services/cvGeneratorService.ts.
 * Mobile extras: downloadCVToDevice (expo-file-system), getTemplateLabel map.
 *
 * Endpoint base: /candidate/cv-generator/*
 */

import api from '../lib/api';
import { API_BASE } from '../constants/api';
import { getToken } from '../lib/storage';
import * as FileSystem from 'expo-file-system';

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
  _id:           string;
  fileName:      string;
  originalName?: string;
  size?:         number;
  uploadedAt:    string;
  isPrimary:     boolean;
  mimetype?:     string;
  fileExtension?: string;
  isGenerated:   boolean;
  templateId:    string;
  generatedAt:   string;
  fileUrl?:      string;
  downloadUrl?:  string;
  downloadCount?: number;
  viewCount?:    number;
  description?:  string;
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
   * Matches web getTemplates()
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
   * Matches web listGeneratedCVs()
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
   * Matches web previewCV()
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
   * Matches web generateCV() — same payload shape.
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
   * Matches web regenerateCV()
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
   * Mobile-only: download PDF binary to device via expo-file-system.
   * Returns local file URI (suitable for expo-sharing).
   * Content-Disposition filename extraction mirrors web downloadGeneratedCV().
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
