import { apiGet, apiPost, apiPut } from '../lib/api';
import { APPLICATIONS } from '../constants/api';

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

export interface CV {
  _id: string;
  fileName: string;
  originalName?: string;
  fileSize?: number;
  mimeType?: string;
  mimetype?: string;
  isPrimary: boolean;
  uploadedAt: string;
  isGenerated?: boolean;
  fileUrl?: string;
  downloadUrl?: string;
  templateId?: string;
  size?: number;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  location?: string;
  telegram?: string;
}

export interface ApplicationAttachment {
  _id: string;
  fileName?: string;
  filename?: string;
  originalName?: string;
  fileSize?: number;
  size?: number;
  mimeType?: string;
  mimetype?: string;
  fileUrl?: string;
  url?: string;
  uploadedAt: string;
}

export interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    company?: { _id: string; name: string; logo?: string; logoUrl?: string };
    organization?: { _id: string; name: string; logo?: string; logoUrl?: string };
    location?: { city?: string; region?: string; remote?: string };
    jobType?: 'company' | 'organization';
    type?: string;
  };
  candidate?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    headline?: string;
    phone?: string;
    location?: string;
  };
  status: ApplicationStatus;
  coverLetter?: string;
  selectedCVs?: Array<{ cvId: string; filename?: string; originalName?: string }>;
  contactInfo: ContactInfo;
  skills?: string[];
  attachments?: {
    referenceDocuments?: ApplicationAttachment[];
    experienceDocuments?: ApplicationAttachment[];
    portfolioFiles?: ApplicationAttachment[];
    otherDocuments?: ApplicationAttachment[];
  };
  companyResponse?: {
    status?: string;
    message?: string;
    respondedAt?: string;
    interviewLocation?: string;
  };
  statusHistory?: Array<{
    _id?: string;
    status: string;
    changedAt: string;
    message?: string;
    changedBy?: { name?: string };
  }>;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    location?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApplyFormData {
  cvId: string;
  coverLetter?: string;
  contactInfo: ContactInfo;
  skills?: string[];
  additionalFiles?: { uri: string; name: string; type: string }[];
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  jobId?: string;
  page?: number;
  limit?: number;
}

export interface ApplicationStatistics {
  totalApplications?: number;
  total?: number;
  underReview?: number;
  shortlisted?: number;
  interviewScheduled?: number;
  rejected?: number;
  offerMade?: number;
  newApplications?: number;
  jobsPosted?: number;
  successRate?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildApplyFormData = (data: ApplyFormData): FormData => {
  const form = new FormData();
  form.append('selectedCVs', JSON.stringify([{ cvId: data.cvId }]));
  form.append('coverLetter', data.coverLetter ?? '');
  form.append('contactInfo', JSON.stringify(data.contactInfo));
  form.append('skills', JSON.stringify(data.skills ?? []));
  form.append('references', JSON.stringify([]));
  form.append('workExperience', JSON.stringify([]));

  data.additionalFiles?.forEach((file) => {
    form.append('referencePdfs', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
  });

  return form;
};

// ─── Status display helpers ───────────────────────────────────────────────────

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  'applied':             'Applied',
  'under-review':        'Under Review',
  'shortlisted':         'Shortlisted',
  'interview-scheduled': 'Interview Scheduled',
  'interviewed':         'Interviewed',
  'offer-pending':       'Offer Pending',
  'offer-made':          'Offer Made',
  'offer-accepted':      'Offer Accepted',
  'offer-rejected':      'Offer Rejected',
  'on-hold':             'On Hold',
  'rejected':            'Rejected',
  'withdrawn':           'Withdrawn',
};

export const STATUS_COLOR: Record<ApplicationStatus, string> = {
  'applied':             '#3B82F6',
  'under-review':        '#6366F1',
  'shortlisted':         '#14B8A6',
  'interview-scheduled': '#8B5CF6',
  'interviewed':         '#7C3AED',
  'offer-pending':       '#F59E0B',
  'offer-made':          '#F97316',
  'offer-accepted':      '#10B981',
  'offer-rejected':      '#F43F5E',
  'on-hold':             '#64748B',
  'rejected':            '#EF4444',
  'withdrawn':           '#9CA3AF',
};

/** Statuses a company/org can move to from each status */
export const ALLOWED_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  'applied':             ['under-review', 'rejected'],
  'under-review':        ['shortlisted', 'on-hold', 'rejected'],
  'shortlisted':         ['interview-scheduled', 'on-hold', 'rejected'],
  'interview-scheduled': ['interviewed', 'rejected'],
  'interviewed':         ['offer-pending', 'rejected'],
  'offer-pending':       ['offer-made', 'rejected'],
  'offer-made':          ['offer-accepted', 'offer-rejected'],
};

// ─── Service functions ────────────────────────────────────────────────────────

export const applicationService = {
  async getMyCVs(): Promise<CV[]> {
    const res = await apiGet<any>(APPLICATIONS.MY_CVS);
    const data = res.data?.data;
    // Handle both flat array and nested { cvs: [] }
    if (Array.isArray(data)) return data;
    if (data?.cvs) return data.cvs;
    return [];
  },

  async getMyApplications(filters?: ApplicationFilters): Promise<{
    data: Application[];
    pagination: { current: number; totalPages: number; totalResults: number };
  }> {
    const res = await apiGet<any>(APPLICATIONS.MY_APPLICATIONS, { params: filters });
    return {
      data: res.data?.data ?? [],
      pagination: res.data?.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  async applyForJob(jobId: string, formData: ApplyFormData): Promise<Application> {
    const form = buildApplyFormData(formData);
    const res = await apiPost<any>(APPLICATIONS.APPLY(jobId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.application;
  },

  async withdrawApplication(id: string): Promise<void> {
    await apiPut<any>(APPLICATIONS.WITHDRAW(id));
  },

  async getApplicationDetails(id: string): Promise<Application> {
    const res = await apiGet<any>(APPLICATIONS.DETAIL(id));
    return res.data?.data?.application;
  },

  async getCompanyApplications(filters?: ApplicationFilters): Promise<{
    data: Application[];
    pagination: any;
  }> {
    const res = await apiGet<any>(APPLICATIONS.COMPANY_LIST, { params: filters });
    return { data: res.data?.data ?? [], pagination: res.data?.pagination };
  },

  async getCompanyApplicationDetails(id: string): Promise<Application> {
    const res = await apiGet<any>(APPLICATIONS.COMPANY_DETAIL(id));
    return res.data?.data?.application;
  },

  async getOrganizationApplications(filters?: ApplicationFilters): Promise<{
    data: Application[];
    pagination: any;
  }> {
    const res = await apiGet<any>(APPLICATIONS.ORG_LIST, { params: filters });
    return { data: res.data?.data ?? [], pagination: res.data?.pagination };
  },

  async getOrganizationApplicationDetails(id: string): Promise<Application> {
    const res = await apiGet<any>(APPLICATIONS.ORG_DETAIL(id));
    return res.data?.data?.application;
  },

  async getJobApplications(jobId: string, filters?: ApplicationFilters): Promise<{
    data: Application[];
    pagination: any;
  }> {
    const res = await apiGet<any>(APPLICATIONS.JOB_APPLICATIONS(jobId), { params: filters });
    return { data: res.data?.data ?? [], pagination: res.data?.pagination };
  },

  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    message?: string,
  ): Promise<Application> {
    const res = await apiPut<any>(APPLICATIONS.UPDATE_STATUS(id), { status, message });
    return res.data?.data?.application;
  },

  async addCompanyResponse(
    id: string,
    data: { status: string; message?: string; interviewLocation?: string },
  ): Promise<Application> {
    const res = await apiPut<any>(APPLICATIONS.COMPANY_RESPONSE(id), data);
    return res.data?.data?.application;
  },

  async downloadCV(cvId: string): Promise<string> {
    // Returns the download URL for use with expo-file-system
    return APPLICATIONS.DOWNLOAD_CV(cvId);
  },

  async getApplicationStatistics(): Promise<ApplicationStatistics> {
    const res = await apiGet<any>(APPLICATIONS.STATISTICS);
    return res.data?.data?.statistics ?? {};
  },
};
