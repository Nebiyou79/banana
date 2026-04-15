/**
 * mobile/src/services/jobService.ts
 *
 * ── FIXES IN THIS VERSION ────────────────────────────────────────────────────
 * TASK 2 — TypeScript `remote` type mismatch
 *   • JobFilters.remote changed from `string` (required) to `remote?: string`
 *     so callers can omit it without passing `''`.
 *
 * TASK 3 — JobStatus enum conflict
 *   • JobStatus now: 'active' | 'draft' | 'paused' | 'closed' | 'archived' | undefined
 *     (was missing 'paused' and 'closed')
 *   • UpdateJobData is a full Partial<CreateJobData> PLUS an explicit `status`
 *     field so `updateJob` / `updateOrganizationJob` can accept status changes.
 *
 * TASK 4 — All helper functions use optional chaining to handle partial data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import api, { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { JOBS } from '../constants/api';

// ─── Enums / constants ────────────────────────────────────────────────────────

export const JOB_TYPES = [
  { value: 'full-time',   label: 'Full Time' },
  { value: 'part-time',   label: 'Part Time' },
  { value: 'contract',    label: 'Contract' },
  { value: 'internship',  label: 'Internship' },
  { value: 'temporary',   label: 'Temporary' },
  { value: 'volunteer',   label: 'Volunteer' },
  { value: 'remote',      label: 'Remote' },
  { value: 'hybrid',      label: 'Hybrid' },
] as const;

// FIX: 'company-scale' uses hyphen, not underscore
export const SALARY_MODES = [
  { value: 'negotiable',    label: 'Negotiable' },
  { value: 'range',         label: 'Salary Range' },
  { value: 'hidden',        label: 'Hidden' },
  { value: 'company-scale', label: 'Company Scale' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'fresh-graduate', label: 'Fresh Graduate' },
  { value: 'entry-level',    label: 'Entry Level' },
  { value: 'mid-level',      label: 'Mid Level' },
  { value: 'senior-level',   label: 'Senior Level' },
  { value: 'managerial',     label: 'Managerial' },
  { value: 'director',       label: 'Director' },
  { value: 'executive',      label: 'Executive' },
] as const;

export const EDUCATION_LEVELS = [
  { value: 'primary-education',       label: 'Primary Education' },
  { value: 'secondary-education',     label: 'Secondary Education' },
  { value: 'tvet-level-i',            label: 'TVET Level I' },
  { value: 'tvet-level-ii',           label: 'TVET Level II' },
  { value: 'tvet-level-iii',          label: 'TVET Level III' },
  { value: 'tvet-level-iv',           label: 'TVET Level IV' },
  { value: 'tvet-level-v',            label: 'TVET Level V' },
  { value: 'undergraduate-bachelors', label: "Bachelor's Degree" },
  { value: 'postgraduate-masters',    label: "Master's Degree" },
  { value: 'doctoral-phd',            label: 'PhD / Doctoral' },
  { value: 'none-required',           label: 'No Requirement' },
] as const;

/** Must EXACTLY match server/src/models/Job.js location.region enum */
export const ETHIOPIAN_REGIONS = [
  { value: 'addis-ababa',         label: 'Addis Ababa' },
  { value: 'afar',                label: 'Afar' },
  { value: 'amhara',              label: 'Amhara' },
  { value: 'benishangul-gumuz',   label: 'Benishangul-Gumuz' },
  { value: 'dire-dawa',           label: 'Dire Dawa' },
  { value: 'gambela',             label: 'Gambela' },
  { value: 'harari',              label: 'Harari' },
  { value: 'oromia',              label: 'Oromia' },
  { value: 'sidama',              label: 'Sidama' },
  { value: 'snnpr',               label: 'SNNPR' },
  { value: 'somali',              label: 'Somali' },
  { value: 'south-west-ethiopia', label: 'South West Ethiopia' },
  { value: 'tigray',              label: 'Tigray' },
  { value: 'international',       label: 'International' },
] as const;

// ─── Scalar types ─────────────────────────────────────────────────────────────

export type RegionValue          = typeof ETHIOPIAN_REGIONS[number]['value'];
export type SalaryModeValue      = 'range' | 'hidden' | 'negotiable' | 'company-scale';
export type JobTypeValue         = typeof JOB_TYPES[number]['value'];
export type ExperienceLevelValue = typeof EXPERIENCE_LEVELS[number]['value'];

/**
 * TASK 3 FIX — all five valid status strings the backend accepts, plus undefined
 * for "unfiltered" query params.  Previously 'paused' and 'closed' were missing,
 * causing the handleStatusToggle assignment to fail type-checking.
 */
export type JobStatus =
  | 'active'
  | 'draft'
  | 'paused'
  | 'closed'
  | 'archived'
  | undefined;

// Legacy alias kept so existing callers compile without changes
export type JobUpdatePayload = Partial<Pick<Job, 'title' | 'description' | 'status'>>;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;      // required when salaryMode='range'
  period?: string;
  isPublic?: boolean;
  isNegotiable?: boolean;
}

export interface JobLocation {
  region?: RegionValue;
  city?: string;
  subCity?: string;
  woreda?: string;
  specificLocation?: string;
  country?: string;
}

export interface JobOwner {
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
  candidatesRemaining?: number;
  applicationCount?: number;
  status?: { canApply: boolean; message: string; reason: string };
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  /** Employment type ('full-time', 'contract', …) */
  type: JobTypeValue;
  /** Owner type: 'company' | 'organization' */
  jobType: 'company' | 'organization';
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  skills?: string[];
  salary?: JobSalary;
  salaryMode: SalaryModeValue;
  /** Computed virtual from backend — prefer this for display */
  salaryDisplay?: string;
  location: JobLocation;
  remote: 'remote' | 'hybrid' | 'on-site';
  workArrangement?: 'office' | 'field-work' | 'both';
  experienceLevel: ExperienceLevelValue;
  educationLevel?: string;
  /** REQUIRED by backend: min 1 */
  candidatesNeeded: number;
  applicationDeadline?: string;
  company?: JobOwner;
  organization?: JobOwner;
  isApplyEnabled: boolean;
  /** TASK 3 FIX — uses the extended JobStatus type */
  status: JobStatus;
  createdAt: string;
  updatedAt?: string;
  applicationCount?: number;
  viewCount?: number;
  saveCount?: number;
  featured?: boolean;
  urgent?: boolean;
  premium?: boolean;
  tags?: string[];
  applicationInfo?: JobApplicationInfo;
  opportunityType?: 'job' | 'volunteer' | 'internship' | 'fellowship' | 'training' | 'grant' | 'other';
  demographicRequirements?: {
    sex?: 'male' | 'female' | 'any';
    age?: { min?: number; max?: number };
  };
  jobNumber?: string;
}

/**
 * TASK 2 FIX — `remote` is now optional (`remote?: string`).
 * Previously it was a required `string`, which forced callers to pass `''`
 * as a workaround and triggered TS "not assignable" errors in useJobs hooks.
 */
export interface JobFilters {
  /** Work arrangement filter — optional so hooks can omit it */
  remote?: string;
  search?: string;
  category?: string;
  type?: string;
  region?: string;
  experienceLevel?: string;
  educationLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryMode?: string;
  /**
   * TASK 3 FIX — status filter accepts the full JobStatus union minus undefined,
   * so callers can pass 'paused' or 'closed' without a TS error.
   */
  status?: 'active' | 'draft' | 'paused' | 'closed' | 'archived';
  featured?: boolean;
  urgent?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  jobType?: 'company' | 'organization';
}

/**
 * Payload for POST /job — mirrors backend createJobValidation exactly.
 * Required fields are NOT optional.
 */
export interface CreateJobData {
  // ── Backend-required ────────────────────────────────
  title:              string;
  description:        string;
  category:           string;
  type:               JobTypeValue;
  experienceLevel:    ExperienceLevelValue;
  /** Required: min 1 */
  candidatesNeeded:   number;
  location:           { region: RegionValue; city?: string; country?: string };
  applicationDeadline:string;

  // ── Optional / conditionally-required ───────────────
  shortDescription?:  string;
  requirements?:      string[];
  responsibilities?:  string[];
  benefits?:          string[];
  skills?:            string[];
  salary?:            JobSalary;
  salaryMode?:        SalaryModeValue;
  educationLevel?:    string;
  remote?:            'remote' | 'hybrid' | 'on-site';
  workArrangement?:   'office' | 'field-work' | 'both';
  isApplyEnabled?:    boolean;
  /**
   * TASK 3 FIX — status in the creation/update payload accepts all valid
   * backend status strings so callers can toggle between any state.
   */
  status?:            'draft' | 'active' | 'paused' | 'closed' | 'archived';
  featured?:          boolean;
  urgent?:            boolean;
  tags?:              string[];
  jobNumber?:         string;
  demographicRequirements?: {
    sex?: 'male' | 'female' | 'any';
    age?: { min?: number; max?: number };
  };
  opportunityType?: 'job' | 'volunteer' | 'internship' | 'fellowship' | 'training' | 'grant' | 'other';
}

/**
 * TASK 3 FIX — UpdateJobData is a full Partial<CreateJobData> so that
 * `updateJob(id, { status: 'paused' })` compiles without casting.
 */
export type UpdateJobData = Partial<CreateJobData>;

export interface JobListResponse {
  jobs: Job[];
  pagination: {
    current:       number;
    totalPages:    number;
    totalResults:  number;
    resultsPerPage?: number;
    nextPage?: number | null;
  };
}

export type JobCategory = { _id: string; count: number };

// ─── Error parser ─────────────────────────────────────────────────────────────

/** Handles express-validator error arrays from backend */
const parseApiError = (e: any): string => {
  const d = e?.response?.data;
  if (!d) return e?.message ?? 'Request failed';
  if (Array.isArray(d.errors))  return d.errors.map((x: any)  => x.msg ?? x.message ?? x).filter(Boolean).join('; ');
  if (Array.isArray(d.details)) return d.details.map((x: any) => x.message ?? x.msg ?? x).filter(Boolean).join('; ');
  if (d.message) return d.message;
  return e.message ?? 'Request failed';
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const jobService = {

  // ── Public browse ─────────────────────────────────────────────────────────

  getJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.LIST, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  getJob: async (id: string): Promise<Job> => {
    const res = await apiGet<{ success: boolean; data: Job }>(JOBS.DETAIL(id))
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  getJobById: async (id: string): Promise<Job> => jobService.getJob(id),

  getCategories: async (): Promise<JobCategory[]> => {
    try {
      const res = await apiGet<{ success: boolean; data: JobCategory[] }>(JOBS.CATEGORIES);
      return res.data.data ?? [];
    } catch { return []; }
  },

  // FIX: correct candidate endpoint GET /job/candidate/jobs
  getJobsForCandidate: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.CANDIDATE_JOBS, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  // FIX: correct saved jobs endpoint GET /job/saved/jobs
  getSavedJobs: async (): Promise<Job[]> => {
    try {
      const res = await apiGet<{ success: boolean; data: Job[] }>(JOBS.SAVED_JOBS);
      return res.data.data ?? [];
    } catch { return []; }
  },

  saveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.SAVE(jobId)).catch(e => { throw new Error(parseApiError(e)); });
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.UNSAVE(jobId)).catch(e => { throw new Error(parseApiError(e)); });
  },

  // ── Company CRUD ─────────────────────────────────────────────────────────

  getCompanyJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.COMPANY_JOBS, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  createJob: async (data: CreateJobData): Promise<Job> => {
    const res = await apiPost<{ success: boolean; data: Job }>(JOBS.CREATE, data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  /**
   * TASK 3 FIX — parameter changed from `UpdateJobData` to `UpdateJobData`
   * which now includes `status?: 'active' | 'draft' | 'paused' | 'closed' | 'archived'`
   * so callers like handleStatusToggle compile without casting.
   */
  updateJob: async (id: string, data: UpdateJobData): Promise<Job> => {
    const res = await apiPut<{ success: boolean; data: Job }>(JOBS.UPDATE(id), data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiDelete(JOBS.DELETE(id)).catch(e => { throw new Error(parseApiError(e)); });
  },

  // ── Organization CRUD ────────────────────────────────────────────────────

  getOrganizationJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.ORG_JOBS, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  // FIX: endpoint is /job/organization not /job/org
  createOrganizationJob: async (data: CreateJobData): Promise<Job> => {
    const res = await apiPost<{ success: boolean; data: Job }>(JOBS.CREATE_ORG, data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  updateOrganizationJob: async (id: string, data: UpdateJobData): Promise<Job> => {
    const res = await apiPut<{ success: boolean; data: Job }>(JOBS.UPDATE_ORG(id), data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  deleteOrganizationJob: async (id: string): Promise<void> => {
    await apiDelete(JOBS.DELETE_ORG(id)).catch(e => { throw new Error(parseApiError(e)); });
  },

  // ── Helpers (TASK 4 — all use optional chaining) ──────────────────────────

  getOwnerName: (job: Job): string =>
    job?.company?.name ?? job?.organization?.name ?? 'Unknown',

  getOwnerLogo: (job: Job): string | undefined =>
    job?.company?.logoUrl ?? job?.company?.logo ??
    job?.organization?.logoUrl ?? job?.organization?.logo,

  /**
   * TASK 4 FIX — uses optional chaining throughout so partial data from the
   * backend never triggers a runtime "Cannot read property of undefined" error.
   * Uses the salaryDisplay virtual first (computed server-side).
   */
  formatSalary: (job: Job): string => {
    if (job?.salaryDisplay) return job.salaryDisplay;
    switch (job?.salaryMode) {
      case 'negotiable':    return 'Negotiable';
      case 'hidden':        return 'Salary Hidden';
      case 'company-scale': return 'As per company scale';
      case 'range': {
        const min      = job?.salary?.min;
        const max      = job?.salary?.max;
        const currency = job?.salary?.currency ?? 'ETB';
        if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
        if (min)        return `${currency} ${min.toLocaleString()}+`;
        if (max)        return `Up to ${currency} ${max.toLocaleString()}`;
        return 'Negotiable';
      }
      default: return 'Not specified';
    }
  },

  /**
   * TASK 1 + TASK 4 — safe location formatter used by all components that need
   * a single-string location label.  Uses optional chaining at every step.
   *
   * Priority: specificLocation → city → region slug → country → 'Ethiopia'
   */
  formatLocation: (location?: Job['location']): string => {
    if (!location) return 'Ethiopia';
    return (
      location.specificLocation?.trim() ||
      location.city?.trim() ||
      location.region?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) ||
      location.country?.trim() ||
      'Ethiopia'
    );
  },

  /**
   * Full location string for detail views: "Bole, Addis Ababa, Ethiopia".
   * Uses optional chaining and filters out empty parts.
   */
  formatFullLocation: (location?: Job['location']): string => {
    if (!location) return 'Ethiopia';
    const parts = [
      location.specificLocation?.trim(),
      location.subCity?.trim(),
      location.city?.trim(),
      location.region?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()),
      location.country?.trim(),
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Ethiopia';
  },

  /** Skeleton for a new job — all backend-required fields pre-populated */
  buildDefaultJobData: (isOrg = false): CreateJobData => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    return {
      title:               '',
      description:         '',
      category:            'software-developer',
      type:                'full-time',
      experienceLevel:     'mid-level',
      educationLevel:      'none-required',
      candidatesNeeded:    1,
      salaryMode:          'negotiable',
      location:            { region: 'addis-ababa', city: '', country: 'Ethiopia' },
      applicationDeadline: deadline.toISOString(),
      remote:              'on-site',
      workArrangement:     'office',
      isApplyEnabled:      true,
      status:              'draft',
      skills:              [],
      requirements:        [],
      responsibilities:    [],
      benefits:            [],
      featured:            false,
      urgent:              false,
      ...(isOrg ? { opportunityType: 'job' as const } : {}),
    };
  },
};

// ─── Legacy alias used by some older hooks ─────────────────────────────────────

export const JobService = {
  getCompanyJobs: jobService.getCompanyJobs,
  updateJob: async (id: string, data: JobUpdatePayload) => {
    const response = await api.patch(`/jobs/${id}`, data);
    return response.data;
  },
};