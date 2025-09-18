/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

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

export interface CandidateProfile {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  cvUrl?: string;
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
  verificationStatus: 'none' | 'partial' | 'full';
  profileCompleted: boolean;
}

export interface UploadCVResponse {
  cvUrl: string;
}

export const candidateService = {
  // Get candidate profile
  getProfile: async (): Promise<CandidateProfile> => {
    try {
      const response = await api.get<{ success: boolean; data: { user: CandidateProfile } }>('/candidate/profile');
      return response.data.data.user;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  // Update candidate profile
  updateProfile: async (data: Partial<CandidateProfile>): Promise<CandidateProfile> => {
    try {
      const response = await api.put<{ success: boolean; data: { user: CandidateProfile } }>('/candidate/profile', data);
      return response.data.data.user;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Upload CV with actual file
uploadCV: async (file: File): Promise<UploadCVResponse> => {
  try {
    const formData = new FormData();
    formData.append('cv', file);
    
    const response = await api.post<{ 
      success: boolean; 
      data: { user: { cvUrl: string } } 
    }>('/candidate/cv', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      }
    });
    
    return { cvUrl: response.data.data.user.cvUrl };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to upload CV');
  }
}
};