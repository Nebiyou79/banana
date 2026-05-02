/**
 * companyService.ts + organizationService.ts
 * Matches backend: companyController.js + organizationController.js
 */
import api, { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../lib/api';
import { JOBS, APPLICATIONS } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyProfile {
  size: string;
  email: string;
  location: any;
  foundedYear: any;
  socialLinks: any;
  benefits: never[];
  isHiring: boolean;
  _id: string;
  name: string;
  tin?: string;
  industry?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  verified: boolean;
  user: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfileUpdate {
  name?: string;
  tin?: string;
  industry?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
}

export interface CompanyJob {
  _id: string;
  title: string;
  status: 'active' | 'inactive' | 'draft' | 'expired' | 'closed';
  applicationCount?: number;
  viewCount?: number;
  deadline?: string;
  createdAt: string;
  jobType?: string;
  opportunityType?: string;
  location?: Record<string, string>;
  salary?: { min?: number; max?: number; currency?: string };
}
export interface CompanySearchResult {
  _id: string;
  name: string;
  logo?: string;
  industry?: string;
  verified?: boolean;
  /** Optional location string for disambiguating same-name companies. */
  location?: string;
}
export interface CompanyApplication {
  _id: string;
  candidate: { _id: string; name: string; avatar?: string; email: string };
  job: { _id: string; title: string };
  status: string;
  appliedAt: string;
  coverLetter?: string;
}
 
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
 
interface PaginatedEnvelope<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: { page: number; limit: number; total: number };
}
export interface CompanyStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  shortlisted: number;
  hired: number;
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

interface ApiResp<T> {
  success: boolean;
  data: T;
  message?: string;
}
const BASE = '/company'
// ─── Company Service ──────────────────────────────────────────────────────────

export const companyService = {
  // GET /company
  getMyCompany: async (): Promise<CompanyProfile | null> => {
    try {
      const res = await apiGet<ApiResp<CompanyProfile | null>>('/company');
      if (!res.data.success) return null;
      return res.data.data ?? null;
    } catch {
      return null;
    }
  },

  // POST /company
  createCompany: async (data: CompanyProfileUpdate): Promise<CompanyProfile> => {
    const res = await api.post<ApiResp<CompanyProfile>>('/company', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to create company profile');
    }
    return res.data.data;
  },

  // PUT /company/me
  updateMyCompany: async (data: CompanyProfileUpdate): Promise<CompanyProfile> => {
    const res = await api.put<ApiResp<CompanyProfile>>('/company/me', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to update company profile');
    }
    return res.data.data;
  },

  // GET /company/:id
  getCompany: async (id: string): Promise<CompanyProfile> => {
    const res = await apiGet<ApiResp<CompanyProfile>>(`/company/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Company not found');
    }
    return res.data.data;
  },

  // GET /company/public/:id
  getPublicCompany: async (id: string): Promise<CompanyProfile | null> => {
    try {
      const res = await apiGet<ApiResp<CompanyProfile>>(`/company/public/${id}`);
      if (!res.data.success) return null;
      return res.data.data ?? null;
    } catch {
      return null;
    }
  },

  // GET /job/company/my-jobs
  getMyJobs: async (): Promise<CompanyJob[]> => {
    try {
      const res = await apiGet<ApiResp<CompanyJob[]>>(JOBS.COMPANY_JOBS);
      return res.data.data ?? [];
    } catch {
      return [];
    }
  },

  // GET /applications/company/applications
  getApplications: async (params?: { jobId?: string; status?: string }): Promise<CompanyApplication[]> => {
    try {
      const res = await apiGet<ApiResp<CompanyApplication[]>>(APPLICATIONS.COMPANY_LIST, { params });
      return res.data.data ?? [];
    } catch {
      return [];
    }
  },

  // PATCH /applications/:id/status
  updateApplicationStatus: async (appId: string, status: string, notes?: string): Promise<void> => {
    await api.patch(APPLICATIONS.UPDATE_STATUS(appId), { status, notes });
  },

  // Derived dashboard stats
  getDashboardStats: async (): Promise<CompanyStats> => {
    const [jobs, apps] = await Promise.all([
      companyService.getMyJobs(),
      companyService.getApplications(),
    ]);
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalApplications: apps.length,
      newApplications: apps.filter(a => a.status === 'pending').length,
      shortlisted: apps.filter(a => a.status === 'shortlisted').length,
      hired: apps.filter(a => a.status === 'hired').length,
    };
  },

  canCreate: (userRole: string, hasCompanyProfile: boolean): boolean =>
    userRole === 'company' && !hasCompanyProfile,

/**
   * Prefix-search by name. Returns up to `limit` lightweight company
   * summaries suitable for autocomplete UIs.
   */
  searchCompanies: async (
    query: string,
    limit: number = 20,
  ): Promise<CompanySearchResult[]> => {
    const params = new URLSearchParams();
    if (query.trim()) params.append('search', query.trim());
    params.append('limit', String(limit));
    const response = await api.get<PaginatedEnvelope<CompanySearchResult>>(
      `${BASE}?${params.toString()}`,
    );
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to search companies');
    }
    return Array.isArray(response.data.data) ? response.data.data : [];
  },
 
  /**
   * Hydrate a single company by id. Used to convert ids → display names
   * after the form has stored only ids in `invitedCompanies`.
   */
  getCompanyById: async (id: string): Promise<CompanyProfile> => {
    const response = await api.get<ApiEnvelope<CompanyProfile>>(`${BASE}/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to load company');
    }
    return response.data.data;
  },
 
  /**
   * Batch-resolve a set of company ids. Falls back to N parallel requests
   * if the backend doesn't support a batch endpoint.
   */
  getCompaniesByIds: async (ids: string[]): Promise<CompanyProfile[]> => {
    if (ids.length === 0) return [];
    try {
      const params = new URLSearchParams();
      ids.forEach((id) => params.append('ids[]', id));
      const response = await api.get<PaginatedEnvelope<CompanyProfile>>(
        `${BASE}/batch?${params.toString()}`,
      );
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      /* fall through to per-id resolution */
    }
    const results = await Promise.allSettled(ids.map((id) => companyService.getCompanyById(id)));
    return results
      .filter((r): r is PromiseFulfilledResult<CompanyProfile> => r.status === 'fulfilled')
      .map((r) => r.value);
  },
};
// ─── Organization Types ───────────────────────────────────────────────────────

export interface OrganizationProfile {
  _id: string;
  name: string;
  registrationNumber?: string;
  organizationType?: 'non-profit' | 'government' | 'educational' | 'healthcare' | 'other';
  industry?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  secondaryPhone?: string;
  website?: string;
  mission?: string;
  verified: boolean;
  user: { _id: string; name: string; email: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationProfileUpdate {
  name?: string;
  registrationNumber?: string;
  organizationType?: 'non-profit' | 'government' | 'educational' | 'healthcare' | 'other';
  industry?: string;
  description?: string;
  address?: string;
  phone?: string;
  secondaryPhone?: string;
  website?: string;
  mission?: string;
}

export interface OrgJob {
  _id: string;
  title: string;
  status: string;
  applicationCount?: number;
  viewCount?: number;
  deadline?: string;
  createdAt: string;
  opportunityType?: 'job' | 'volunteer' | 'internship' | 'training';
}

export interface OrgStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
}

// ─── Organization Service ─────────────────────────────────────────────────────

export const organizationService = {
  // GET /organization
  getMyOrganization: async (): Promise<OrganizationProfile | null> => {
    try {
      const res = await apiGet<ApiResp<OrganizationProfile | null>>('/organization');
      if (!res.data.success) return null;
      return res.data.data ?? null;
    } catch {
      return null;
    }
  },

  // POST /organization
  createOrganization: async (data: OrganizationProfileUpdate): Promise<OrganizationProfile> => {
    const res = await api.post<ApiResp<OrganizationProfile>>('/organization', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to create organization');
    }
    return res.data.data;
  },

  // PUT /organization/me
  updateMyOrganization: async (data: OrganizationProfileUpdate): Promise<OrganizationProfile> => {
    const res = await api.put<ApiResp<OrganizationProfile>>('/organization/me', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to update organization');
    }
    return res.data.data;
  },

  // GET /organization/:id
  getOrganization: async (id: string): Promise<OrganizationProfile> => {
    const res = await apiGet<ApiResp<OrganizationProfile>>(`/organization/${id}`);
    if (!res.data.success || !res.data.data) throw new Error('Organization not found');
    return res.data.data;
  },

  // GET /organization/public/:id
  getPublicOrganization: async (id: string): Promise<OrganizationProfile | null> => {
    try {
      const res = await apiGet<ApiResp<OrganizationProfile>>(`/organization/public/${id}`);
      if (!res.data.success) return null;
      return res.data.data ?? null;
    } catch {
      return null;
    }
  },

  // GET /job/organization/my-jobs
  getMyJobs: async (): Promise<OrgJob[]> => {
    try {
      const res = await apiGet<ApiResp<OrgJob[]>>(JOBS.ORG_JOBS);
      return res.data.data ?? [];
    } catch {
      return [];
    }
  },

  // GET /applications/organization/applications
  getApplications: async (): Promise<CompanyApplication[]> => {
    try {
      const res = await apiGet<ApiResp<CompanyApplication[]>>(APPLICATIONS.ORG_LIST);
      return res.data.data ?? [];
    } catch {
      return [];
    }
  },

  getDashboardStats: async (): Promise<OrgStats> => {
    const [jobs, apps] = await Promise.all([
      organizationService.getMyJobs(),
      organizationService.getApplications(),
    ]);
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalApplications: apps.length,
      newApplications: apps.filter((a: any) => a.status === 'pending').length,
    };
  },

  getOrganizationTypeLabel: (type?: string): string => {
    const map: Record<string, string> = {
      'non-profit': 'Non-Profit',
      government: 'Government',
      educational: 'Educational',
      healthcare: 'Healthcare',
      other: 'Other',
    };
    return type ? map[type] ?? type : '';
  },

  canCreate: (userRole: string, hasOrgProfile: boolean): boolean =>
    userRole === 'organization' && !hasOrgProfile,
};
