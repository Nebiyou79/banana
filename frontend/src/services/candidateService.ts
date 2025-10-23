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
  getProfile: async (): Promise<CandidateProfile> => {
    return safeApiCall(async () => {
      const response = await api.get<{
        message: string; 
        success: boolean; 
        data: { user: CandidateProfile } 
      }>('/candidate/profile', {
        timeout: 10000,
        params: { t: Date.now() }
      });
      
      if (!response.data.success) {
        throw new ServiceError(
          response.data.message || 'Failed to fetch profile',
          'SERVER'
        );
      }
      
      return response.data.data.user;
    }, 'Failed to load profile');
  },

  // Update candidate profile
  updateProfile: async (data: Partial<CandidateProfile>): Promise<CandidateProfile> => {
    try {
      // Client-side validation
      const validationErrors: string[] = [];

      // Basic validation
      if (data.bio && data.bio.length > 1000) {
        validationErrors.push('Bio cannot exceed 1000 characters');
      }
      
      if (data.skills && data.skills.length > 50) {
        validationErrors.push('Maximum 50 skills allowed');
      }

      if (data.education && data.education.length > 10) {
        validationErrors.push('Maximum 10 education entries allowed');
      }

      if (data.experience && data.experience.length > 15) {
        validationErrors.push('Maximum 15 experience entries allowed');
      }

      // Date validation
      const dateErrors = validateDates(data);
      validationErrors.push(...dateErrors);

      // Required field validation
      if (data.education) {
        data.education.forEach((edu, index) => {
          if (!edu.institution?.trim() || !edu.degree?.trim() || !edu.startDate) {
            validationErrors.push(`Education #${index + 1}: Institution, Degree, and Start Date are required`);
          }
        });
      }

      if (data.experience) {
        data.experience.forEach((exp, index) => {
          if (!exp.company?.trim() || !exp.position?.trim() || !exp.startDate) {
            validationErrors.push(`Experience #${index + 1}: Company, Position, and Start Date are required`);
          }
        });
      }

      // Show validation errors as toasts
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => showToastError(new ServiceError(error, 'VALIDATION', null, true)));
        throw new ServiceError('Please fix the validation errors above', 'VALIDATION');
      }

      // Optimize payload before sending
      const optimizedData = optimizeProfilePayload(data);

      return safeApiCall(async () => {
        const response = await api.put<{
          message: string; 
          success: boolean; 
          data: { user: CandidateProfile } 
        }>(
          '/candidate/profile', 
          optimizedData, 
          {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (!response.data.success) {
          throw new ServiceError(
            response.data.message || 'Failed to update profile',
            'SERVER'
          );
        }
        
        showSuccess('Profile updated successfully');
        return response.data.data.user;
      }, 'Failed to update profile');

    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to update profile', 'CLIENT', error);
    }
  },

// Upload multiple CVs
uploadCVs: async (files: File[]): Promise<CV[]> => {
  try {
    // File validation - updated to 5MB
    const fileErrors = validateFiles(files);
    if (fileErrors.length > 0) {
      fileErrors.forEach(error => showToastError(new ServiceError(error, 'VALIDATION', null, true)));
      throw new ServiceError('Please fix the file validation errors above', 'VALIDATION');
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('cvs', file);
    });
    
    return safeApiCall(async () => {
      const response = await api.post<{
        message: string; 
        success: boolean; 
        data: { cvs: CV[] } 
      }>('/candidate/cv', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Increased timeout for larger files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Optional: Show progress toast for large files
            if (percentCompleted % 25 === 0) { // Show at 25%, 50%, 75%, 100%
              showInfo(`Upload progress: ${percentCompleted}%`);
            }
          }
        }
      });

      if (!response.data.success) {
        throw new ServiceError(
          response.data.message || 'Failed to upload CVs',
          'SERVER'
        );
      }
      
      showSuccess(`Successfully uploaded ${files.length} CV(s)`);
      return response.data.data.cvs;
    }, 'Failed to upload CVs');

  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }
    throw new ServiceError('Failed to upload CVs', 'CLIENT', error);
  }
},

  // Set primary CV
  setPrimaryCV: async (cvId: string): Promise<void> => {
    if (!cvId) {
      const error = new ServiceError('CV ID is required', 'VALIDATION');
      showToastError(error);
      throw error;
    }

    return safeApiCall(async () => {
      const response = await api.patch(`/candidate/cv/${cvId}/primary`, {}, {
        timeout: 10000
      });

      if (!response.data.success) {
        throw new ServiceError(
          response.data.message || 'Failed to set primary CV',
          'SERVER'
        );
      }
      
      showSuccess('Primary CV updated successfully');
    }, 'Failed to set primary CV');
  },

  // Delete CV
  deleteCV: async (cvId: string): Promise<void> => {
    if (!cvId) {
      const error = new ServiceError('CV ID is required', 'VALIDATION');
      showToastError(error);
      throw error;
    }

    return safeApiCall(async () => {
      const response = await api.delete(`/candidate/cv/${cvId}`, {
        timeout: 10000
      });

      if (!response.data.success) {
        throw new ServiceError(
          response.data.message || 'Failed to delete CV',
          'SERVER'
        );
      }
      
      showSuccess('CV deleted successfully');
    }, 'Failed to delete CV');
  },

  // Get jobs for candidate
  getJobs: async (params?: JobFilters): Promise<JobsResponse> => {
    return safeApiCall(async () => {
      // Validate pagination parameters
      const safeParams = {
        ...params,
        page: Math.max(1, params?.page || 1),
        limit: Math.min(50, Math.max(1, params?.limit || 12))
      };

      const response = await api.get<{
        message: string; 
        success: boolean; 
        data: any[]; 
        pagination: any 
      }>('/candidate/jobs', { 
        params: safeParams,
        timeout: 10000
      });

      if (!response.data.success) {
        throw new ServiceError(
          response.data.message || 'Failed to fetch jobs',
          'SERVER'
        );
      }
      
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    }, 'Failed to fetch jobs');
  },

// Save job for candidate
saveJob: async (jobId: string): Promise<{ saved: boolean }> => {
  try {
    console.log('💾 saveJob called for job:', jobId);
    
    const response = await api.post<{
      message: string; 
      success: boolean; 
      data: { saved: boolean } 
    }>(`/job/${jobId}/save`);

    console.log('📡 Save job response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save job');
    }
    
    // Don't show toast here - let component handle it
    return response.data.data;
  } catch (error: any) {
    console.error('❌ saveJob error:', error);
    handleError(error, 'Failed to save job');
    throw error;
  }
},

// Unsave job for candidate
unsaveJob: async (jobId: string): Promise<{ saved: boolean }> => {
  try {
    console.log('🗑️ unsaveJob called for job:', jobId);
    
    const response = await api.post<{
      message: string; 
      success: boolean; 
      data: { saved: boolean } 
    }>(`/job/${jobId}/unsave`);

    console.log('📡 Unsave job response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to unsave job');
    }
    
    // Don't show toast here - let component handle it
    return response.data.data;
  } catch (error: any) {
    console.error('❌ unsaveJob error:', error);
    handleError(error, 'Failed to unsave job');
    throw error;
  }
},

  // Get saved jobs
  getSavedJobs: async (): Promise<any[]> => {
    return safeApiCall(async () => {
      const response = await api.get<{
        message: string; 
        success: boolean; 
        data: any[] 
      }>('/candidate/jobs/saved', {
        timeout: 10000
      });

      if (!response.data.success) {
        throw new ServiceError(
          response.data.message || 'Failed to fetch saved jobs',
          'SERVER'
        );
      }
      
      return response.data.data;
    }, 'Failed to fetch saved jobs');
  },

  // CV download URL - now with proper error handling
  getCVDownloadUrl: (cv: CV): string => {
    try {
      if (!cv) {
        throw new ServiceError('CV data is required', 'VALIDATION');
      }

      let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // Remove /api/v1 from backendUrl if it exists
      if (backendUrl.includes('/api/v1')) {
        backendUrl = backendUrl.replace('/api/v1', '');
      }

      // Method 1: Use filename directly (most reliable)
      if (cv.filename) {
        return `${backendUrl}/uploads/cv/${cv.filename}`;
      }
      
      // Method 2: If no filename, clean up the path
      let downloadPath = cv.path || '';
      
      // Remove any /api/v1 prefixes from the path
      if (downloadPath.includes('/api/v1')) {
        downloadPath = downloadPath.replace('/api/v1', '');
      }
      
      // Ensure the path starts with /uploads
      if (!downloadPath.startsWith('/uploads/')) {
        downloadPath = `/uploads/cv/${downloadPath.startsWith('/') ? downloadPath.slice(1) : downloadPath}`;
      }
      
      // Clean any double slashes
      downloadPath = downloadPath.replace(/([^:]\/)\/+/g, '$1');
      
      return `${backendUrl}${downloadPath}`;
    } catch (error) {
      console.error('Error generating CV download URL:', error);
      showToastError(new ServiceError('Failed to generate download URL', 'CLIENT', error));
      return '';
    }
  }
};