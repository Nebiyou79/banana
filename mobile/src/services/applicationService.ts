/**
 * mobile/src/services/applicationService.ts
 *
 * ── Mobile-Service-Auditor AUDIT LOG ──────────────────────────────────────────
 * SOURCE OF TRUTH: server/src/routes/applicationRoutes.js
 *
 * FIXES vs original:
 *  1. `withdrawApplication` uses PUT (not POST) — matches route: router.put('/:id/withdraw')
 *  2. `canWithdraw()` — backend allows withdraw for 'applied' AND 'under-review'
 *     Web service matches this; original mobile only had 'applied'
 *  3. Application `data` wrapper — backend returns { data: Application[] } not { applications: [] }
 *     Fixed select() in hooks to unwrap correctly
 *  4. Status history field: `changedAt` (not `timestamp`)
 *  5. `companyResponse.interviewDetails` is nested object — matches backend schema
 *  6. Error parser handles express-validator's `errors[]` array format
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { apiGet, apiPost, apiPut } from '../lib/api';
import { APPLICATIONS } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'applied' | 'under-review' | 'shortlisted'
  | 'interview-scheduled' | 'interviewed'
  | 'offer-pending' | 'offer-made' | 'offer-accepted' | 'offer-rejected'
  | 'on-hold' | 'rejected' | 'withdrawn';

export type CompanyResponseStatus =
  | 'active-consideration' | 'on-hold' | 'rejected' | 'selected-for-interview';

export interface ApplicationJob {
  _id: string;
  title: string;
  jobType: 'company' | 'organization';
  type?: string;
  company?:      { _id: string; name: string; logoUrl?: string; verified?: boolean };
  organization?: { _id: string; name: string; logoUrl?: string; verified?: boolean };
  location?: { city?: string; region?: string };
}

export interface ApplicationCandidate {
  _id: string; name: string; email: string; avatar?: string; phone?: string; location?: string;
}

export interface SelectedCV {
  cvId: string; _id?: string; filename?: string; originalName?: string;
  url?: string; downloadUrl?: string;
}

export interface Reference {
  _id?: string; name?: string; position?: string; company?: string;
  email?: string; phone?: string; relationship?: string; allowsContact?: boolean;
  document?: { filename: string; originalName: string; url: string };
  providedAsDocument?: boolean;
}

export interface WorkExperience {
  _id?: string; company?: string; position?: string;
  startDate?: string; endDate?: string; current?: boolean; description?: string;
  document?: { filename: string; originalName: string; url: string };
  providedAsDocument?: boolean;
}

export interface StatusHistoryEntry {
  _id?: string;
  status: ApplicationStatus;
  /** Backend field name is changedAt, NOT timestamp */
  changedAt: string;
  message?: string;
  changedBy?: { _id: string; name: string; email: string };
  interviewDetails?: {
    date?: string; location?: string; type?: string; interviewer?: string; notes?: string;
  };
}

export interface CompanyResponse {
  status: CompanyResponseStatus;
  message?: string;
  interviewLocation?: string;
  respondedAt?: string;
  respondedBy?: { _id: string; name: string; email: string };
  interviewDetails?: {
    date: string; location: string; type: string; interviewer?: string; notes?: string;
  };
}

export interface Application {
  _id: string;
  job: ApplicationJob;
  candidate: ApplicationCandidate;
  userInfo: {
    name: string; email: string; phone?: string; location?: string;
    avatar?: string; bio?: string; website?: string;
    socialLinks?: { linkedin?: string; github?: string; twitter?: string };
  };
  selectedCVs:  SelectedCV[];
  coverLetter:  string;
  skills:       string[];
  references:   Reference[];
  workExperience: WorkExperience[];
  contactInfo: { email?: string; phone?: string; location?: string; telegram?: string };
  status:        ApplicationStatus;
  statusHistory: StatusHistoryEntry[];
  companyResponse?: CompanyResponse;
  attachments?: {
    portfolioFiles?: any[];
    otherDocuments?: any[];
  };
  createdAt: string;
  updatedAt: string;
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface ApplicationPagination {
  current:      number;
  totalPages:   number;
  totalResults: number;
  resultsPerPage?: number;
}

export interface ApplicationListData {
  applications?: Application[];  // some routes wrap in applications key
  data?:         Application[];  // other routes return array directly
  pagination:    ApplicationPagination;
}

export interface ApplicationListResponse {
  success: boolean;
  data:    Application[];
  pagination: ApplicationPagination;
}

export interface ApplicationDetailResponse {
  success: boolean;
  data: { application: Application };
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface ApplyJobData {
  coverLetter: string;
  skills:      string[];
  selectedCVs?: Array<{ cvId: string }>;
  references?:     Reference[];
  workExperience?: WorkExperience[];
  contactInfo?: { email?: string; phone?: string; location?: string; telegram?: string };
  userInfo?:    { name?: string; email?: string; phone?: string; location?: string; bio?: string };
}

export interface UpdateStatusData {
  status:  string;
  message?: string;
  interviewDetails?: {
    date: string; location: string; type: string; interviewer?: string; notes?: string;
  };
}

export interface CompanyResponseData {
  status:            CompanyResponseStatus;
  message?:          string;
  interviewLocation?: string;
}

export interface ApplicationFilters {
  page?:      number;
  limit?:     number;
  status?:    string;
  search?:    string;
  jobId?:     string;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?:  string;
  dateTo?:    string;
}

export interface ApplicationStats {
  total:               number;
  totalApplications?:  number;
  applied?:            number;
  underReview?:        number;
  shortlisted?:        number;
  interviewScheduled?: number;
  rejected?:           number;
  hired?:              number;
  newApplications?:    number;
  successRate?:        string;
}

// ─── Display helpers ─────────────────────────────────────────────────────────

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
  'rejected':             'Not Selected',
  'withdrawn':            'Withdrawn',
};

type ST = { bg: string; text: string; dot: string; border: string };

export const STATUS_COLORS: Record<ApplicationStatus, ST> = {
  'applied':             { bg:'#EFF6FF', text:'#1D4ED8', dot:'#3B82F6', border:'#BFDBFE' },
  'under-review':        { bg:'#FFF7ED', text:'#C2410C', dot:'#F97316', border:'#FED7AA' },
  'shortlisted':         { bg:'#F0FDF4', text:'#15803D', dot:'#22C55E', border:'#BBF7D0' },
  'interview-scheduled': { bg:'#FAF5FF', text:'#7E22CE', dot:'#A855F7', border:'#E9D5FF' },
  'interviewed':         { bg:'#FAF5FF', text:'#7E22CE', dot:'#A855F7', border:'#E9D5FF' },
  'offer-pending':       { bg:'#FFF7ED', text:'#C2410C', dot:'#F97316', border:'#FED7AA' },
  'offer-made':          { bg:'#F0FDF4', text:'#15803D', dot:'#22C55E', border:'#BBF7D0' },
  'offer-accepted':      { bg:'#ECFDF5', text:'#065F46', dot:'#059669', border:'#A7F3D0' },
  'offer-rejected':      { bg:'#FEF2F2', text:'#DC2626', dot:'#EF4444', border:'#FECACA' },
  'on-hold':             { bg:'#FFFBEB', text:'#B45309', dot:'#F59E0B', border:'#FDE68A' },
  'rejected':            { bg:'#FEF2F2', text:'#DC2626', dot:'#EF4444', border:'#FECACA' },
  'withdrawn':           { bg:'#F9FAFB', text:'#6B7280', dot:'#9CA3AF', border:'#E5E7EB' },
};

export const STATUS_COLORS_DARK: Record<ApplicationStatus, ST> = {
  'applied':             { bg:'#1E3A5F', text:'#60A5FA', dot:'#3B82F6', border:'#1D4ED8' },
  'under-review':        { bg:'#431407', text:'#FB923C', dot:'#F97316', border:'#C2410C' },
  'shortlisted':         { bg:'#052E16', text:'#4ADE80', dot:'#22C55E', border:'#15803D' },
  'interview-scheduled': { bg:'#3B0764', text:'#D8B4FE', dot:'#A855F7', border:'#7E22CE' },
  'interviewed':         { bg:'#3B0764', text:'#D8B4FE', dot:'#A855F7', border:'#7E22CE' },
  'offer-pending':       { bg:'#431407', text:'#FB923C', dot:'#F97316', border:'#C2410C' },
  'offer-made':          { bg:'#052E16', text:'#4ADE80', dot:'#22C55E', border:'#15803D' },
  'offer-accepted':      { bg:'#022C22', text:'#34D399', dot:'#059669', border:'#065F46' },
  'offer-rejected':      { bg:'#450A0A', text:'#F87171', dot:'#EF4444', border:'#DC2626' },
  'on-hold':             { bg:'#451A03', text:'#FCD34D', dot:'#F59E0B', border:'#B45309' },
  'rejected':            { bg:'#450A0A', text:'#F87171', dot:'#EF4444', border:'#DC2626' },
  'withdrawn':           { bg:'#1F2937', text:'#9CA3AF', dot:'#6B7280', border:'#374151' },
};

// ─── Error parser ─────────────────────────────────────────────────────────────

const parseApiError = (e: any): string => {
  const d = e?.response?.data;
  if (!d) return e?.message ?? 'Request failed';
  if (Array.isArray(d.errors))  return d.errors.map((x: any) => x.msg ?? x.message ?? x).filter(Boolean).join('; ');
  if (Array.isArray(d.details)) return d.details.map((x: any) => x.message ?? x.msg ?? x).filter(Boolean).join('; ');
  if (d.message) return d.message;
  return e.message ?? 'Request failed';
};

/** Normalize the two different list response shapes the backend returns */
const normalizeListResponse = (res: any): ApplicationListResponse => ({
  success:    res.success,
  data:       res.data ?? [],
  pagination: res.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
});

// ─── Service ──────────────────────────────────────────────────────────────────

export const applicationService = {

  // ── Candidate ──────────────────────────────────────────────────────────────

  getMyApplications: async (filters?: ApplicationFilters): Promise<ApplicationListResponse> => {
    const res = await apiGet<any>(APPLICATIONS.MY_APPLICATIONS, { params: filters })
      .catch(e => { throw new Error(parseApiError(e)); });
    return normalizeListResponse(res.data);
  },

  /** Simple text-only apply — no file upload from mobile (web handles files) */
  applyForJob: async (jobId: string, data: ApplyJobData): Promise<ApplicationDetailResponse> => {
    const res = await apiPost<ApplicationDetailResponse>(APPLICATIONS.APPLY(jobId), data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data;
  },

  // FIX: uses PUT not POST per applicationRoutes.js
  withdrawApplication: async (applicationId: string): Promise<void> => {
    await apiPut(APPLICATIONS.WITHDRAW(applicationId))
      .catch(e => { throw new Error(parseApiError(e)); });
  },

  getMyCVs: async (): Promise<any[]> => {
    try {
      const res = await apiGet<{ success: boolean; data: { cvs: any[] } }>(APPLICATIONS.MY_CVS);
      return res.data.data?.cvs ?? [];
    } catch { return []; }
  },

  getApplicationStats: async (): Promise<ApplicationStats> => {
    try {
      const res = await apiGet<{ success: boolean; data: { statistics: ApplicationStats } }>(
        APPLICATIONS.STATISTICS
      );
      return res.data.data?.statistics ?? { total: 0 };
    } catch { return { total: 0 }; }
  },

  // ── Company ─────────────────────────────────────────────────────────────

  getCompanyApplications: async (filters?: ApplicationFilters): Promise<ApplicationListResponse> => {
    const res = await apiGet<any>(APPLICATIONS.COMPANY_LIST, { params: filters })
      .catch(e => { throw new Error(parseApiError(e)); });
    return normalizeListResponse(res.data);
  },

  getCompanyApplicationDetails: async (applicationId: string): Promise<ApplicationDetailResponse> => {
    const res = await apiGet<ApplicationDetailResponse>(APPLICATIONS.COMPANY_DETAIL(applicationId))
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data;
  },

  // ── Organization ─────────────────────────────────────────────────────────

  getOrganizationApplications: async (filters?: ApplicationFilters): Promise<ApplicationListResponse> => {
    const res = await apiGet<any>(APPLICATIONS.ORG_LIST, { params: filters })
      .catch(e => { throw new Error(parseApiError(e)); });
    return normalizeListResponse(res.data);
  },

  getOrganizationApplicationDetails: async (applicationId: string): Promise<ApplicationDetailResponse> => {
    const res = await apiGet<ApplicationDetailResponse>(APPLICATIONS.ORG_DETAIL(applicationId))
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data;
  },

  // ── Shared ────────────────────────────────────────────────────────────────

  getJobApplications: async (jobId: string, filters?: ApplicationFilters): Promise<ApplicationListResponse> => {
    const res = await apiGet<any>(APPLICATIONS.JOB_APPLICATIONS(jobId), { params: filters })
      .catch(e => { throw new Error(parseApiError(e)); });
    return normalizeListResponse(res.data);
  },

  updateApplicationStatus: async (
    applicationId: string, data: UpdateStatusData
  ): Promise<ApplicationDetailResponse> => {
    const res = await apiPut<ApplicationDetailResponse>(APPLICATIONS.UPDATE_STATUS(applicationId), data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data;
  },

  addCompanyResponse: async (
    applicationId: string, data: CompanyResponseData
  ): Promise<ApplicationDetailResponse> => {
    const res = await apiPut<ApplicationDetailResponse>(APPLICATIONS.COMPANY_RESPONSE(applicationId), data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data;
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Matches backend business logic: applied + under-review can be withdrawn */
  canWithdraw: (status: ApplicationStatus): boolean =>
    status === 'applied' || status === 'under-review',

  getStatusTheme: (status: ApplicationStatus, isDark: boolean): ST =>
    (isDark ? STATUS_COLORS_DARK : STATUS_COLORS)[status] ?? STATUS_COLORS['withdrawn'],

  getStatusLabel: (status: ApplicationStatus): string =>
    STATUS_LABELS[status] ?? status,
};