/**
 * mobile/src/services/freelancerMarketplaceService.ts
 *
 * Mirrors backend routes:
 *   GET  /api/v1/freelancers                  — list with filters
 *   GET  /api/v1/freelancers/professions       — profession list
 *   GET  /api/v1/freelancers/:id               — public profile
 *   GET  /api/v1/freelancers/:id/reviews       — paginated reviews
 *   POST /api/v1/freelancers/:id/reviews       — submit review (company/org)
 *   POST /api/v1/company/shortlist/:id         — toggle shortlist (company/org)
 *   GET  /api/v1/company/shortlist             — get shortlist (company/org)
 */

import apiGet  from '../lib/httpClient';
import apiPost from '../lib/httpClient';
import { FREELANCERS, SHORTLIST } from '../constants/api';

// ─── Enums / Literals ─────────────────────────────────────────────────────────

export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'expert';
export type SortOption =
  | 'rating'
  | 'rate_asc'
  | 'rate_desc'
  | 'newest'
  | 'experience';

// ─── Shared sub-types ─────────────────────────────────────────────────────────

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface RatingBreakdown {
  communication?: number;
  quality?: number;
  deadlines?: number;
  professionalism?: number;
}

export interface WorkingHours {
  start: string;
  end: string;
  timezone: string;
}

export interface FreelancerService {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  deliveryTime?: string;
}

export interface FreelancerCertification {
  _id: string;
  name: string;
  issuedBy: string;
  issuedDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface PortfolioItem {
  _id: string;
  title: string;
  description?: string;
  mediaUrls: string[];
  projectUrl?: string;
  category?: string;
  technologies: string[];
  client?: string;
  featured: boolean;
  createdAt: string;
}

export interface FreelancerReview {
  _id: string;
  companyId: { _id: string; name: string; logo?: string };
  rating: number;
  comment?: string;
  subRatings?: RatingBreakdown;
  createdAt: string;
}

// ─── List item (returned from GET /freelancers) ───────────────────────────────

export interface FreelancerListItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
    location?: string;
    skills: string[];
  };
  profession?: string;
  title?: string;
  experienceLevel: ExperienceLevel;
  availability: AvailabilityStatus;
  hourlyRate?: number;
  currency?: string;
  skills: string[];
  ratings: { average: number; count: number; breakdown: RatingBreakdown };
  featured: boolean;
  isSaved?: boolean;
  completedProjects: number;
  createdAt: string;
}

// ─── Full public profile (returned from GET /freelancers/:id) ─────────────────

export interface FreelancerPublicProfile extends Omit<FreelancerListItem, 'user'> {
  user: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    location?: string;
    gender?: string;
    age?: number;
    website?: string;
    skills: string[];
    socialLinks: SocialLinks;
    portfolio: PortfolioItem[];
  };
  bio?: string;
  englishProficiency?: string;
  timezone?: string;
  services: FreelancerService[];
  certifications: FreelancerCertification[];
  businessSize?: string;
  workingHours?: WorkingHours;
  successRate: number;
  onTimeDelivery: number;
  totalEarnings?: number;
  profileCompletion: number;
  isSaved: boolean;
  recentReviews: FreelancerReview[];
}

// ─── Reviews response ─────────────────────────────────────────────────────────

export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: RatingBreakdown;
}

export interface ReviewsResponse {
  reviews: FreelancerReview[];
  pagination: Pagination;
  summary: ReviewSummary;
}

// ─── List / pagination ────────────────────────────────────────────────────────

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListResponse {
  freelancers: FreelancerListItem[];
  pagination: Pagination;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface FreelancerFilters {
  search?: string;
  skills?: string[];
  profession?: string;
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

// ─── Review submission ────────────────────────────────────────────────────────

export interface ReviewSubmission {
  rating: number; // 1–5
  comment?: string;
  subRatings?: RatingBreakdown;
}

// ─── Shortlist ────────────────────────────────────────────────────────────────

export interface ShortlistToggleResponse {
  saved: boolean;
  message: string;
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

const normaliseList = (data: any): ListResponse => {
  const inner = data?.data ?? data;
  return {
    freelancers: inner?.freelancers ?? inner ?? [],
    pagination: inner?.pagination ?? { total: 0, page: 1, limit: 12, totalPages: 1 },
  };
};

const normaliseProfile = (data: any): FreelancerPublicProfile => {
  const inner = data?.data ?? data;
  return inner?.freelancer ?? inner;
};

const normaliseReviews = (data: any): ReviewsResponse => {
  const inner = data?.data ?? data;
  return {
    reviews: inner?.reviews ?? [],
    pagination: inner?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 },
    summary: inner?.summary ?? { average: 0, count: 0, breakdown: {} },
  };
};

// ─── Service ──────────────────────────────────────────────────────────────────

const freelancerMarketplaceService = {
  /**
   * GET /api/v1/freelancers
   * Public — Company / Org can browse freelancers.
   */
  async listFreelancers(filters: FreelancerFilters = {}): Promise<ListResponse> {
    const params: Record<string, any> = { ...filters };
    if (Array.isArray(params.skills)) {
      params.skills = params.skills.join(',');
    }
    params.page = params.page ?? 1;
    params.limit = params.limit ?? 12;
    const res = await apiGet<any>(FREELANCERS.LIST, { params });
    return normaliseList(res.data);
  },

  /**
   * GET /api/v1/freelancers/professions
   * Returns master list of professions for filter dropdowns.
   */
  async getProfessions(): Promise<string[]> {
    const res = await apiGet<any>('/freelancers/professions');
    const inner = res.data?.data ?? res.data;
    return inner?.professions ?? inner ?? [];
  },

  /**
   * GET /api/v1/freelancers/:id
   * Full public profile of a single freelancer.
   */
  async getFreelancerProfile(id: string): Promise<FreelancerPublicProfile> {
    const res = await apiGet<any>(FREELANCERS.DETAIL(id));
    return normaliseProfile(res.data);
  },

  /**
   * GET /api/v1/freelancers/:id/reviews?page=&limit=
   * Paginated reviews for a freelancer.
   */
  async getReviews(freelancerId: string, page = 1, limit = 10): Promise<ReviewsResponse> {
    const res = await apiGet<any>(FREELANCERS.REVIEWS(freelancerId), {
      params: { page, limit },
    });
    return normaliseReviews(res.data);
  },

  /**
   * POST /api/v1/freelancers/:id/reviews
   * Company / Org submits a review for a freelancer.
   */
  async submitReview(
    freelancerId: string,
    data: ReviewSubmission,
  ): Promise<FreelancerReview> {
    const res = await apiPost<any>(FREELANCERS.SUBMIT_REVIEW(freelancerId), data);
    const inner = res.data?.data ?? res.data;
    return inner?.review ?? inner;
  },

  /**
   * POST /api/v1/company/shortlist/:freelancerId
   * Toggles a freelancer in/out of the company's shortlist.
   * Returns { saved: boolean }
   */
  async toggleShortlist(freelancerId: string): Promise<ShortlistToggleResponse> {
    const res = await apiPost<any>(SHORTLIST.TOGGLE(freelancerId), {});
    const inner = res.data?.data ?? res.data;
    return inner ?? { saved: false, message: '' };
  },

  /**
   * GET /api/v1/company/shortlist?page=&limit=
   * Returns the company's saved freelancer list.
   */
  async getShortlist(page = 1, limit = 12): Promise<ListResponse> {
    const res = await apiGet<any>(SHORTLIST.LIST, { params: { page, limit } });
    return normaliseList(res.data);
  },
};

export default freelancerMarketplaceService;
