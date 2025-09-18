/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

export interface CompanyProfile {
  _id: string;
  name: string;
  tin?: string;
  industry?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  verified: boolean;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
export const companyService = {
  // Get current user's company - change from '/company/me' to '/company/'
  getMyCompany: async (): Promise<CompanyProfile | null> => {
    try {
      const response = await api.get<{ success: boolean; data: CompanyProfile | null; message?: string }>('/company/');
      
      // Handle case where company doesn't exist yet
      if (response.data.data === null) {
        return null;
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get company error:', error);
      
      // Handle 404 specifically for company not found
      if (error.response?.status === 404 || error.message.includes('not found')) {
        return null;
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch company profile');
    }
  },

  // Get company by ID - keep as is
  getCompany: async (id: string): Promise<CompanyProfile> => {
    try {
      const response = await api.get<{ success: boolean; data: CompanyProfile }>(`/company/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Get company error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch company');
    }
  },

// Create company - improved error handling
createCompany: async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
  try {
    const response = await api.post<{ success: boolean; data: CompanyProfile }>('/company', data);
    return response.data.data;
  } catch (error: any) {
    console.error('Create company error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      throw new Error('Company profile already exists for this user');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to create company profile');
  }
},

  // Update company - keep as is
  updateCompany: async (id: string, data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      const response = await api.put<{ success: boolean; data: CompanyProfile }>(`/company/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Update company error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update company');
    }
  },

  // Update current user's company - change from '/company/me' to '/company/me'
  updateMyCompany: async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      const response = await api.put<{ success: boolean; data: CompanyProfile }>('/company/me', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Update my company error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update company profile');
    }
  }
};