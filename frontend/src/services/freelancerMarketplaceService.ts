// src/services/freelancerMarketplaceService.ts
import api from '@/lib/axios';

export type AvailabilityStatus = 'available' | 'not-available' | 'part-time';
export type ExperienceLevel    = 'entry' | 'intermediate' | 'expert';
export type MembershipTier     = 'basic' | 'professional' | 'premium';
export type SortOption = 'rating' | 'rate_asc' | 'rate_desc' | 'newest' | 'most_active';

export interface RatingBreakdown {
  communication: number; quality: number; deadlines: number; professionalism: number;
}
export interface FreelancerRatings { average: number; count: number; breakdown: RatingBreakdown; }
export interface FreelancerBadge { name: string; description?: string; earnedAt?: string; icon?: string; }
export interface FreelancerService { _id: string; title: string; description?: string; price?: number; deliveryTime?: number; category?: string; }
export interface FreelancerCertification { _id: string; name: string; issuer: string; issueDate: string; expiryDate?: string; credentialId?: string; credentialUrl?: string; description?: string; skills: string[]; }
export interface SocialLinks { linkedin?: string; twitter?: string; github?: string; facebook?: string; instagram?: string; telegram?: string; youtube?: string; whatsapp?: string; discord?: string; behance?: string; dribbble?: string; medium?: string; devto?: string; stackoverflow?: string; codepen?: string; gitlab?: string; tiktok?: string; }
export interface PortfolioItem { _id: string; title: string; description?: string; mediaUrls: string[]; projectUrl?: string; category?: string; technologies: string[]; client?: string; featured: boolean; createdAt: string; }
export interface ExperienceEntry { _id: string; company: string; position: string; startDate: string; endDate?: string; current: boolean; description?: string; skills: string[]; }
export interface EducationEntry { _id: string; institution: string; degree: string; field?: string; startDate: string; endDate?: string; current: boolean; description?: string; }

export interface FreelancerUserSnapshot { _id: string; name: string; avatar?: string; location?: string; gender?: string; age?: number; skills: string[]; }

export interface FreelancerListItem {
  _id: string;
  user: FreelancerUserSnapshot;
  profession?: string;          // ← NEW
  headline?: string;
  hourlyRate: number;
  availability: AvailabilityStatus;
  experienceLevel: ExperienceLevel;
  specialization: string[];
  ratings: FreelancerRatings;
  badges: FreelancerBadge[];
  featured: boolean;
  membership: MembershipTier;
  profileViews: number;
  responseTime: number;
  createdAt: string;
}

export interface FreelancerPublicUser extends FreelancerUserSnapshot {
  email: string; phone?: string; website?: string; socialLinks: SocialLinks;
  portfolio: PortfolioItem[]; experience: ExperienceEntry[]; education: EducationEntry[];
}

export interface FreelancerPublicProfile extends Omit<FreelancerListItem, 'user'> {
  user: FreelancerPublicUser;
  profession?: string;          // ← NEW
  bio?: string;
  englishProficiency?: string;
  timezone?: string;
  services: FreelancerService[];
  certifications: FreelancerCertification[];
  businessSize: string;
  workingHours?: { start: string; end: string; timezone: string };
  successRate: number;
  onTimeDelivery: number;
  totalEarnings: number;
  profileCompletion: number;
  isSaved: boolean;
  recentReviews: FreelancerReview[];
}

export interface FreelancerReview {
  _id: string;
  companyId: { _id: string; name: string; logo?: string };
  rating: number;
  comment?: string;
  subRatings?: { communication?: number; quality?: number; deadlines?: number; professionalism?: number; };
  createdAt: string;
}

export interface ReviewSummary { average: number; count: number; breakdown: RatingBreakdown; }

export interface FreelancerFilters {
  search?: string;
  skills?: string[];
  profession?: string;          // ← NEW
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  availability?: AvailabilityStatus;
  experienceLevel?: ExperienceLevel;
  location?: string;
  featured?: boolean;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

export interface Pagination { total: number; page: number; limit: number; totalPages: number; }
export interface ReviewSubmission { rating: number; comment?: string; subRatings?: { communication?: number; quality?: number; deadlines?: number; professionalism?: number; }; }

interface ListResponse { freelancers: FreelancerListItem[]; pagination: Pagination; }
interface ReviewsResponse { reviews: FreelancerReview[]; pagination: Pagination; summary: ReviewSummary; }
interface ShortlistToggleResponse { saved: boolean; shortlistCount: number; }

const freelancerMarketplaceService = {
  listFreelancers: async (filters: FreelancerFilters = {}): Promise<ListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (filters.search)           params.search          = filters.search;
    if (filters.skills?.length)   params.skills          = filters.skills.join(',');
    if (filters.profession)       params.profession      = filters.profession;  // ← NEW
    if (filters.minRate   != null) params.minRate        = filters.minRate;
    if (filters.maxRate   != null) params.maxRate        = filters.maxRate;
    if (filters.minRating != null) params.minRating      = filters.minRating;
    if (filters.availability)     params.availability    = filters.availability;
    if (filters.experienceLevel)  params.experienceLevel = filters.experienceLevel;
    if (filters.location)         params.location        = filters.location;
    if (filters.featured)         params.featured        = true;
    if (filters.sortBy)           params.sortBy          = filters.sortBy;
    params.page  = filters.page  ?? 1;
    params.limit = filters.limit ?? 12;
    const res = await api.get('/freelancers', { params });
    return res.data.data as ListResponse;
  },

  /** GET /api/v1/freelancers/professions — master profession list for dropdowns */
  getProfessions: async (): Promise<string[]> => {
    const res = await api.get('/freelancers/professions');
    return res.data.data.professions as string[];
  },

  getFreelancerProfile: async (id: string): Promise<FreelancerPublicProfile> => {
    const res = await api.get(`/freelancers/${id}`);
    return res.data.data as FreelancerPublicProfile;
  },

  getReviews: async (freelancerId: string, page = 1, limit = 10) => {
    const res = await api.get(`/freelancers/${freelancerId}/reviews`, { params: { page, limit } });
    return res.data.data as ReviewsResponse;
  },

  submitReview: async (freelancerId: string, data: ReviewSubmission): Promise<FreelancerReview> => {
    const res = await api.post(`/freelancers/${freelancerId}/reviews`, data);
    return res.data.data as FreelancerReview;
  },

  toggleShortlist: async (freelancerId: string): Promise<ShortlistToggleResponse> => {
    const res = await api.post(`/company/shortlist/${freelancerId}`);
    return res.data.data as ShortlistToggleResponse;
  },

  getShortlist: async (page = 1, limit = 12): Promise<ListResponse> => {
    const res = await api.get('/company/shortlist', { params: { page, limit } });
    return res.data.data as ListResponse;
  },
};

export default freelancerMarketplaceService;