/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/candidateService.ts
import api from '@/lib/axios';
import { toast } from '@/hooks/use-toast';
import { handleError } from '@/lib/error-handler';

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  skills: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export interface CV {
  viewUrl: string;
  downloadUrl: string;
  url: string;
  size: any;
  mimetype: any;
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  uploadedAt: string;
  isPrimary: boolean;
}

export interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: 'none' | 'partial' | 'full';
  profileCompleted: boolean;
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  cvs: CV[];
  portfolio: Array<{
    title: string;
    description?: string;
    url?: string;
    image?: string;
    skills: string[];
  }>;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  socialLinks?: SocialLinks;
  lastLogin?: string;
  // NEW: Age and Gender fields
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  age?: number; // Virtual field calculated from dateOfBirth
}

export interface UploadCVResponse {
  cvs: CV[];
}

export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  category?: string;
  type?: string;
  experienceLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  remote?: string;
}

export interface JobsResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Enhanced error types for better categorization
type ErrorType = 'NETWORK' | 'VALIDATION' | 'AUTH' | 'SERVER' | 'CLIENT' | 'UNKNOWN';

class ServiceError extends Error {
  constructor(
    message: string,
    public type: ErrorType = 'UNKNOWN',
    public originalError?: any,
    public userFriendly?: boolean
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Enhanced toast helper with error categorization
const showToastError = (error: ServiceError | string) => {
  if (typeof error === 'string') {
    toast({
      title: 'Error',
      description: error,
      variant: 'destructive',
    });
    return;
  }

  let title = 'Error';
  let description = error.message;
  
  switch (error.type) {
    case 'NETWORK':
      title = 'Connection Error';
      description = 'Please check your internet connection and try again.';
      break;
    case 'AUTH':
      title = 'Authentication Error';
      description = 'Please log in again to continue.';
      break;
    case 'VALIDATION':
      title = 'Validation Error';
      break;
    case 'SERVER':
      title = 'Server Error';
      description = 'Something went wrong on our end. Please try again later.';
      break;
    case 'CLIENT':
      title = 'Error';
      break;
    default:
      title = 'Unexpected Error';
      description = 'An unexpected error occurred. Please try again.';
  }
  
  toast({
    title,
    description,
    variant: 'destructive',
  });
  
  // Log detailed error for debugging (but don't show to user)
  if (error.originalError && process.env.NODE_ENV === 'development') {
    console.error('Service Error Details:', {
      message: error.message,
      type: error.type,
      originalError: error.originalError
    });
  }
};

// Success toast helper
const showSuccess = (message: string) => {
  toast({
    title: 'Success',
    description: message,
    variant: 'success',
  });
};

// Info toast helper
const showInfo = (message: string) => {
  toast({
    title: 'Info',
    description: message,
    variant: 'info',
  });
};

// Warning toast helper
const showWarning = (message: string) => {
  toast({
    title: 'Warning',
    description: message,
    variant: 'warning',
  });
};

// Enhanced error detection and extraction
const isNetworkError = (error: any): boolean => {
  return (!error.response && error.request) || error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error');
};

const isTimeoutError = (error: any): boolean => {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
};

const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 || error.name === 'ValidationError';
};

const extractErrorMessage = (error: any): string => {
  // Handle ServiceError instances
  if (error instanceof ServiceError) {
    return error.message;
  }

  // Handle network errors
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle timeout errors
  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }

  // Handle axios response errors
  if (error.response?.data) {
    const data = error.response.data;
    
    // Handle array of errors from server
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.join(', ');
    }
    
    // Handle single error message from server
    if (data.message) {
      return data.message;
    }
    
    // Handle error string directly
    if (typeof data === 'string') {
      return data;
    }
  }

  // Handle generic Error instances
  if (error.message) {
    return error.message;
  }

  // Fallback message
  return 'An unexpected error occurred. Please try again.';
};

const extractErrorType = (error: any): ErrorType => {
  if (isNetworkError(error) || isTimeoutError(error)) return 'NETWORK';
  if (isAuthError(error)) return 'AUTH';
  if (isValidationError(error)) return 'VALIDATION';
  if (error.response?.status >= 500) return 'SERVER';
  if (error.response?.status >= 400) return 'CLIENT';
  return 'UNKNOWN';
};

// Safe API call wrapper with error handling
const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  defaultErrorMessage: string
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    const message = extractErrorMessage(error);
    const type = extractErrorType(error);
    const serviceError = new ServiceError(message, type, error);
    showToastError(serviceError);
    throw serviceError;
  }
};

// NEW: Age validation helper
const validateAgeAndGender = (data: Partial<CandidateProfile>): string[] => {
  const errors: string[] = [];

  // Validate date of birth
  if (data.dateOfBirth) {
    try {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      
      if (dob > maxDate) {
        errors.push('You must be at least 16 years old');
      }
      if (dob < minDate) {
        errors.push('Please enter a valid date of birth');
      }
    } catch (error) {
      errors.push('Invalid date of birth format');
    }
  }

  // Validate gender
  if (data.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(data.gender)) {
    errors.push('Please select a valid gender option');
  }

  return errors;
};

// Optimized payload helper to reduce data size
const optimizeProfilePayload = (data: Partial<CandidateProfile>): Partial<CandidateProfile> => {
  try {
    const optimized: any = { ...data };
    
    // Remove undefined and empty array fields
    Object.keys(optimized).forEach(key => {
      if (optimized[key] === undefined || 
          (Array.isArray(optimized[key]) && optimized[key].length === 0)) {
        delete optimized[key];
      }
    });

    // Limit arrays to prevent oversized payloads
    if (optimized.skills && optimized.skills.length > 50) {
      optimized.skills = optimized.skills.slice(0, 50);
      showWarning('Limited to first 50 skills');
    }

    if (optimized.education && optimized.education.length > 10) {
      optimized.education = optimized.education.slice(0, 10);
      showWarning('Limited to first 10 education entries');
    }

    if (optimized.experience && optimized.experience.length > 15) {
      optimized.experience = optimized.experience.slice(0, 15);
      showWarning('Limited to first 15 experience entries');
    }

    if (optimized.certifications && optimized.certifications.length > 20) {
      optimized.certifications = optimized.certifications.slice(0, 20);
      showWarning('Limited to first 20 certification entries');
    }

    // Trim strings
    if (optimized.bio) optimized.bio = optimized.bio.trim();
    if (optimized.location) optimized.location = optimized.location.trim();
    if (optimized.phone) optimized.phone = optimized.phone.trim();
    if (optimized.website) optimized.website = optimized.website.trim();

    return optimized;
  } catch (error) {
    throw new ServiceError('Failed to optimize profile data', 'CLIENT', error);
  }
};

// Date validation helper
const validateDates = (data: Partial<CandidateProfile>): string[] => {
  try {
    const errors: string[] = [];
    const now = new Date();

    if (data.education) {
      data.education.forEach((edu, index) => {
        if (!edu.startDate) {
          errors.push(`Education #${index + 1}: Start date is required`);
          return;
        }

        try {
          const startDate = new Date(edu.startDate);
          const endDate = edu.endDate ? new Date(edu.endDate) : null;

          // Check if start date is in the future
          if (startDate > now) {
            errors.push(`Education #${index + 1}: Start date cannot be in the future`);
          }

          // Check if end date is before start date
          if (endDate && endDate < startDate) {
            errors.push(`Education #${index + 1}: End date must be after start date`);
          }

          // Check if end date is in the future for completed education
          if (endDate && endDate > now && !edu.current) {
            errors.push(`Education #${index + 1}: End date cannot be in the future for completed education`);
          }
        } catch (dateError) {
          errors.push(`Education #${index + 1}: Invalid date format`);
        }
      });
    }

    if (data.experience) {
      data.experience.forEach((exp, index) => {
        if (!exp.startDate) {
          errors.push(`Experience #${index + 1}: Start date is required`);
          return;
        }

        try {
          const startDate = new Date(exp.startDate);
          const endDate = exp.endDate ? new Date(exp.endDate) : null;

          // Check if start date is in the future
          if (startDate > now) {
            errors.push(`Experience #${index + 1}: Start date cannot be in the future`);
          }

          // Check if end date is before start date
          if (endDate && endDate < startDate) {
            errors.push(`Experience #${index + 1}: End date must be after start date`);
          }

          // Check if end date is in the future for completed experience
          if (endDate && endDate > now && !exp.current) {
            errors.push(`Experience #${index + 1}: End date cannot be in the future for completed experience`);
          }
        } catch (dateError) {
          errors.push(`Experience #${index + 1}: Invalid date format`);
        }
      });
    }
    
    if (data.certifications) {
      data.certifications.forEach((cert, index) => {
        if (!cert.issueDate) {
          errors.push(`Certification #${index + 1}: Issue date is required`);
          return;
        }

        try {
          const issueDate = new Date(cert.issueDate);
          const expiryDate = cert.expiryDate ? new Date(cert.expiryDate) : null;

          // Check if issue date is in the future
          if (issueDate > now) {
            errors.push(`Certification #${index + 1}: Issue date cannot be in the future`);
          }

          // Check if expiry date is before issue date
          if (expiryDate && expiryDate < issueDate) {
            errors.push(`Certification #${index + 1}: Expiry date must be after issue date`);
          }
        } catch (dateError) {
          errors.push(`Certification #${index + 1}: Invalid date format`);
        }
      });
    }

    return errors;
  } catch (error) {
    throw new ServiceError('Failed to validate dates', 'CLIENT', error);
  }
};

// File validation helper
const validateFiles = (files: File[]): string[] => {
  const errors: string[] = [];
  
  if (!files || files.length === 0) {
    errors.push('No files selected');
    return errors;
  }

  // Check maximum files per upload
  if (files.length > 10) {
    errors.push('Maximum 10 files allowed per upload');
  }

  files.forEach(file => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB (updated from 10MB)
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`"${file.name}" must be PDF, DOC, or DOCX`);
    }
    
    if (file.size > maxSize) {
      errors.push(`"${file.name}" must be less than 5MB`);
    }
    
    if (file.size === 0) {
      errors.push(`"${file.name}" is empty`);
    }
  });

  return errors;
};

export const candidateService = {
  // Get candidate profile
  // Get candidate profile - FIXED
  getProfile: async (): Promise<CandidateProfile> => {
    try {
      const response = await api.get<{
        message: string; 
        success: boolean; 
        data: { user: CandidateProfile } 
      }>('/candidate/profile');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }
      
      return response.data.data.user;
    } catch (error: any) {
      console.error('Failed to fetch candidate profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to load profile');
    }
  },

  // Update candidate profile - FIXED
  updateProfile: async (data: Partial<CandidateProfile>): Promise<CandidateProfile> => {
    try {
      const response = await api.put<{
        message: string; 
        success: boolean; 
        data: { user: CandidateProfile } 
      }>('/candidate/profile', data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update profile');
      }
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default',
      });
      return response.data.data.user;
    } catch (error: any) {
      console.error('Failed to update candidate profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Upload CVs - FIXED
  uploadCVs: async (files: File[]): Promise<CV[]> => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('cvs', file); // Note: field name is 'cvs' (plural)
      });
      
      const response = await api.post<{
        message: string; 
        success: boolean; 
        data: { cvs: CV[] } 
      }>('/candidate/cv', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload CVs');
      }
      
      toast({
        title: 'Success',
        description: `Successfully uploaded ${files.length} CV(s)`,
        variant: 'default',
      });
      return response.data.data.cvs;
    } catch (error: any) {
      console.error('Failed to upload CVs:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload CVs');
    }
  },

  // Set primary CV - FIXED
  setPrimaryCV: async (cvId: string): Promise<void> => {
    try {
      const response = await api.patch(`/candidate/cv/${cvId}/primary`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to set primary CV');
      }
      
      toast({
        title: 'Success',
        description: 'Primary CV updated successfully',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to set primary CV:', error);
      throw new Error(error.response?.data?.message || 'Failed to set primary CV');
    }
  },

  // Delete CV - FIXED
  deleteCV: async (cvId: string): Promise<void> => {
    try {
      const response = await api.delete(`/candidate/cv/${cvId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete CV');
      }
      
      toast({
        title: 'Success',
        description: 'CV deleted successfully',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to delete CV:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete CV');
    }
  },

  // Get CV file size - FIXED
  getCVFileSize: (cv: CV): string => {
    if (!cv.size) return 'Unknown size';
    
    const bytes = cv.size;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get CV download URL - FIXED
  getCVDownloadUrl: (cv: CV): string => {
    try {
      if (!cv) return '';
      
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const cleanBackendUrl = backendUrl.replace(/\/+$/, '');
      
      // Use filename for download URL
      if (cv.filename) {
        return `${cleanBackendUrl}/uploads/cv/${cv.filename}`;
      }
      
      // Fallback to path
      if (cv.path) {
        return `${cleanBackendUrl}${cv.path.startsWith('/') ? cv.path : `/${cv.path}`}`;
      }

      return '';
    } catch (error) {
      console.error('Error generating CV download URL:', error);
      return '';
    }
  },

  // Get jobs for candidate - FIXED
  getJobs: async (params?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<{
        message: string; 
        success: boolean; 
        data: any[]; 
        pagination: any 
      }>('/candidate/jobs', { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch jobs');
      }
      
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch jobs');
    }
  },

  // Save job - FIXED
  saveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<{
        message: string; 
        success: boolean; 
        data: { saved: boolean } 
      }>(`/job/${jobId}/save`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save job');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to save job:', error);
      throw new Error(error.response?.data?.message || 'Failed to save job');
    }
  },

  // Unsave job - FIXED
  unsaveJob: async (jobId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<{
        message: string; 
        success: boolean; 
        data: { saved: boolean } 
      }>(`/job/${jobId}/unsave`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to unsave job');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to unsave job:', error);
      throw new Error(error.response?.data?.message || 'Failed to unsave job');
    }
  },

  // Get saved jobs - FIXED
  getSavedJobs: async (): Promise<any[]> => {
    try {
      const response = await api.get<{
        message: string; 
        success: boolean; 
        data: any[] 
      }>('/candidate/jobs/saved');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch saved jobs');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch saved jobs:', error);
      return [];
    }
  }
};
