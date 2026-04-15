// ─── Freelancer Domain Types ─────────────────────────────────────────────────

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

export interface ServiceFormData {
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
  description?: string;
  skills?: string[];
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
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  age?: number;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'expert';
    yearsOfExperience: number;
  }>;
  experience?: Array<{
    _id?: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>;
  education?: Array<{
    _id?: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
  }>;
  portfolio: PortfolioItem[];
  certifications?: FreelancerCertification[];
  socialLinks?: Record<string, string>;
  profileCompleted: boolean;
  verificationStatus: string;
  freelancerProfile?: {
    headline?: string;
    hourlyRate?: number;
    availability?: 'available' | 'not-available' | 'part-time';
    experienceLevel?: 'entry' | 'intermediate' | 'expert';
    englishProficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
    timezone?: string;
    specialization?: string[];
    services?: FreelancerServiceItem[];
    profileCompletion: number;
    totalEarnings: number;
    successRate: number;
    ratings: { average: number; count: number };
    verified?: boolean;
    profileViews?: number;
  };
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
  };
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  profileStrength: {
    score: number;
    strengths: string[];
    suggestions: string[];
  };
}
