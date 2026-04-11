import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { APPLICATIONS, JOBS } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CV {
  _id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPrimary: boolean;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface SavedJob {
  _id: string;
  title: string;
  company: { _id: string; name: string; logo?: string };
  location: string;
  jobType: string;
  salary?: { min?: number; max?: number; currency?: string };
  savedAt: string;
  deadline?: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  reviewed: number;
  shortlisted: number;
  rejected: number;
  hired: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const candidateService = {
  // ── CVs ────────────────────────────────────────────────────────────────────
  getMyCVs: async (): Promise<CV[]> => {
    const res = await apiGet<{ success: boolean; data: CV[] }>(APPLICATIONS.MY_CVS);
    return res.data.data ?? [];
  },

  setPrimaryCV: async (cvId: string): Promise<void> => {
    // Backend: PATCH /candidate/cv/:cvId/primary  (candidateRoutes)
    await apiPatch(`/candidate/cv/${cvId}/primary`);
  },

  deleteCV: async (cvId: string): Promise<void> => {
    await apiDelete(`/candidate/cv/${cvId}`);
  },

  downloadCV: async (cvId: string): Promise<string> => {
    // Returns a download URL from the backend
    const res = await apiGet<{ success: boolean; data: { downloadUrl: string } }>(
      APPLICATIONS.DOWNLOAD_CV(cvId)
    );
    return res.data.data.downloadUrl;
  },

  // ── Saved Jobs ─────────────────────────────────────────────────────────────
  getSavedJobs: async (): Promise<SavedJob[]> => {
    const res = await apiGet<{ success: boolean; data: SavedJob[] }>(JOBS.SAVED_JOBS);
    return res.data.data ?? [];
  },

  saveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.SAVE(jobId));
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.UNSAVE(jobId));
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  getApplicationStats: async (): Promise<ApplicationStats> => {
    const res = await apiGet<{ success: boolean; data: ApplicationStats }>(APPLICATIONS.STATISTICS);
    return res.data.data;
  },
};
