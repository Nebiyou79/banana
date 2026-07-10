/**
 * src/services/applicationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AVATAR FIX — Application.job.company and Application.job.organization now
 * include all avatar field names (avatar, avatarUrl, profileImage, avatarPublicId)
 * that the fixed backend populate projections return.
 *
 * AVATAR FIX — Application.job now includes ownerPreview (new backend field).
 *
 * All prior logic (file download, buildAttachments, service methods) is
 * preserved unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import  httpClient  from '../lib/httpClient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ─── Constants ────────────────────────────────────────────────────────────────

export const APPLICATIONS = {
  MY_CVS:           '/applications/my-cvs',
  MY_APPLICATIONS:  '/applications/my-applications',
  APPLY:            (jobId: string) => `/applications/apply/${jobId}`,
  WITHDRAW:         (id: string)    => `/applications/${id}/withdraw`,
  STATISTICS:       '/applications/statistics/overview',
  COMPANY_LIST:     '/applications/company/applications',
  COMPANY_DETAIL:   (id: string)    => `/applications/company/${id}`,
  ORG_LIST:         '/applications/organization/applications',
  ORG_DETAIL:       (id: string)    => `/applications/organization/${id}`,
  JOB_LIST:         (jobId: string) => `/applications/job/${jobId}`,
  UPDATE_STATUS:    (id: string)    => `/applications/${id}/status`,
  COMPANY_RESPONSE: (id: string)    => `/applications/${id}/company-response`,
  ATTACHMENTS:      (id: string)    => `/applications/${id}/attachments`,
  FILE_DOWNLOAD:    (appId: string, fileId: string) => `/applications/${appId}/files/${fileId}/download`,
  FILE_VIEW:        (appId: string, fileId: string) => `/applications/${appId}/files/${fileId}/view`,
  BY_ID:            (id: string)    => `/applications/${id}`,
} as const;

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'applied' | 'under-review' | 'shortlisted' | 'interview-scheduled'
  | 'interviewed' | 'offer-pending' | 'offer-made' | 'offer-accepted'
  | 'offer-rejected' | 'on-hold' | 'rejected' | 'withdrawn';

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

export const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; dot: string; border: string }> = {
  'applied':              { bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6', border: '#BFDBFE' },
  'under-review':         { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B', border: '#FDE68A' },
  'shortlisted':          { bg: '#D1FAE5', text: '#059669', dot: '#10B981', border: '#A7F3D0' },
  'interview-scheduled':  { bg: '#EDE9FE', text: '#7C3AED', dot: '#8B5CF6', border: '#DDD6FE' },
  'interviewed':          { bg: '#E0E7FF', text: '#4338CA', dot: '#6366F1', border: '#C7D2FE' },
  'offer-pending':        { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316', border: '#FED7AA' },
  'offer-made':           { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', border: '#A7F3D0' },
  'offer-accepted':       { bg: '#D1FAE5', text: '#065F46', dot: '#059669', border: '#A7F3D0' },
  'offer-rejected':       { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444', border: '#FECACA' },
  'on-hold':              { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8', border: '#E2E8F0' },
  'rejected':             { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444', border: '#FECACA' },
  'withdrawn':            { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', border: '#E2E8F0' },
};

export const STATUS_COLORS_DARK: typeof STATUS_COLORS = {
  'applied':              { bg: '#1E3A5F', text: '#93C5FD', dot: '#3B82F6', border: '#1E40AF' },
  'under-review':         { bg: '#451A03', text: '#FCD34D', dot: '#F59E0B', border: '#78350F' },
  'shortlisted':          { bg: '#064E3B', text: '#6EE7B7', dot: '#10B981', border: '#065F46' },
  'interview-scheduled':  { bg: '#2E1065', text: '#C4B5FD', dot: '#8B5CF6', border: '#4C1D95' },
  'interviewed':          { bg: '#1E1B4B', text: '#A5B4FC', dot: '#6366F1', border: '#312E81' },
  'offer-pending':        { bg: '#431407', text: '#FDBA74', dot: '#F97316', border: '#7C2D12' },
  'offer-made':           { bg: '#022C22', text: '#6EE7B7', dot: '#10B981', border: '#064E3B' },
  'offer-accepted':       { bg: '#022C22', text: '#6EE7B7', dot: '#059669', border: '#064E3B' },
  'offer-rejected':       { bg: '#450A0A', text: '#FCA5A5', dot: '#EF4444', border: '#7F1D1D' },
  'on-hold':              { bg: '#0F172A', text: '#94A3B8', dot: '#64748B', border: '#1E293B' },
  'rejected':             { bg: '#450A0A', text: '#FCA5A5', dot: '#EF4444', border: '#7F1D1D' },
  'withdrawn':            { bg: '#0F172A', text: '#94A3B8', dot: '#64748B', border: '#1E293B' },
};

// ─── Data Interfaces ──────────────────────────────────────────────────────────

export interface CV {
  _id: string;
  filename: string;
  originalName: string;
  path?: string;
  size?: number;
  fileSize?: number;
  mimetype?: string;
  url?: string;
  downloadUrl?: string;
  viewUrl?: string;
  uploadedAt?: string;
  isDefault?: boolean;
  isPrimary?: boolean;
  description?: string;
}

export interface Reference {
  _id?: string;
  _tempId?: string;
  name?: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  allowsContact?: boolean;
  notes?: string;
  providedAsDocument: boolean;
  document?: {
    _id?: string; filename?: string; originalName?: string;
    url?: string; downloadUrl?: string; size?: number; mimetype?: string;
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
    _id?: string; filename?: string; originalName?: string;
    url?: string; downloadUrl?: string; size?: number; mimetype?: string;
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
    date: string; time?: string; location: string;
    type: 'phone' | 'video' | 'in-person' | 'technical';
    interviewer: string; notes?: string; duration?: number;
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
  interviewDetails?: { date: string; location: string; type: string; time?: string };
}

/**
 * AVATAR FIX — Extended company/org interface with all avatar fields.
 * Previously only had logoUrl — the fixed backend populate projection now
 * also returns: avatar, avatarUrl, profileImage, avatarPublicId, user.
 */
export interface ApplicationJobOwner {
  _id: string;
  name: string;
  // Avatar fields — all may be present depending on populate projection
  logoUrl?: string;
  logo?: string;
  avatar?: string;
  avatarUrl?: string;
  profileImage?: string;
  avatarPublicId?: string;
  // Metadata
  verified: boolean;
  industry?: string;
  organizationType?: string;
  website?: string;
  user?: string;
}

/**
 * AVATAR FIX — Backend-synthesised owner preview.
 * Always contains a correctly-resolved logoUrl from Profile.avatar.secure_url.
 */
export interface ApplicationJobOwnerPreview {
  _id?: string;
  type: 'company' | 'organization';
  name: string;
  logoUrl?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  verified?: boolean;
  industry?: string;
}

export interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    description?: string;
    location?: any;
    jobType: 'company' | 'organization';
    // AVATAR FIX — use extended ApplicationJobOwner instead of the minimal inline type
    company?:      ApplicationJobOwner;
    organization?: ApplicationJobOwner;
    /**
     * AVATAR FIX — new field from fixed backend.
     * Always present in responses from the fixed applicationController.
     * Components should prefer this for avatar resolution.
     */
    ownerPreview?: ApplicationJobOwnerPreview;
  };
  candidate: {
    _id: string; name: string; email: string;
    avatar?: string; phone?: string; location?: string;
  };
  userInfo: UserInfo;
  selectedCVs: Array<{
    cvId: string; _id?: string; filename: string; originalName: string;
    url: string; downloadUrl?: string; viewUrl?: string;
    size?: number; mimetype?: string; filePath?: string; path?: string;
  }>;
  coverLetter: string;
  skills: string[];
  references: Reference[];
  workExperience: WorkExperience[];
  contactInfo: ContactInfo;
  attachments: {
    referenceDocuments: any[];
    experienceDocuments: any[];
    portfolioFiles: any[];
    otherDocuments: any[];
  };
  status: ApplicationStatus | string;
  statusHistory: StatusHistory[];
  companyResponse?: CompanyResponse;
  createdAt: string;
  updatedAt: string;
}

// ─── Request / Response types ─────────────────────────────────────────────────

export interface ApplyJobData {
  coverLetter: string;
  skills: string[];
  selectedCVs: Array<{
    cvId: string; filename?: string; originalName?: string;
    url?: string; downloadUrl?: string; size?: number; mimetype?: string;
  }>;
  contactInfo: ContactInfo;
  userInfo?: UserInfo;
  references?: Reference[];
  workExperience?: WorkExperience[];
  referenceFiles?: Array<{ uri: string; name: string; type: string; _tempId: string }>;
  experienceFiles?: Array<{ uri: string; name: string; type: string; _tempId: string }>;
}

export interface UpdateStatusData {
  status: string;
  message?: string;
  interviewDetails?: {
    date: string; location: string; type: string;
    interviewer?: string; notes?: string; duration?: number;
  };
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

export interface NormalizedAttachment {
  id: string;
  name: string;
  originalName: string;
  category: 'CV' | 'Reference' | 'Experience' | 'Other';
  description: string;
  sizeLabel: string;
  fileType: string;
  uploadedAt: string;
  applicationId: string;
  fileId: string;
  cvId?: string;
  mimetype?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateTempId = () =>
  `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parseError = (e: any): string => {
  const d = e?.response?.data;
  if (!d) return e?.message ?? 'Request failed';
  if (Array.isArray(d.errors))
    return d.errors.map((x: any) => x.msg ?? x.message ?? x).join('; ');
  return d.message ?? e.message ?? 'Request failed';
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getCVDisplayName = (cv: CV): string =>
  cv.originalName ?? cv.filename ?? 'CV Document';

export const buildAttachments = (application: Application): NormalizedAttachment[] => {
  const list: NormalizedAttachment[] = [];
  const appId = application._id;

  (application.selectedCVs ?? []).forEach((cv, i) => {
    const realId = cv._id ?? cv.cvId;
    if (!realId) return;
    list.push({
      id: `cv-${i}`,
      name: cv.originalName ?? cv.filename ?? 'CV',
      originalName: cv.originalName ?? cv.filename ?? 'CV',
      category: 'CV',
      description: 'Curriculum Vitae',
      sizeLabel: formatFileSize(cv.size),
      fileType: cv.mimetype?.includes('pdf') ? 'PDF' : 'Document',
      uploadedAt: application.createdAt,
      applicationId: appId,
      fileId: realId,
      cvId: cv.cvId,
      mimetype: cv.mimetype,
    });
  });

  (application.references ?? []).forEach((ref, i) => {
    if (!ref.document?._id) return;
    list.push({
      id: `ref-${i}`,
      name: ref.document.originalName ?? ref.document.filename ?? 'Reference Document',
      originalName: ref.document.originalName ?? ref.document.filename ?? 'Reference',
      category: 'Reference',
      description: ref.name ? `Reference from ${ref.name}` : 'Reference Document',
      sizeLabel: formatFileSize(ref.document.size),
      fileType: ref.document.mimetype?.includes('pdf') ? 'PDF' : 'Document',
      uploadedAt: application.createdAt,
      applicationId: appId,
      fileId: ref.document._id,
      mimetype: ref.document.mimetype,
    });
  });

  (application.workExperience ?? []).forEach((exp, i) => {
    if (!exp.document?._id) return;
    list.push({
      id: `exp-${i}`,
      name: exp.document.originalName ?? exp.document.filename ?? 'Experience Document',
      originalName: exp.document.originalName ?? exp.document.filename ?? 'Experience',
      category: 'Experience',
      description: exp.company ? `Experience at ${exp.company}` : 'Work Experience Document',
      sizeLabel: formatFileSize(exp.document.size),
      fileType: exp.document.mimetype?.includes('pdf') ? 'PDF' : 'Document',
      uploadedAt: application.createdAt,
      applicationId: appId,
      fileId: exp.document._id,
      mimetype: exp.document.mimetype,
    });
  });

  return list;
};

// ─── File download ────────────────────────────────────────────────────────────

export const downloadAndShare = async (
  applicationId: string,
  fileId: string,
  fileName: string,
  getAuthToken: () => string | null,
): Promise<void> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const baseUrl = (httpClient.defaults.baseURL ?? '').replace(/\/$/, '');
  const url = `${baseUrl}${APPLICATIONS.FILE_DOWNLOAD(applicationId, fileId)}`;
  const dest = FileSystem.cacheDirectory + encodeURIComponent(fileName);

  const downloadResumable = FileSystem.createDownloadResumable(
    url, dest, { headers: { Authorization: `Bearer ${token}` } },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error('Download failed — no URI returned');

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: `Save ${fileName}`,
      UTI: 'public.data',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
};

// ─── Service object ───────────────────────────────────────────────────────────

export const applicationService = {

  // ── Candidate ─────────────────────────────────────────────────────────────

  getMyCVs: async (): Promise<CV[]> => {
    try {
      const res = await httpClient.get<{ success: boolean; data: { cvs: CV[] } | CV[] }>(
        APPLICATIONS.MY_CVS
      );
      const payload = res.data.data;
      if (Array.isArray(payload)) return payload;
      return (payload as any)?.cvs ?? [];
    } catch {
      return [];
    }
  },

  getMyApplications: async (params?: ApplicationFilters): Promise<ApplicationsListResponse> => {
    const res = await httpClient
      .get<ApplicationsListResponse>(APPLICATIONS.MY_APPLICATIONS, { params })
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  applyForJob: async (jobId: string, data: ApplyJobData): Promise<ApplicationResponse> => {
    const formData = new FormData();

    formData.append('coverLetter', data.coverLetter);
    formData.append('skills', JSON.stringify(data.skills ?? []));
    formData.append('selectedCVs', JSON.stringify(
      data.selectedCVs.map((cv) => ({
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

    const refs = (data.references ?? []).map((r) => ({
      ...r,
      _tempId: r.providedAsDocument ? (r._tempId ?? generateTempId()) : undefined,
    }));
    formData.append('references', JSON.stringify(refs));

    const exps = (data.workExperience ?? []).map((e) => ({
      ...e,
      _tempId: e.providedAsDocument ? (e._tempId ?? generateTempId()) : undefined,
    }));
    formData.append('workExperience', JSON.stringify(exps));

    (data.referenceFiles ?? []).forEach((f, i) => {
      formData.append('referencePdfs', { uri: f.uri, name: f.name, type: f.type } as any);
      formData.append(`referencePdfs_${i}_tempId`, f._tempId);
      formData.append(`referencePdfs_metadata_${i}`, JSON.stringify({ _tempId: f._tempId, fileName: f.name }));
    });

    (data.experienceFiles ?? []).forEach((f, i) => {
      formData.append('experiencePdfs', { uri: f.uri, name: f.name, type: f.type } as any);
      formData.append(`experiencePdfs_${i}_tempId`, f._tempId);
      formData.append(`experiencePdfs_metadata_${i}`, JSON.stringify({ _tempId: f._tempId, fileName: f.name }));
    });

    const res = await httpClient
      .post<ApplicationResponse>(APPLICATIONS.APPLY(jobId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90_000,
      })
      .catch((e) => { throw new Error(parseError(e)); });

    return res.data;
  },

  withdrawApplication: async (applicationId: string): Promise<void> => {
    await httpClient
      .put(APPLICATIONS.WITHDRAW(applicationId))
      .catch((e) => { throw new Error(parseError(e)); });
  },

  getApplicationStats: async (): Promise<ApplicationStats> => {
    try {
      const res = await httpClient.get<{ success: boolean; data: ApplicationStats }>(
        APPLICATIONS.STATISTICS
      );
      return res.data.data ?? {};
    } catch {
      return {};
    }
  },

  // ── Fetch single application by ID ────────────────────────────────────────

  getById: async (applicationId: string): Promise<Application> => {
    const res = await httpClient
      .get<ApplicationResponse>(APPLICATIONS.BY_ID(applicationId))
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data.data.application;
  },

  // ── Company / Org ──────────────────────────────────────────────────────────

  getCompanyApplications: async (params?: ApplicationFilters): Promise<ApplicationsListResponse> => {
    const res = await httpClient
      .get<ApplicationsListResponse>(APPLICATIONS.COMPANY_LIST, { params })
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  getCompanyApplicationDetails: async (id: string): Promise<ApplicationResponse> => {
    const res = await httpClient
      .get<ApplicationResponse>(APPLICATIONS.COMPANY_DETAIL(id))
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  getOrganizationApplications: async (params?: ApplicationFilters): Promise<ApplicationsListResponse> => {
    const res = await httpClient
      .get<ApplicationsListResponse>(APPLICATIONS.ORG_LIST, { params })
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  getOrganizationApplicationDetails: async (id: string): Promise<ApplicationResponse> => {
    const res = await httpClient
      .get<ApplicationResponse>(APPLICATIONS.ORG_DETAIL(id))
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  getJobApplications: async (
    jobId: string,
    params?: ApplicationFilters,
  ): Promise<ApplicationsListResponse> => {
    const res = await httpClient
      .get<ApplicationsListResponse>(APPLICATIONS.JOB_LIST(jobId), { params })
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  updateApplicationStatus: async (
    applicationId: string,
    data: UpdateStatusData,
  ): Promise<ApplicationResponse> => {
    const res = await httpClient
      .put<ApplicationResponse>(APPLICATIONS.UPDATE_STATUS(applicationId), data)
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  addCompanyResponse: async (
    applicationId: string,
    data: CompanyResponseData,
  ): Promise<ApplicationResponse> => {
    const res = await httpClient
      .put<ApplicationResponse>(APPLICATIONS.COMPANY_RESPONSE(applicationId), data)
      .catch((e) => { throw new Error(parseError(e)); });
    return res.data;
  },

  // ── File helpers ───────────────────────────────────────────────────────────

  buildAttachments,
  formatFileSize,
  getCVDisplayName,
  downloadAndShare,
};