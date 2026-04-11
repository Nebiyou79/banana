import api from '../lib/api';
import { FREELANCERS, SHORTLIST, PRODUCTS, CV_GENERATOR } from '../constants/api';

// ══════════════════════════════════════════════════════════════════════════════
// FREELANCER MARKETPLACE
// ══════════════════════════════════════════════════════════════════════════════

export interface FreelancerListItem {
  _id: string;
  user: { _id: string; name: string; avatar?: string; location?: string; skills: string[] };
  profession?: string;
  headline?: string;
  hourlyRate: number;
  availability: 'available' | 'not-available' | 'part-time';
  experienceLevel: string;
  specialization: string[];
  ratings: { average: number; count: number };
  featured: boolean;
  isSaved?: boolean;
  createdAt: string;
}

export interface FreelancerPublicProfile extends FreelancerListItem {
  user: FreelancerListItem['user'] & {
    email?: string; website?: string;
    portfolio: { _id: string; title: string; mediaUrls: string[]; technologies: string[]; featured: boolean }[];
    experience: { company: string; position: string; startDate: string; endDate?: string; current: boolean }[];
    education:  { institution: string; degree: string; field?: string; startDate: string }[];
  };
  bio?: string;
  services: { _id: string; title: string; price: number; priceType: string; deliveryTime: number }[];
  certifications: { _id: string; name: string; issuer: string; issueDate: string }[];
  recentReviews: FreelancerReview[];
  profileCompletion: number;
}

export interface FreelancerReview {
  _id: string;
  companyId: { _id: string; name: string; logo?: string };
  rating: number;
  comment?: string;
  subRatings?: { communication?: number; quality?: number; deadlines?: number; professionalism?: number };
  createdAt: string;
}

export interface ReviewSubmission {
  rating: number;
  comment?: string;
  subRatings?: { communication?: number; quality?: number; deadlines?: number; professionalism?: number };
}

export interface MarketplaceFilters {
  search?: string;
  skills?: string;
  profession?: string;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  availability?: string;
  experienceLevel?: string;
  sortBy?: 'rating' | 'rate_asc' | 'rate_desc' | 'newest';
  page?: number;
  limit?: number;
}

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

export const freelancerMarketplaceService = {
  listFreelancers: async (filters?: MarketplaceFilters) => {
    const res = await api.get<ApiResponse<{ freelancers: FreelancerListItem[]; total: number; page: number; totalPages: number }>>(
      FREELANCERS.LIST, { params: filters },
    );
    return res.data.data;
  },

  getFreelancerProfile: async (id: string): Promise<FreelancerPublicProfile> => {
    const res = await api.get<ApiResponse<FreelancerPublicProfile>>(FREELANCERS.DETAIL(id));
    return res.data.data;
  },

  getReviews: async (id: string, page = 1) => {
    const res = await api.get<ApiResponse<{ reviews: FreelancerReview[]; pagination: { total: number; page: number; totalPages: number }; summary: { average: number; count: number } }>>(
      FREELANCERS.REVIEWS(id), { params: { page } },
    );
    return res.data.data;
  },

  submitReview: async (id: string, data: ReviewSubmission) => {
    const res = await api.post<ApiResponse<FreelancerReview>>(FREELANCERS.SUBMIT_REVIEW(id), data);
    return res.data.data;
  },

  toggleShortlist: async (freelancerId: string): Promise<{ saved: boolean }> => {
    const res = await api.post<ApiResponse<{ saved: boolean }>>(SHORTLIST.TOGGLE(freelancerId));
    return res.data.data;
  },

  getShortlist: async (page = 1) => {
    const res = await api.get<ApiResponse<{ freelancers: FreelancerListItem[]; total: number }>>(
      SHORTLIST.LIST, { params: { page } },
    );
    return res.data.data;
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  productImages: string[];
  company: { _id: string; name: string; logo?: string };
  featured: boolean;
  status: 'active' | 'draft' | 'out-of-stock';
  stock?: number;
  tags: string[];
  createdAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export const productService = {
  getProducts: async (filters?: ProductFilters) => {
    const res = await api.get<ApiResponse<{ products: Product[]; total: number; page: number; totalPages: number }>>(
      PRODUCTS.LIST, { params: filters },
    );
    return res.data.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const res = await api.get<ApiResponse<Product>>(PRODUCTS.DETAIL(id));
    return res.data.data;
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    const res = await api.get<ApiResponse<Product[]>>(PRODUCTS.FEATURED);
    return res.data.data ?? [];
  },

  getCategories: async (): Promise<string[]> => {
    const res = await api.get<ApiResponse<string[]>>(PRODUCTS.CATEGORIES);
    return res.data.data ?? [];
  },

  getCompanyProducts: async (companyId?: string) => {
    const url = companyId ? PRODUCTS.COMPANY(companyId) : PRODUCTS.LIST;
    const res = await api.get<ApiResponse<{ products: Product[]; total: number }>>(url);
    return res.data.data;
  },

  getRelatedProducts: async (id: string): Promise<Product[]> => {
    const res = await api.get<ApiResponse<Product[]>>(PRODUCTS.RELATED(id));
    return res.data.data ?? [];
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const res = await api.post<ApiResponse<Product>>(PRODUCTS.CREATE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  updateProduct: async (id: string, formData: FormData): Promise<Product> => {
    const res = await api.put<ApiResponse<Product>>(PRODUCTS.UPDATE(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  updateProductStatus: async (id: string, status: Product['status']): Promise<Product> => {
    const res = await api.patch<ApiResponse<Product>>(PRODUCTS.UPDATE_STATUS(id), { status });
    return res.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(PRODUCTS.DELETE(id));
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CV GENERATOR
// ══════════════════════════════════════════════════════════════════════════════

export interface CvTemplate {
  _id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
}

export interface GeneratedCv {
  _id: string;
  templateId: string;
  templateName: string;
  fileName: string;
  downloadUrl?: string;
  createdAt: string;
}

export const cvGeneratorService = {
  getTemplates: async (): Promise<CvTemplate[]> => {
    const res = await api.get<ApiResponse<CvTemplate[]>>(CV_GENERATOR.TEMPLATES);
    return res.data.data ?? [];
  },

  listGeneratedCVs: async (): Promise<GeneratedCv[]> => {
    const res = await api.get<ApiResponse<GeneratedCv[]>>(CV_GENERATOR.LIST);
    return res.data.data ?? [];
  },

  previewCV: async (templateId: string): Promise<{ html: string }> => {
    const res = await api.post<ApiResponse<{ html: string }>>(CV_GENERATOR.PREVIEW, { templateId });
    return res.data.data;
  },

  generateCV: async (templateId: string, customizations?: Record<string, unknown>): Promise<GeneratedCv> => {
    const res = await api.post<ApiResponse<GeneratedCv>>(CV_GENERATOR.GENERATE, { templateId, customizations });
    return res.data.data;
  },

  regenerateCV: async (cvId: string, templateId: string): Promise<GeneratedCv> => {
    const res = await api.post<ApiResponse<GeneratedCv>>(CV_GENERATOR.REGENERATE(cvId), { templateId });
    return res.data.data;
  },

  getDownloadUrl: async (cvId: string): Promise<string> => {
    const res = await api.get<ApiResponse<{ url: string }>>(CV_GENERATOR.DOWNLOAD(cvId));
    return res.data.data.url;
  },
};
