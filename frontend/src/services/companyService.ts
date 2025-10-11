// src/services/companyService.ts - FIXED RETURN TYPES
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';
// import { Job, JobsResponse } from './jobService';

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
  // Virtual fields from backend schema
  logoFullUrl?: string;
  bannerFullUrl?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    logoUrl?: string;
    bannerUrl?: string;
    logoPath?: string;
    bannerPath?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Validation functions
const validateCompanyData = (data: Partial<CompanyProfile>): void => {
  if (data.name && data.name.trim().length < 2) {
    throw new Error('Company name must be at least 2 characters long');
  }
  
  if (data.name && data.name.trim().length > 100) {
    throw new Error('Company name cannot exceed 100 characters');
  }
  
  if (data.description && data.description.length > 1000) {
    throw new Error('Description cannot exceed 1000 characters');
  }
  
  if (data.website && !isValidUrl(data.website)) {
    throw new Error('Please enter a valid website URL');
  }
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const handleApiError = (error: any, defaultMessage: string): never => {
  if (error.response?.data?.message) {
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

export const companyService = {
  // ✅ PERFECTLY ALIGNED: GET /api/v1/company
  // Get current user's company
  getMyCompany: async (): Promise<CompanyProfile | null> => {
    try {
      const response = await api.get<ApiResponse<CompanyProfile | null>>('/company');
      
      if (!response.data.success) {
        return null;
      }
      
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      handleApiError(error, 'Failed to fetch company profile');
      // This line will never be reached because handleApiError always throws
      return null;
    }
  },

  // ✅ PERFECTLY ALIGNED: GET /api/v1/company/:id
  // Get company by ID
  getCompany: async (id: string): Promise<CompanyProfile> => {
    try {
      if (!id) {
        throw new Error('Company ID is required');
      }
      
      const response = await api.get<ApiResponse<CompanyProfile>>(`/company/${id}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch company');
      }
      
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch company') as never;
    }
  },

  // ✅ PERFECTLY ALIGNED: POST /api/v1/company
  // Create company
  createCompany: async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      validateCompanyData(data);
      
      const response = await api.post<ApiResponse<CompanyProfile>>('/company', data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create company profile');
      }
      
      handleSuccess('Company profile created successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to create company profile') as never;
    }
  },

  // ✅ PERFECTLY ALIGNED: PUT /api/v1/company/:id
  // Update company by ID
  updateCompany: async (id: string, data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      if (!id) {
        throw new Error('Company ID is required');
      }
      
      validateCompanyData(data);
      
      const response = await api.put<ApiResponse<CompanyProfile>>(`/company/${id}`, data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update company');
      }
      
      handleSuccess('Company updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update company') as never;
    }
  },

  // ✅ PERFECTLY ALIGNED: PUT /api/v1/company/me
  // Update current user's company
  updateMyCompany: async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      validateCompanyData(data);
      
      const response = await api.put<ApiResponse<CompanyProfile>>('/company/me', data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update company profile');
      }
      
      handleSuccess('Company profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update company profile') as never;
    }
  },

  // ✅ PERFECTLY ALIGNED: POST /api/v1/company/upload/logo
  // Upload company logo
  uploadLogo: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post<UploadResponse>('/company/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for file uploads
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload logo');
      }

      handleSuccess('Logo uploaded successfully');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to upload logo') as never;
    }
  },

  // ✅ PERFECTLY ALIGNED: POST /api/v1/company/upload/banner
  // Upload company banner
  uploadBanner: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await api.post<UploadResponse>('/company/upload/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload banner');
      }

      handleSuccess('Banner uploaded successfully');
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to upload banner') as never;
    }
  },

  // ✅ PERFECTLY ALIGNED: DELETE /api/v1/company/upload/logo
  // Delete company logo
  deleteLogo: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/company/upload/logo');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete logo');
      }

      handleSuccess('Logo deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete logo') as never;
    }
  },

  // ✅ PERFECTLY ALIGNED: DELETE /api/v1/company/upload/banner
  // Delete company banner
  deleteBanner: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/company/upload/banner');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete banner');
      }

      handleSuccess('Banner deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete banner') as never;
    }
  },

  // Utility function to check if user can create company
  canCreateCompany: (userRole: string, hasCompanyProfile: boolean): boolean => {
    return userRole === 'company' && !hasCompanyProfile;
  },

  // Utility function to get full image URL
getFullImageUrl: (imageUrl: string | undefined): string | undefined => {
  if (!imageUrl) return undefined;
  
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  // Handle relative paths from backend
  // If imageUrl starts with /uploads, it's already a full path from backend
  if (imageUrl.startsWith('/uploads')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
    return `${baseUrl}${imageUrl}`;
  }
  // For other relative paths
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}
};