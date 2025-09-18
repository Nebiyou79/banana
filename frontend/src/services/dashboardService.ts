/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

export interface DashboardStats {
  portfolioItems: number;
  profileCompleteness: number;
  activeProposals: number;
}

export interface Activity {
  id: string;
  type: 'portfolio' | 'proposal' | 'profile' | 'message';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'rejected';
}

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    try {
      console.log('Calling API: /freelancer/dashboard/stats');
      const response = await api.get<{ success: boolean; data: DashboardStats }>(
        '/freelancer/dashboard/stats' // REMOVE /api/v1/ from here
      );
      console.log('API response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      console.error('Error details:', error.response?.data);
      // Return default stats if API fails
      return {
        portfolioItems: 0,
        profileCompleteness: 0,
        activeProposals: 0
      };
    }
  },

  // Get recent activities
  getActivities: async (): Promise<Activity[]> => {
    try {
      console.log('Calling API: /freelancer/dashboard/activities');
      const response = await api.get<{ success: boolean; data: Activity[] }>(
        '/freelancer/dashboard/activities' // REMOVE /api/v1/ from here
      );
      console.log('API response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch activities:', error);
      console.error('Error details:', error.response?.data);
      // Return empty array if API fails
      return [];
    }
  },
};