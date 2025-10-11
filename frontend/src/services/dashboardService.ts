/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

export interface DashboardStats {
  portfolioItems: number;
  profileCompleteness: number;
  activeProposals: number;
  completedProjects?: number;
  earnings?: number;
}

export interface Activity {
  id: string;
  type: 'portfolio' | 'proposal' | 'profile' | 'message' | 'project';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'rejected' | 'completed';
  link?: string;
}

// Error handler utility
const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('API Error:', error);
  
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  
  if (error.response?.status === 401) {
    throw new Error('Authentication required');
  }
  
  throw new Error(defaultMessage);
};

// Fallback data for when API fails
const getFallbackStats = (): DashboardStats => ({
  portfolioItems: 0,
  profileCompleteness: 0,
  activeProposals: 0,
  completedProjects: 0,
  earnings: 0
});

const getFallbackActivities = (): Activity[] => [];

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get<{ success: boolean; data: DashboardStats }>(
        '/freelancer/dashboard/stats'
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error: any) {
      console.warn('Using fallback dashboard stats due to API error:', error);
      return getFallbackStats();
    }
  },

  // Get recent activities
  getActivities: async (): Promise<Activity[]> => {
    try {
      const response = await api.get<{ success: boolean; data: Activity[] }>(
        '/freelancer/dashboard/activities'
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (error: any) {
      console.warn('Using fallback activities due to API error:', error);
      return getFallbackActivities();
    }
  },

  // Get candidate-specific stats
  getCandidateStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get<{ success: boolean; data: DashboardStats }>(
        '/candidate/dashboard/stats'
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch candidate stats');
      }
    } catch (error: any) {
      console.warn('Using fallback candidate stats due to API error:', error);
      return getFallbackStats();
    }
  },

  // Get company-specific stats
  getCompanyStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get<{ success: boolean; data: DashboardStats }>(
        '/company/dashboard/stats'
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch company stats');
      }
    } catch (error: any) {
      console.warn('Using fallback company stats due to API error:', error);
      return getFallbackStats();
    }
  }
};