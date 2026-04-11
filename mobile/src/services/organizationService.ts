import { apiGet, apiPost, apiPut } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrganizationProfile {
  _id: string;
  user: { _id: string; name: string; email: string };
  name: string;
  description?: string;
  industry?: string;
  organizationType?: 'non-profit' | 'government' | 'educational' | 'healthcare' | 'other';
  size?: string;
  founded?: string;
  headquarters?: string;
  website?: string;
  phone?: string;
  registrationNumber?: string;
  logoUrl?: string;
  bannerUrl?: string;
  mission?: string;
  values?: string[];
  specialties?: string[];
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  industry?: string;
  organizationType?: string;
  size?: string;
  founded?: string;
  headquarters?: string;
  website?: string;
  phone?: string;
  registrationNumber?: string;
  mission?: string;
  values?: string[];
  specialties?: string[];
}

export interface OrgStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
}

export interface OrgJob {
  _id: string;
  title: string;
  status: string;
  applicantCount: number;
  deadline?: string;
  location?: string;
  jobType?: string;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const organizationService = {
  // GET /organization  → current user's org
  getMyOrganization: async (): Promise<OrganizationProfile> => {
    const res = await apiGet<{ success: boolean; data: OrganizationProfile }>('/organization');
    return res.data.data;
  },

  // PUT /organization/me
  updateMyOrganization: async (data: UpdateOrganizationData): Promise<OrganizationProfile> => {
    const res = await apiPut<{ success: boolean; data: OrganizationProfile }>('/organization/me', data);
    return res.data.data;
  },

  // GET /organization/public/:id
  getPublicOrganization: async (id: string): Promise<OrganizationProfile | null> => {
    try {
      const res = await apiGet<{ success: boolean; data: OrganizationProfile }>(`/organization/public/${id}`);
      return res.data.data ?? null;
    } catch {
      return null;
    }
  },

  // ── Jobs (via job routes) ──────────────────────────────────────────────────
  getMyJobs: async (): Promise<OrgJob[]> => {
    const res = await apiGet<{ success: boolean; data: OrgJob[] }>('/job/organization/my-jobs');
    return res.data.data ?? [];
  },

  // ── Applications ──────────────────────────────────────────────────────────
  getApplications: async (): Promise<any[]> => {
    const res = await apiGet<{ success: boolean; data: any[] }>('/applications/organization/applications');
    return res.data.data ?? [];
  },

  // ── Computed stats ────────────────────────────────────────────────────────
  getDashboardStats: async (): Promise<OrgStats> => {
    const [jobs, apps] = await Promise.all([
      organizationService.getMyJobs(),
      organizationService.getApplications(),
    ]);
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'active').length,
      totalApplications: apps.length,
      newApplications: apps.filter((a: any) => a.status === 'pending').length,
    };
  },

  // ── Helpers ───────────────────────────────────────────────────────────────
  getOrganizationTypeLabel: (type?: string): string => {
    const map: Record<string, string> = {
      'non-profit':  'Non-Profit Organization',
      'government':  'Government Agency',
      'educational': 'Educational Institution',
      'healthcare':  'Healthcare Organization',
      'other':       'Other',
    };
    return type ? map[type] ?? type : 'Not specified';
  },

  getOrganizationTypeOptions: () => [
    { value: 'non-profit',  label: 'Non-Profit Organization' },
    { value: 'government',  label: 'Government Agency' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'healthcare',  label: 'Healthcare Organization' },
    { value: 'other',       label: 'Other' },
  ],
};
