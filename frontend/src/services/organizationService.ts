// src/services/organizationService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

export interface OrganizationProfile {
  _id: string;
  name: string;
  registrationNumber?: string;
  organizationType?: 'non-profit' | 'government' | 'educational' | 'healthcare' | 'other';
  industry?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  mission?: string;
  verified: boolean;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
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
const validateOrganizationData = (data: Partial<OrganizationProfile>): void => {
  if (data.name && data.name.trim().length < 2) {
    throw new Error('Organization name must be at least 2 characters long');
  }
  
  if (data.name && data.name.trim().length > 100) {
    throw new Error('Organization name cannot exceed 100 characters');
  }
  
  if (data.description && data.description.length > 1000) {
    throw new Error('Description cannot exceed 1000 characters');
  }
  
  if (data.mission && data.mission.length > 500) {
    throw new Error('Mission statement cannot exceed 500 characters');
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

export const organizationService = {
  // Get current user's organization
  getMyOrganization: async (): Promise<OrganizationProfile | null> => {
    try {
      const response = await api.get<ApiResponse<OrganizationProfile | null>>('/organization');
      
      if (!response.data.success) {
        return null;
      }
      
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      handleApiError(error, 'Failed to fetch organization profile');
      return null;
    }
  },

  // Get organization by ID
  getOrganization: async (id: string): Promise<OrganizationProfile> => {
    try {
      if (!id) {
        throw new Error('Organization ID is required');
      }
      
      const response = await api.get<ApiResponse<OrganizationProfile>>(`/organization/${id}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch organization');
      }
      
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch organization') as never;
    }
  },

  // Create organization
  createOrganization: async (data: Partial<OrganizationProfile>): Promise<OrganizationProfile> => {
    try {
      validateOrganizationData(data);
      
      const response = await api.post<ApiResponse<OrganizationProfile>>('/organization', data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create organization profile');
      }
      
      handleSuccess('Organization profile created successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to create organization profile') as never;
    }
  },

  // Update organization by ID
  updateOrganization: async (id: string, data: Partial<OrganizationProfile>): Promise<OrganizationProfile> => {
    try {
      if (!id) {
        throw new Error('Organization ID is required');
      }
      
      validateOrganizationData(data);
      
      const response = await api.put<ApiResponse<OrganizationProfile>>(`/organization/${id}`, data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update organization');
      }
      
      handleSuccess('Organization updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update organization') as never;
    }
  },

  // Update current user's organization
  updateMyOrganization: async (data: Partial<OrganizationProfile>): Promise<OrganizationProfile> => {
    try {
      validateOrganizationData(data);
      
      const response = await api.put<ApiResponse<OrganizationProfile>>('/organization/me', data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update organization profile');
      }
      
      handleSuccess('Organization profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update organization profile') as never;
    }
  },

  // Upload organization logo
  uploadLogo: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post<UploadResponse>('/organization/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
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

  // Upload organization banner
  uploadBanner: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await api.post<UploadResponse>('/organization/upload/banner', formData, {
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

  // Delete organization logo
  deleteLogo: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/organization/upload/logo');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete logo');
      }

      handleSuccess('Logo deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete logo') as never;
    }
  },

  // Delete organization banner
  deleteBanner: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/organization/upload/banner');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete banner');
      }

      handleSuccess('Banner deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete banner') as never;
    }
  },

  // Utility function to check if user can create organization
  canCreateOrganization: (userRole: string, hasOrganizationProfile: boolean): boolean => {
    return userRole === 'organization' && !hasOrganizationProfile;
  },

  // Utility function to get full image URL
  getFullImageUrl: (imageUrl: string | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    if (imageUrl.startsWith('/uploads')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
      return `${baseUrl}${imageUrl}`;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  },

  // Get organization type options
  getOrganizationTypeOptions: () => [
    { value: 'non-profit', label: 'Non-Profit Organization' },
    { value: 'government', label: 'Government Agency' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'healthcare', label: 'Healthcare Organization' },
    { value: 'other', label: 'Other' }
  ],

  // Get organization type label
  getOrganizationTypeLabel: (type: string): string => {
    const types: Record<string, string> = {
      'non-profit': 'Non-Profit Organization',
      'government': 'Government Agency',
      'educational': 'Educational Institution',
      'healthcare': 'Healthcare Organization',
      'other': 'Other Organization'
    };
    return types[type] || type;
  }
};