// src/services/tenderService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios'; // FIXED IMPORT
import { handleError, handleSuccess } from '@/lib/error-handler'; // ADD THIS IMPORT

export interface Budget {
  isNegotiable: boolean | undefined;
  min: number;
  max: number;
  currency: string;
}

export interface LanguageRequirement {
  language: string;
  proficiency: string;
}

export interface Requirements {
  experienceLevel: string;
  location: string;
  specificLocation?: string;
  languageRequirements: LanguageRequirement[];
}

export interface Tender {
  _id: string;
  title: string;
  description: string;
  category: string;
  skillsRequired: string[];
  budget: Budget;
  deadline: string;
  duration: number;
  visibility: 'public' | 'invite_only';
  status: 'draft' | 'published' | 'open' | 'completed' | 'cancelled';
  invitedFreelancers: string[];
  requirements: Requirements;
  company: {
    description: any;
    _id: string;
    name: string;
    logo: string;
    industry: string;
    verified: boolean;
  };
  createdBy: string;
  proposals: any[];
  metadata: {
    savedBy: string[];
    views: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TenderFilters {
  page?: number;
  limit?: number;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string | string[];
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTenderData {
  title: string;
  description: string;
  category: string;
  skillsRequired: string[];
  budget: Budget;
  deadline: string;
  duration: number;
  visibility?: 'public' | 'invite_only';
  invitedFreelancers?: string[];
  requirements?: Partial<Requirements>;
  status?: 'draft' | 'published';
}

export interface UpdateTenderData {
  title?: string;
  description?: string;
  category?: string;
  skillsRequired?: string[];
  budget?: Budget;
  deadline?: string;
  duration?: number;
  visibility?: 'public' | 'invite_only';
  invitedFreelancers?: string[];
  requirements?: Partial<Requirements>;
  status?: string;
}

export const TenderService = {
  // Create a new tender
  async createTender(tenderData: CreateTenderData): Promise<{ success: boolean; data: { tender: Tender }; message: string }> {
    try {
      const response = await api.post('/tender', tenderData);
      handleSuccess('Tender created successfully');
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to create tender');
      return Promise.reject(error);
    }
  },

  // Get all tenders with filtering and pagination
  async getTenders(filters: TenderFilters = {}): Promise<{
    success: boolean;
    data: Tender[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, item));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await api.get(`/tender?${params}`);
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch tenders');
      return Promise.reject(error);
    }
  },

  // Get single tender details
  async getTender(id: string): Promise<{ success: boolean; data: { tender: Tender } }> {
    try {
      if (!id || id === 'undefined') {
        handleError('Tender ID is required');
        return Promise.reject(new Error('Tender ID is required'));
      }
      const response = await api.get(`/tender/${id}`);
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch tender');
      return Promise.reject(error);
    }
  },

  // Update tender
  async updateTender(id: string, updateData: UpdateTenderData): Promise<{ success: boolean; data: { tender: Tender }; message: string }> {
    try {
      if (!id || id === 'undefined') {
        handleError('Tender ID is required');
        return Promise.reject(new Error('Tender ID is required'));
      }
      const response = await api.put(`/tender/${id}`, updateData);
      handleSuccess('Tender updated successfully');
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to update tender');
      return Promise.reject(error);
    }
  },

  // Delete tender
  async deleteTender(id: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!id || id === 'undefined') {
        handleError('Tender ID is required');
        return Promise.reject(new Error('Tender ID is required'));
      }
      const response = await api.delete(`/tender/${id}`);
      handleSuccess('Tender deleted successfully');
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to delete tender');
      return Promise.reject(error);
    }
  },

  // Get company's tenders
  async getMyTenders(): Promise<{ success: boolean; data: { tenders: Tender[] } }> {
    try {
      const response = await api.get('/tender/company/my-tenders');
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch company tenders');
      return Promise.reject(error);
    }
  },

  // Save/unsave tender
  async toggleSaveTender(id: string): Promise<{ success: boolean; data: { saved: boolean }; message: string }> {
    try {
      if (!id || id === 'undefined') {
        handleError('Tender ID is required');
        return Promise.reject(new Error('Tender ID is required'));
      }
      const response = await api.post(`/tender/${id}/save`);
      
      const message = response.data.data.saved 
        ? 'Tender saved successfully' 
        : 'Tender removed from saved';
      handleSuccess(message);
      
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to toggle save tender');
      return Promise.reject(error);
    }
  },

  // Get saved tenders
  async getSavedTenders(): Promise<{ success: boolean; data: { tenders: Tender[] } }> {
    try {
      const response = await api.get('/tender/saved/saved');
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch saved tenders');
      return Promise.reject(error);
    }
  },

  // Check if tender is saved
  async checkTenderSaved(id: string): Promise<boolean> {
    try {
      if (!id || id === 'undefined') {
        handleError('Tender ID is required');
        return Promise.reject(new Error('Tender ID is required'));
      }
      const response = await this.getTender(id);
      return response.data.tender.metadata.savedBy.includes(
        localStorage.getItem('userId') || ''
      );
    } catch (error) {
      handleError(error, 'Failed to check if tender is saved');
      return false;
    }
  }
};