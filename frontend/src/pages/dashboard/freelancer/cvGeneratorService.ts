// src/services/cvGeneratorService.ts
// Frontend API layer for the CV Generator feature.
// Follows the same patterns as candidateService.ts in this codebase.

import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

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
  originalName: string;
  size: number;
  uploadedAt: string;
  isPrimary: boolean;
  mimetype: string;
  fileExtension: string;
  description?: string;
  fileUrl: string;
  downloadUrl: string;
  isGenerated: boolean;
  templateId: string;
  generatedAt: string;
  downloadCount?: number;
  viewCount?: number;
}

export interface GeneratePayload {
  templateId: string;
  description?: string;
  setAsPrimary?: boolean;
}

export interface RegeneratePayload {
  templateId: string;
}

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export const cvGeneratorService = {
  /**
   * Fetch all available CV templates with metadata.
   */
  getTemplates: async (): Promise<CVTemplate[]> => {
    const res = await api.get<{ success: boolean; data: { templates: CVTemplate[] } }>(
      '/candidate/cv-generator/templates'
    );
    if (!res.data.success) throw new Error('Failed to fetch templates');
    return res.data.data.templates;
  },

  /**
   * Fetch an HTML preview of the candidate's CV rendered with the given template.
   * Returns raw HTML string for injection into an <iframe srcDoc>.
   */
  previewCV: async (templateId: string): Promise<string> => {
    const res = await api.post<string>(
      '/candidate/cv-generator/preview',
      { templateId },
      { responseType: 'text' }
    );
    return res.data as unknown as string;
  },

  /**
   * Generate a PDF CV, save it to disk, and attach it to the user's CV list.
   */
  generateCV: async (payload: GeneratePayload): Promise<GeneratedCV> => {
    const res = await api.post<{ success: boolean; message: string; data: { cv: GeneratedCV } }>(
      '/candidate/cv-generator/generate',
      payload
    );
    if (!res.data.success) throw new Error(res.data.message || 'Generation failed');
    toast({ title: 'CV Generated!', description: 'Your CV has been saved to your profile.', variant: 'default' });
    return res.data.data.cv;
  },

  /**
   * Regenerate an existing generated CV with a (possibly different) template.
   */
  regenerateCV: async (cvId: string, payload: RegeneratePayload): Promise<GeneratedCV> => {
    const res = await api.post<{ success: boolean; data: { cv: GeneratedCV } }>(
      `/candidate/cv-generator/regenerate/${cvId}`,
      payload
    );
    if (!res.data.success) throw new Error('Regeneration failed');
    toast({ title: 'CV Updated', description: 'Your CV has been regenerated.', variant: 'default' });
    return res.data.data.cv;
  },

  /**
   * List only the generated CVs from the user's CV array.
   */
  listGeneratedCVs: async (): Promise<GeneratedCV[]> => {
    const res = await api.get<{ success: boolean; data: { cvs: GeneratedCV[] } }>(
      '/candidate/cv-generator/list'
    );
    if (!res.data.success) throw new Error('Failed to fetch generated CVs');
    return res.data.data.cvs;
  },

  /**
   * Download a generated CV as a blob and trigger browser download.
   */
  downloadGeneratedCV: async (cvId: string, filename?: string): Promise<void> => {
    const res = await api.get(`/candidate/cv-generator/download/${cvId}`, {
      responseType: 'blob',
      timeout: 60_000,
    });

    const blob = new Blob([res.data], {
      type: res.headers['content-type'] || 'application/pdf',
    });

    let finalName = filename || `cv-${cvId}.pdf`;
    const cd = res.headers['content-disposition'];
    if (cd) {
      const m = cd.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]*)['"]?/i);
      if (m?.[1]) finalName = decodeURIComponent(m[1]);
    }

    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = finalName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
  },
};
