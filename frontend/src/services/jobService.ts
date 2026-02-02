/* eslint-disable @typescript-eslint/no-explicit-any */
// services/jobService.ts - UPDATED WITH ALL NEW FEATURES
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

// =============================================
// ENUMS AND CONSTANTS
// =============================================

export enum SalaryMode {
  RANGE = 'range',
  HIDDEN = 'hidden',
  NEGOTIABLE = 'negotiable',
  COMPANY_SCALE = 'company-scale'
}

export enum ApplicationStatusReason {
  OPEN = 'open',
  DISABLED = 'disabled',
  INACTIVE = 'inactive',
  EXPIRED = 'expired'
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum OpportunityType {
  JOB = 'job',
  VOLUNTEER = 'volunteer',
  INTERNSHIP = 'internship',
  FELLOWSHIP = 'fellowship',
  TRAINING = 'training',
  GRANT = 'grant',
  OTHER = 'other'
}

// =============================================
// INTERFACES
// =============================================

// Ethiopian Location Interface
export interface EthiopianLocation {
  region: string;
  city: string;
  subCity?: string;
  woreda?: string;
  specificLocation?: string;
  country: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Job Salary Interface
export interface JobSalary {
  min?: number;
  max?: number;
  currency: 'ETB' | 'USD' | 'EUR' | 'GBP';
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isPublic: boolean;
  isNegotiable: boolean;
}

// Application Status Interface
export interface ApplicationStatus {
  canApply: boolean;
  message: string;
  reason: ApplicationStatusReason;
}

// Application Info Interface (NEW)
export interface ApplicationInfo {
  isApplyEnabled: boolean;
  canApply: boolean;
  candidatesNeeded: number;
  candidatesRemaining: number;
  applicationCount: number;
  status: ApplicationStatus;
}

// Salary Info Interface (NEW)
export interface SalaryInfo {
  display: string;
  mode: SalaryMode;
  details: {
    min?: number;
    max?: number;
    currency?: 'ETB' | 'USD' | 'EUR' | 'GBP';
    period?: string;
    isNegotiable: boolean;
    isPublic: boolean;
  } | null;
  isVisible: boolean;
}

// Duration Interface for Organization Opportunities
export interface Duration {
  value?: number;
  unit?: 'days' | 'weeks' | 'months' | 'years';
  isOngoing: boolean;
}

// Volunteer Info Interface for Organization Opportunities
export interface VolunteerInfo {
  hoursPerWeek?: number;
  commitmentLevel?: 'casual' | 'regular' | 'intensive';
  providesAccommodation: boolean;
  providesStipend: boolean;
}

// Organization Interface
export interface Organization {
  _id: string;
  name: string;
  organizationType?: string;
  industry?: string;
  logoUrl?: string;
  verified: boolean;
  description?: string;
  website?: string;
  mission?: string;
  logoFullUrl?: string;
  bannerFullUrl?: string;
}

export interface DemographicRequirements {
  sex: 'male' | 'female' | 'any';
  age?: {
    min?: number;
    max?: number;
  };
}

// Main Job Interface - UPDATED WITH NEW FIELDS
export interface Job {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  demographicRequirements?: DemographicRequirements;
  jobNumber?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'volunteer' | 'remote' | 'hybrid';
  location: EthiopianLocation;
  salary?: JobSalary;

  // NEW FIELDS
  candidatesNeeded: number;
  salaryMode: SalaryMode;
  isApplyEnabled: boolean;

  category: string;
  subCategory?: string;
  experienceLevel: 'fresh-graduate' | 'entry-level' | 'mid-level' | 'senior-level' | 'managerial' | 'director' | 'executive';
  educationLevel?:
  | 'primary-education'
  | 'secondary-education'
  | 'tvet-level-i'
  | 'tvet-level-ii'
  | 'tvet-level-iii'
  | 'tvet-level-iv'
  | 'tvet-level-v'
  | 'undergraduate-bachelors'
  | 'postgraduate-masters'
  | 'doctoral-phd'
  | 'lecturer'
  | 'professor'
  | 'high-school'
  | 'diploma'
  | 'bachelors'
  | 'masters'
  | 'phd'
  | 'none-required';
  status: JobStatus;
  remote: 'remote' | 'hybrid' | 'on-site';
  workArrangement: 'office' | 'field-work' | 'both';

  // Company fields (for company jobs)
  company?: {
    _id: string;
    name: string;
    logoUrl?: string;
    verified: boolean;
    industry?: string;
    size?: string;
    website?: string;
    description?: string;
    country?: string;
    ownerId?: string;
  };

  // Organization fields (for organization opportunities)
  organization?: Organization;
  jobType: 'company' | 'organization';
  opportunityType?: OpportunityType;
  duration?: Duration;
  volunteerInfo?: VolunteerInfo;

  createdBy: string;
  applicationCount: number;
  viewCount: number;
  saveCount: number;
  featured: boolean;
  urgent: boolean;
  premium: boolean;
  tags: string[];
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;

  // Virtual/Computed Fields (NEW)
  isActive?: boolean;
  isExpired?: boolean;
  salaryDisplay?: string;
  canAcceptApplications?: boolean;
  displayType?: string;
  ownerType?: string;

  // NEW COMPUTED FIELDS
  applicationInfo?: ApplicationInfo;
  salaryInfo?: SalaryInfo;

  applications?: any[];
  views?: number;
}

// Job Form Data Interface for Create/Update Operations
export interface JobFormData {
  title: string;
  description: string;
  shortDescription?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  skills?: string[];
  demographicRequirements?: DemographicRequirements;
  jobNumber?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'volunteer' | 'remote' | 'hybrid';
  location: EthiopianLocation;
  salary?: JobSalary;

  // NEW FIELDS
  candidatesNeeded: number;
  salaryMode: SalaryMode;
  isApplyEnabled?: boolean;

  category: string;
  experienceLevel: 'fresh-graduate' | 'entry-level' | 'mid-level' | 'senior-level' | 'managerial' | 'director' | 'executive';
  educationLevel?:
  | 'primary-education'
  | 'secondary-education'
  | 'tvet-level-i'
  | 'tvet-level-ii'
  | 'tvet-level-iii'
  | 'tvet-level-iv'
  | 'tvet-level-v'
  | 'undergraduate-bachelors'
  | 'postgraduate-masters'
  | 'doctoral-phd'
  | 'lecturer'
  | 'professor'
  | 'high-school'
  | 'diploma'
  | 'bachelors'
  | 'masters'
  | 'phd'
  | 'none-required';
  status?: JobStatus;
  remote: 'remote' | 'hybrid' | 'on-site';
  workArrangement: 'office' | 'field-work' | 'both';
  applicationDeadline?: string;
  featured?: boolean;
  urgent?: boolean;
  tags?: string[];

  // Organization-specific fields
  opportunityType?: OpportunityType;
  duration?: Duration;
  volunteerInfo?: VolunteerInfo;
}

// Ethiopian Region Interface
export interface EthiopianRegion {
  name: string;
  slug: string;
  cities: string[];
}

// Jobs Response Interface
export interface JobsResponse {
  success: boolean;
  data: Job[];
  pagination?: {
    current: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
  filters?: any;
  stats?: any;
}

// Job Filters Interface - UPDATED WITH NEW FIELDS
export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  city?: string;
  type?: string;
  category?: string;
  remote?: string;
  experienceLevel?: string;
  educationLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: 'ETB' | 'USD' | 'EUR' | 'GBP';
  skills?: string[];
  company?: string;
  featured?: boolean;
  urgent?: boolean;
  workArrangement?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  jobType?: 'company' | 'organization';
  opportunityType?: string;

  // NEW FILTERS
  salaryMode?: SalaryMode;
  candidatesNeededMin?: number;
  candidatesNeededMax?: number;
  isApplyEnabled?: boolean;
  status?: JobStatus;
}

// Application Data Interface
export interface ApplicationData {
  coverLetter: string;
  proposal: string;
  bidAmount?: number;
}

// Single Job Response Interface
export interface JobResponse {
  success: boolean;
  data: Job;
  message?: string;
}

// Company Jobs Response Interface
export interface CompanyJobsResponse {
  success: boolean;
  data: Job[];
  pagination: {
    current: number;
    totalPages: number;
    totalResults: number;
  };
}

// Organization Jobs Response Interface
export interface OrganizationJobsResponse {
  success: boolean;
  data: Job[];
  pagination: {
    current: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage?: number;
  };
}

// Categories Response Interface
export interface CategoriesResponse {
  success: boolean;
  data: Array<{ _id: string, count: number }>;
}

// =============================================
// CONSTANTS
// =============================================

export const SALARY_MODES = [
  { value: SalaryMode.RANGE, label: 'Salary Range' },
  { value: SalaryMode.HIDDEN, label: 'Salary Hidden' },
  { value: SalaryMode.NEGOTIABLE, label: 'Negotiable' },
  { value: SalaryMode.COMPANY_SCALE, label: 'Company Scale' }
];

export const APPLICATION_STATUS_MESSAGES = {
  [ApplicationStatusReason.OPEN]: 'Accepting applications',
  [ApplicationStatusReason.DISABLED]: 'Applications are currently closed for this position',
  [ApplicationStatusReason.INACTIVE]: 'This position is not currently active',
  [ApplicationStatusReason.EXPIRED]: 'Application deadline has passed'
};

export const JOB_STATUS_OPTIONS = [
  { value: JobStatus.DRAFT, label: 'Draft' },
  { value: JobStatus.ACTIVE, label: 'Active' },
  { value: JobStatus.PAUSED, label: 'Paused' },
  { value: JobStatus.CLOSED, label: 'Closed' },
  { value: JobStatus.ARCHIVED, label: 'Archived' }
];

// =============================================
// UTILITY FUNCTIONS
// =============================================

const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 API Error Details:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  if (error.response?.data?.errors || error.response?.data?.details) {
    // Handle validation errors with details
    const validationErrors = error.response.data.details || error.response.data.errors;
    const errorMessage = validationErrors.map((err: any) =>
      `${err.field || 'field'}: ${err.message || err.msg}`
    ).join(', ');

    console.error('❌ Validation errors:', validationErrors);
    handleError(`Validation failed: ${errorMessage}`);
    throw new Error(`Validation failed: ${errorMessage}`);
  } else if (error.response?.data?.message) {
    handleError(error.response.data.message);
    throw new Error(error.response.data.message);
  } else if (error.message) {
    handleError(error.message);
    throw error;
  } else {
    handleError(defaultMessage);
    throw new Error(defaultMessage);
  }
};

// Info handler function
const handleInfo = (message: string): void => {
  console.info(message);
};

// =============================================
// JOB SERVICE
// =============================================

export const jobService = {
  // =============================================
  // API METHODS
  // =============================================

  /**
   * Fetch all active jobs with optional filtering
   * @param params - Filter parameters
   * @returns Promise with jobs response
   */
  getJobs: async (params?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<JobsResponse>('/job', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch jobs') as never;
    }
  },

  /**
   * Fetch a single job by ID
   * @param id - Job ID
   * @returns Promise with job data
   */
  getJob: async (id: string): Promise<Job> => {
    try {
      console.log('🔍 Fetching job with ID:', id);

      if (!id || id === 'undefined' || id === 'null') {
        throw new Error('Job ID is required and must be valid');
      }

      // Validate if it's a valid MongoDB ObjectId format
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(id)) {
        throw new Error(`Invalid job ID format: ${id}`);
      }

      const response = await api.get<JobResponse>(`/job/${id}`);

      console.log('📡 Job API Response:', response.status, response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch job');
      }

      if (!response.data.data) {
        throw new Error('Job data not found in response');
      }

      console.log('✅ Job fetched successfully:', response.data.data._id);
      return response.data.data;

    } catch (error: any) {
      console.error('❌ Error in jobService.getJob:', {
        jobId: id,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Enhanced error messages based on status code
      if (error.response?.status === 404) {
        throw new Error('Job not found or has been removed');
      } else if (error.response?.status === 500) {
        throw new Error('Server error while fetching job. Please try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to view job details');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Network error. Please check your connection.');
      } else if (error.message.includes('Invalid job ID')) {
        throw new Error('Invalid job ID format');
      }

      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch job');
    }
  },

  /**
   * Fetch company's jobs
   * @param params - Pagination and status filters
   * @returns Promise with company jobs response
   */
  getCompanyJobs: async (params?: { page?: number; limit?: number; status?: string }): Promise<CompanyJobsResponse> => {
    try {
      const response = await api.get<CompanyJobsResponse>('/job/company/my-jobs', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch company jobs') as never;
    }
  },

  /**
   * Create a new job
   * @param data - Job data including new fields
   * @returns Promise with created job
   */
  createJob: async (data: JobFormData): Promise<Job> => {
    try {
      jobService.validateJobData(data);

      console.log('📤 Sending job data to backend:', JSON.stringify(data, null, 2));

      const response = await api.post<JobResponse>('/job', data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create job');
      }

      handleSuccess('Job created successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Job creation failed:', error);
      console.log('📋 Response data:', error.response?.data);
      return handleApiError(error, 'Failed to create job') as never;
    }
  },

  /**
   * Update an existing job
   * @param id - Job ID
   * @param data - Updated job data
   * @returns Promise with updated job
   */
  updateJob: async (id: string, data: Partial<JobFormData>): Promise<Job> => {
    try {
      if (!id) {
        throw new Error('Job ID is required');
      }

      jobService.validateJobData(data);

      const response = await api.put<JobResponse>(`/job/${id}`, data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update job');
      }

      handleSuccess('Job updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update job') as never;
    }
  },

  /**
   * Delete a job
   * @param id - Job ID
   * @returns Promise<void>
   */
  deleteJob: async (id: string): Promise<void> => {
    try {
      if (!id) {
        throw new Error('Job ID is required');
      }

      const response = await api.delete(`/job/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete job');
      }

      handleSuccess('Job deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete job') as never;
    }
  },

  // =============================================
  // ORGANIZATION METHODS
  // =============================================

  /**
   * Fetch organization's opportunities
   * @param params - Pagination and status filters
   * @returns Promise with organization jobs response
   */
  getOrganizationJobs: async (params?: { page?: number; limit?: number; status?: string }): Promise<OrganizationJobsResponse> => {
    try {
      const response = await api.get<OrganizationJobsResponse>('/job/organization/my-jobs', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch organization opportunities') as never;
    }
  },

  /**
   * Create a new opportunity for organization
   * @param data - Opportunity data
   * @returns Promise with created opportunity
   */
  createOrganizationJob: async (data: JobFormData): Promise<Job> => {
    try {
      jobService.validateJobData(data);

      console.log('📤 Sending organization opportunity data to backend:', JSON.stringify(data, null, 2));

      const response = await api.post<JobResponse>('/job/organization', data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create opportunity');
      }

      handleSuccess('Opportunity created successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Organization opportunity creation failed:', error);
      console.log('📋 Response data:', error.response?.data);
      return handleApiError(error, 'Failed to create opportunity') as never;
    }
  },

  /**
   * Update an organization opportunity
   * @param id - Opportunity ID
   * @param data - Updated opportunity data
   * @returns Promise with updated opportunity
   */
  updateOrganizationJob: async (id: string, data: Partial<JobFormData>): Promise<Job> => {
    try {
      if (!id) {
        throw new Error('Opportunity ID is required');
      }

      jobService.validateJobData(data);

      const response = await api.put<JobResponse>(`/job/organization/${id}`, data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update opportunity');
      }

      handleSuccess('Opportunity updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update opportunity') as never;
    }
  },

  /**
   * Delete an organization opportunity
   * @param id - Opportunity ID
   * @returns Promise<void>
   */
  deleteOrganizationJob: async (id: string): Promise<void> => {
    try {
      if (!id) {
        throw new Error('Opportunity ID is required');
      }

      const response = await api.delete(`/job/organization/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete opportunity');
      }

      handleSuccess('Opportunity deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete opportunity') as never;
    }
  },

  /**
   * Fetch jobs for candidates
   * @param params - Filter parameters
   * @returns Promise with jobs response
   */
  getJobsForCandidate: async (params?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<JobsResponse>('/job/candidate/jobs', { params });
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch jobs');
      throw error;
    }
  },

  /**
   * Save a job for candidate
   * @param jobId - Job ID to save
   * @returns Promise with save status
   */
  saveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      console.log('💾 jobService.saveJob called for job:', jobId);

      const response = await api.post<{
        message: string;
        success: boolean;
        data: { saved: boolean }
      }>(`/job/${jobId}/save`);

      console.log('📡 Save job response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save job');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ jobService.saveJob error:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      handleError(error, 'Failed to save job');
      throw error;
    }
  },

  /**
   * Unsave a job for candidate
   * @param jobId - Job ID to unsave
   * @returns Promise with unsave status
   */
  unsaveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      console.log('🗑️ jobService.unsaveJob called for job:', jobId);

      const response = await api.post<{
        message: string;
        success: boolean;
        data: { saved: boolean }
      }>(`/job/${jobId}/unsave`);

      console.log('📡 Unsave job response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to unsave job');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('❌ jobService.unsaveJob error:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      handleError(error, 'Failed to unsave job');
      throw error;
    }
  },

  /**
   * Fetch saved jobs for candidate
   * @returns Promise with saved jobs
   */
  getSavedJobs: async (): Promise<any[]> => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/job/saved/jobs');

      if (!response.data.success) {
        throw new Error('Failed to fetch saved jobs');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching saved jobs:', error);

      // Don't throw error for saved jobs, just return empty array
      if (error.response?.status === 500 || error.response?.status === 404) {
        console.warn('Saved jobs endpoint not available, returning empty array');
        return [];
      }

      handleError(error, 'Failed to fetch saved jobs');
      return [];
    }
  },

  /**
   * Fetch job categories
   * @returns Promise with categories data
   */
  getCategories: async (): Promise<Array<{ _id: string, count: number }>> => {
    try {
      const response = await api.get<CategoriesResponse>('/job/categories');
      return response.data.data;
    } catch (error: any) {
      handleInfo('Using default categories');
      // Return default categories if API fails
      return [
        { _id: 'software-development', count: 0 },
        { _id: 'web-development', count: 0 },
        { _id: 'marketing', count: 0 },
        { _id: 'sales', count: 0 },
        { _id: 'design', count: 0 },
        { _id: 'other', count: 0 }
      ];
    }
  },

  // =============================================
  // NEW VALIDATION AND HELPER FUNCTIONS
  // =============================================

  /**
   * Validate job data before submission
   * @param data - Job data to validate
   * @throws Error if validation fails
   */
  validateJobData: (data: Partial<JobFormData>): void => {
    // Title validation
    if (data.title && data.title.trim().length < 5) {
      throw new Error('Job title must be at least 5 characters long');
    }

    if (data.title && data.title.trim().length > 100) {
      throw new Error('Job title cannot exceed 100 characters');
    }

    // Description validation
    if (data.description && data.description.length < 50) {
      throw new Error('Job description must be at least 50 characters long');
    }

    if (data.description && data.description.length > 5000) {
      throw new Error('Description cannot exceed 5000 characters');
    }

    // Short description validation
    if (data.shortDescription && data.shortDescription.length > 200) {
      throw new Error('Short description cannot exceed 200 characters');
    }

    // NEW: Candidates needed validation
    if (data.candidatesNeeded !== undefined && data.candidatesNeeded < 1) {
      throw new Error('At least 1 candidate is required');
    }

    // NEW: Salary mode validation
    if (data.salaryMode && !Object.values(SalaryMode).includes(data.salaryMode)) {
      throw new Error(`Invalid salary mode. Must be one of: ${Object.values(SalaryMode).join(', ')}`);
    }

    // NEW: Validate salary data based on salary mode
    if (data.salaryMode === SalaryMode.RANGE) {
      if (data.salary) {
        if (data.salary.min && data.salary.max && data.salary.min > data.salary.max) {
          throw new Error('Minimum salary cannot be greater than maximum salary');
        }
        if (!data.salary.currency) {
          throw new Error('Currency is required when salary mode is "range"');
        }
      }
    }
  },

  /**
   * Check if a job can accept applications
   * @param job - Job object
   * @returns Boolean indicating if job can accept applications
   */
  canJobAcceptApplications: (job: Job): boolean => {
    if (job.isApplyEnabled === false) return false;
    if (job.status !== JobStatus.ACTIVE) return false;
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) return false;
    return true;
  },

  /**
   * Calculate remaining candidates for a job
   * @param job - Job object
   * @returns Number of candidates remaining
   */
  calculateCandidatesRemaining: (job: Job): number => {
    const needed = job.candidatesNeeded || 0;
    const applied = job.applicationCount || 0;
    return Math.max(0, needed - applied);
  },

  /**
   * Format salary display based on salary mode
   * @param job - Job object
   * @returns Formatted salary string
   */
  getFormattedSalary: (job: Job): string => {
    if (!job.salaryInfo && job.salaryDisplay) {
      return job.salaryDisplay;
    }

    switch (job.salaryMode) {
      case SalaryMode.RANGE:
        if (job.salaryInfo?.details?.min && job.salaryInfo.details.max) {
          const formattedMin = job.salaryInfo.details.min.toLocaleString();
          const formattedMax = job.salaryInfo.details.max.toLocaleString();
          const currency = job.salaryInfo.details.currency || 'ETB';
          const period = job.salaryInfo.details.period === 'monthly' ? 'per month' : job.salaryInfo.details.period;
          return `${currency} ${formattedMin} - ${formattedMax} ${period}`;
        } else if (job.salaryInfo?.details?.min) {
          const formattedMin = job.salaryInfo.details.min.toLocaleString();
          const currency = job.salaryInfo.details.currency || 'ETB';
          const period = job.salaryInfo.details.period === 'monthly' ? 'per month' : job.salaryInfo.details.period;
          return `${currency} ${formattedMin}+ ${period}`;
        } else if (job.salaryInfo?.details?.max) {
          const formattedMax = job.salaryInfo.details.max.toLocaleString();
          const currency = job.salaryInfo.details.currency || 'ETB';
          const period = job.salaryInfo.details.period === 'monthly' ? 'per month' : job.salaryInfo.details.period;
          return `${currency} Up to ${formattedMax} ${period}`;
        }
        return 'Salary not specified';

      case SalaryMode.HIDDEN:
        return 'Salary hidden';

      case SalaryMode.NEGOTIABLE:
        return 'Negotiable';

      case SalaryMode.COMPANY_SCALE:
        return 'As per company scale';

      default:
        return 'Salary not specified';
    }
  },

  /**
   * Get application status information
   * @param job - Job object
   * @returns Application status information
   */
  getApplicationStatusInfo: (job: Job): ApplicationInfo => {
    const canApply = jobService.canJobAcceptApplications(job);
    const candidatesRemaining = jobService.calculateCandidatesRemaining(job);

    let reason = ApplicationStatusReason.OPEN;
    let message = 'Accepting applications';

    if (!job.isApplyEnabled) {
      reason = ApplicationStatusReason.DISABLED;
      message = 'Applications are currently closed for this position';
    } else if (job.status !== JobStatus.ACTIVE) {
      reason = ApplicationStatusReason.INACTIVE;
      message = 'This position is not currently active';
    } else if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      reason = ApplicationStatusReason.EXPIRED;
      message = 'Application deadline has passed';
    }

    return {
      isApplyEnabled: job.isApplyEnabled ?? true,
      canApply,
      candidatesNeeded: job.candidatesNeeded || 0,
      candidatesRemaining,
      applicationCount: job.applicationCount || 0,
      status: {
        canApply,
        message,
        reason
      }
    };
  },

  /**
   * Get salary information
   * @param job - Job object
   * @returns Salary information
   */
  getSalaryInfo: (job: Job): SalaryInfo => {
    const isVisible = job.salaryMode === SalaryMode.RANGE &&
      (job.salary?.isPublic !== false);

    return {
      display: jobService.getFormattedSalary(job),
      mode: job.salaryMode || SalaryMode.RANGE,
      details: job.salaryMode === SalaryMode.RANGE ? {
        min: job.salary?.min,
        max: job.salary?.max,
        currency: job.salary?.currency,
        period: job.salary?.period || 'monthly',
        isNegotiable: job.salary?.isNegotiable || false,
        isPublic: job.salary?.isPublic !== false
      } : null,
      isVisible
    };
  },

  // =============================================
  // EXISTING HELPER FUNCTIONS (Updated)
  // =============================================

  canApplyToJob: (job: Job): boolean => {
    return jobService.canJobAcceptApplications(job);
  },

  getApplicationStatus: (job: Job): {
    canApply: boolean;
    statusKey: 'closed' | 'inactive' | 'expired' | 'open';
    message: string;
  } => {
    if (job.isApplyEnabled === false) {
      return {
        canApply: false,
        statusKey: 'closed',
        message: 'Applications are not being accepted for this position'
      };
    }

    if (job.status !== JobStatus.ACTIVE) {
      return {
        canApply: false,
        statusKey: 'inactive',
        message: 'This position is not currently active'
      };
    }

    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return {
        canApply: false,
        statusKey: 'expired',
        message: 'The application deadline has passed'
      };
    }

    return {
      canApply: true,
      statusKey: 'open',
      message: job.applicationDeadline
        ? `Applications are open until ${new Date(job.applicationDeadline).toLocaleDateString()}`
        : 'Applications are open'
    };
  },

  getApplicationEligibility: (job: Job): {
    isEligible: boolean;
    reasons: string[];
  } => {
    const reasons: string[] = [];

    if (job.isApplyEnabled === false) {
      reasons.push('Applications are disabled for this position');
    }

    if (job.status !== JobStatus.ACTIVE) {
      reasons.push('Position is not active');
    }

    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      reasons.push('Application deadline has passed');
    }

    return {
      isEligible: reasons.length === 0,
      reasons
    };
  },

  formatSalary: (salary?: JobSalary): string => {
    if (!salary) return 'Negotiable';

    const { min, max, currency, period, isNegotiable } = salary;

    if (isNegotiable) return 'Negotiable';

    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency} / ${period}`;
    } else if (min) {
      return `From ${min.toLocaleString()} ${currency} / ${period}`;
    } else if (max) {
      return `Up to ${max.toLocaleString()} ${currency} / ${period}`;
    }

    return 'Negotiable';
  },

  getJobTypeLabel: (type: string | undefined): string => {
    if (!type) return 'Not Specified';
    const labels: Record<string, string> = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'temporary': 'Temporary',
      'volunteer': 'Volunteer',
      'remote': 'Remote',
      'hybrid': 'Hybrid'
    };
    return labels[type] || type;
  },

  getExperienceLabel: (level: string | undefined): string => {
    if (!level) return 'Not Specified';
    const labels: Record<string, string> = {
      'fresh-graduate': 'Fresh Graduate',
      'entry-level': 'Entry Level',
      'mid-level': 'Mid Level',
      'senior-level': 'Senior Level',
      'managerial': 'Managerial',
      'director': 'Director',
      'executive': 'Executive'
    };
    return labels[level] || level;
  },

  getEducationLabel: (level: string | undefined): string => {
    if (!level) return 'Not Specified';
    const educationLevels = jobService.getEducationLevels();
    const found = educationLevels.find(edu => edu.value === level);
    return found ? found.label : level;
  },

  getSexRequirementLabel: (sex: string): string => {
    const labels: Record<string, string> = {
      'male': 'Male Only',
      'female': 'Female Only',
      'any': 'Any Gender'
    };
    return labels[sex] || 'Any Gender';
  },

  formatAgeRequirement: (demographicRequirements?: any): string => {
    if (!demographicRequirements?.age) return 'No age restriction';

    const { min, max } = demographicRequirements.age;
    if (min && max) {
      return `${min} - ${max} years`;
    } else if (min) {
      return `Above ${min} years`;
    } else if (max) {
      return `Below ${max} years`;
    }
    return 'No age restriction';
  },

  getJobTypeDisplayLabel: (job: Job): string => {
    if (job.jobType === 'organization') {
      const opportunityTypes: Record<string, string> = {
        'job': 'Job Opportunity',
        'volunteer': 'Volunteer Position',
        'internship': 'Internship',
        'fellowship': 'Fellowship',
        'training': 'Training Program',
        'grant': 'Grant Opportunity',
        'other': 'Opportunity'
      };
      return opportunityTypes[job.opportunityType || 'job'] || 'Opportunity';
    }
    return 'Job';
  },

  getOwnerName: (job: Job): string => {
    if (job.jobType === 'organization' && job.organization) {
      return job.organization.name;
    }
    if (job.jobType === 'company' && job.company) {
      return job.company.name;
    }
    return 'Unknown';
  },

  getOwnerType: (job: Job): string => {
    return job.jobType === 'organization' ? 'Organization' : 'Company';
  },

  isOrganizationJobOwner: (job: Job, organizationId?: string): boolean => {
    return job.jobType === 'organization' && job.organization?._id === organizationId;
  },

  isCompanyJobOwner: (job: Job, companyId?: string): boolean => {
    return job.jobType === 'company' && job.company?._id === companyId;
  },

  getEthiopianRegions: (): EthiopianRegion[] => {
    return [
      {
        name: 'Addis Ababa',
        slug: 'addis-ababa',
        cities: ['Addis Ababa', 'Akaki Kaliti', 'Arada', 'Bole', 'Gulele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk Lafto', 'Yeka']
      },
      {
        name: 'Amhara',
        slug: 'amhara',
        cities: ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Markos', 'Debre Birhan', 'Woldia', 'Kombolcha']
      },
      {
        name: 'Oromia',
        slug: 'oromia',
        cities: ['Adama', 'Nazret', 'Jimma', 'Bishoftu', 'Ambo', 'Shashamane', 'Nekemte', 'Adama', 'Assela']
      },
      {
        name: 'Tigray',
        slug: 'tigray',
        cities: ['Mekele', 'Adigrat', 'Axum', 'Adwa', 'Shire', 'Humera', 'Alamata']
      },
      {
        name: 'SNNPR',
        slug: 'snnpr',
        cities: ['Hawassa', 'Arba Minch', 'Dila', 'Wolaita Sodo', 'Hosaena', 'Durame', 'Wondo Genet']
      },
      {
        name: 'Somali',
        slug: 'somali',
        cities: ['Jijiga', 'Degehabur', 'Gode', 'Kebri Dahar', 'Warder', 'Shilavo']
      },
      {
        name: 'Afar',
        slug: 'afar',
        cities: ['Semera', 'Asayita', 'Awash', 'Logiya', 'Dubti', 'Gewane']
      },
      {
        name: 'Benishangul-Gumuz',
        slug: 'benishangul-gumuz',
        cities: ['Assosa', 'Metekel', 'Gilgil Beles', 'Mambuk']
      },
      {
        name: 'Gambela',
        slug: 'gambela',
        cities: ['Gambela', 'Itang', 'Abobo', 'Gore']
      },
      {
        name: 'Harari',
        slug: 'harari',
        cities: ['Harar', 'Dire Dawa Administrative Council']
      },
      {
        name: 'Sidama',
        slug: 'sidama',
        cities: ['Hawassa', 'Yirgalem', 'Leku', 'Aleta Wondo', 'Chuko']
      },
      {
        name: 'South West Ethiopia',
        slug: 'south-west-ethiopia',
        cities: ['Bonga', 'Mizan Teferi', 'Tepi', 'Tercha', 'Maji']
      },
      {
        name: 'Dire Dawa',
        slug: 'dire-dawa',
        cities: ['Dire Dawa']
      },
      {
        name: 'International',
        slug: 'international',
        cities: ['Remote Worldwide', 'Multiple Locations', 'Global']
      }
    ];
  },

  getOpportunityTypes: (): Array<{ value: string, label: string }> => {
    return [
      { value: 'job', label: 'Job Opportunity' },
      { value: 'volunteer', label: 'Volunteer Position' },
      { value: 'internship', label: 'Internship' },
      { value: 'fellowship', label: 'Fellowship' },
      { value: 'training', label: 'Training Program' },
      { value: 'grant', label: 'Grant Opportunity' },
      { value: 'other', label: 'Other Opportunity' }
    ];
  },

  getCommitmentLevels: (): Array<{ value: string, label: string }> => {
    return [
      { value: 'casual', label: 'Casual (1-10 hours/week)' },
      { value: 'regular', label: 'Regular (10-25 hours/week)' },
      { value: 'intensive', label: 'Intensive (25+ hours/week)' }
    ];
  },

  getDurationUnits: (): Array<{ value: string, label: string }> => {
    return [
      { value: 'days', label: 'Days' },
      { value: 'weeks', label: 'Weeks' },
      { value: 'months', label: 'Months' },
      { value: 'years', label: 'Years' }
    ];
  },

  // =============================================
  // JOB CATEGORIES (Updated to match backend)
  // =============================================

  // In jobService.ts - Update the getJobCategories function

  getJobCategories: (): Array<{ value: string, label: string }> => {
    // Complete list matching your backend enum
    const categories = [
      /* =========================
         TECHNOLOGY & ICT
      ========================== */
      { value: 'software-developer', label: 'Software Developer' },
      { value: 'frontend-developer', label: 'Frontend Developer' },
      { value: 'backend-developer', label: 'Backend Developer' },
      { value: 'fullstack-developer', label: 'Fullstack Developer' },
      { value: 'web-developer', label: 'Web Developer' },
      { value: 'mobile-app-developer', label: 'Mobile App Developer' },
      { value: 'android-developer', label: 'Android Developer' },
      { value: 'ios-developer', label: 'iOS Developer' },
      { value: 'ai-engineer', label: 'AI Engineer' },
      { value: 'machine-learning-engineer', label: 'Machine Learning Engineer' },
      { value: 'data-scientist', label: 'Data Scientist' },
      { value: 'data-analyst', label: 'Data Analyst' },
      { value: 'business-intelligence-analyst', label: 'Business Intelligence Analyst' },
      { value: 'database-administrator', label: 'Database Administrator' },
      { value: 'system-administrator', label: 'System Administrator' },
      { value: 'network-engineer', label: 'Network Engineer' },
      { value: 'network-administrator', label: 'Network Administrator' },
      { value: 'cloud-engineer', label: 'Cloud Engineer' },
      { value: 'devops-engineer', label: 'DevOps Engineer' },
      { value: 'site-reliability-engineer', label: 'Site Reliability Engineer' },
      { value: 'cybersecurity-analyst', label: 'Cybersecurity Analyst' },
      { value: 'soc-analyst', label: 'SOC Analyst' },
      { value: 'penetration-tester', label: 'Penetration Tester' },
      { value: 'it-support-officer', label: 'IT Support Officer' },
      { value: 'it-support-technician', label: 'IT Support Technician' },
      { value: 'helpdesk-officer', label: 'Helpdesk Officer' },
      { value: 'ui-designer', label: 'UI Designer' },
      { value: 'ux-designer', label: 'UX Designer' },
      { value: 'product-designer', label: 'Product Designer' },
      { value: 'product-manager', label: 'Product Manager' },
      { value: 'scrum-master', label: 'Scrum Master' },
      { value: 'it-project-manager', label: 'IT Project Manager' },
      { value: 'qa-engineer', label: 'QA Engineer' },
      { value: 'software-tester', label: 'Software Tester' },
      { value: 'automation-tester', label: 'Automation Tester' },
      { value: 'erp-consultant', label: 'ERP Consultant' },
      { value: 'sap-consultant', label: 'SAP Consultant' },
      { value: 'odoo-developer', label: 'Odoo Developer' },
      { value: 'crm-administrator', label: 'CRM Administrator' },
      { value: 'digital-transformation-specialist', label: 'Digital Transformation Specialist' },
      { value: 'fintech-specialist', label: 'Fintech Specialist' },
      { value: 'blockchain-developer', label: 'Blockchain Developer' },
      { value: 'web3-developer', label: 'Web3 Developer' },
      { value: 'it-policy-advisor', label: 'IT Policy Advisor' },
      { value: 'ict-trainer', label: 'ICT Trainer' },
      { value: 'computer-lab-technician', label: 'Computer Lab Technician' },

      /* =========================
         NGO / UN / DEVELOPMENT
      ========================== */
      { value: 'project-officer', label: 'Project Officer' },
      { value: 'project-manager', label: 'Project Manager' },
      { value: 'program-officer', label: 'Program Officer' },
      { value: 'program-manager', label: 'Program Manager' },
      { value: 'me-officer', label: 'ME Officer' },
      { value: 'me-manager', label: 'ME Manager' },
      { value: 'wash-officer', label: 'WASH Officer' },
      { value: 'wash-specialist', label: 'WASH Specialist' },
      { value: 'livelihood-officer', label: 'Livelihood Officer' },
      { value: 'food-security-officer', label: 'Food Security Officer' },
      { value: 'nutrition-officer', label: 'Nutrition Officer' },
      { value: 'protection-officer', label: 'Protection Officer' },
      { value: 'child-protection-officer', label: 'Child Protection Officer' },
      { value: 'gender-officer', label: 'Gender Officer' },
      { value: 'gbv-officer', label: 'GBV Officer' },
      { value: 'peacebuilding-officer', label: 'Peacebuilding Officer' },
      { value: 'resilience-officer', label: 'Resilience Officer' },
      { value: 'community-mobilizer', label: 'Community Mobilizer' },
      { value: 'community-development-officer', label: 'Community Development Officer' },
      { value: 'social-development-officer', label: 'Social Development Officer' },
      { value: 'humanitarian-officer', label: 'Humanitarian Officer' },
      { value: 'emergency-response-officer', label: 'Emergency Response Officer' },
      { value: 'disaster-risk-reduction-officer', label: 'Disaster Risk Reduction Officer' },
      { value: 'refugee-program-officer', label: 'Refugee Program Officer' },
      { value: 'migration-officer', label: 'Migration Officer' },
      { value: 'durable-solutions-officer', label: 'Durable Solutions Officer' },
      { value: 'case-management-officer', label: 'Case Management Officer' },
      { value: 'psychosocial-support-officer', label: 'Psychosocial Support Officer' },
      { value: 'grant-officer', label: 'Grant Officer' },
      { value: 'grant-manager', label: 'Grant Manager' },
      { value: 'proposal-writer', label: 'Proposal Writer' },
      { value: 'resource-mobilization-officer', label: 'Resource Mobilization Officer' },
      { value: 'partnership-officer', label: 'Partnership Officer' },
      { value: 'advocacy-officer', label: 'Advocacy Officer' },
      { value: 'policy-officer', label: 'Policy Officer' },
      { value: 'enumerator', label: 'Enumerator' },
      { value: 'field-officer', label: 'Field Officer' },
      { value: 'monitoring-assistant', label: 'Monitoring Assistant' },

      /* =========================
         FINANCE
      ========================== */
      { value: 'accountant', label: 'Accountant' },
      { value: 'junior-accountant', label: 'Junior Accountant' },
      { value: 'senior-accountant', label: 'Senior Accountant' },
      { value: 'auditor', label: 'Auditor' },
      { value: 'internal-auditor', label: 'Internal Auditor' },
      { value: 'external-auditor', label: 'External Auditor' },
      { value: 'bank-teller', label: 'Bank Teller' },
      { value: 'customer-service-officer-banking', label: 'Customer Service Officer (Banking)' },
      { value: 'relationship-manager', label: 'Relationship Manager' },
      { value: 'branch-manager', label: 'Branch Manager' },
      { value: 'operations-manager-banking', label: 'Operations Manager (Banking)' },
      { value: 'credit-officer', label: 'Credit Officer' },
      { value: 'loan-officer', label: 'Loan Officer' },
      { value: 'credit-analyst', label: 'Credit Analyst' },
      { value: 'risk-officer', label: 'Risk Officer' },
      { value: 'compliance-officer-banking', label: 'Compliance Officer (Banking)' },
      { value: 'forex-officer', label: 'Forex Officer' },
      { value: 'trade-finance-officer', label: 'Trade Finance Officer' },
      { value: 'interest-free-banking-officer', label: 'Interest Free Banking Officer' },
      { value: 'sharia-compliance-officer', label: 'Sharia Compliance Officer' },
      { value: 'treasury-officer', label: 'Treasury Officer' },
      { value: 'cashier', label: 'Cashier' },
      { value: 'microfinance-officer', label: 'Microfinance Officer' },
      { value: 'insurance-officer', label: 'Insurance Officer' },
      { value: 'insurance-underwriter', label: 'Insurance Underwriter' },
      { value: 'claims-officer', label: 'Claims Officer' },
      { value: 'actuarial-analyst', label: 'Actuarial Analyst' },
      { value: 'financial-analyst', label: 'Financial Analyst' },
      { value: 'investment-officer', label: 'Investment Officer' },
      { value: 'tax-officer', label: 'Tax Officer' },
      { value: 'tax-consultant', label: 'Tax Consultant' },
      { value: 'revenue-officer', label: 'Revenue Officer' },

      /* =========================
         ENGINEERING
      ========================== */
      { value: 'civil-engineer', label: 'Civil Engineer' },
      { value: 'site-engineer', label: 'Site Engineer' },
      { value: 'office-engineer', label: 'Office Engineer' },
      { value: 'resident-engineer', label: 'Resident Engineer' },
      { value: 'structural-engineer', label: 'Structural Engineer' },
      { value: 'geotechnical-engineer', label: 'Geotechnical Engineer' },
      { value: 'transport-engineer', label: 'Transport Engineer' },
      { value: 'highway-engineer', label: 'Highway Engineer' },
      { value: 'water-engineer', label: 'Water Engineer' },
      { value: 'hydraulic-engineer', label: 'Hydraulic Engineer' },
      { value: 'sanitary-engineer', label: 'Sanitary Engineer' },
      { value: 'electrical-engineer', label: 'Electrical Engineer' },
      { value: 'power-engineer', label: 'Power Engineer' },
      { value: 'mechanical-engineer', label: 'Mechanical Engineer' },
      { value: 'electromechanical-engineer', label: 'Electromechanical Engineer' },
      { value: 'industrial-engineer', label: 'Industrial Engineer' },
      { value: 'architect', label: 'Architect' },
      { value: 'landscape-architect', label: 'Landscape Architect' },
      { value: 'urban-planner', label: 'Urban Planner' },
      { value: 'quantity-surveyor', label: 'Quantity Surveyor' },
      { value: 'cost-engineer', label: 'Cost Engineer' },
      { value: 'construction-manager', label: 'Construction Manager' },
      { value: 'project-engineer', label: 'Project Engineer' },
      { value: 'site-supervisor', label: 'Site Supervisor' },
      { value: 'foreman', label: 'Foreman' },
      { value: 'draftsman', label: 'Draftsman' },
      { value: 'autocad-operator', label: 'AutoCAD Operator' },
      { value: 'survey-engineer', label: 'Survey Engineer' },
      { value: 'land-surveyor', label: 'Land Surveyor' },
      { value: 'building-inspector', label: 'Building Inspector' },
      { value: 'material-engineer', label: 'Material Engineer' },

      /* =========================
         AGRICULTURE
      ========================== */
      { value: 'agronomist', label: 'Agronomist' },
      { value: 'assistant-agronomist', label: 'Assistant Agronomist' },
      { value: 'crop-production-officer', label: 'Crop Production Officer' },
      { value: 'soil-scientist', label: 'Soil Scientist' },
      { value: 'irrigation-engineer', label: 'Irrigation Engineer' },
      { value: 'irrigation-technician', label: 'Irrigation Technician' },
      { value: 'horticulturist', label: 'Horticulturist' },
      { value: 'plant-protection-officer', label: 'Plant Protection Officer' },
      { value: 'livestock-production-officer', label: 'Livestock Production Officer' },
      { value: 'animal-health-officer', label: 'Animal Health Officer' },
      { value: 'veterinarian', label: 'Veterinarian' },
      { value: 'assistant-veterinarian', label: 'Assistant Veterinarian' },
      { value: 'fisheries-officer', label: 'Fisheries Officer' },
      { value: 'aquaculture-specialist', label: 'Aquaculture Specialist' },
      { value: 'beekeeper', label: 'Beekeeper' },
      { value: 'apiculture-officer', label: 'Apiculture Officer' },
      { value: 'forestry-officer', label: 'Forestry Officer' },
      { value: 'natural-resource-management-officer', label: 'Natural Resource Management Officer' },
      { value: 'environmental-officer', label: 'Environmental Officer' },
      { value: 'environmental-scientist', label: 'Environmental Scientist' },
      { value: 'climate-change-officer', label: 'Climate Change Officer' },
      { value: 'climate-adaptation-specialist', label: 'Climate Adaptation Specialist' },
      { value: 'agricultural-economist', label: 'Agricultural Economist' },
      { value: 'rural-development-officer', label: 'Rural Development Officer' },
      { value: 'extension-agent', label: 'Extension Agent' },
      { value: 'agricultural-extension-worker', label: 'Agricultural Extension Worker' },
      { value: 'seed-production-officer', label: 'Seed Production Officer' },
      { value: 'fertilizer-marketing-officer', label: 'Fertilizer Marketing Officer' },
      { value: 'agro-processing-officer', label: 'Agro-processing Officer' },
      { value: 'cooperative-officer', label: 'Cooperative Officer' },

      /* =========================
         HEALTH
      ========================== */
      { value: 'general-practitioner', label: 'General Practitioner' },
      { value: 'medical-doctor', label: 'Medical Doctor' },
      { value: 'specialist-physician', label: 'Specialist Physician' },
      { value: 'surgeon', label: 'Surgeon' },
      { value: 'pediatrician', label: 'Pediatrician' },
      { value: 'gynecologist', label: 'Gynecologist' },
      { value: 'nurse', label: 'Nurse' },
      { value: 'staff-nurse', label: 'Staff Nurse' },
      { value: 'clinical-nurse', label: 'Clinical Nurse' },
      { value: 'midwife', label: 'Midwife' },
      { value: 'anesthetist', label: 'Anesthetist' },
      { value: 'pharmacist', label: 'Pharmacist' },
      { value: 'druggist', label: 'Druggist' },
      { value: 'medical-laboratory-technologist', label: 'Medical Laboratory Technologist' },
      { value: 'lab-technician', label: 'Lab Technician' },
      { value: 'radiographer', label: 'Radiographer' },
      { value: 'radiologist', label: 'Radiologist' },
      { value: 'public-health-officer', label: 'Public Health Officer' },
      { value: 'epidemiologist', label: 'Epidemiologist' },
      { value: 'health-extension-worker', label: 'Health Extension Worker' },
      { value: 'health-education-officer', label: 'Health Education Officer' },
      { value: 'hospital-administrator', label: 'Hospital Administrator' },
      { value: 'health-information-officer', label: 'Health Information Officer' },
      { value: 'biomedical-engineer', label: 'Biomedical Engineer' },
      { value: 'biomedical-technician', label: 'Biomedical Technician' },
      { value: 'physiotherapist', label: 'Physiotherapist' },
      { value: 'occupational-therapist', label: 'Occupational Therapist' },
      { value: 'nutritionist', label: 'Nutritionist' },
      { value: 'dietitian', label: 'Dietitian' },
      { value: 'mental-health-officer', label: 'Mental Health Officer' },
      { value: 'psychologist', label: 'Psychologist' },
      { value: 'psychiatric-nurse', label: 'Psychiatric Nurse' },
      { value: 'emergency-medical-technician', label: 'Emergency Medical Technician' },

      /* =========================
         EDUCATION
      ========================== */
      { value: 'kindergarten-teacher', label: 'Kindergarten Teacher' },
      { value: 'primary-teacher', label: 'Primary Teacher' },
      { value: 'secondary-teacher', label: 'Secondary Teacher' },
      { value: 'high-school-teacher', label: 'High School Teacher' },
      { value: 'university-lecturer', label: 'University Lecturer' },
      { value: 'assistant-lecturer', label: 'Assistant Lecturer' },
      { value: 'professor', label: 'Professor' },
      { value: 'academic-researcher', label: 'Academic Researcher' },
      { value: 'tvet-trainer', label: 'TVET Trainer' },
      { value: 'technical-instructor', label: 'Technical Instructor' },
      { value: 'language-teacher', label: 'Language Teacher' },
      { value: 'english-instructor', label: 'English Instructor' },
      { value: 'math-teacher', label: 'Math Teacher' },
      { value: 'physics-teacher', label: 'Physics Teacher' },
      { value: 'chemistry-teacher', label: 'Chemistry Teacher' },
      { value: 'school-director', label: 'School Director' },
      { value: 'school-principal', label: 'School Principal' },
      { value: 'academic-coordinator', label: 'Academic Coordinator' },
      { value: 'education-officer', label: 'Education Officer' },
      { value: 'curriculum-developer', label: 'Curriculum Developer' },
      { value: 'education-planner', label: 'Education Planner' },
      { value: 'school-supervisor', label: 'School Supervisor' },
      { value: 'exam-officer', label: 'Exam Officer' },
      { value: 'guidance-counselor', label: 'Guidance Counselor' },
      { value: 'special-needs-teacher', label: 'Special Needs Teacher' },
      { value: 'librarian', label: 'Librarian' },
      { value: 'e-learning-specialist', label: 'E-learning Specialist' },

      /* =========================
         ADMIN
      ========================== */
      { value: 'administrative-assistant', label: 'Administrative Assistant' },
      { value: 'office-assistant', label: 'Office Assistant' },
      { value: 'executive-secretary', label: 'Executive Secretary' },
      { value: 'secretary', label: 'Secretary' },
      { value: 'hr-officer', label: 'HR Officer' },
      { value: 'hr-manager', label: 'HR Manager' },
      { value: 'recruitment-officer', label: 'Recruitment Officer' },
      { value: 'training-officer', label: 'Training Officer' },
      { value: 'performance-management-officer', label: 'Performance Management Officer' },
      { value: 'personnel-officer', label: 'Personnel Officer' },
      { value: 'organizational-development-officer', label: 'Organizational Development Officer' },
      { value: 'general-manager', label: 'General Manager' },
      { value: 'operations-manager', label: 'Operations Manager' },
      { value: 'business-development-officer', label: 'Business Development Officer' },
      { value: 'strategy-officer', label: 'Strategy Officer' },
      { value: 'customer-service-representative', label: 'Customer Service Representative' },
      { value: 'call-center-agent', label: 'Call Center Agent' },
      { value: 'sales-representative', label: 'Sales Representative' },
      { value: 'sales-manager', label: 'Sales Manager' },
      { value: 'marketing-officer', label: 'Marketing Officer' },
      { value: 'brand-manager', label: 'Brand Manager' },
      { value: 'procurement-officer', label: 'Procurement Officer' },
      { value: 'procurement-manager', label: 'Procurement Manager' },
      { value: 'supply-chain-officer', label: 'Supply Chain Officer' },
      { value: 'storekeeper', label: 'Storekeeper' },
      { value: 'inventory-controller', label: 'Inventory Controller' },
      { value: 'logistics-officer', label: 'Logistics Officer' },

      /* =========================
         DRIVERS
      ========================== */
      { value: 'driver', label: 'Driver' },
      { value: 'personal-driver', label: 'Personal Driver' },
      { value: 'truck-driver', label: 'Truck Driver' },
      { value: 'bus-driver', label: 'Bus Driver' },
      { value: 'heavy-truck-driver', label: 'Heavy Truck Driver' },
      { value: 'forklift-operator', label: 'Forklift Operator' },
      { value: 'machine-operator', label: 'Machine Operator' },
      { value: 'auto-mechanic', label: 'Auto Mechanic' },
      { value: 'diesel-mechanic', label: 'Diesel Mechanic' },
      { value: 'vehicle-electrician', label: 'Vehicle Electrician' },
      { value: 'garage-supervisor', label: 'Garage Supervisor' },
      { value: 'fleet-manager', label: 'Fleet Manager' },
      { value: 'transport-coordinator', label: 'Transport Coordinator' },
      { value: 'dispatch-officer', label: 'Dispatch Officer' },
      { value: 'customs-clearing-officer', label: 'Customs Clearing Officer' },
      { value: 'port-officer', label: 'Port Officer' },
      { value: 'cargo-handler', label: 'Cargo Handler' },
      { value: 'aviation-technician', label: 'Aviation Technician' },
      { value: 'aircraft-mechanic', label: 'Aircraft Mechanic' },

      /* =========================
         HOSPITALITY
      ========================== */
      { value: 'hotel-manager', label: 'Hotel Manager' },
      { value: 'assistant-hotel-manager', label: 'Assistant Hotel Manager' },
      { value: 'front-desk-officer', label: 'Front Desk Officer' },
      { value: 'receptionist', label: 'Receptionist' },
      { value: 'waiter', label: 'Waiter' },
      { value: 'waitress', label: 'Waitress' },
      { value: 'chef', label: 'Chef' },
      { value: 'assistant-chef', label: 'Assistant Chef' },
      { value: 'cook', label: 'Cook' },
      { value: 'baker', label: 'Baker' },
      { value: 'pastry-chef', label: 'Pastry Chef' },
      { value: 'housekeeping-supervisor', label: 'Housekeeping Supervisor' },
      { value: 'housekeeper', label: 'Housekeeper' },
      { value: 'barista', label: 'Barista' },
      { value: 'bartender', label: 'Bartender' },
      { value: 'tour-guide', label: 'Tour Guide' },
      { value: 'travel-consultant', label: 'Travel Consultant' },
      { value: 'event-coordinator', label: 'Event Coordinator' },
      { value: 'catering-supervisor', label: 'Catering Supervisor' },
      { value: 'restaurant-manager', label: 'Restaurant Manager' },

      /* =========================
         SECURITY
      ========================== */
      { value: 'security-guard', label: 'Security Guard' },
      { value: 'chief-security-officer', label: 'Chief Security Officer' },
      { value: 'safety-officer', label: 'Safety Officer' },
      { value: 'fire-safety-officer', label: 'Fire Safety Officer' },
      { value: 'occupational-health-officer', label: 'Occupational Health Officer' },
      { value: 'cleaner', label: 'Cleaner' },
      { value: 'janitor', label: 'Janitor' },
      { value: 'messenger', label: 'Messenger' },
      { value: 'office-runner', label: 'Office Runner' },
      { value: 'groundskeeper', label: 'Groundskeeper' },
      { value: 'maintenance-worker', label: 'Maintenance Worker' },
      { value: 'caretaker', label: 'Caretaker' },
      { value: 'store-assistant', label: 'Store Assistant' },
      { value: 'night-guard', label: 'Night Guard' },
      { value: 'loss-prevention-officer', label: 'Loss Prevention Officer' },

      /* =========================
         GRADUATE & ENTRY LEVEL
      ========================== */
      { value: 'graduate-trainee', label: 'Graduate Trainee' },
      { value: 'intern', label: 'Intern' },
      { value: 'internship', label: 'Internship' },
      { value: 'apprentice', label: 'Apprentice' },
      { value: 'volunteer', label: 'Volunteer' },
      { value: 'national-service', label: 'National Service' },

      /* =========================
         OTHER
      ========================== */
      { value: 'other', label: 'Other' }
    ];

    return categories;
  },

  getAllJobCategories: (): Array<{ value: string, label: string }> => {
    return jobService.getJobCategories();
  },

  getEducationLevels: (): Array<{ value: string, label: string }> => {
    return [
      // Ethiopian Education System
      { value: 'primary-education', label: 'Primary Education' },
      { value: 'secondary-education', label: 'Secondary Education' },
      { value: 'tvet-level-i', label: 'TVET Level I - Basic Skills' },
      { value: 'tvet-level-ii', label: 'TVET Level II - Skilled Worker' },
      { value: 'tvet-level-iii', label: 'TVET Level III - Technician' },
      { value: 'tvet-level-iv', label: 'TVET Level IV - Senior Technician' },
      { value: 'tvet-level-v', label: 'TVET Level V - Expert/Trainer' },
      { value: 'undergraduate-bachelors', label: 'Undergraduate (Bachelor\'s)' },
      { value: 'postgraduate-masters', label: 'Postgraduate (Master\'s)' },
      { value: 'doctoral-phd', label: 'Doctoral (Ph.D.)' },
      { value: 'lecturer', label: 'Lecturer' },
      { value: 'professor', label: 'Professor' },
      { value: 'none-required', label: 'Not Required' }
    ];
  },

  getSalaryRanges: (currency: string = 'ETB') => {
    const ranges = {
      ETB: [
        { label: 'Under 2,000 ETB', min: 0, max: 2000 },
        { label: '2,000 - 5,000 ETB', min: 2000, max: 5000 },
        { label: '5,000 - 10,000 ETB', min: 5000, max: 10000 },
        { label: '10,000 - 20,000 ETB', min: 10000, max: 20000 },
        { label: '20,000 - 50,000 ETB', min: 20000, max: 50000 },
        { label: '50,000+ ETB', min: 50000, max: null }
      ],
      USD: [
        { label: 'Under $500', min: 0, max: 500 },
        { label: '$500 - $1,000', min: 500, max: 1000 },
        { label: '$1,000 - $2,000', min: 1000, max: 2000 },
        { label: '$2,000 - $5,000', min: 2000, max: 5000 },
        { label: '$5,000+', min: 5000, max: null }
      ],
      EUR: [
        { label: 'Under €500', min: 0, max: 500 },
        { label: '€500 - €1,000', min: 500, max: 1000 },
        { label: '€1,000 - €2,000', min: 1000, max: 2000 },
        { label: '€2,000 - €5,000', min: 2000, max: 5000 },
        { label: '€5,000+', min: 5000, max: null }
      ],
      GBP: [
        { label: 'Under £500', min: 0, max: 500 },
        { label: '£500 - £1,000', min: 500, max: 1000 },
        { label: '£1,000 - £2,000', min: 1000, max: 2000 },
        { label: '£2,000 - £5,000', min: 2000, max: 5000 },
        { label: '£5,000+', min: 5000, max: null }
      ]
    };
    return ranges[currency as keyof typeof ranges] || ranges.ETB;
  },

  normalizeEducationLevel: (level: string): string => {
    const mapping: Record<string, string> = {
      // Map old values to new values
      'high-school': 'secondary-education',
      'diploma': 'tvet-level-iii',
      'bachelors': 'undergraduate-bachelors',
      'masters': 'postgraduate-masters',
      'phd': 'doctoral-phd'
    };
    return mapping[level] || level;
  },

  // =============================================
  // NEW METHODS FOR PROCESSING API RESPONSES
  // =============================================

  /**
   * Process API job response to ensure all fields are properly set
   * @param job - Raw job data from API
   * @returns Processed job with all computed fields
   */
  processJobResponse: (job: any): Job => {
    // Ensure salaryMode has a default
    if (!job.salaryMode) {
      job.salaryMode = SalaryMode.RANGE;
    }

    // Ensure isApplyEnabled has a default
    if (job.isApplyEnabled === undefined) {
      job.isApplyEnabled = true;
    }

    // Ensure candidatesNeeded has a default
    if (job.candidatesNeeded === undefined) {
      job.candidatesNeeded = 1;
    }

    // Add computed fields if not provided by backend
    if (!job.salaryInfo) {
      job.salaryInfo = jobService.getSalaryInfo(job);
    }

    if (!job.applicationInfo) {
      job.applicationInfo = jobService.getApplicationStatusInfo(job);
    }

    // Add virtual fields if not present
    if (job.salaryDisplay === undefined) {
      job.salaryDisplay = jobService.getFormattedSalary(job);
    }

    if (job.isActive === undefined) {
      job.isActive = job.status === JobStatus.ACTIVE &&
        (!job.applicationDeadline || new Date(job.applicationDeadline) > new Date());
    }

    if (job.isExpired === undefined && job.applicationDeadline) {
      job.isExpired = new Date(job.applicationDeadline) < new Date();
    }

    return job as Job;
  },

  /**
   * Process multiple job responses
   * @param jobs - Array of raw job data
   * @returns Array of processed jobs
   */
  processJobsResponse: (jobs: any[]): Job[] => {
    return jobs.map(job => jobService.processJobResponse(job));
  },

  /**
   * Prepare job data for API submission
   * @param data - Job form data
   * @returns Cleaned data ready for API
   */
  prepareJobDataForSubmission: (data: JobFormData): any => {
    const submissionData = { ...data };

    // Set defaults if not provided
    if (submissionData.candidatesNeeded === undefined) {
      submissionData.candidatesNeeded = 1;
    }

    if (submissionData.salaryMode === undefined) {
      submissionData.salaryMode = SalaryMode.RANGE;
    }

    if (submissionData.isApplyEnabled === undefined) {
      submissionData.isApplyEnabled = true;
    }

    // Clean up salary data based on salary mode
    if (submissionData.salaryMode !== SalaryMode.RANGE && submissionData.salary) {
      // Clear salary fields for non-range modes
      submissionData.salary = {
        currency: 'ETB',
        period: 'monthly',
        isPublic: false,
        isNegotiable: submissionData.salaryMode === SalaryMode.NEGOTIABLE
      };
    }

    return submissionData;
  }
};

export default jobService;