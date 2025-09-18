/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

export interface Application {
  _id: string;
  jobId: { _id: string; title: string; company: string; location: string };
  candidate: { _id: string; name: string; email: string };
  coverLetter?: string;
  resumeSnapshot?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const applicationService = {
  // ✅ Apply to a job (candidate only)
  applyJob: async (data: {
    jobId: string;
    coverLetter?: string;
    resumeSnapshot?: string;
  }): Promise<Application> => {
    try {
      const response = await api.post<{ success: boolean; data: Application }>('/applications', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to apply to job');
    }
  },

  // ✅ Get current user's applications
  getUserApplications: async (): Promise<Application[]> => {
    try {
      const response = await api.get<{ success: boolean; count: number; data: Application[] }>(
        '/applications/me'
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch applications');
    }
  },

  // ✅ Get applications for a job (company/admin only)
  getApplicationsForJob: async (jobId: string): Promise<Application[]> => {
    try {
      const response = await api.get<{ success: boolean; count: number; data: Application[] }>(
        `/applications/job/${jobId}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch applications for job');
    }
  },

  // ✅ Update application status (company/admin only)
  updateApplicationStatus: async (
    id: string,
    data: { status: string; notes?: string }
  ): Promise<Application> => {
    try {
      const response = await api.put<{ success: boolean; data: Application }>(`/applications/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update application');
    }
  },
};
