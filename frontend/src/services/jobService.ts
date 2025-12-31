/* eslint-disable @typescript-eslint/no-explicit-any */
// services/jobService.ts - COMPLETE FIXED VERSION
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

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

// Main Job Interface - UPDATED TO MATCH BACKEND
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
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
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
  };

  // Organization fields (for organization opportunities)
  organization?: Organization;
  jobType: 'company' | 'organization';
  opportunityType?: 'job' | 'volunteer' | 'internship' | 'fellowship' | 'training' | 'grant' | 'other';
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
  isActive?: boolean;
  applications?: any[];
  views?: number;
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

// Job Filters Interface
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
  };
}

// Categories Response Interface
export interface CategoriesResponse {
  success: boolean;
  data: Array<{ _id: string, count: number }>;
}

// Error handling function
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

// Validation functions
const validateJobData = (data: Partial<Job>): void => {
  if (data.title && data.title.trim().length < 5) {
    throw new Error('Job title must be at least 5 characters long');
  }

  if (data.title && data.title.trim().length > 100) {
    throw new Error('Job title cannot exceed 100 characters');
  }

  if (data.description && data.description.length < 50) {
    throw new Error('Job description must be at least 50 characters long');
  }

  if (data.description && data.description.length > 5000) {
    throw new Error('Description cannot exceed 5000 characters');
  }

  if (data.shortDescription && data.shortDescription.length > 200) {
    throw new Error('Short description cannot exceed 200 characters');
  }
};

// Info handler function
const handleInfo = (message: string): void => {
  console.info(message);
};

export const jobService = {
  getJobs: async (params?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<JobsResponse>('/job', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch jobs') as never;
    }
  },

  // Get single job - FIXED VERSION
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

  // Get company's jobs
  getCompanyJobs: async (params?: { page?: number; limit?: number; status?: string }): Promise<CompanyJobsResponse> => {
    try {
      const response = await api.get<CompanyJobsResponse>('/job/company/my-jobs', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch company jobs') as never;
    }
  },

  // Create job
  createJob: async (data: Partial<Job>): Promise<Job> => {
    try {
      validateJobData(data);

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

  // Update job
  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    try {
      if (!id) {
        throw new Error('Job ID is required');
      }

      validateJobData(data);

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

  // Delete job
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

  // ORGANIZATION METHODS

  // Get organization's opportunities
  getOrganizationJobs: async (params?: { page?: number; limit?: number; status?: string }): Promise<OrganizationJobsResponse> => {
    try {
      const response = await api.get<OrganizationJobsResponse>('/job/organization/my-jobs', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch organization opportunities') as never;
    }
  },

  // Create opportunity for organization
  createOrganizationJob: async (data: Partial<Job>): Promise<Job> => {
    try {
      validateJobData(data);

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

  // Update organization opportunity
  updateOrganizationJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    try {
      if (!id) {
        throw new Error('Opportunity ID is required');
      }

      validateJobData(data);

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

  // Delete organization opportunity
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

  getJobsForCandidate: async (params?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<JobsResponse>('/job/candidate/jobs', { params });
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch jobs');
      throw error;
    }
  },

  // FIXED: Save job for candidate - PATH IS CORRECT
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

  // FIXED: Unsave job for candidate - PATH IS CORRECT
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

  // Get saved jobs for candidate - FIXED PATH
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

  // Get job categories
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

  // Helper to format salary for display
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

  // Helper to get job type label
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

  // Helper to get experience level label
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

  // Helper to get Ethiopian education level label - UPDATED
  getEducationLabel: (level: string | undefined): string => {
    if (!level) return 'Not Specified';
    const educationLevels = jobService.getEducationLevels();
    const found = educationLevels.find(edu => edu.value === level);
    return found ? found.label : level;
  },

  // Helper for sex requirements
  getSexRequirementLabel: (sex: string): string => {
    const labels: Record<string, string> = {
      'male': 'Male Only',
      'female': 'Female Only',
      'any': 'Any Gender'
    };
    return labels[sex] || 'Any Gender';
  },

  // Helper for age requirement display
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

  // Helper to get job type display label (company vs organization)
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

  // Helper to get owner name (company or organization)
  getOwnerName: (job: Job): string => {
    if (job.jobType === 'organization' && job.organization) {
      return job.organization.name;
    }
    if (job.jobType === 'company' && job.company) {
      return job.company.name;
    }
    return 'Unknown';
  },

  // Helper to get owner type
  getOwnerType: (job: Job): string => {
    return job.jobType === 'organization' ? 'Organization' : 'Company';
  },

  // Helper to check if job belongs to current organization
  isOrganizationJobOwner: (job: Job, organizationId?: string): boolean => {
    return job.jobType === 'organization' && job.organization?._id === organizationId;
  },

  // Helper to check if job belongs to current company
  isCompanyJobOwner: (job: Job, companyId?: string): boolean => {
    return job.jobType === 'company' && job.company?._id === companyId;
  },

  // Get Ethiopian regions
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

  // Get opportunity types for organizations
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

  // Get commitment levels for volunteer opportunities
  getCommitmentLevels: (): Array<{ value: string, label: string }> => {
    return [
      { value: 'casual', label: 'Casual (1-10 hours/week)' },
      { value: 'regular', label: 'Regular (10-25 hours/week)' },
      { value: 'intensive', label: 'Intensive (25+ hours/week)' }
    ];
  },

  // Get duration units for opportunities
  getDurationUnits: (): Array<{ value: string, label: string }> => {
    return [
      { value: 'days', label: 'Days' },
      { value: 'weeks', label: 'Weeks' },
      { value: 'months', label: 'Months' },
      { value: 'years', label: 'Years' }
    ];
  },

  // Get job categories - UPDATED TO MATCH BACKEND
  getJobCategories: (): Array<{ value: string, label: string }> => {
    return [
      // Technology & IT (Expanded)
      { value: 'software-developer', label: 'Software Developer' },
      { value: 'web-developer', label: 'Web Developer' },
      { value: 'mobile-app-developer', label: 'Mobile App Developer' },
      { value: 'ai-engineer', label: 'AI Engineer' },
      { value: 'machine-learning-specialist', label: 'Machine Learning Specialist' },
      { value: 'data-analyst', label: 'Data Analyst' },
      { value: 'data-scientist', label: 'Data Scientist' },
      { value: 'cybersecurity-analyst', label: 'Cybersecurity Analyst' },
      { value: 'network-administrator', label: 'Network Administrator' },
      { value: 'database-administrator', label: 'Database Administrator' },
      { value: 'cloud-engineer', label: 'Cloud Engineer' },
      { value: 'devops-engineer', label: 'DevOps Engineer' },
      { value: 'ui-ux-designer', label: 'UI/UX Designer' },
      { value: 'game-developer', label: 'Game Developer' },
      { value: 'it-project-manager', label: 'IT Project Manager' },
      { value: 'blockchain-developer', label: 'Blockchain Developer' },
      { value: 'ar-vr-specialist', label: 'AR/VR Specialist' },
      { value: 'computer-hardware-technician', label: 'Computer Hardware Technician' },
      { value: 'it-support-specialist', label: 'IT Support Specialist' },
      { value: 'systems-analyst', label: 'Systems Analyst' },

      // Engineering & Construction (Expanded)
      { value: 'civil-engineer', label: 'Civil Engineer' },
      { value: 'mechanical-engineer', label: 'Mechanical Engineer' },
      { value: 'electrical-engineer', label: 'Electrical Engineer' },
      { value: 'chemical-engineer', label: 'Chemical Engineer' },
      { value: 'industrial-engineer', label: 'Industrial Engineer' },
      { value: 'structural-engineer', label: 'Structural Engineer' },
      { value: 'architect', label: 'Architect' },
      { value: 'construction-manager', label: 'Construction Manager' },
      { value: 'surveyor', label: 'Surveyor' },
      { value: 'urban-planner', label: 'Urban Planner' },
      { value: 'quantity-surveyor', label: 'Quantity Surveyor' },
      // REMOVE DUPLICATE: { value: 'environmental-engineer', label: 'Environmental Engineer' }, // This appears in Energy & Utilities
      { value: 'mining-engineer', label: 'Mining Engineer' },
      { value: 'geotechnical-engineer', label: 'Geotechnical Engineer' },
      { value: 'water-resource-engineer', label: 'Water Resource Engineer' },
      { value: 'road-construction-technician', label: 'Road Construction Technician' },
      { value: 'site-supervisor', label: 'Site Supervisor' },
      { value: 'building-inspector', label: 'Building Inspector' },
      { value: 'mason', label: 'Mason' },
      { value: 'carpenter', label: 'Carpenter' },

      // Healthcare (Expanded)
      { value: 'medical-doctor', label: 'Medical Doctor' },
      { value: 'nurse', label: 'Nurse' },
      { value: 'midwife', label: 'Midwife' },
      { value: 'pharmacist', label: 'Pharmacist' },
      { value: 'medical-laboratory-technician', label: 'Medical Laboratory Technician' },
      { value: 'radiologist', label: 'Radiologist' },
      { value: 'physiotherapist', label: 'Physiotherapist' },
      { value: 'dentist', label: 'Dentist' },
      { value: 'public-health-officer', label: 'Public Health Officer' },
      { value: 'nutritionist', label: 'Nutritionist' },
      { value: 'health-extension-worker', label: 'Health Extension Worker' },
      { value: 'community-health-nurse', label: 'Community Health Nurse' },
      { value: 'emergency-medical-technician', label: 'Emergency Medical Technician' },
      { value: 'optometrist', label: 'Optometrist' },
      { value: 'biomedical-engineer', label: 'Biomedical Engineer' },
      { value: 'psychologist', label: 'Psychologist' },
      { value: 'clinical-officer', label: 'Clinical Officer' },
      { value: 'hospital-administrator', label: 'Hospital Administrator' },
      { value: 'veterinarian', label: 'Veterinarian' },
      { value: 'health-information-technician', label: 'Health Information Technician' },

      // Education (Expanded)
      { value: 'kindergarten-teacher', label: 'Kindergarten Teacher' },
      { value: 'primary-school-teacher', label: 'Primary School Teacher' },
      { value: 'secondary-school-teacher', label: 'Secondary School Teacher' },
      { value: 'university-lecturer', label: 'University Lecturer' },
      { value: 'professor', label: 'Professor' },
      { value: 'teacher-trainer', label: 'Teacher Trainer' },
      { value: 'curriculum-developer', label: 'Curriculum Developer' },
      { value: 'educational-researcher', label: 'Educational Researcher' },
      { value: 'school-administrator', label: 'School Administrator' },
      { value: 'librarian', label: 'Librarian' },
      { value: 'special-needs-educator', label: 'Special Needs Educator' },
      { value: 'language-instructor', label: 'Language Instructor' },
      { value: 'online-tutor', label: 'Online Tutor' },
      { value: 'tvet-trainer', label: 'TVET Trainer' },
      { value: 'education-policy-analyst', label: 'Education Policy Analyst' },
      { value: 'academic-advisor', label: 'Academic Advisor' },
      { value: 'exam-coordinator', label: 'Exam Coordinator' },
      { value: 'school-counselor', label: 'School Counselor' },
      { value: 'education-technologist', label: 'Education Technologist' },
      { value: 'instructional-designer', label: 'Instructional Designer' },

      // Business & Finance (Expanded)
      { value: 'accountant', label: 'Accountant' },
      { value: 'auditor', label: 'Auditor' },
      { value: 'financial-analyst', label: 'Financial Analyst' },
      { value: 'bank-teller', label: 'Bank Teller' },
      { value: 'loan-officer', label: 'Loan Officer' },
      { value: 'insurance-agent', label: 'Insurance Agent' },
      { value: 'tax-consultant', label: 'Tax Consultant' },
      { value: 'investment-advisor', label: 'Investment Advisor' },
      { value: 'business-consultant', label: 'Business Consultant' },
      { value: 'entrepreneur', label: 'Entrepreneur' },
      { value: 'procurement-officer', label: 'Procurement Officer' },
      { value: 'human-resource-manager', label: 'Human Resource Manager' },
      { value: 'marketing-specialist', label: 'Marketing Specialist' },
      { value: 'sales-executive', label: 'Sales Executive' },
      { value: 'administrative-assistant', label: 'Administrative Assistant' },
      { value: 'customer-service-representative', label: 'Customer Service Representative' },
      { value: 'project-manager', label: 'Project Manager' },
      { value: 'management-consultant', label: 'Management Consultant' },
      { value: 'data-entry-clerk', label: 'Data Entry Clerk' },
      { value: 'operations-manager', label: 'Operations Manager' },

      // Agriculture & Environment (Expanded)
      { value: 'agronomist', label: 'Agronomist' },
      { value: 'livestock-expert', label: 'Livestock Expert' },
      { value: 'horticulturist', label: 'Horticulturist' },
      { value: 'forestry-technician', label: 'Forestry Technician' },
      { value: 'soil-scientist', label: 'Soil Scientist' },
      { value: 'irrigation-technician', label: 'Irrigation Technician' },
      { value: 'agricultural-economist', label: 'Agricultural Economist' },
      { value: 'farm-manager', label: 'Farm Manager' },
      { value: 'beekeeper', label: 'Beekeeper' },
      { value: 'fisheries-officer', label: 'Fisheries Officer' },
      { value: 'veterinary-assistant', label: 'Veterinary Assistant' },
      { value: 'agricultural-extension-worker', label: 'Agricultural Extension Worker' },
      { value: 'hydrologist', label: 'Hydrologist' },
      { value: 'environmental-scientist', label: 'Environmental Scientist' },
      { value: 'climate-change-specialist', label: 'Climate Change Specialist' },
      { value: 'wildlife-conservationist', label: 'Wildlife Conservationist' },
      { value: 'organic-farmer', label: 'Organic Farmer' },
      { value: 'agricultural-engineer', label: 'Agricultural Engineer' },
      { value: 'greenhouse-technician', label: 'Greenhouse Technician' },
      { value: 'agro-processing-specialist', label: 'Agro Processing Specialist' },

      // Creative & Media (Expanded)
      { value: 'graphic-designer', label: 'Graphic Designer' },
      { value: 'photographer', label: 'Photographer' },
      { value: 'videographer', label: 'Videographer' },
      { value: 'film-director', label: 'Film Director' },
      { value: 'sound-engineer', label: 'Sound Engineer' },
      { value: 'animator', label: 'Animator' },
      { value: 'fashion-designer', label: 'Fashion Designer' },
      { value: 'interior-designer', label: 'Interior Designer' },
      { value: 'journalist', label: 'Journalist' },
      { value: 'news-anchor', label: 'News Anchor' },
      { value: 'social-media-manager', label: 'Social Media Manager' },
      { value: 'public-relations-officer', label: 'Public Relations Officer' },
      { value: 'copywriter', label: 'Copywriter' },
      { value: 'content-creator', label: 'Content Creator' },
      { value: 'digital-marketer', label: 'Digital Marketer' },
      { value: 'editor', label: 'Editor' },
      { value: 'musician', label: 'Musician' },
      { value: 'actor', label: 'Actor' },
      { value: 'painter', label: 'Painter' },
      { value: 'cultural-heritage-specialist', label: 'Cultural Heritage Specialist' },

      // Legal & Public Service (Expanded)
      { value: 'lawyer', label: 'Lawyer' },
      { value: 'judge', label: 'Judge' },
      { value: 'legal-assistant', label: 'Legal Assistant' },
      { value: 'prosecutor', label: 'Prosecutor' },
      { value: 'court-clerk', label: 'Court Clerk' },
      { value: 'police-officer', label: 'Police Officer' },
      { value: 'customs-officer', label: 'Customs Officer' },
      { value: 'immigration-officer', label: 'Immigration Officer' },
      { value: 'public-administrator', label: 'Public Administrator' },
      { value: 'policy-analyst', label: 'Policy Analyst' },
      { value: 'diplomat', label: 'Diplomat' },
      { value: 'foreign-service-officer', label: 'Foreign Service Officer' },
      { value: 'urban-governance-expert', label: 'Urban Governance Expert' },
      { value: 'elected-official', label: 'Elected Official' },
      { value: 'civil-registrar', label: 'Civil Registrar' },
      { value: 'social-worker', label: 'Social Worker' },
      { value: 'human-rights-advocate', label: 'Human Rights Advocate' },
      { value: 'mediator', label: 'Mediator' },
      { value: 'compliance-officer', label: 'Compliance Officer' },
      { value: 'anti-corruption-officer', label: 'Anti Corruption Officer' },

      // Hospitality & Tourism (Expanded)
      { value: 'hotel-manager', label: 'Hotel Manager' },
      { value: 'tour-guide', label: 'Tour Guide' },
      { value: 'chef', label: 'Chef' },
      { value: 'waiter', label: 'Waiter' },
      { value: 'bartender', label: 'Bartender' },
      { value: 'housekeeper', label: 'Housekeeper' },
      { value: 'event-planner', label: 'Event Planner' },
      { value: 'travel-agent', label: 'Travel Agent' },
      { value: 'front-desk-officer', label: 'Front Desk Officer' },
      { value: 'concierge', label: 'Concierge' },
      { value: 'restaurant-manager', label: 'Restaurant Manager' },
      { value: 'baker', label: 'Baker' },
      { value: 'pastry-chef', label: 'Pastry Chef' },
      { value: 'resort-manager', label: 'Resort Manager' },
      { value: 'catering-manager', label: 'Catering Manager' },
      { value: 'cruise-staff', label: 'Cruise Staff' },
      { value: 'tourism-development-officer', label: 'Tourism Development Officer' },
      { value: 'sommelier', label: 'Sommelier' },
      { value: 'barista', label: 'Barista' },
      { value: 'food-beverage-supervisor', label: 'Food Beverage Supervisor' },

      // Manufacturing & Production (Expanded)
      { value: 'factory-worker', label: 'Factory Worker' },
      { value: 'production-supervisor', label: 'Production Supervisor' },
      { value: 'quality-control-inspector', label: 'Quality Control Inspector' },
      { value: 'machinist', label: 'Machinist' },
      { value: 'welder', label: 'Welder' },
      { value: 'textile-worker', label: 'Textile Worker' },
      { value: 'garment-designer', label: 'Garment Designer' },
      { value: 'plastic-production-operator', label: 'Plastic Production Operator' },
      { value: 'metal-fabricator', label: 'Metal Fabricator' },
      { value: 'packaging-technician', label: 'Packaging Technician' },
      { value: 'maintenance-technician', label: 'Maintenance Technician' },
      { value: 'tool-maker', label: 'Tool Maker' },
      { value: 'machine-operator', label: 'Machine Operator' },
      { value: 'industrial-electrician', label: 'Industrial Electrician' },
      { value: 'production-engineer', label: 'Production Engineer' },
      { value: 'leather-technician', label: 'Leather Technician' },
      { value: 'furniture-maker', label: 'Furniture Maker' },
      { value: 'ceramics-artist', label: 'Ceramics Artist' },
      { value: 'printing-technician', label: 'Printing Technician' },
      { value: 'toy-manufacturer', label: 'Toy Manufacturer' },

      // Transportation & Logistics (Expanded)
      { value: 'driver', label: 'Driver' },
      { value: 'truck-operator', label: 'Truck Operator' },
      { value: 'logistics-coordinator', label: 'Logistics Coordinator' },
      { value: 'transport-manager', label: 'Transport Manager' },
      { value: 'warehouse-officer', label: 'Warehouse Officer' },
      { value: 'forklift-operator', label: 'Forklift Operator' },
      { value: 'ship-captain', label: 'Ship Captain' },
      { value: 'flight-attendant', label: 'Flight Attendant' },
      { value: 'air-traffic-controller', label: 'Air Traffic Controller' },
      { value: 'pilot', label: 'Pilot' },
      { value: 'aviation-maintenance-technician', label: 'Aviation Maintenance Technician' },
      { value: 'railway-engineer', label: 'Railway Engineer' },
      { value: 'delivery-driver', label: 'Delivery Driver' },
      { value: 'fleet-manager', label: 'Fleet Manager' },
      { value: 'transport-planner', label: 'Transport Planner' },
      { value: 'maritime-officer', label: 'Maritime Officer' },
      { value: 'cargo-handler', label: 'Cargo Handler' },
      { value: 'port-operations-manager', label: 'Port Operations Manager' },
      { value: 'customs-broker', label: 'Customs Broker' },
      { value: 'dispatcher', label: 'Dispatcher' },

      // Energy & Utilities (Expanded)
      { value: 'renewable-energy-technician', label: 'Renewable Energy Technician' },
      { value: 'solar-panel-installer', label: 'Solar Panel Installer' },
      { value: 'wind-turbine-technician', label: 'Wind Turbine Technician' },
      { value: 'hydropower-engineer', label: 'Hydropower Engineer' },
      { value: 'energy-auditor', label: 'Energy Auditor' },
      { value: 'electric-power-line-technician', label: 'Electric Power Line Technician' },
      { value: 'water-treatment-operator', label: 'Water Treatment Operator' },
      { value: 'waste-management-officer', label: 'Waste Management Officer' },
      { value: 'environmental-engineer', label: 'Environmental Engineer' }, // KEEP THIS ONE
      { value: 'utility-manager', label: 'Utility Manager' },
      { value: 'petroleum-engineer', label: 'Petroleum Engineer' },
      { value: 'gas-plant-operator', label: 'Gas Plant Operator' },
      { value: 'chemical-plant-technician', label: 'Chemical Plant Technician' },
      { value: 'recycling-specialist', label: 'Recycling Specialist' },
      { value: 'nuclear-safety-technician', label: 'Nuclear Safety Technician' },
      { value: 'meter-reader', label: 'Meter Reader' },
      { value: 'electricity-distribution-engineer', label: 'Electricity Distribution Engineer' },
      { value: 'boiler-operator', label: 'Boiler Operator' },
      { value: 'maintenance-planner', label: 'Maintenance Planner' },
      { value: 'energy-policy-analyst', label: 'Energy Policy Analyst' },

      // Emerging & Specialized Roles
      { value: 'ai-ethics-specialist', label: 'AI Ethics Specialist' },
      { value: 'sustainability-officer', label: 'Sustainability Officer' },
      { value: 'e-commerce-manager', label: 'E-commerce Manager' },
      { value: 'digital-transformation-consultant', label: 'Digital Transformation Consultant' },
      { value: 'remote-work-coordinator', label: 'Remote Work Coordinator' },
      { value: 'drone-operator', label: 'Drone Operator' },
      { value: '3d-printing-technician', label: '3D Printing Technician' },
      { value: 'robotics-engineer', label: 'Robotics Engineer' },
      { value: 'climate-data-analyst', label: 'Climate Data Analyst' },
      { value: 'social-impact-consultant', label: 'Social Impact Consultant' },
      { value: 'health-data-analyst', label: 'Health Data Analyst' },
      { value: 'cybercrime-investigator', label: 'Cybercrime Investigator' },
      { value: 'it-policy-advisor', label: 'IT Policy Advisor' },
      { value: 'open-data-specialist', label: 'Open Data Specialist' },
      { value: 'data-governance-officer', label: 'Data Governance Officer' },
      { value: 'innovation-manager', label: 'Innovation Manager' },
      { value: 'creative-director', label: 'Creative Director' },
      { value: 'startup-founder', label: 'Startup Founder' },
      { value: 'community-development-specialist', label: 'Community Development Specialist' },
      { value: 'nonprofit-manager', label: 'Nonprofit Manager' },

      // Keep existing categories for backward compatibility
      { value: 'software-development', label: 'Software Development' },
      { value: 'web-development', label: 'Web Development' },
      { value: 'mobile-development', label: 'Mobile Development' },
      { value: 'frontend-development', label: 'Frontend Development' },
      { value: 'backend-development', label: 'Backend Development' },
      { value: 'full-stack-development', label: 'Full Stack Development' },
      { value: 'devops', label: 'DevOps' },
      { value: 'cloud-computing', label: 'Cloud Computing' },
      { value: 'data-science', label: 'Data Science' },
      { value: 'machine-learning', label: 'Machine Learning' },
      { value: 'artificial-intelligence', label: 'Artificial Intelligence' },
      { value: 'cybersecurity', label: 'Cybersecurity' },
      { value: 'it-support', label: 'IT Support' },
      { value: 'network-administration', label: 'Network Administration' },
      { value: 'database-administration', label: 'Database Administration' },
      { value: 'system-administration', label: 'System Administration' },

      // Other
      { value: 'other', label: 'Other' }
    ];
  },

  // Get education levels that match backend - UPDATED
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
  getAllJobCategories: (): Array<{ value: string, label: string }> => {
    return jobService.getJobCategories(); // This returns all categories
  },
  // Get salary ranges for Ethiopian market
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

  // Normalize education level values for backward compatibility
  // In jobService.ts - update the normalizeEducationLevel function
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
  }
};