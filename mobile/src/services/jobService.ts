import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { JOBS } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JobSalary {
  min?: number;
  max?: number;
  currency: string;
  negotiable: boolean;
  mode?: 'range' | 'negotiable' | 'hidden' | 'company_scale';
  display?: string;
}

export interface JobLocation {
  city?: string;
  region?: string;
  country?: string;
  remote: boolean;
}

export interface JobCompany {
  _id: string;
  name: string;
  logoUrl?: string;
  logo?: string;
  verified?: boolean;
  industry?: string;
}

export interface JobApplicationInfo {
  isApplyEnabled: boolean;
  canApply: boolean;
  candidatesNeeded?: number;
  applicationCount?: number;
  status?: string;
}

export interface Job {
  _id: string;
  title: string;
  category: string;
  jobType: string;      // full-time | part-time | contract | internship | freelance
  description: string;
  requirements: string[];
  skills: string[];
  salary: JobSalary;
  location: JobLocation;
  experienceLevel: string; // entry | mid | senior | executive
  educationLevel?: string;
  applicationDeadline?: string;
  company?: JobCompany;
  organization?: JobCompany;
  isApplyEnabled: boolean;
  status: 'active' | 'inactive' | 'draft' | 'expired' | 'paused' | 'closed' | 'archived';
  createdAt: string;
  updatedAt?: string;
  savedCount?: number;
  applicantCount?: number;
  applicationCount?: number;
  isSaved?: boolean;
  featured?: boolean;
  urgent?: boolean;
  salaryDisplay?: string;
  applicationInfo?: JobApplicationInfo;
}

export interface JobFilters {
  search?: string;
  category?: string;
  jobType?: string;
  region?: string;
  experienceLevel?: string;
  educationLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  remote?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateJobData {
  title: string;
  category: string;
  jobType: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  salary?: Partial<JobSalary>;
  location?: Partial<JobLocation>;
  experienceLevel: string;
  educationLevel?: string;
  applicationDeadline?: string;
  isApplyEnabled?: boolean;
  status?: string;
  candidatesNeeded?: number;
  salaryMode?: string;
}

export interface JobListResponse {
  jobs: Job[];
  pagination: {
    current: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage?: number;
  };
}

// categories returns Array<{ _id: string; count: number }>
export type JobCategory = { _id: string; count: number };

// ─── Service ──────────────────────────────────────────────────────────────────

export const jobService = {

  // ── Public ─────────────────────────────────────────────────────────────────

  getJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.LIST,
      { params: filters }
    );
    return { jobs: res.data.data ?? [], pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 } };
  },

  getJob: async (id: string): Promise<Job> => {
    const res = await apiGet<{ success: boolean; data: Job }>(JOBS.DETAIL(id));
    return res.data.data;
  },

  // GET /job/categories → [{ _id: string, count: number }]
  getCategories: async (): Promise<JobCategory[]> => {
    const res = await apiGet<{ success: boolean; data: JobCategory[] }>(JOBS.CATEGORIES);
    return res.data.data ?? [];
  },

  // ── Candidate ──────────────────────────────────────────────────────────────

  getJobsForCandidate: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.CANDIDATE_JOBS,
      { params: filters }
    );
    return { jobs: res.data.data ?? [], pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 } };
  },

  // GET /job/saved/jobs → data: Job[]  (no pagination)
  getSavedJobs: async (): Promise<Job[]> => {
    const res = await apiGet<{ success: boolean; data: Job[] }>(JOBS.SAVED_JOBS);
    return res.data.data ?? [];
  },

  saveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.SAVE(jobId));
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.UNSAVE(jobId));
  },

  // ── Company ────────────────────────────────────────────────────────────────

  getCompanyJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.COMPANY_JOBS,
      { params: filters }
    );
    return { jobs: res.data.data ?? [], pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 } };
  },

  createJob: async (data: CreateJobData): Promise<Job> => {
    const res = await apiPost<{ success: boolean; data: Job }>(JOBS.CREATE, data);
    return res.data.data;
  },

  updateJob: async (id: string, data: Partial<CreateJobData>): Promise<Job> => {
    const res = await apiPut<{ success: boolean; data: Job }>(JOBS.UPDATE(id), data);
    return res.data.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiDelete(JOBS.DELETE(id));
  },

  // ── Organization ───────────────────────────────────────────────────────────

  getOrganizationJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.ORG_JOBS,
      { params: filters }
    );
    return { jobs: res.data.data ?? [], pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 } };
  },

  createOrganizationJob: async (data: CreateJobData): Promise<Job> => {
    const res = await apiPost<{ success: boolean; data: Job }>(JOBS.CREATE_ORG, data);
    return res.data.data;
  },

  updateOrganizationJob: async (id: string, data: Partial<CreateJobData>): Promise<Job> => {
    const res = await apiPut<{ success: boolean; data: Job }>(JOBS.UPDATE_ORG(id), data);
    return res.data.data;
  },

  deleteOrganizationJob: async (id: string): Promise<void> => {
    await apiDelete(JOBS.DELETE_ORG(id));
  },

  // ── Helpers ────────────────────────────────────────────────────────────────

  getCompanyName: (job: Job): string => {
    return job.company?.name ?? job.organization?.name ?? 'Unknown';
  },

  getCompanyLogo: (job: Job): string | undefined => {
    return job.company?.logoUrl ?? job.company?.logo ?? job.organization?.logoUrl ?? job.organization?.logo;
  },

  isOwnedByOrg: (job: Job): boolean => !!job.organization,
};
