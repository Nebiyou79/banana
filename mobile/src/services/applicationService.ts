/**
 * src/services/applicationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean, production-grade application service for React Native.
 * Mirrors backend Application model and frontend web service exactly.
 * Handles multipart/form-data for file uploads.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { APPLICATIONS } from '../constants/api';
import  httpClient  from '../lib/httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'applied'
  | 'under-review'
  | 'shortlisted'
  | 'interview-scheduled'
  | 'interviewed'
  | 'offer-pending'
  | 'offer-made'
  | 'offer-accepted'
  | 'offer-rejected'
  | 'on-hold'
  | 'rejected'
  | 'withdrawn';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  'applied':              'Applied',
  'under-review':         'Under Review',
  'shortlisted':          'Shortlisted',
  'interview-scheduled':  'Interview Scheduled',
  'interviewed':          'Interviewed',
  'offer-pending':        'Offer Pending',
  'offer-made':           'Offer Made',
  'offer-accepted':       'Offer Accepted',
  'offer-rejected':       'Offer Rejected',
  'on-hold':              'On Hold',
  'rejected':             'Rejected',
  'withdrawn':            'Withdrawn',
};

// Light-mode status colours { bg, text, dot, border }
export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  'applied':             { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', border: '#BFDBFE' },
  'under-review':        { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B', border: '#FDE68A' },
  'shortlisted':         { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', border: '#BBF7D0' },
  'interview-scheduled': { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6', border: '#DDD6FE' },
  'interviewed':         { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1', border: '#C7D2FE' },
  'offer-pending':       { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316', border: '#FED7AA' },
  'offer-made':          { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
  'offer-accepted':      { bg: '#F0FDF4', text: '#166534', dot: '#16A34A', border: '#86EFAC' },
  'offer-rejected':      { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', border: '#FECACA' },
  'on-hold':             { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF', border: '#E5E7EB' },
  'rejected':            { bg: '#FEF2F2', text: '#B91C1C', dot: '#DC2626', border: '#FECACA' },
  'withdrawn':           { bg: '#F3F4F6', text: '#4B5563', dot: '#6B7280', border: '#D1D5DB' },
};

// Dark-mode status colours
export const STATUS_COLORS_DARK: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  'applied':             { bg: 'rgba(59,130,246,0.15)',  text: '#93C5FD', dot: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
  'under-review':        { bg: 'rgba(245,158,11,0.15)',  text: '#FCD34D', dot: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  'shortlisted':         { bg: 'rgba(34,197,94,0.15)',   text: '#86EFAC', dot: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  'interview-scheduled': { bg: 'rgba(139,92,246,0.15)',  text: '#C4B5FD', dot: '#8B5CF6', border: 'rgba(139,92,246,0.3)' },
  'interviewed':         { bg: 'rgba(99,102,241,0.15)',  text: '#A5B4FC', dot: '#6366F1', border: 'rgba(99,102,241,0.3)' },
  'offer-pending':       { bg: 'rgba(249,115,22,0.15)',  text: '#FDBA74', dot: '#F97316', border: 'rgba(249,115,22,0.3)' },
  'offer-made':          { bg: 'rgba(16,185,129,0.15)',  text: '#6EE7B7', dot: '#10B981', border: 'rgba(16,185,129,0.3)' },
  'offer-accepted':      { bg: 'rgba(22,163,74,0.15)',   text: '#86EFAC', dot: '#16A34A', border: 'rgba(22,163,74,0.3)' },
  'offer-rejected':      { bg: 'rgba(239,68,68,0.15)',   text: '#FCA5A5', dot: '#EF4444', border: 'rgba(239,68,68,0.3)' },
  'on-hold':             { bg: 'rgba(107,114,128,0.15)', text: '#D1D5DB', dot: '#9CA3AF', border: 'rgba(107,114,128,0.3)' },
  'rejected':            { bg: 'rgba(220,38,38,0.15)',   text: '#FCA5A5', dot: '#DC2626', border: 'rgba(220,38,38,0.3)' },
  'withdrawn':           { bg: 'rgba(75,85,99,0.15)',    text: '#9CA3AF', dot: '#6B7280', border: 'rgba(75,85,99,0.3)' },
};

// Status progression for pipeline display
export const STATUS_PIPELINE: ApplicationStatus[] = [
  'applied', 'under-review', 'shortlisted', 'interview-scheduled', 'offer-made',
];

export const COMPANY_STATUSES: ApplicationStatus[] = [
  'under-review', 'shortlisted', 'interview-scheduled', 'interviewed',
  'offer-pending', 'offer-made', 'offer-accepted', 'offer-rejected',
  'on-hold', 'rejected',
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CV {
  _id: string;
  cvId?: string;
  filename?: string;
  fileName?: string;
  originalName?: string;
  fileUrl?: string;
  downloadUrl?: string;
  url?: string;
  fileSize?: number;
  size?: number;
  isPrimary?: boolean;
  uploadedAt?: string;
  mimetype?: string;
  fileExtension?: string;
  description?: string;
}

export interface Reference {
  _id?: string;
  _tempId?: string;
  name?: string;
  position?: string;
  organization?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  allowsContact?: boolean;
  notes?: string;
  providedAsDocument: boolean;
  document?: {
    filename?: string;
    originalName?: string;
    url?: string;
    downloadUrl?: string;
    size?: number;
    mimetype?: string;
  };
}

export interface WorkExperience {
  _id?: string;
  _tempId?: string;
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  skills?: string[];
  supervisor?: { name: string; position: string; contact: string };
  providedAsDocument: boolean;
  document?: {
    filename?: string;
    originalName?: string;
    url?: string;
    downloadUrl?: string;
    size?: number;
    mimetype?: string;
  };
}

export interface ContactInfo {
  email: string;
  phone?: string;
  telegram?: string;
  location?: string;
}

export interface UserInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: { linkedin?: string; github?: string; twitter?: string };
}

export interface StatusHistory {
  _id: string;
  status: string;
  changedBy: { _id: string; name: string; email: string };
  changedAt: string;
  message?: string;
  interviewDetails?: {
    date: string; time: string; location: string;
    type: 'phone' | 'video' | 'in-person' | 'technical';
    interviewer: string; notes: string; duration?: number;
  };
}

export interface CompanyResponse {
  status: 'active-consideration' | 'on-hold' | 'rejected' | 'selected-for-interview' | null;
  message?: string;
  interviewLocation?: string;
  interviewDate?: string;
  interviewTime?: string;
  respondedAt?: string;
  respondedBy?: { _id: string; name: string; email: string };
  interviewDetails?: { date: string; location: string; type: string };
}

export interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    description?: string;
    location?: any;
    jobType: 'company' | 'organization';
    company?: { _id: string; name: string; logoUrl?: string; verified: boolean; industry?: string };
    organization?: { _id: string; name: string; logoUrl?: string; verified: boolean; industry?: string; organizationType?: string };
  };
  candidate: { _id: string; name: string; email: string; avatar?: string; phone?: string; location?: string };
  userInfo: UserInfo;
  selectedCVs: Array<{
    cvId: string; _id?: string; filename: string; originalName: string;
    url: string; downloadUrl?: string; viewUrl?: string; size?: number; mimetype?: string;
  }>;
  coverLetter: string;
  skills: string[];
  references: Reference[];
  workExperience: WorkExperience[];
  contactInfo: ContactInfo;
  attachments: {
    referenceDocuments: any[]; experienceDocuments: any[];
    portfolioFiles: any[]; otherDocuments: any[];
  };
  status: ApplicationStatus | string;
  statusHistory: StatusHistory[];
  companyResponse?: CompanyResponse;
  createdAt: string;
  updatedAt: string;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface ApplyJobData {
  coverLetter: string;
  skills: string[];
  selectedCVs: Array<{ cvId: string; filename?: string; originalName?: string; url?: string; downloadUrl?: string; size?: number; mimetype?: string }>;
  contactInfo: ContactInfo;
  userInfo?: UserInfo;
  references?: Reference[];
  workExperience?: WorkExperience[];
  // Mobile file objects (React Native DocumentPicker result)
  referenceFiles?: Array<{ uri: string; name: string; type: string; _tempId: string }>;
  experienceFiles?: Array<{ uri: string; name: string; type: string; _tempId: string }>;
}

export interface UpdateStatusData {
  status: ApplicationStatus;
  message?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewType?: 'phone' | 'video' | 'in-person' | 'technical';
  interviewerName?: string;
  interviewNotes?: string;
  interviewDuration?: number;
}

export interface CompanyResponseData {
  status: 'active-consideration' | 'on-hold' | 'rejected' | 'selected-for-interview';
  message?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
}

export interface ApplicationFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  jobId?: string;
}

export interface ApplicationsListResponse {
  success: boolean;
  data: Application[];
  pagination: {
    hasNextPage: boolean; hasPreviousPage: boolean;
    current: number; totalPages: number;
    totalResults: number; resultsPerPage: number;
  };
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
  data: { application: Application };
}

export interface ApplicationStats {
  totalApplications?: number;
  newApplications?: number;
  underReview?: number;
  shortlisted?: number;
  interviewScheduled?: number;
  rejected?: number;
  hired?: number;
  newToday?: number;
  thisWeek?: number;
  jobsPosted?: number;
  successRate?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseError = (e: any): string => {
  const d = e?.response?.data;
  if (!d) return e?.message ?? 'Request failed';
  if (Array.isArray(d.errors)) return d.errors.map((x: any) => x.msg ?? x.message ?? x).join('; ');
  return d.message ?? e.message ?? 'Request failed';
};

const generateTempId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ─── Service ──────────────────────────────────────────────────────────────────

export const applicationService = {

  // ── Candidate ─────────────────────────────────────────────────────────────

  getMyCVs: async (): Promise<CV[]> => {
    try {
      const res = await httpClient.get<{ success: boolean; data: CV[] }>(APPLICATIONS.MY_CVS);
      return res.data.data ?? [];
    } catch { return []; }
  },

  getMyApplications: async (params?: ApplicationFilters): Promise<ApplicationsListResponse> => {
    const res = await httpClient.get<ApplicationsListResponse>(
      APPLICATIONS.MY_APPLICATIONS, { params }
    ).catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  applyForJob: async (jobId: string, data: ApplyJobData): Promise<ApplicationResponse> => {
    const formData = new FormData();

    // JSON fields
    formData.append('coverLetter', data.coverLetter);
    formData.append('skills', JSON.stringify(data.skills ?? []));
    formData.append('selectedCVs', JSON.stringify(
      data.selectedCVs.map(cv => ({
        cvId: cv.cvId,
        filename: cv.filename ?? cv.originalName ?? 'cv',
        originalName: cv.originalName ?? cv.filename ?? 'cv',
        url: cv.url ?? '',
        downloadUrl: cv.downloadUrl ?? cv.url ?? '',
        size: cv.size ?? 0,
        mimetype: cv.mimetype ?? 'application/pdf',
      }))
    ));
    formData.append('contactInfo', JSON.stringify(data.contactInfo));
    if (data.userInfo) formData.append('userInfo', JSON.stringify(data.userInfo));

    // References (prepare with _tempId for docs)
    const refs = (data.references ?? []).map(r => ({
      ...r,
      _tempId: r.providedAsDocument ? (r._tempId ?? generateTempId()) : undefined,
    }));
    formData.append('references', JSON.stringify(refs));

    // Work experience
    const exps = (data.workExperience ?? []).map(e => ({
      ...e,
      _tempId: e.providedAsDocument ? (e._tempId ?? generateTempId()) : undefined,
    }));
    formData.append('workExperience', JSON.stringify(exps));

    // Reference document files
    if (data.referenceFiles?.length) {
      data.referenceFiles.forEach((f, i) => {
        formData.append('referencePdfs', { uri: f.uri, name: f.name, type: f.type } as any);
        formData.append(`referencePdfs_${i}_tempId`, f._tempId);
        formData.append(`referencePdfs_metadata_${i}`, JSON.stringify({ _tempId: f._tempId, fileName: f.name }));
      });
    }

    // Experience document files
    if (data.experienceFiles?.length) {
      data.experienceFiles.forEach((f, i) => {
        formData.append('experiencePdfs', { uri: f.uri, name: f.name, type: f.type } as any);
        formData.append(`experiencePdfs_${i}_tempId`, f._tempId);
        formData.append(`experiencePdfs_metadata_${i}`, JSON.stringify({ _tempId: f._tempId, fileName: f.name }));
      });
    }

    const res = await httpClient.post<ApplicationResponse>(
      APPLICATIONS.APPLY(jobId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
    ).catch(e => { throw new Error(parseError(e)); });

    return res.data;
  },

  withdrawApplication: async (applicationId: string): Promise<void> => {
    await httpClient.put(APPLICATIONS.WITHDRAW(applicationId))
      .catch(e => { throw new Error(parseError(e)); });
  },

  getApplicationStats: async (): Promise<ApplicationStats> => {
    try {
      const res = await httpClient.get<{ success: boolean; data: ApplicationStats }>(APPLICATIONS.STATISTICS);
      return res.data.data ?? {};
    } catch { return {}; }
  },

  // ── Company / Org ──────────────────────────────────────────────────────────

  getCompanyApplications: async (params?: ApplicationFilters): Promise<ApplicationsListResponse> => {
    const res = await httpClient.get<ApplicationsListResponse>(
      APPLICATIONS.COMPANY_LIST, { params }
    ).catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  getCompanyApplicationDetails: async (id: string): Promise<ApplicationResponse> => {
    const res = await httpClient.get<ApplicationResponse>(APPLICATIONS.COMPANY_DETAIL(id))
      .catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  getOrganizationApplications: async (params?: ApplicationFilters): Promise<ApplicationsListResponse> => {
    const res = await httpClient.get<ApplicationsListResponse>(
      APPLICATIONS.ORG_LIST, { params }
    ).catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  getOrganizationApplicationDetails: async (id: string): Promise<ApplicationResponse> => {
    const res = await httpClient.get<ApplicationResponse>(APPLICATIONS.ORG_DETAIL(id))
      .catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  getJobApplications: async (jobId: string, params?: ApplicationFilters): Promise<ApplicationsListResponse> => {
    const res = await httpClient.get<ApplicationsListResponse>(
      APPLICATIONS.JOB_APPLICATIONS(jobId), { params }
    ).catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  updateApplicationStatus: async (id: string, data: UpdateStatusData): Promise<ApplicationResponse> => {
    const res = await httpClient.put<ApplicationResponse>(
      APPLICATIONS.UPDATE_STATUS(id), data
    ).catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  sendCompanyResponse: async (id: string, data: CompanyResponseData): Promise<ApplicationResponse> => {
    const res = await httpClient.put<ApplicationResponse>(
      APPLICATIONS.COMPANY_RESPONSE(id), data
    ).catch(e => { throw new Error(parseError(e)); });
    return res.data;
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

  canWithdraw: (status: string): boolean => {
    return !['offer-accepted', 'rejected', 'withdrawn'].includes(status);
  },

  getStatusLabel: (status: string): string =>
    STATUS_LABELS[status as ApplicationStatus] ?? status,

  getCVDisplayName: (cv: CV): string =>
    cv.originalName ?? cv.fileName ?? cv.filename ?? 'CV Document',

  formatFileSize: (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  generateTempId,
};

export default applicationService;
