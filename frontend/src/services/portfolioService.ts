/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

export interface PortfolioFormData {
  title: string;
  description: string; // Change from optional to required
  mediaUrl: string;    // Change from optional to required
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  budget?: string;
  duration?: string;
  client?: string;
  completionDate?: string;
}

export interface PortfolioItem {
  _id: string;
  title: string;
  description: string; // Change from optional to required
  mediaUrl: string;    // Change from optional to required
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  budget?: string;
  duration?: string;
  client?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}
export interface PortfolioResponse {
  success: boolean;
  message?: string;
  data: PortfolioItem | PortfolioItem[];
}

export interface ProfileData {
  name: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  skills: string[];
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  skills: string[];
  profileCompleted: boolean;
  verificationStatus: string;
}

// Helper function to handle API errors consistently
const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  throw new Error(error.response?.data?.message || defaultMessage);
};

export const portfolioService = {
  // Get current user's portfolio
  getPortfolio: async (): Promise<PortfolioItem[]> => {
    try {
      const response = await api.get<PortfolioResponse>('/freelancer/portfolio');
      return Array.isArray(response.data.data) 
        ? response.data.data 
        : [response.data.data];
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch portfolio');
    }
  },

  // Add portfolio item with enhanced data
  addPortfolioItem: async (data: PortfolioFormData): Promise<PortfolioItem> => {
    try {
      const response = await api.post<PortfolioResponse>('/freelancer/portfolio', data);
      return response.data.data as PortfolioItem;
    } catch (error: any) {
      return handleApiError(error, 'Failed to add portfolio item');
    }
  },

  // Update portfolio item with enhanced data
  updatePortfolioItem: async (id: string, data: PortfolioFormData): Promise<PortfolioItem> => {
    try {
      const response = await api.put<PortfolioResponse>(`/freelancer/portfolio/${id}`, data);
      return response.data.data as PortfolioItem;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update portfolio item');
    }
  },

  // Delete portfolio item
  deletePortfolioItem: async (id: string): Promise<void> => {
    try {
      await api.delete<{ success: boolean; message: string }>(`/freelancer/portfolio/${id}`);
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete portfolio item');
    }
  },

  // Get freelancer profile
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get<{ success: boolean; data: UserProfile }>('/freelancer/profile');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch profile');
    }
  },

  // Update freelancer profile
  updateProfile: async (data: ProfileData): Promise<UserProfile> => {
    try {
      const response = await api.put<{ success: boolean; data: UserProfile }>('/freelancer/profile', data);
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update profile');
    }
  }
};