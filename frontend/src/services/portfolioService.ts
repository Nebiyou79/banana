// src/services/freelancerService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler'; // ADD THIS IMPORT

export interface PortfolioFormData {
  title: string;
  description: string;
  mediaUrl: string;
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
  description: string;
  mediaUrl: string;
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

export const portfolioService = {
  // Get current user's portfolio
  getPortfolio: async (): Promise<PortfolioItem[]> => {
    try {
      const response = await api.get<PortfolioResponse>('/freelancer/portfolio');
      
      if (!response.data.success) {
        handleError('Failed to fetch portfolio');
        return Promise.reject(new Error('Failed to fetch portfolio'));
      }
      
      return Array.isArray(response.data.data) 
        ? response.data.data 
        : [response.data.data];
    } catch (error: any) {
      handleError(error, 'Failed to fetch portfolio');
      return Promise.reject(error);
    }
  },

  // Add portfolio item with enhanced data
  addPortfolioItem: async (data: PortfolioFormData): Promise<PortfolioItem> => {
    try {
      const response = await api.post<PortfolioResponse>('/freelancer/portfolio', data);
      
      if (!response.data.success) {
        handleError('Failed to add portfolio item');
        return Promise.reject(new Error('Failed to add portfolio item'));
      }
      
      handleSuccess('Portfolio item added successfully');
      return response.data.data as PortfolioItem;
    } catch (error: any) {
      handleError(error, 'Failed to add portfolio item');
      return Promise.reject(error);
    }
  },

  // Update portfolio item with enhanced data
  updatePortfolioItem: async (id: string, data: PortfolioFormData): Promise<PortfolioItem> => {
    try {
      const response = await api.put<PortfolioResponse>(`/freelancer/portfolio/${id}`, data);
      
      if (!response.data.success) {
        handleError('Failed to update portfolio item');
        return Promise.reject(new Error('Failed to update portfolio item'));
      }
      
      handleSuccess('Portfolio item updated successfully');
      return response.data.data as PortfolioItem;
    } catch (error: any) {
      handleError(error, 'Failed to update portfolio item');
      return Promise.reject(error);
    }
  },

  // Delete portfolio item
  deletePortfolioItem: async (id: string): Promise<void> => {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/freelancer/portfolio/${id}`);
      
      if (!response.data.success) {
        handleError('Failed to delete portfolio item');
        return Promise.reject(new Error('Failed to delete portfolio item'));
      }
      
      handleSuccess('Portfolio item deleted successfully');
    } catch (error: any) {
      handleError(error, 'Failed to delete portfolio item');
      return Promise.reject(error);
    }
  },

  // Get freelancer profile
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get<{ success: boolean; data: UserProfile }>('/freelancer/profile');
      
      if (!response.data.success) {
        handleError('Failed to fetch profile');
        return Promise.reject(new Error('Failed to fetch profile'));
      }
      
      return response.data.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch profile');
      return Promise.reject(error);
    }
  },

  // Update freelancer profile
  updateProfile: async (data: ProfileData): Promise<UserProfile> => {
    try {
      const response = await api.put<{ success: boolean; data: UserProfile }>('/freelancer/profile', data);
      
      if (!response.data.success) {
        handleError('Failed to update profile');
        return Promise.reject(new Error('Failed to update profile'));
      }
      
      handleSuccess('Profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      handleError(error, 'Failed to update profile');
      return Promise.reject(error);
    }
  }
};