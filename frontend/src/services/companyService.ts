// src/services/companyService.ts - PROPERLY FIXED ERROR HANDLING
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

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

// FIXED: Simple error handler that just shows toast and returns the error
const handleServiceError = (error: any, defaultMessage: string, context?: string): Error => {
  console.error(`[CompanyService${context ? `: ${context}` : ''}] Error:`, error);
  
  let errorMessage = defaultMessage;
  
  // Network errors
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    errorMessage = 'Please check your internet connection and try again.';
    toast({
      title: 'Network Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }
  // Validation errors from backend
  else if (error.response?.data?.errors) {
    const fieldErrors = Object.values(error.response.data.errors).flat();
    if (fieldErrors.length > 0) {
      errorMessage = fieldErrors[0] as string;
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'warning',
      });
    }
  }
  // Backend error message
  else if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }
  // Generic error message
  else if (error.message) {
    errorMessage = error.message;
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  }
  // Fallback
  else {
    toast({
      title: 'Error',
      description: defaultMessage,
      variant: 'destructive',
    });
  }

  // Return the error instead of throwing
  return new Error(errorMessage);
};

export const companyService = {
  // Get current user's company - FIXED: Returns null on error
  getMyCompany: async (): Promise<CompanyProfile | null> => {
    try {
      const response = await api.get<ApiResponse<CompanyProfile | null>>('/company');
      
      if (!response.data.success) {
        return null;
      }
      
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        // No company found is not an error, return null
        return null;
      }
      // For other errors, show toast and return null
      handleServiceError(error, 'Failed to fetch company profile', 'getMyCompany');
      return null;
    }
  },

  // Get company by ID - FIXED: Shows toast and throws error
  getCompany: async (id: string): Promise<CompanyProfile> => {
    try {
      if (!id) {
        const error = new Error('Company ID is required');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      const response = await api.get<ApiResponse<CompanyProfile>>(`/company/${id}`);
      
      if (!response.data.success || !response.data.data) {
        const error = new Error(response.data.message || 'Failed to fetch company');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      return response.data.data;
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to fetch company', 'getCompany');
      throw processedError;
    }
  },

  // Create company - FIXED: Shows toast and throws error
  createCompany: async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      validateCompanyData(data);
      
      const response = await api.post<ApiResponse<CompanyProfile>>('/company', data);
      
      if (!response.data.success || !response.data.data) {
        const error = new Error(response.data.message || 'Failed to create company profile');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Company profile created successfully!',
        variant: 'success',
      });
      
      return response.data.data;
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to create company profile', 'createCompany');
      throw processedError;
    }
  },

  // Update company by ID - FIXED: Shows toast and throws error
  updateCompany: async (id: string, data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      if (!id) {
        const error = new Error('Company ID is required');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      validateCompanyData(data);
      
      const response = await api.put<ApiResponse<CompanyProfile>>(`/company/${id}`, data);
      
      if (!response.data.success || !response.data.data) {
        const error = new Error(response.data.message || 'Failed to update company');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Company updated successfully!',
        variant: 'success',
      });
      
      return response.data.data;
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to update company', 'updateCompany');
      throw processedError;
    }
  },

  // Update current user's company - FIXED: Shows toast and throws error
  updateMyCompany: async (data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
    try {
      validateCompanyData(data);
      
      console.log('[CompanyService] Updating company with data:', data);
      
      const response = await api.put<ApiResponse<CompanyProfile>>('/company/me', data);
      
      if (!response.data.success || !response.data.data) {
        console.error('[CompanyService] Update failed:', response.data);
        const error = new Error(response.data.message || 'Failed to update company profile');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      console.log('[CompanyService] Update successful:', response.data.data);
      
      toast({
        title: 'Success',
        description: 'Company profile updated successfully!',
        variant: 'success',
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('[CompanyService] Update error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to update company profile', 'updateMyCompany');
      throw processedError;
    }
  },

  // Upload company logo - FIXED: Shows toast and throws error
  uploadLogo: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post<UploadResponse>('/company/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (!response.data.success) {
        const error = new Error(response.data.message || 'Failed to upload logo');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Logo uploaded successfully!',
        variant: 'success',
      });
      
      return response.data;
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to upload logo', 'uploadLogo');
      throw processedError;
    }
  },

  // Upload company banner - FIXED: Shows toast and throws error
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
        const error = new Error(response.data.message || 'Failed to upload banner');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Banner uploaded successfully!',
        variant: 'success',
      });
      
      return response.data;
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to upload banner', 'uploadBanner');
      throw processedError;
    }
  },

  // Delete company logo - FIXED: Shows toast and throws error
  deleteLogo: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/company/upload/logo');

      if (!response.data.success) {
        const error = new Error(response.data.message || 'Failed to delete logo');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Logo deleted successfully!',
        variant: 'success',
      });
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to delete logo', 'deleteLogo');
      throw processedError;
    }
  },

  // Delete company banner - FIXED: Shows toast and throws error
  deleteBanner: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/company/upload/banner');

      if (!response.data.success) {
        const error = new Error(response.data.message || 'Failed to delete banner');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Banner deleted successfully!',
        variant: 'success',
      });
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to delete banner', 'deleteBanner');
      throw processedError;
    }
  },

  // Utility functions
  canCreateCompany: (userRole: string, hasCompanyProfile: boolean): boolean => {
    return userRole === 'company' && !hasCompanyProfile;
  },

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
  }
};