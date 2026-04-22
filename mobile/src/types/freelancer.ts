/**
 * types/freelancer.ts
 * Single source of truth for all freelancer-related types on mobile.
 * Aligned to backend models: User.js, Freelancer.js, freelancerController.js
 */

// ─── Core Entities ────────────────────────────────────────────────────────────

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
  _id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
}

export interface FreelancerServiceItem {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  price?: number;
  priceType?: 'fixed' | 'hourly' | 'negotiable';
  deliveryTime?: string;
  isActive?: boolean;
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

// ─── Profile ──────────────────────────────────────────────────────────────────

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
  profileCompleted: boolean;
  verificationStatus: string;
  freelancerProfile?: {
    _id?: string;
    headline?: string;
    hourlyRate?: number;
    availability?: 'available' | 'not-available' | 'part-time';
    experienceLevel?: 'entry' | 'intermediate' | 'expert';
    englishProficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
    timezone?: string;
    specialization?: string[];
    services?: FreelancerServiceItem[];
    profileCompletion?: number;
    totalEarnings?: number;
    successRate?: number;
    ratings?: { average: number; count: number };
    verified?: boolean;
    profileViews?: number;
    socialLinks?: Record<string, string>;
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
  recentActivities: Activity[];
  profileStrength: { score: number; strengths: string[]; suggestions: string[] };
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

// ─── Stats ────────────────────────────────────────────────────────────────────

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

// ─── Form Data ────────────────────────────────────────────────────────────────

export interface PortfolioFormData {
  title: string;
  description: string;
  mediaUrls: string[];
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
}

export interface CertificationFormData {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  skills?: string[];
}

export interface ServiceFormData {
  title: string;
  description?: string;
  category?: string;
  price?: number;
  priceType?: 'fixed' | 'hourly' | 'negotiable';
  deliveryTime?: string;
  isActive?: boolean;
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
  socialLinks?: Record<string, string>;
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
}

// ─── Upload ───────────────────────────────────────────────────────────────────

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

// ─── Marketplace / Reviews ────────────────────────────────────────────────────

export interface FreelancerReview {
  _id: string;
  companyId?: { _id: string; name: string; logo?: string };
  rating: number;
  comment?: string;
  subRatings?: {
    communication?: number;
    quality?: number;
    deadlines?: number;
    professionalism?: number;
  };
  createdAt: string;
}

export interface ReviewsSummary {
  average: number;
  count: number;
  breakdown?: {
    communication: number;
    quality: number;
    deadlines: number;
    professionalism: number;
  };
}