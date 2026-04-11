import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../lib/api';
import { JOBS, APPLICATIONS } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyJob {
  _id: string;
  title: string;
  status: 'active' | 'inactive' | 'draft' | 'expired';
  applicantCount: number;
  deadline?: string;
  createdAt: string;
  jobType: string;
  location: string;
}

export interface CompanyStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  shortlisted: number;
  hired: number;
}

export interface CompanyApplication {
  _id: string;
  candidate: { _id: string; name: string; avatar?: string; email: string };
  job: { _id: string; title: string };
  status: string;
  appliedAt: string;
  coverLetter?: string;
}

// ─── Company Service ──────────────────────────────────────────────────────────

export const companyService = {
  getMyJobs: async (): Promise<CompanyJob[]> => {
    const res = await apiGet<{ success: boolean; data: CompanyJob[] }>(JOBS.COMPANY_JOBS);
    return res.data.data ?? [];
  },

  getApplications: async (params?: { jobId?: string; status?: string }): Promise<CompanyApplication[]> => {
    const res = await apiGet<{ success: boolean; data: CompanyApplication[] }>(
      APPLICATIONS.COMPANY_LIST,
      { params }
    );
    return res.data.data ?? [];
  },

  updateApplicationStatus: async (
    appId: string,
    status: string,
    notes?: string
  ): Promise<void> => {
    await apiPatch(APPLICATIONS.UPDATE_STATUS(appId), { status, notes });
  },

  // Stats are derived from jobs + applications in the dashboard
  getDashboardStats: async (): Promise<CompanyStats> => {
    const [jobs, apps] = await Promise.all([
      companyService.getMyJobs(),
      companyService.getApplications(),
    ]);
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'active').length,
      totalApplications: apps.length,
      newApplications: apps.filter((a) => a.status === 'pending').length,
      shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
      hired: apps.filter((a) => a.status === 'hired').length,
    };
  },
};

// ─── Organization Service ─────────────────────────────────────────────────────

export interface OrgJob {
  _id: string;
  title: string;
  status: string;
  applicantCount: number;
  deadline?: string;
  createdAt: string;
}

export interface OrgStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
}

export const organizationService = {
  getMyJobs: async (): Promise<OrgJob[]> => {
    const res = await apiGet<{ success: boolean; data: OrgJob[] }>(JOBS.ORG_JOBS);
    return res.data.data ?? [];
  },

  getApplications: async (): Promise<CompanyApplication[]> => {
    const res = await apiGet<{ success: boolean; data: CompanyApplication[] }>(
      APPLICATIONS.ORG_LIST
    );
    return res.data.data ?? [];
  },

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
};
