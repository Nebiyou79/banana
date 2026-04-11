import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { FREELANCER } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortfolioItem {
  _id: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  budget?: number;
  duration?: string;
  client?: string;
  completionDate?: string;
  featured?: boolean;
}

export interface FreelancerService {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  price?: number;
  priceType?: 'fixed' | 'hourly' | 'negotiable';
  deliveryTime?: string;
  isActive?: boolean;
}

export interface FreelancerCertification {
  _id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface FreelancerStats {
  totalEarnings?: number;
  completedProjects?: number;
  activeProjects?: number;
  rating?: number;
  reviewCount?: number;
  profileViews?: number;
}

export interface FreelancerDashboard {
  profile: any;
  stats: FreelancerStats;
  recentPortfolio: PortfolioItem[];
  recentServices: FreelancerService[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const freelancerService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: async (): Promise<FreelancerDashboard> => {
    const res = await apiGet<{ success: boolean; data: FreelancerDashboard }>(FREELANCER.DASHBOARD);
    return res.data.data;
  },

  getStats: async (): Promise<FreelancerStats> => {
    const res = await apiGet<{ success: boolean; data: FreelancerStats }>(FREELANCER.STATS);
    return res.data.data;
  },

  // ── Portfolio ──────────────────────────────────────────────────────────────
  getPortfolio: async (): Promise<PortfolioItem[]> => {
    const res = await apiGet<{ success: boolean; data: PortfolioItem[] }>(FREELANCER.PORTFOLIO);
    return res.data.data ?? [];
  },

  addPortfolioItem: async (data: Omit<PortfolioItem, '_id'>): Promise<PortfolioItem> => {
    const res = await apiPost<{ success: boolean; data: PortfolioItem }>(FREELANCER.PORTFOLIO, data);
    return res.data.data;
  },

  updatePortfolioItem: async (id: string, data: Partial<PortfolioItem>): Promise<PortfolioItem> => {
    const res = await apiPut<{ success: boolean; data: PortfolioItem }>(
      FREELANCER.PORTFOLIO_ITEM(id),
      data
    );
    return res.data.data;
  },

  deletePortfolioItem: async (id: string): Promise<void> => {
    await apiDelete(FREELANCER.PORTFOLIO_ITEM(id));
  },

  // ── Services ───────────────────────────────────────────────────────────────
  getServices: async (): Promise<FreelancerService[]> => {
    const res = await apiGet<{ success: boolean; data: FreelancerService[] }>(FREELANCER.SERVICES);
    return res.data.data ?? [];
  },

  addService: async (data: Omit<FreelancerService, '_id'>): Promise<FreelancerService> => {
    const res = await apiPost<{ success: boolean; data: FreelancerService }>(FREELANCER.SERVICES, data);
    return res.data.data;
  },

  updateService: async (id: string, data: Partial<FreelancerService>): Promise<FreelancerService> => {
    const res = await apiPut<{ success: boolean; data: FreelancerService }>(
      `${FREELANCER.SERVICES}/${id}`,
      data
    );
    return res.data.data;
  },

  deleteService: async (id: string): Promise<void> => {
    await apiDelete(`${FREELANCER.SERVICES}/${id}`);
  },

  // ── Certifications ─────────────────────────────────────────────────────────
  getCertifications: async (): Promise<FreelancerCertification[]> => {
    const res = await apiGet<{ success: boolean; data: FreelancerCertification[] }>(
      FREELANCER.CERTIFICATIONS
    );
    return res.data.data ?? [];
  },

  addCertification: async (data: Omit<FreelancerCertification, '_id'>): Promise<FreelancerCertification> => {
    const res = await apiPost<{ success: boolean; data: FreelancerCertification }>(
      FREELANCER.CERTIFICATIONS,
      data
    );
    return res.data.data;
  },

  deleteCertification: async (id: string): Promise<void> => {
    await apiDelete(FREELANCER.CERTIFICATION(id));
  },
};
