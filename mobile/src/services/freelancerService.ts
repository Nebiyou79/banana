import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { FREELANCER } from '../constants/api';
import type {
  FreelancerProfile,
  FreelancerStats,
  DashboardData,
  PortfolioItem,
  PortfolioFormData,
  FreelancerServiceItem,
  ServiceFormData,
  FreelancerCertification,
  CertificationFormData,
} from '../types/freelancer';

// ─── API Response Wrappers ────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  profileCompletion?: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: { items: T[]; pagination: { current: number; pages: number; total: number; hasNext: boolean; hasPrev: boolean } };
}

// ─── Cloudinary URL Helper ────────────────────────────────────────────────────

export const getOptimizedUrl = (url: string, w = 400, h = 300): string => {
  if (!url?.includes('cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  return `${parts[0]}/upload/w_${w},h_${h},c_fill,g_auto,q_auto,f_auto/${parts[1]}`;
};

export const isCloudinaryUrl = (url: string): boolean =>
  Boolean(url?.includes('cloudinary.com'));

// ─── Service ──────────────────────────────────────────────────────────────────

export const freelancerService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: async (): Promise<DashboardData> => {
    const res = await apiGet<ApiResponse<DashboardData>>(FREELANCER.DASHBOARD);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load dashboard');
    return res.data.data;
  },

  getStats: async (): Promise<FreelancerStats> => {
    const res = await apiGet<ApiResponse<FreelancerStats>>(FREELANCER.STATS);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load stats');
    return res.data.data;
  },

  // ── Profile ────────────────────────────────────────────────────────────────
  getProfile: async (): Promise<FreelancerProfile> => {
    const res = await apiGet<ApiResponse<FreelancerProfile>>(FREELANCER.PROFILE);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to load profile');
    return res.data.data;
  },

  updateProfile: async (data: Partial<FreelancerProfile>): Promise<{ profile: FreelancerProfile; profileCompletion: number }> => {
    const res = await apiPut<ApiResponse<FreelancerProfile> & { profileCompletion: number }>(FREELANCER.PROFILE, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update profile');
    return { profile: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // ── Portfolio ──────────────────────────────────────────────────────────────
  getPortfolio: async (params?: { page?: number; limit?: number; featured?: boolean; category?: string }): Promise<{
    items: PortfolioItem[];
    pagination: { current: number; pages: number; total: number; hasNext: boolean; hasPrev: boolean };
  }> => {
    const res = await apiGet<PaginatedResponse<PortfolioItem>>(FREELANCER.PORTFOLIO, { params });
    if (!res.data.success) throw new Error('Failed to load portfolio');
    const items = (res.data.data.items ?? []).filter(
      item => item.mediaUrls?.some(isCloudinaryUrl) || isCloudinaryUrl(item.mediaUrl ?? '')
    );
    return { items, pagination: res.data.data.pagination };
  },

  getPortfolioItem: async (id: string): Promise<PortfolioItem> => {
    const res = await apiGet<ApiResponse<PortfolioItem>>(FREELANCER.PORTFOLIO_ITEM(id));
    if (!res.data.success) throw new Error('Failed to load portfolio item');
    return res.data.data;
  },

  addPortfolioItem: async (data: PortfolioFormData): Promise<{ item: PortfolioItem; profileCompletion: number }> => {
    const cloudinaryUrls = data.mediaUrls.filter(isCloudinaryUrl);
    if (!cloudinaryUrls.length) throw new Error('Please upload images to Cloudinary first');
    const res = await apiPost<ApiResponse<PortfolioItem> & { profileCompletion: number }>(
      FREELANCER.PORTFOLIO, { ...data, mediaUrls: cloudinaryUrls, mediaUrl: cloudinaryUrls[0] }
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add portfolio item');
    return { item: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  updatePortfolioItem: async (id: string, data: Partial<PortfolioFormData>): Promise<PortfolioItem> => {
    const res = await apiPut<ApiResponse<PortfolioItem>>(FREELANCER.PORTFOLIO_ITEM(id), data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update portfolio item');
    return res.data.data;
  },

  deletePortfolioItem: async (id: string): Promise<{ profileCompletion: number }> => {
    const res = await apiDelete<ApiResponse<unknown> & { profileCompletion: number }>(FREELANCER.PORTFOLIO_ITEM(id));
    if (!res.data.success) throw new Error('Failed to delete portfolio item');
    return { profileCompletion: res.data.profileCompletion ?? 0 };
  },

  // ── Services ───────────────────────────────────────────────────────────────
  getServices: async (): Promise<FreelancerServiceItem[]> => {
    const res = await apiGet<ApiResponse<FreelancerServiceItem[]>>(FREELANCER.SERVICES);
    if (!res.data.success) throw new Error('Failed to load services');
    return res.data.data ?? [];
  },

  addService: async (data: ServiceFormData): Promise<FreelancerServiceItem> => {
    const res = await apiPost<ApiResponse<FreelancerServiceItem>>(FREELANCER.SERVICES, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add service');
    return res.data.data;
  },

  updateService: async (id: string, data: Partial<ServiceFormData>): Promise<FreelancerServiceItem> => {
    const res = await apiPut<ApiResponse<FreelancerServiceItem>>(`${FREELANCER.SERVICES}/${id}`, data);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update service');
    return res.data.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await apiDelete(`${FREELANCER.SERVICES}/${id}`);
  },

  // ── Certifications ─────────────────────────────────────────────────────────
  getCertifications: async (): Promise<FreelancerCertification[]> => {
    const res = await apiGet<ApiResponse<FreelancerCertification[]>>(FREELANCER.CERTIFICATIONS);
    if (!res.data.success) throw new Error('Failed to load certifications');
    return res.data.data ?? [];
  },

  addCertification: async (data: CertificationFormData): Promise<{ cert: FreelancerCertification; profileCompletion: number }> => {
    const res = await apiPost<ApiResponse<FreelancerCertification> & { profileCompletion: number }>(
      FREELANCER.CERTIFICATIONS, data
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to add certification');
    return { cert: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  updateCertification: async (id: string, data: Partial<CertificationFormData>): Promise<{ cert: FreelancerCertification; profileCompletion: number }> => {
    const res = await apiPut<ApiResponse<FreelancerCertification> & { profileCompletion: number }>(
      FREELANCER.CERTIFICATION(id), data
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to update certification');
    return { cert: res.data.data, profileCompletion: res.data.profileCompletion ?? 0 };
  },

  deleteCertification: async (id: string): Promise<{ profileCompletion: number }> => {
    const res = await apiDelete<ApiResponse<unknown> & { profileCompletion: number }>(FREELANCER.CERTIFICATION(id));
    if (!res.data.success) throw new Error('Failed to delete certification');
    return { profileCompletion: res.data.profileCompletion ?? 0 };
  },
};
