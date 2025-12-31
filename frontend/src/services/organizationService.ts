// src/services/organizationService.ts - UPDATED WITH TOAST ERROR HANDLING
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';

export interface OrganizationProfile {
  _id: string;
  name: string;
  registrationNumber?: string;
  organizationType?: string;
  industry?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  secondaryPhone?: string;
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
    const error = new Error('Organization name must be at least 2 characters long');
    toast({
      title: 'Validation Error',
      description: error.message,
      variant: 'warning',
    });
    throw error;
  }

  if (data.name && data.name.trim().length > 100) {
    const error = new Error('Organization name cannot exceed 100 characters');
    toast({
      title: 'Validation Error',
      description: error.message,
      variant: 'warning',
    });
    throw error;
  }

  if (data.description && data.description.length > 1000) {
    const error = new Error('Description cannot exceed 1000 characters');
    toast({
      title: 'Validation Error',
      description: error.message,
      variant: 'warning',
    });
    throw error;
  }

  if (data.mission && data.mission.length > 500) {
    const error = new Error('Mission statement cannot exceed 500 characters');
    toast({
      title: 'Validation Error',
      description: error.message,
      variant: 'warning',
    });
    throw error;
  }

  // Relaxed website validation
  if (data.website && data.website.trim() !== '' && !isValidUrl(data.website)) {
    const error = new Error('Please enter a valid website URL (including http:// or https://)');
    toast({
      title: 'Validation Error',
      description: error.message,
      variant: 'warning',
    });
    throw error;
  }

  // Phone validation
  if (data.phone && data.phone.trim() !== '' && !isValidPhone(data.phone)) {
    const error = new Error('Please enter a valid phone number');
    toast({
      title: 'Validation Error',
      description: error.message,
      variant: 'warning',
    });
    throw error;
  }

  // Secondary phone validation
  if (data.secondaryPhone && data.secondaryPhone.trim() !== '' && !isValidPhone(data.secondaryPhone)) {
    const error = new Error('Please enter a valid secondary phone number');
    toast({
      title: 'Validation Error',
      description: error.message,
      variant: 'warning',
    });
    throw error;
  }
};

const isValidUrl = (url: string): boolean => {
  try {
    // Allow empty strings and trim whitespace
    if (!url || url.trim() === '') return true;

    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidPhone = (phone: string): boolean => {
  // Basic phone validation - allow various formats
  if (!phone || phone.trim() === '') return true;

  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\(\)\-\s\d]+$/;
  return phoneRegex.test(phone.replace(/[\s\(\)\-]/g, ''));
};

// Simple error handler that shows toast and returns the error
const handleServiceError = (error: any, defaultMessage: string, context?: string): Error => {
  console.error(`[OrganizationService${context ? `: ${context}` : ''}] Error:`, error);

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

export const organizationService = {
  // Get current user's organization - FIXED: Returns null on error
  getMyOrganization: async (): Promise<OrganizationProfile | null> => {
    try {
      const response = await api.get<ApiResponse<OrganizationProfile | null>>('/organization');

      if (!response.data.success) {
        return null;
      }

      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        return null;
      }
      handleServiceError(error, 'Failed to fetch organization profile', 'getMyOrganization');
      return null;
    }
  },

  // Get organization by ID - FIXED: Shows toast and throws error
  getOrganization: async (id: string): Promise<OrganizationProfile> => {
    try {
      if (!id) {
        const error = new Error('Organization ID is required');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      const response = await api.get<ApiResponse<OrganizationProfile>>(`/organization/${id}`);

      if (!response.data.success || !response.data.data) {
        const error = new Error(response.data.message || 'Failed to fetch organization');
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
      const processedError = handleServiceError(error, 'Failed to fetch organization', 'getOrganization');
      throw processedError;
    }
  },

  // Create organization - FIXED: Shows toast and throws error
  createOrganization: async (data: Partial<OrganizationProfile>): Promise<OrganizationProfile> => {
    try {
      validateOrganizationData(data);

      const response = await api.post<ApiResponse<OrganizationProfile>>('/organization', data);

      if (!response.data.success || !response.data.data) {
        const error = new Error(response.data.message || 'Failed to create organization profile');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Organization profile created successfully!',
        variant: 'success',
      });

      return response.data.data;
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to create organization profile', 'createOrganization');
      throw processedError;
    }
  },

  // Update organization by ID - FIXED: Shows toast and throws error
  updateOrganization: async (id: string, data: Partial<OrganizationProfile>): Promise<OrganizationProfile> => {
    try {
      if (!id) {
        const error = new Error('Organization ID is required');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      validateOrganizationData(data);

      const response = await api.put<ApiResponse<OrganizationProfile>>(`/organization/${id}`, data);

      if (!response.data.success || !response.data.data) {
        const error = new Error(response.data.message || 'Failed to update organization');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Organization updated successfully!',
        variant: 'success',
      });

      return response.data.data;
    } catch (error: any) {
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to update organization', 'updateOrganization');
      throw processedError;
    }
  },

  // Update current user's organization - FIXED: Shows toast and throws error
  updateMyOrganization: async (data: Partial<OrganizationProfile>): Promise<OrganizationProfile> => {
    try {
      console.log('Updating organization with data:', data);

      validateOrganizationData(data);

      const response = await api.put<ApiResponse<OrganizationProfile>>('/organization/me', data);

      console.log('Update response:', response.data);

      if (!response.data.success || !response.data.data) {
        const error = new Error(response.data.message || 'Failed to update organization profile');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Organization profile updated successfully!',
        variant: 'success',
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Update error:', error);
      // Show toast and re-throw the error
      const processedError = handleServiceError(error, 'Failed to update organization profile', 'updateMyOrganization');
      throw processedError;
    }
  },

  // Upload organization logo - FIXED: Shows toast and throws error
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

  // Upload organization banner - FIXED: Shows toast and throws error
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

  // Delete organization logo - FIXED: Shows toast and throws error
  deleteLogo: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/organization/upload/logo');

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

  // Delete organization banner - FIXED: Shows toast and throws error
  deleteBanner: async (): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>('/organization/upload/banner');

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
  canCreateOrganization: (userRole: string, hasOrganizationProfile: boolean): boolean => {
    return userRole === 'organization' && !hasOrganizationProfile;
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
  },

  getOrganizationTypeOptions: () => [
    { value: 'non-profit', label: 'Non-Profit Organization' },
    { value: 'government', label: 'Government Agency' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'healthcare', label: 'Healthcare Organization' },
    { value: 'other', label: 'Other' }
  ],

  getOrganizationTypeLabel: (type: string): string => {
    const types: Record<string, string> = {
      'non-profit': 'Non-Profit Organization',
      'government': 'Government Agency',
      'educational': 'Educational Institution',
      'healthcare': 'Healthcare Organization',
      'other': 'Other'
    };
    return types[type] || type;
  }
};