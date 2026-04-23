/**
 * services/freelancerService.ts
 *
 * Mobile freelancer API service.
 * Aligned to:
 *  - Backend: freelancerController.js + freelancerRoutes.js
 *  - Web:     frontend/src/services/freelancerService.ts
 *
 * All image URLs must be Cloudinary. Local URLs are filtered out.
 */

import api, { apiGet } from '../lib/api';
import { getToken } from '../lib/storage';
import { FREELANCER } from '../constants/api';
import type {
  FreelancerProfile,
  FreelancerProfileUpdate,
  FreelancerStats,
  DashboardData,
  PortfolioItem,
  PortfolioFormData,
  FreelancerCertification,
  CertificationFormData,
  FreelancerServiceItem,
  ServiceFormData,
  UploadedMediaFile,
} from '../types/freelancer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ApiResp<T> {
  success: boolean;
  data: T;
  message?: string;
  profileCompletion?: number;
  pagination?: {
    current: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const isCloudinaryUrl = (url?: string): boolean =>
  Boolean(url?.includes('cloudinary.com'));

const filterCloudinaryItems = (items: PortfolioItem[]): PortfolioItem[] =>
  items
    .map(item => {
      const urls: string[] = [];
      if (item.mediaUrls?.length) urls.push(...item.mediaUrls);
      else if (item.mediaUrl) urls.push(item.mediaUrl);
      const cloudinary = urls.filter(isCloudinaryUrl);
      return { ...item, mediaUrls: cloudinary, isCloudinary: cloudinary.length > 0 };
    })
    .filter(item => (item.mediaUrls?.length ?? 0) > 0);

/**
 * Returns a Cloudinary transformation URL for efficient image delivery.
 * Falls back gracefully to the original URL if transformation is impossible.
 */
export const getOptimizedUrl = (url: string, w = 400, h = 300): string => {
  if (!url?.includes('cloudinary.com')) return url ?? '';
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  return `${parts[0]}/upload/w_${w},h_${h},c_fill,g_auto,q_auto,f_auto/${parts[1]}`;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const freelancerService = {
  // ── Utilities ──────────────────────────────────────────────────────────────

  isCloudinaryUrl,
  getOptimizedUrl,

  getSkillName: (skill: { name: string } | string): string =>
    typeof skill === 'string' ? skill : skill.name,

  // ── Dashboard ──────────────────────────────────────────────────────────────

  getDashboard: async (): Promise<DashboardData> => {
    const res = await apiGet<ApiResp<DashboardData>>(FREELANCER.DASHBOARD);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load dashboard');
    return res.data.data;
  },

  getStats: async (): Promise<FreelancerStats> => {
    const res = await apiGet<ApiResp<FreelancerStats>>(FREELANCER.STATS);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load stats');
    return res.data.data;
  },

  // ── Profile ────────────────────────────────────────────────────────────────

  getProfile: async (): Promise<FreelancerProfile> => {
    const res = await apiGet<ApiResp<FreelancerProfile>>(FREELANCER.PROFILE);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load profile');
    const profile = res.data.data;
    // Only Cloudinary portfolio items
    if (profile.portfolio) {
      profile.portfolio = filterCloudinaryItems(profile.portfolio);
    }
    // Only Cloudinary avatar
    if (profile.avatar && !isCloudinaryUrl(profile.avatar)) {
      profile.avatar = '';
    }
    return profile;
  },

  updateProfile: async (
    data: FreelancerProfileUpdate,
  ): Promise<{ profile: FreelancerProfile; profileCompletion: number }> => {
    const res = await api.put<ApiResp<FreelancerProfile>>(FREELANCER.PROFILE, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update profile');
    const profile = res.data.data;
    if (profile.portfolio) {
      profile.portfolio = filterCloudinaryItems(profile.portfolio);
    }
    return { profile, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // ── Portfolio ──────────────────────────────────────────────────────────────

  getPortfolio: async (params?: {
    page?: number;
    limit?: number;
    featured?: boolean;
    category?: string;
  }): Promise<{ items: PortfolioItem[]; pagination: ApiResp<unknown>['pagination'] }> => {
    const res = await apiGet<ApiResp<{ items: PortfolioItem[]; pagination: any }>>(
      FREELANCER.PORTFOLIO,
      { params },
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to fetch portfolio');
    const items = filterCloudinaryItems(res.data.data?.items ?? []);
    return { items, pagination: res.data.data?.pagination ?? {} };
  },

  getPortfolioItem: async (id: string): Promise<PortfolioItem> => {
    const res = await apiGet<ApiResp<PortfolioItem>>(FREELANCER.PORTFOLIO_ITEM(id));
    if (!res.data.success) throw new Error(res.data.message ?? 'Portfolio item not found');
    const item = res.data.data;
    // Ensure mediaUrls is populated
    return {
      ...item,
      mediaUrls: item.mediaUrls?.length
        ? item.mediaUrls
        : item.mediaUrl
          ? [item.mediaUrl]
          : [],
      isCloudinary: true,
    };
  },

  addPortfolioItem: async (
    data: PortfolioFormData,
  ): Promise<{ item: PortfolioItem; profileCompletion: number }> => {
    const cloudinaryUrls = data.mediaUrls.filter(isCloudinaryUrl);
    if (cloudinaryUrls.length === 0) throw new Error('At least one Cloudinary image is required');

    const payload = {
      ...data,
      mediaUrl: cloudinaryUrls[0],
      mediaUrls: cloudinaryUrls,
    };

    const res = await api.post<ApiResp<PortfolioItem>>(FREELANCER.PORTFOLIO, payload);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add portfolio item');

    const item = res.data.data;
    return {
      item: {
        ...item,
        mediaUrls: item.mediaUrls?.length ? item.mediaUrls : item.mediaUrl ? [item.mediaUrl] : [],
        isCloudinary: true,
      },
      profileCompletion: res.data.profileCompletion ?? 0,
    };
  },

  updatePortfolioItem: async (
    id: string,
    data: Partial<PortfolioFormData>,
  ): Promise<{ item: PortfolioItem; profileCompletion: number }> => {
    const payload: Record<string, unknown> = { ...data };
    if (data.mediaUrls?.length) {
      const cloudinary = data.mediaUrls.filter(isCloudinaryUrl);
      if (cloudinary.length === 0) throw new Error('At least one Cloudinary image is required');
      payload.mediaUrl = cloudinary[0];
      payload.mediaUrls = cloudinary;
    }

    const res = await api.put<ApiResp<PortfolioItem>>(FREELANCER.PORTFOLIO_ITEM(id), payload);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update portfolio item');

    const item = res.data.data;
    return {
      item: {
        ...item,
        mediaUrls: item.mediaUrls?.length ? item.mediaUrls : item.mediaUrl ? [item.mediaUrl] : [],
        isCloudinary: true,
      },
      profileCompletion: res.data.profileCompletion ?? 0,
    };
  },

  deletePortfolioItem: async (id: string): Promise<{ profileCompletion: number }> => {
    const res = await api.delete<ApiResp<unknown>>(FREELANCER.PORTFOLIO_ITEM(id));
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to delete portfolio item');
    return { profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // ── Services ───────────────────────────────────────────────────────────────

  getServices: async (): Promise<FreelancerServiceItem[]> => {
    const res = await apiGet<ApiResp<FreelancerServiceItem[]>>(FREELANCER.SERVICES);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to fetch services');
    return res.data.data ?? [];
  },

  addService: async (data: ServiceFormData): Promise<FreelancerServiceItem> => {
    const res = await api.post<ApiResp<FreelancerServiceItem>>(FREELANCER.SERVICES, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add service');
    return res.data.data;
  },


  // FIX: Was completely missing — caused every edit to 404
  updateService: async (id: string, data: Partial<Omit<FreelancerServiceItem, '_id'>>): Promise<FreelancerServiceItem> => {
    const res = await api.put<ApiResp<FreelancerServiceItem>>(FREELANCER.SERVICE(id), data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update service');
    return res.data.data;
  },
 
  // FIX: Was missing
  deleteService: async (id: string): Promise<void> => {
    const res = await api.delete<ApiResp<any>>(FREELANCER.SERVICE(id));
    if (!res.data.success) throw new Error('Failed to delete service');
  },

  // ── Certifications ─────────────────────────────────────────────────────────

  getCertifications: async (): Promise<FreelancerCertification[]> => {
    const res = await apiGet<ApiResp<FreelancerCertification[]>>(FREELANCER.CERTIFICATIONS);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to fetch certifications');
    return res.data.data ?? [];
  },

  addCertification: async (
    data: CertificationFormData,
  ): Promise<{ cert: FreelancerCertification; profileCompletion: number }> => {
    const res = await api.post<ApiResp<FreelancerCertification>>(FREELANCER.CERTIFICATIONS, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add certification');
    return { cert: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  updateCertification: async (
    id: string,
    data: Partial<CertificationFormData>,
  ): Promise<{ cert: FreelancerCertification; profileCompletion: number }> => {
    const res = await api.put<ApiResp<FreelancerCertification>>(FREELANCER.CERTIFICATION(id), data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update certification');
    return { cert: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  deleteCertification: async (id: string): Promise<{ profileCompletion: number }> => {
    const res = await api.delete<ApiResp<unknown>>(FREELANCER.CERTIFICATION(id));
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to delete certification');
    return { profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // ── Image Upload ───────────────────────────────────────────────────────────

  /**
   * Upload portfolio images via multipart/form-data.
   * Field name must be 'media' — matches cloudinaryMediaUpload.multiple on the backend.
   */
  uploadPortfolioImages: async (
    files: Array<{ uri: string; name: string; type: string }>,
  ): Promise<UploadedMediaFile[]> => {
    const formData = new FormData();
    files.forEach(f => {
      (formData as any).append('media', { uri: f.uri, name: f.name, type: f.type });
    });

    const token = await getToken();
    const baseUrl =
      (process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://192.168.1.7:4000');

    const response = await fetch(`${baseUrl}/api/v1${FREELANCER.UPLOAD_PORTFOLIO}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message ?? 'Upload failed');

    const uploaded: UploadedMediaFile[] = (data.data as any[]).map(f => ({
      filename: f.filename ?? `portfolio-${Date.now()}`,
      originalName: f.originalName ?? f.originalname ?? 'unknown',
      url: f.url ?? f.path ?? '',
      path: f.path ?? f.url ?? '',
      size: f.size ?? 0,
      mimetype: f.mimetype ?? 'image/jpeg',
      uploadedAt: f.uploadedAt ?? new Date().toISOString(),
      isCloudinary: isCloudinaryUrl(f.url ?? f.path),
    }));

    const cloudinary = uploaded.filter(f => f.isCloudinary);
    if (cloudinary.length === 0) throw new Error('No Cloudinary URLs received from server');
    return cloudinary;
  },

  /**
   * Upload avatar via multipart/form-data.
   * Field name must be 'avatar'.
   */
  uploadAvatar: async (
    file: { uri: string; name: string; type: string },
  ): Promise<{ avatarUrl: string; filename: string; size: number; path: string }> => {
    const formData = new FormData();
    (formData as any).append('avatar', { uri: file.uri, name: file.name, type: file.type });

    const res = await api.post<ApiResp<any>>(FREELANCER.UPLOAD_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to upload avatar');
    return res.data.data;
  },
};

// Named re-export for convenience (used in PortfolioDetailsScreen, DashboardScreen)
export { getOptimizedUrl as optimizeCloudinaryUrl };