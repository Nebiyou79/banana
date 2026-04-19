/**
 * candidateService.ts
 * Matches backend: candidateController.js + candidateRoutes.js
 * Key: CV upload uses local storage (NOT Cloudinary), multipart to /candidate/cv
 */
import api, { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { APPLICATIONS, JOBS } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CV {
  _id: string;
  fileName: string;
  originalName: string;
  filePath?: string;
  fileUrl: string;
  downloadUrl: string;
  size: number;
  uploadedAt: string;
  isPrimary: boolean;
  mimetype: string;
  fileExtension: string;
  description?: string;
  downloadCount?: number;
  viewCount?: number;
}

export interface CandidateProfileUpdate {
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  skills?: string[];
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    skills: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    description?: string;
  }>;
}

export interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  age?: number;
  skills: string[];
  education: Array<{
    _id?: string;
    institution: string;
    degree: string;
    field?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  experience: Array<{
    _id?: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    skills: string[];
  }>;
  certifications: Array<{
    _id?: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    description?: string;
  }>;
  cvs: CV[];
  profileCompleted: boolean;
  verificationStatus: string;
}

export interface SavedJob {
  _id: string;
  title: string;
  company?: { _id: string; name: string; logo?: string };
  location?: Record<string, string>;
  jobType?: string;
  salary?: { min?: number; max?: number; currency?: string };
  savedAt?: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getAllowedCVExtensions = (): string[] =>
  ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf'];

export const validateCVFile = (file: {
  name: string;
  size: number;
  mimeType?: string;
}): { valid: boolean; error?: string } => {
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!getAllowedCVExtensions().includes(ext)) {
    return { valid: false, error: `Unsupported format. Allowed: ${getAllowedCVExtensions().join(', ')}` };
  }
  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 100MB limit' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  return { valid: true };
};

// ─── API Response wrapper ─────────────────────────────────────────────────────

interface ApiResp<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const candidateService = {
  // GET /candidate/profile
  getProfile: async (): Promise<CandidateProfile> => {
    const res = await apiGet<ApiResp<{ user: CandidateProfile }>>('/candidate/profile');
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to fetch profile');
    const user = res.data.data.user;
    if (user.cvs) user.cvs = user.cvs.map(processCVResponse);
    return user;
  },

  // PUT /candidate/profile
  updateProfile: async (data: CandidateProfileUpdate): Promise<CandidateProfile> => {
    const res = await apiGet<ApiResp<{ user: CandidateProfile }>>('/candidate/profile');
    // Use put via api directly
    const putRes = await api.put<ApiResp<{ user: CandidateProfile }>>('/candidate/profile', data);
    if (!putRes.data.success) throw new Error(putRes.data.message ?? 'Failed to update profile');
    const user = putRes.data.data.user;
    if (user.cvs) user.cvs = user.cvs.map(processCVResponse);
    return user;
  },

  // GET /candidate/cvs
  getAllCVs: async (): Promise<{ cvs: CV[]; count: number; primaryCV?: CV }> => {
    const res = await apiGet<ApiResp<{ cvs: CV[]; count: number; primaryCV?: CV }>>('/candidate/cvs');
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to fetch CVs');
    return {
      cvs: (res.data.data.cvs ?? []).map(processCVResponse),
      count: res.data.data.count ?? 0,
      primaryCV: res.data.data.primaryCV ? processCVResponse(res.data.data.primaryCV) : undefined,
    };
  },

  // POST /candidate/cv — single file upload, field: 'cv'
  uploadCV: async (
    fileUri: string,
    fileName: string,
    mimeType: string,
    description?: string
  ): Promise<CV> => {
    const formData = new FormData();
    (formData as FormData).append('cv', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    if (description) formData.append('description', description);

    const res = await api.post<ApiResp<{ cv: CV; totalCVs: number; primaryCVId?: string }>>(
      '/candidate/cv',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 }
    );
    if (!res.data.success || !res.data.data?.cv) {
      throw new Error(res.data.message ?? 'Failed to upload CV');
    }
    return processCVResponse(res.data.data.cv);
  },

  // PATCH /candidate/cv/:cvId/primary
  setPrimaryCV: async (cvId: string): Promise<{ primaryCVId: string }> => {
    const res = await api.patch<ApiResp<{ primaryCVId: string }>>(`/candidate/cv/${cvId}/primary`);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to set primary CV');
    return res.data.data;
  },

  // DELETE /candidate/cv/:cvId
  deleteCV: async (cvId: string): Promise<{ deletedCVId: string; remainingCVs: number; newPrimaryCVId?: string }> => {
    const res = await api.delete<ApiResp<{ deletedCVId: string; remainingCVs: number; newPrimaryCVId?: string }>>(
      `/candidate/cv/${cvId}`
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to delete CV');
    return res.data.data;
  },

  // GET /candidate/cv/:cvId/download — streams file (opens in browser/viewer on mobile)
  getDownloadUrl: (cvId: string): string => `/candidate/cv/${cvId}/download`,

  // ── Jobs ────────────────────────────────────────────────────────────────────

  getSavedJobs: async (): Promise<SavedJob[]> => {
    const res = await apiGet<ApiResp<SavedJob[]>>(JOBS.SAVED_JOBS);
    return res.data.data ?? [];
  },

  saveJob: async (jobId: string): Promise<void> => {
    await apiPost(`/candidate/job/${jobId}/save`);
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiPost(`/candidate/job/${jobId}/unsave`);
  },

  // GET /candidate/jobs
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    type?: string;
    experienceLevel?: string;
    minSalary?: number;
    maxSalary?: number;
  }): Promise<{ data: any[]; pagination: any }> => {
    const res = await apiGet<ApiResp<any[]>>('/candidate/jobs', { params });
    return {
      data: res.data.data ?? [],
      pagination: (res.data as any).pagination ?? {},
    };
  },

  // ── Stats ────────────────────────────────────────────────────────────────────

  getApplicationStats: async (): Promise<ApplicationStats> => {
    const res = await apiGet<ApiResp<ApplicationStats>>(APPLICATIONS.STATISTICS);
    return res.data.data;
  },

  // ── Helpers ─────────────────────────────────────────────────────────────────

  formatFileSize,

  getFileExtension: (fileName: string): string =>
    fileName.split('.').pop()?.toUpperCase() ?? 'FILE',

  getCVDisplayName: (cv: CV): string => cv.originalName || cv.fileName || 'Unnamed CV',

  isPDFViewable: (cv: CV): boolean =>
    cv.mimetype === 'application/pdf' || cv.fileExtension === 'pdf',
};

// ─── Internal helper ──────────────────────────────────────────────────────────

function processCVResponse(cv: any): CV {
  return {
    _id: cv._id,
    fileName: cv.fileName || '',
    originalName: cv.originalName || cv.fileName || 'Unknown',
    filePath: cv.filePath,
    fileUrl: cv.fileUrl || '',
    downloadUrl: cv.downloadUrl || '',
    size: cv.size || 0,
    uploadedAt: cv.uploadedAt || new Date().toISOString(),
    isPrimary: cv.isPrimary || false,
    mimetype: cv.mimetype || 'application/octet-stream',
    fileExtension: cv.fileExtension || 'pdf',
    description: cv.description,
    downloadCount: cv.downloadCount || 0,
    viewCount: cv.viewCount || 0,
  };
}
