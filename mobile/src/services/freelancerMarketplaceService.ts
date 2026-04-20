/**
 * mobile/src/services/freelancerMarketplaceService.ts
 *
 * ROOT CAUSE FIX (both bugs):
 *
 * The original file imported:
 *   import apiGet  from '../lib/httpClient';
 *   import apiPost from '../lib/httpClient';
 *
 * Both names resolve to the SAME default export (the axios instance).
 * A bare axios instance call — axios(url) or api(url) — defaults to GET.
 * So EVERY call, including toggleShortlist and submitReview, was firing
 * a GET request, which is why:
 *   - Shortlist toggle → GET /company/shortlist/:id → 404
 *   - Submit review    → GET /freelancers/:id/reviews → returns list, not create
 *
 * FIX: Import the single api instance and call api.get() / api.post()
 * explicitly. This guarantees the correct HTTP verb every time.
 */

import api from '../lib/httpClient'; // single axios instance

// ─── Enums / Literals ─────────────────────────────────────────────────────────

export type AvailabilityStatus = 'available' | 'busy' | 'unavailable' | 'part-time' | 'not-available';
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'intermediate' | 'senior' | 'expert';
export type MembershipTier = 'basic' | 'professional' | 'premium';
export type SortOption =
  | 'rating'
  | 'rate_asc'
  | 'rate_desc'
  | 'newest'
  | 'most_active'
  | 'experience';

// ─── Sub-types ────────────────────────────────────────────────────────────────

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
  category?: string;
}

export interface FreelancerCertification {
  _id: string;
  name: string;
  issuedBy?: string;
  issuer?: string;
  issuedDate?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
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

export interface FreelancerBadge {
  name: string;
  description?: string;
  earnedAt?: string;
  icon?: string;
}

export interface FreelancerReview {
  _id: string;
  companyId: { _id: string; name: string; logo?: string };
  rating: number;
  comment?: string;
  subRatings?: RatingBreakdown;
  createdAt: string;
}

// ─── List item ────────────────────────────────────────────────────────────────

export interface FreelancerUserSnapshot {
  _id: string;
  name: string;
  avatar?: string;
  location?: string;
  gender?: string;
  age?: number;
  skills: string[];
}

export interface FreelancerListItem {
  _id: string;
  user: FreelancerUserSnapshot;
  profession?: string;
  title?: string;
  headline?: string;
  hourlyRate?: number;
  currency?: string;
  availability: AvailabilityStatus;
  experienceLevel: ExperienceLevel;
  specialization?: string[];
  skills?: string[];
  ratings: { average: number; count: number; breakdown: RatingBreakdown };
  badges?: FreelancerBadge[];
  featured: boolean;
  membership?: MembershipTier;
  profileViews?: number;
  responseTime?: number;
  completedProjects?: number;
  isSaved?: boolean;
  createdAt: string;
}

// ─── Full public profile ──────────────────────────────────────────────────────

export interface FreelancerPublicUser extends FreelancerUserSnapshot {
  email?: string;
  phone?: string;
  website?: string;
  socialLinks: SocialLinks;
  portfolio: PortfolioItem[];
  experience?: any[];
  education?: any[];
}

export interface FreelancerPublicProfile extends Omit<FreelancerListItem, 'user'> {
  user: FreelancerPublicUser;
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

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewSummary {
  average: number;
  count: number;
  breakdown: RatingBreakdown;
}

export interface ReviewSubmission {
  rating: number;
  comment?: string;
  subRatings?: RatingBreakdown;
}

export interface ReviewsResponse {
  reviews: FreelancerReview[];
  pagination: Pagination;
  summary: ReviewSummary;
}

// ─── Pagination / List ────────────────────────────────────────────────────────

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

// ─── Filters ─────────────────────────────────────────────────────────────────

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

// ─── Shortlist ────────────────────────────────────────────────────────────────

export interface ShortlistToggleResponse {
  saved: boolean;
  message?: string;
  shortlistCount?: number;
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

// ─── API endpoint constants ───────────────────────────────────────────────────
// Defined inline to avoid depending on a constants file that may differ.

const ENDPOINTS = {
  LIST:              '/freelancers',
  PROFESSIONS:       '/freelancers/professions',
  DETAIL:            (id: string) => `/freelancers/${id}`,
  REVIEWS:           (id: string) => `/freelancers/${id}/reviews`,
  SHORTLIST_TOGGLE:  (id: string) => `/company/shortlist/${id}`,
  SHORTLIST_LIST:    '/company/shortlist',
} as const;

// ─── Service ──────────────────────────────────────────────────────────────────

const freelancerMarketplaceService = {

  /**
   * GET /api/v1/freelancers
   */
  async listFreelancers(filters: FreelancerFilters = {}): Promise<ListResponse> {
    const params: Record<string, any> = { ...filters };
    if (Array.isArray(params.skills)) {
      params.skills = params.skills.join(',');
    }
    params.page  = params.page  ?? 1;
    params.limit = params.limit ?? 12;

    // FIX: explicit .get()
    const res = await api.get<any>(ENDPOINTS.LIST, { params });
    return normaliseList(res.data);
  },

  /**
   * GET /api/v1/freelancers/professions
   */
  async getProfessions(): Promise<string[]> {
    // FIX: explicit .get()
    const res = await api.get<any>(ENDPOINTS.PROFESSIONS);
    const inner = res.data?.data ?? res.data;
    return inner?.professions ?? inner ?? [];
  },

  /**
   * GET /api/v1/freelancers/:id
   */
  async getFreelancerProfile(id: string): Promise<FreelancerPublicProfile> {
    // FIX: explicit .get()
    const res = await api.get<any>(ENDPOINTS.DETAIL(id));
    return normaliseProfile(res.data);
  },

  /**
   * GET /api/v1/freelancers/:id/reviews?page=&limit=
   */
  async getReviews(freelancerId: string, page = 1, limit = 10): Promise<ReviewsResponse> {
    // FIX: explicit .get()
    const res = await api.get<any>(ENDPOINTS.REVIEWS(freelancerId), {
      params: { page, limit },
    });
    return normaliseReviews(res.data);
  },

  /**
   * POST /api/v1/freelancers/:id/reviews
   *
   * FIX: was silently calling GET because apiPost === apiGet (same import alias).
   * Now explicitly uses api.post() so the backend actually creates the review.
   */
  async submitReview(
    freelancerId: string,
    data: ReviewSubmission,
  ): Promise<FreelancerReview> {
    // FIX: explicit .post() — this was the root cause of "review submitted but not showing"
    const res = await api.post<any>(ENDPOINTS.REVIEWS(freelancerId), data);
    const inner = res.data?.data ?? res.data;
    return inner?.review ?? inner;
  },

  /**
   * POST /api/v1/company/shortlist/:freelancerId  (toggle — no GET variant exists)
   *
   * FIX: was silently calling GET /company/shortlist/:id → 404
   * because apiPost was the same function as apiGet.
   * Now explicitly uses api.post() so the backend receives a POST.
   */
  async toggleShortlist(freelancerId: string): Promise<ShortlistToggleResponse> {
    // FIX: explicit .post() — this was the root cause of the 404
    const res = await api.post<any>(ENDPOINTS.SHORTLIST_TOGGLE(freelancerId), {});
    const inner = res.data?.data ?? res.data;
    return inner ?? { saved: false, message: '' };
  },

  /**
   * GET /api/v1/company/shortlist?page=&limit=
   */
  async getShortlist(page = 1, limit = 12): Promise<ListResponse> {
    // FIX: explicit .get()
    const res = await api.get<any>(ENDPOINTS.SHORTLIST_LIST, {
      params: { page, limit },
    });
    return normaliseList(res.data);
  },
};

export default freelancerMarketplaceService;