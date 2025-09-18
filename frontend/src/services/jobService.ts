/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

export interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  type: string;
  location: string;
  salary?: JobSalary;
  category?: string;
  experienceLevel: string;
  status: string;
  remote: boolean;
  applicationDeadline?: string;
  company: {
    description: any;
    website: any;
    _id: string;
    name: string;
    logoUrl?: string;
    verified: boolean;
    industry?: string;
  };
  createdBy: string;
  applicationCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobsResponse {
  success: boolean;
  data: Job[];
  pagination?: {
    current: number;
    total: number;
    results: number;
  };
}

export interface JobResponse {
  success: boolean;
  data: Job;
}

export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  type?: string;
  category?: string;
  remote?: boolean;
  experienceLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  skills?: string[];
}

export interface ApplicationData {
  coverLetter: string;
  proposal: string;
  bidAmount?: number;
}
export const jobService = {
  // Get all jobs - keep as is
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    type?: string;
    category?: string;
    remote?: boolean;
    experienceLevel?: string;
  }): Promise<JobsResponse> => {
    try {
      const response = await api.get<JobsResponse>('/job', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get jobs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch jobs');
    }
  },

  // Get single job - keep as is
  getJob: async (id: string): Promise<Job> => {
    try {
      const response = await api.get<JobResponse>(`/job/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch job');
    }
  },

  // Get company's jobs - change from '/job/company/my-jobs' to '/job/my-jobs'
getCompanyJobs: async (): Promise<Job[]> => {
  try {
    const response = await api.get<JobsResponse>('/job/company/my-jobs');
    return response.data.data;
  } catch (error: any) {
    console.error('Get company jobs error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch company jobs');
  }
},

  // Create job - keep as is
  createJob: async (data: Partial<Job>): Promise<Job> => {
    try {
      const response = await api.post<JobResponse>('/job', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Create job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create job');
    }
  },

  // Update job - keep as is
  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    try {
      const response = await api.put<JobResponse>(`/job/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Update job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update job');
    }
  },

  // Delete job - keep as is
  deleteJob: async (id: string): Promise<void> => {
    try {
      await api.delete(`/job/${id}`);
    } catch (error: any) {
      console.error('Delete job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete job');
    }
  },
    getFreelancerJobs: async (filters?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<JobsResponse>('/job/public', { 
        params: filters 
      });
      return response.data;
    } catch (error: any) {
      console.error('Get freelancer jobs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch jobs');
    }
  },

  // Get single job
  // getJob: async (id: string): Promise<Job> => {
  //   try {
  //     const response = await api.get<JobResponse>(`/job/${id}`);
  //     return response.data.data;
  //   } catch (error: any) {
  //     console.error('Get job error:', error);
  //     throw new Error(error.response?.data?.message || 'Failed to fetch job');
  //   }
  // },

  // Save job
  saveJob: async (jobId: string): Promise<void> => {
    try {
      await api.post(`/job/${jobId}/save`);
    } catch (error: any) {
      console.error('Save job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to save job');
    }
  },

  // Unsave job
  unsaveJob: async (jobId: string): Promise<void> => {
    try {
      await api.delete(`/job/${jobId}/save`);
    } catch (error: any) {
      console.error('Unsave job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to unsave job');
    }
  },

  // Get saved jobs
  getSavedJobs: async (): Promise<Job[]> => {
    try {
      const response = await api.get<JobsResponse>('/job/saved/get');
      return response.data.data;
    } catch (error: any) {
      console.error('Get saved jobs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch saved jobs');
    }
  },

  // Apply to job
  applyToJob: async (jobId: string, data: ApplicationData): Promise<void> => {
    try {
      await api.post(`/job/${jobId}/apply`, data);
    } catch (error: any) {
      console.error('Apply to job error:', error);
      throw new Error(error.response?.data?.message || 'Failed to apply to job');
    }
  },
};