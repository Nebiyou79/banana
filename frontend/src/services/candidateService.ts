// src/services/candidateService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { handleError, handleSuccess, handleInfo } from '@/lib/error-handler'; // ADD THIS IMPORT

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

// Optimized payload helper to reduce data size
const optimizeProfilePayload = (data: Partial<CandidateProfile>) => {
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
  }

  if (optimized.education && optimized.education.length > 10) {
    optimized.education = optimized.education.slice(0, 10);
  }

  if (optimized.experience && optimized.experience.length > 15) {
    optimized.experience = optimized.experience.slice(0, 15);
  }

  // Trim strings
  if (optimized.bio) optimized.bio = optimized.bio.trim();
  if (optimized.location) optimized.location = optimized.location.trim();
  if (optimized.phone) optimized.phone = optimized.phone.trim();
  if (optimized.website) optimized.website = optimized.website.trim();

  return optimized;
};

export const candidateService = {
  // Get candidate profile with optimized timeout
  getProfile: async (): Promise<CandidateProfile> => {
    try {
      const response = await api.get<{ success: boolean; data: { user: CandidateProfile } }>('/candidate/profile', {
        timeout: 10000,
        params: { t: Date.now() } // Prevent caching
      });
      
      if (!response.data.success) {
        handleError('Failed to fetch profile');
        return Promise.reject(new Error('Failed to fetch profile'));
      }
      
      return response.data.data.user;
    } catch (error: any) {
      handleError(error, 'Failed to fetch profile');
      return Promise.reject(error);
    }
  },

  // Update candidate profile with optimized payload and timeout
  updateProfile: async (data: Partial<CandidateProfile>): Promise<CandidateProfile> => {
    try {
      // Client-side validation
      if (data.bio && data.bio.length > 1000) {
        handleError('Bio cannot exceed 1000 characters');
        return Promise.reject(new Error('Bio cannot exceed 1000 characters'));
      }
      
      if (data.skills && data.skills.length > 50) {
        handleError('Maximum 50 skills allowed');
        return Promise.reject(new Error('Maximum 50 skills allowed'));
      }

      if (data.education && data.education.length > 10) {
        handleError('Maximum 10 education entries allowed');
        return Promise.reject(new Error('Maximum 10 education entries allowed'));
      }

      if (data.experience && data.experience.length > 15) {
        handleError('Maximum 15 experience entries allowed');
        return Promise.reject(new Error('Maximum 15 experience entries allowed'));
      }

      // Optimize payload before sending
      const optimizedData = optimizeProfilePayload(data);

      const response = await api.put<{ success: boolean; data: { user: CandidateProfile } }>(
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
        handleError('Failed to update profile');
        return Promise.reject(new Error('Failed to update profile'));
      }
      
      handleSuccess('Profile updated successfully');
      return response.data.data.user;
    } catch (error: any) {
      handleError(error, 'Failed to update profile');
      return Promise.reject(error);
    }
  },

  // Upload multiple CVs with progress tracking
  uploadCVs: async (files: File[]): Promise<CV[]> => {
    try {
      if (!files || files.length === 0) {
        handleError('No files selected');
        return Promise.reject(new Error('No files selected'));
      }

      // Validate files
      files.forEach(file => {
        const allowedTypes = ['application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 10 * 1024 * 1024;
        
        if (!allowedTypes.includes(file.type)) {
          handleError('Please upload only PDF or Word documents');
          return Promise.reject(new Error('Please upload only PDF or Word documents'));
        }
        
        if (file.size > maxSize) {
          handleError(`File ${file.name} must be less than 10MB`);
          return Promise.reject(new Error(`File ${file.name} must be less than 10MB`));
        }
      });

      const formData = new FormData();
      files.forEach(file => {
        formData.append('cvs', file);
      });
      
      const response = await api.post<{ 
        success: boolean; 
        data: { cvs: CV[] } 
      }>('/candidate/cv', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        }
      });

      if (!response.data.success) {
        handleError('Failed to upload CVs');
        return Promise.reject(new Error('Failed to upload CVs'));
      }
      
      handleSuccess(`Successfully uploaded ${files.length} CV(s)`);
      return response.data.data.cvs;
    } catch (error: any) {
      handleError(error, 'Failed to upload CVs');
      return Promise.reject(error);
    }
  },

  // Set primary CV
  setPrimaryCV: async (cvId: string): Promise<void> => {
    try {
      const response = await api.patch(`/candidate/cv/${cvId}/primary`, {}, {
        timeout: 10000
      });

      if (!response.data.success) {
        handleError(response.data.message || 'Failed to set primary CV');
        return Promise.reject(new Error(response.data.message || 'Failed to set primary CV'));
      }
      
      handleSuccess('Primary CV updated successfully');
    } catch (error: any) {
      handleError(error, 'Failed to set primary CV');
      return Promise.reject(error);
    }
  },

  // Delete CV
  deleteCV: async (cvId: string): Promise<void> => {
    try {
      const response = await api.delete(`/candidate/cv/${cvId}`, {
        timeout: 10000
      });

      if (!response.data.success) {
        handleError(response.data.message || 'Failed to delete CV');
        return Promise.reject(new Error(response.data.message || 'Failed to delete CV'));
      }
      
      handleSuccess('CV deleted successfully');
    } catch (error: any) {
      handleError(error, 'Failed to delete CV');
      return Promise.reject(error);
    }
  },

  // Get open tenders
  getOpenTenders: async (params?: any): Promise<{ data: any[]; pagination: any }> => {
    try {
      const response = await api.get<{ success: boolean; data: any[]; pagination: any }>('/candidate/tenders', { 
        params,
        timeout: 10000
      });

      if (!response.data.success) {
        handleError('Failed to fetch tenders');
        return Promise.reject(new Error('Failed to fetch tenders'));
      }
      
      return response.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch tenders');
      return Promise.reject(error);
    }
  },

  // Toggle save tender
  toggleSaveTender: async (tenderId: string): Promise<{ saved: boolean }> => {
    try {
      const response = await api.post<{ success: boolean; data: { saved: boolean } }>(
        `/candidate/tenders/${tenderId}/save`, 
        {}, 
        { timeout: 10000 }
      );

      if (!response.data.success) {
        handleError('Failed to toggle save tender');
        return Promise.reject(new Error('Failed to toggle save tender'));
      }
      
      const message = response.data.data.saved 
        ? 'Tender saved successfully' 
        : 'Tender removed from saved';
      
      handleSuccess(message);
      return response.data.data;
    } catch (error: any) {
      handleError(error, 'Failed to toggle save tender');
      return Promise.reject(error);
    }
  },

  // Get saved tenders
  getSavedTenders: async (): Promise<any[]> => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/candidate/tenders/saved', {
        timeout: 10000
      });

      if (!response.data.success) {
        handleError('Failed to fetch saved tenders');
        return Promise.reject(new Error('Failed to fetch saved tenders'));
      }
      
      return response.data.data;
    } catch (error: any) {
      handleError(error, 'Failed to fetch saved tenders');
      return Promise.reject(error);
    }
  }
};