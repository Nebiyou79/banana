import { apiGet, apiPost, apiPut } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrganizationProfile {
  email: string;
  foundedYear: any;
  socialMedia: any;
  settings: any;
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
  secondaryPhone?: string;
  address?: string;
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
  secondaryPhone?: string;
  address?: string;
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
  getMyOrganization: async (): Promise<OrganizationProfile | null> => {
    const res = await apiGet<{ success: boolean; data: OrganizationProfile | null }>('/organization');
    return res.data?.data ?? null;
  },

  // POST /organization  → create organization profile
  createOrganization: async (data: Partial<OrganizationProfile>): Promise<OrganizationProfile> => {
    const res = await apiPost<{ success: boolean; data: OrganizationProfile }>('/organization', data);
    return res.data.data;
  },

  // PUT /organization/me  → update current user's org
  updateMyOrganization: async (data: UpdateOrganizationData): Promise<OrganizationProfile> => {
    console.log('📤 Updating organization with data:', data);
    try {
      const res = await apiPut<{ success: boolean; data: OrganizationProfile }>('/organization/me', data);
      console.log('✅ Organization updated successfully:', res.data);
      return res.data.data;
    } catch (error) {
      console.error('❌ Failed to update organization:', error);
      throw error;
    }
  },

  // GET /organization/public/:id  → public org profile (no auth)
  getPublicOrganization: async (id: string): Promise<OrganizationProfile | null> => {
    try {
      const res = await apiGet<{ success: boolean; data: OrganizationProfile }>(`/organization/public/${id}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  },

  // GET /organization/:id  → get org by ID (auth required)
  getOrganizationById: async (id: string): Promise<OrganizationProfile> => {
    const res = await apiGet<{ success: boolean; data: OrganizationProfile }>(`/organization/${id}`);
    return res.data.data;
  },

  // ── Upload methods ────────────────────────────────────────────────────────
  uploadLogo: async (formData: FormData): Promise<{ logoUrl: string }> => {
    const res = await apiPost<{ success: boolean; data: { logoUrl: string; logoPath: string } }>('/organization/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  uploadBanner: async (formData: FormData): Promise<{ bannerUrl: string }> => {
    const res = await apiPost<{ success: boolean; data: { bannerUrl: string; bannerPath: string } }>('/organization/upload/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  deleteLogo: async (): Promise<void> => {
    await apiPost<{ success: boolean }>('/organization/upload/logo', {});
  },

  deleteBanner: async (): Promise<void> => {
    await apiPost<{ success: boolean }>('/organization/upload/banner', {});
  },

  // ── Jobs (via job routes) ──────────────────────────────────────────────────
  getMyJobs: async (): Promise<OrgJob[]> => {
    const res = await apiGet<{ success: boolean; data: OrgJob[] }>('/job/organization/my-jobs');
    return res.data?.data ?? [];
  },

  // ── Applications ──────────────────────────────────────────────────────────
  getApplications: async (): Promise<any[]> => {
    const res = await apiGet<{ success: boolean; data: any[] }>('/applications/organization/applications');
    return res.data?.data ?? [];
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