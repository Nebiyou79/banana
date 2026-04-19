/**
 * freelancerService.ts
 * Matches backend: freelancerController.js + freelancerRoutes.js
 * Key: Images via Cloudinary, PUT /freelancer/profile for all updates
 */
import api, { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { FREELANCER } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FreelancerSkill {
  name: string;
  level?: 'beginner' | 'intermediate' | 'expert';
  yearsOfExperience?: number;
}

export interface FreelancerExperience {
  _id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  skills: string[];
}

export interface FreelancerEducation {
  _id?: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface FreelancerCertification {
  _id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
}

export interface FreelancerService {
  _id?: string;
  title: string;
  description: string;
  price: number;
  priceType: 'fixed' | 'hourly';
  deliveryTime: number;
  category?: string;
}

export interface PortfolioItem {
  _id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  budget?: number;
  budgetType?: 'fixed' | 'hourly' | 'daily' | 'monthly';
  duration?: string;
  client?: string;
  completionDate?: string;
  featured?: boolean;
  visibility?: 'public' | 'private';
  isCloudinary?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FreelancerProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  age?: number;
  skills: Array<FreelancerSkill | string>;
  experience: FreelancerExperience[];
  education: FreelancerEducation[];
  certifications?: FreelancerCertification[];
  portfolio: PortfolioItem[];
  socialLinks?: Record<string, string>;
  freelancerProfile?: {
    headline?: string;
    hourlyRate?: number;
    availability?: 'available' | 'not-available' | 'part-time';
    experienceLevel?: 'entry' | 'intermediate' | 'expert';
    englishProficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
    timezone?: string;
    specialization?: string[];
    services?: FreelancerService[];
    profileCompletion?: number;
    totalEarnings?: number;
    successRate?: number;
    ratings?: { average: number; count: number };
    verified?: boolean;
    profileViews?: number;
    socialLinks?: Record<string, string>;
  };
  profileCompleted: boolean;
  verificationStatus: string;
}

export interface FreelancerProfileUpdate {
  name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  skills?: Array<{ name: string; level?: string; yearsOfExperience?: number }>;
  experience?: FreelancerExperience[];
  education?: FreelancerEducation[];
  // Freelancer-specific via nested object:
  freelancerProfile?: {
    headline?: string;
    hourlyRate?: number;
    availability?: 'available' | 'not-available' | 'part-time';
    experienceLevel?: 'entry' | 'intermediate' | 'expert';
    englishProficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
    timezone?: string;
    specialization?: string[];
    socialLinks?: Record<string, string>;
  };
  // Flat social links also accepted by backend:
  socialLinks?: Record<string, string>;
}

export interface FreelancerStats {
  profileStrength: number;
  jobSuccessScore: number;
  onTimeDelivery: number;
  responseRate: number;
  totalEarnings: number;
  totalJobs: number;
  activeProposals: number;
  profileViews: number;
  clientReviews: number;
  averageRating: number;
  age?: number | null;
  gender?: string;
  portfolioCount: number;
}

export interface DashboardData {
  stats: {
    profile: { completion: number; views: number; verified: boolean };
    portfolio: { total: number; featured: number };
    skills: { total: number; categories: string[] };
    earnings: { total: number; successRate: number };
    ratings: { average: number; count: number };
    proposals: { sent: number; accepted: number; pending: number };
    socialLinks?: { total: number };
    demographics?: { age: number | null; gender: string };
  };
  recentActivities: any[];
  profileStrength: { score: number; strengths: string[]; suggestions: string[] };
}

export interface UploadedMediaFile {
  filename: string;
  originalName: string;
  url: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  isCloudinary: boolean;
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

interface ApiResp<T> {
  success: boolean;
  data: T;
  message?: string;
  profileCompletion?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const freelancerService = {
  // GET /freelancer/dashboard/overview
  getDashboard: async (): Promise<DashboardData> => {
    const res = await apiGet<ApiResp<DashboardData>>(FREELANCER.DASHBOARD);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load dashboard');
    return res.data.data;
  },

  // GET /freelancer/stats
  getStats: async (): Promise<FreelancerStats> => {
    const res = await apiGet<ApiResp<FreelancerStats>>(FREELANCER.STATS);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load stats');
    return res.data.data;
  },

  // GET /freelancer/profile
  getProfile: async (): Promise<FreelancerProfile> => {
    const res = await apiGet<ApiResp<FreelancerProfile>>(FREELANCER.PROFILE);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load profile');
    return res.data.data;
  },

  // PUT /freelancer/profile
  updateProfile: async (data: FreelancerProfileUpdate): Promise<{ profile: FreelancerProfile; profileCompletion: number }> => {
    const res = await api.put<ApiResp<FreelancerProfile>>(FREELANCER.PROFILE, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update profile');
    return { profile: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // GET /freelancer/certifications
  getCertifications: async (): Promise<FreelancerCertification[]> => {
    const res = await apiGet<ApiResp<FreelancerCertification[]>>(FREELANCER.CERTIFICATIONS);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to fetch certifications');
    return res.data.data ?? [];
  },

  // POST /freelancer/certifications
  addCertification: async (data: Omit<FreelancerCertification, '_id'>): Promise<{ cert: FreelancerCertification; profileCompletion: number }> => {
    const res = await api.post<ApiResp<FreelancerCertification>>(FREELANCER.CERTIFICATIONS, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add certification');
    return { cert: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // PUT /freelancer/certifications/:id
  updateCertification: async (id: string, data: Partial<FreelancerCertification>): Promise<{ cert: FreelancerCertification; profileCompletion: number }> => {
    const res = await api.put<ApiResp<FreelancerCertification>>(FREELANCER.CERTIFICATION(id), data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update certification');
    return { cert: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // DELETE /freelancer/certifications/:id
  deleteCertification: async (id: string): Promise<{ profileCompletion: number }> => {
    const res = await api.delete<ApiResp<any>>(FREELANCER.CERTIFICATION(id));
    if (!res.data.success) throw new Error('Failed to delete certification');
    return { profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // GET /freelancer/services
  getServices: async (): Promise<FreelancerService[]> => {
    const res = await apiGet<ApiResp<FreelancerService[]>>(FREELANCER.SERVICES);
    if (!res.data.success) throw new Error('Failed to fetch services');
    return res.data.data ?? [];
  },

  // POST /freelancer/services
  addService: async (data: Omit<FreelancerService, '_id'>): Promise<FreelancerService> => {
    const res = await api.post<ApiResp<FreelancerService>>(FREELANCER.SERVICES, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add service');
    return res.data.data;
  },

  // GET /freelancer/portfolio
  getPortfolio: async (params?: { page?: number; limit?: number; featured?: boolean; category?: string }): Promise<{
    items: PortfolioItem[];
    pagination: any;
  }> => {
    const res = await apiGet<ApiResp<{ items: PortfolioItem[]; pagination: any }>>(FREELANCER.PORTFOLIO, { params });
    if (!res.data.success) throw new Error('Failed to fetch portfolio');
    const items = (res.data.data?.items ?? []).filter(
      item => item.mediaUrls?.some((u: string) => u?.includes('cloudinary.com')) ||
        (item.mediaUrl ?? '').includes('cloudinary.com')
    );
    return { items, pagination: res.data.data?.pagination ?? {} };
  },

  // POST /freelancer/upload/portfolio — uploads media files to Cloudinary
  // field name: 'media' (matches cloudinaryMediaUpload.multiple)
  uploadPortfolioImages: async (
    files: Array<{ uri: string; name: string; type: string }>
  ): Promise<UploadedMediaFile[]> => {
    const formData = new FormData();
    files.forEach(f => {
      (formData as FormData).append('media', {
        uri: f.uri,
        name: f.name,
        type: f.type,
      } as unknown as Blob);
    });

    const token = await import('../lib/storage').then(m => m.getToken());
    const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://192.168.1.7:4000';

    const response = await fetch(`${baseUrl}/api/v1/freelancer/upload/portfolio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message ?? 'Upload failed');
    return data.data as UploadedMediaFile[];
  },

  // POST /freelancer/upload/avatar — uploads avatar to Cloudinary
  uploadAvatar: async (file: { uri: string; name: string; type: string }): Promise<{ avatarUrl: string; filename: string; size: number; path: string }> => {
    const formData = new FormData();
    (formData as FormData).append('avatar', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    const res = await api.post<ApiResp<any>>(`${FREELANCER.PROFILE.replace('/profile', '')}/upload/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to upload avatar');
    return res.data.data;
  },

  // ── Cloudinary URL helpers ─────────────────────────────────────────────────

  isCloudinaryUrl: (url?: string): boolean => Boolean(url?.includes('cloudinary.com')),

  getOptimizedUrl: (url: string, w = 400, h = 300): string => {
    if (!url?.includes('cloudinary.com')) return url;
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    return `${parts[0]}/upload/w_${w},h_${h},c_fill,g_auto,q_auto,f_auto/${parts[1]}`;
  },

  getSkillName: (skill: FreelancerSkill | string): string =>
    typeof skill === 'string' ? skill : skill.name,
};
