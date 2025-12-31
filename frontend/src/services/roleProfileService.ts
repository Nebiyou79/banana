/* eslint-disable @typescript-eslint/no-explicit-any */
// services/roleProfileService.ts
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

// Import types from profileService
import type {
  Education,
  Experience,
  Certification,
  PortfolioProject,
  SocialLinks,
  CompanyInfo,
  Language,
  Award,
  VolunteerExperience
} from './profileService';

// ========== INTERFACES ==========

// Base response interface
interface BaseResponse {
  success: boolean;
  message?: string;
  code?: string;
}

// Candidate Profile Interfaces
export interface CandidateProfileResponse extends BaseResponse {
  data: {
    skills: string[];
    education: Education[];
    experience: Experience[];
    certifications: Certification[];
    languages: Language[];
    interests: string[];
    awards: Award[];
    volunteerExperience: VolunteerExperience[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  };
}

export interface CompanyProfileResponse extends BaseResponse {
  data: {
    companyInfo: CompanyInfo;
    specialties: string[];
    mission: string;
    values: string[];
    culture: string;
    portfolio: PortfolioProject[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  };
}

export interface FreelancerProfileResponse extends BaseResponse {
  data: {
    skills: string[];
    education: Education[];
    experience: Experience[];
    certifications: Certification[];
    portfolio: PortfolioProject[];
    languages: Language[];
    interests: string[];
    awards: Award[];
    volunteerExperience: VolunteerExperience[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  };
}

export interface OrganizationProfileResponse extends BaseResponse {
  data: {
    companyInfo: CompanyInfo;
    specialties: string[];
    mission: string;
    values: string[];
    culture: string;
    portfolio: PortfolioProject[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  };
}

export interface UpdateCandidateProfileData {
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  languages?: Language[];
  interests?: string[];
  awards?: Award[];
  volunteerExperience?: VolunteerExperience[];
}

export interface UpdateCompanyProfileData {
  companyInfo?: CompanyInfo;
  portfolio?: PortfolioProject[];
}

export interface UpdateFreelancerProfileData {
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  portfolio?: PortfolioProject[];
  languages?: Language[];
  interests?: string[];
  awards?: Award[];
  volunteerExperience?: VolunteerExperience[];
}

export interface UpdateOrganizationProfileData {
  companyInfo?: CompanyInfo;
  portfolio?: PortfolioProject[];
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: any[];
}

class RoleProfileServiceError extends Error {
  code?: string;
  errors?: any[];

  constructor(message: string, code?: string, errors?: any[]) {
    super(message);
    this.name = 'RoleProfileServiceError';
    this.code = code;
    this.errors = errors;
  }
}

const handleApiError = (error: any, defaultMessage: string): never => {
  console.error('🔴 Role Profile Service Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  if (error.response?.data) {
    const { message, code, errors } = error.response.data;
    const errorMessage = message || error.message || defaultMessage;

    handleError(errorMessage);
    throw new RoleProfileServiceError(errorMessage, code, errors);
  } else if (error.message) {
    handleError(error.message);
    throw new RoleProfileServiceError(error.message);
  } else {
    handleError(defaultMessage);
    throw new RoleProfileServiceError(defaultMessage);
  }
};

export const roleProfileService = {
  // ========== CANDIDATE PROFILE ENDPOINTS ==========

  getCandidateProfile: async (): Promise<{
    skills: string[];
    education: Education[];
    experience: Experience[];
    certifications: Certification[];
    languages: Language[];
    interests: string[];
    awards: Award[];
    volunteerExperience: VolunteerExperience[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.get<CandidateProfileResponse>('/role-profile/candidate');

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to fetch candidate profile',
          response.data.code
        );
      }

      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch candidate profile') as never;
    }
  },

  updateCandidateProfile: async (data: UpdateCandidateProfileData): Promise<{
    skills: string[];
    education: Education[];
    experience: Experience[];
    certifications: Certification[];
    languages: Language[];
    interests: string[];
    awards: Award[];
    volunteerExperience: VolunteerExperience[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.put<CandidateProfileResponse>('/role-profile/candidate', data);

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to update candidate profile',
          response.data.code
        );
      }

      handleSuccess('Candidate profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update candidate profile') as never;
    }
  },

  // ========== COMPANY PROFILE ENDPOINTS ==========

  getCompanyProfile: async (): Promise<{
    companyInfo: CompanyInfo;
    specialties: string[];
    mission: string;
    values: string[];
    culture: string;
    portfolio: PortfolioProject[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.get<CompanyProfileResponse>('/role-profile/company');

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to fetch company profile',
          response.data.code
        );
      }

      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch company profile') as never;
    }
  },

  updateCompanyProfile: async (data: UpdateCompanyProfileData): Promise<{
    companyInfo: CompanyInfo;
    specialties: string[];
    mission: string;
    values: string[];
    culture: string;
    portfolio: PortfolioProject[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.put<CompanyProfileResponse>('/role-profile/company', data);

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to update company profile',
          response.data.code
        );
      }

      handleSuccess('Company profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update company profile') as never;
    }
  },

  // ========== FREELANCER PROFILE ENDPOINTS ==========

  getFreelancerProfile: async (): Promise<{
    skills: string[];
    education: Education[];
    experience: Experience[];
    certifications: Certification[];
    portfolio: PortfolioProject[];
    languages: Language[];
    interests: string[];
    awards: Award[];
    volunteerExperience: VolunteerExperience[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.get<FreelancerProfileResponse>('/role-profile/freelancer');

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to fetch freelancer profile',
          response.data.code
        );
      }

      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch freelancer profile') as never;
    }
  },

  updateFreelancerProfile: async (data: UpdateFreelancerProfileData): Promise<{
    skills: string[];
    education: Education[];
    experience: Experience[];
    certifications: Certification[];
    portfolio: PortfolioProject[];
    languages: Language[];
    interests: string[];
    awards: Award[];
    volunteerExperience: VolunteerExperience[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.put<FreelancerProfileResponse>('/role-profile/freelancer', data);

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to update freelancer profile',
          response.data.code
        );
      }

      handleSuccess('Freelancer profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update freelancer profile') as never;
    }
  },

  // ========== ORGANIZATION PROFILE ENDPOINTS ==========

  getOrganizationProfile: async (): Promise<{
    companyInfo: CompanyInfo;
    specialties: string[];
    mission: string;
    values: string[];
    culture: string;
    portfolio: PortfolioProject[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.get<OrganizationProfileResponse>('/role-profile/organization');

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to fetch organization profile',
          response.data.code
        );
      }

      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch organization profile') as never;
    }
  },

  updateOrganizationProfile: async (data: UpdateOrganizationProfileData): Promise<{
    companyInfo: CompanyInfo;
    specialties: string[];
    mission: string;
    values: string[];
    culture: string;
    portfolio: PortfolioProject[];
    profileCompletion?: {
      percentage: number;
      completedSections: string[];
      requiredFields: string[];
      completedFields: string[];
    };
  }> => {
    try {
      const response = await api.put<OrganizationProfileResponse>('/role-profile/organization', data);

      if (!response.data.success || !response.data.data) {
        throw new RoleProfileServiceError(
          response.data.message || 'Failed to update organization profile',
          response.data.code
        );
      }

      handleSuccess('Organization profile updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update organization profile') as never;
    }
  },

  // ========== HELPER FUNCTIONS ==========

  getRoleDisplayName: (role: string): string => {
    const roleNames: Record<string, string> = {
      'candidate': 'Job Seeker',
      'company': 'Company',
      'freelancer': 'Freelancer',
      'organization': 'Organization',
      'admin': 'Administrator'
    };
    return roleNames[role] || role;
  },

  getEmploymentTypeLabel: (type: string): string => {
    const types: Record<string, string> = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'freelance': 'Freelance',
      'self-employed': 'Self Employed'
    };
    return types[type] || type;
  },

  getCompanySizeLabel: (size?: string): string => {
    const sizes: Record<string, string> = {
      '1-10': '1-10 employees',
      '11-50': '11-50 employees',
      '51-200': '51-200 employees',
      '201-500': '201-500 employees',
      '501-1000': '501-1000 employees',
      '1000+': '1000+ employees'
    };
    return size ? sizes[size] || size : 'Not specified';
  },

  getCompanyTypeLabel: (type?: string): string => {
    const types: Record<string, string> = {
      'startup': 'Startup',
      'small-business': 'Small Business',
      'medium-business': 'Medium Business',
      'large-enterprise': 'Large Enterprise',
      'multinational': 'Multinational',
      'non-profit': 'Non-Profit',
      'government': 'Government',
      'community': 'Community Organization',
      'ngo': 'NGO',
      'charity': 'Charity',
      'association': 'Association',
      'educational': 'Educational Institution',
      'healthcare': 'Healthcare',
      'other': 'Other'
    };
    return type ? types[type] || type : 'Not specified';
  },

  calculateExperienceYears: (experiences: Experience[]): number => {
    let totalYears = 0;

    experiences.forEach(exp => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.current || !exp.endDate ? new Date() : new Date(exp.endDate);
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      totalYears += Math.max(0, years);
    });

    return Math.round(totalYears * 10) / 10;
  },

  formatDateRange: (startDate: string, endDate?: string, current: boolean = false): string => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    const startStr = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (current) {
      return `${startStr} - Present`;
    } else if (end) {
      const endStr = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } else {
      return startStr;
    }
  },

  getDurationInMonths: (startDate: string, endDate?: string, current: boolean = false): number => {
    const start = new Date(startDate);
    const end = current || !endDate ? new Date() : new Date(endDate);

    const months = (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      (end.getDate() >= start.getDate() ? 0 : -1);

    return Math.max(0, months);
  },

  getDurationLabel: (months: number): string => {
    if (months < 12) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      } else {
        return `${years}.${remainingMonths} years`;
      }
    }
  },

  getProficiencyLabel: (proficiency: string): string => {
    const labels: Record<string, string> = {
      'basic': 'Basic',
      'conversational': 'Conversational',
      'professional': 'Professional',
      'fluent': 'Fluent',
      'native': 'Native'
    };

    return labels[proficiency] || proficiency;
  },

  getCertificationStatus: (expiryDate?: string): {
    status: 'active' | 'expired' | 'expiring-soon';
    daysUntilExpiry?: number;
  } => {
    if (!expiryDate) {
      return { status: 'active' };
    }

    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon', daysUntilExpiry };
    } else {
      return { status: 'active', daysUntilExpiry };
    }
  },

  getPortfolioCategoryLabel: (category?: string): string => {
    const categories: Record<string, string> = {
      'web-development': 'Web Development',
      'mobile-app': 'Mobile App',
      'ui-ux': 'UI/UX Design',
      'e-commerce': 'E-commerce',
      'saas': 'SaaS',
      'api': 'API Development',
      'consulting': 'Consulting',
      'training': 'Training',
      'other': 'Other'
    };

    return category ? categories[category] || category : 'Uncategorized';
  },

  getBudgetLabel: (budget?: number, currency: string = 'USD'): string => {
    if (!budget) return 'Not specified';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(budget);
  },

  getTeamSizeLabel: (teamSize?: number): string => {
    if (!teamSize) return 'Not specified';

    if (teamSize === 1) return 'Solo project';
    if (teamSize <= 5) return `Small team (${teamSize})`;
    if (teamSize <= 15) return `Medium team (${teamSize})`;
    return `Large team (${teamSize}+)`;
  },

  getSkillLevel: (yearsOfExperience: number): string => {
    if (yearsOfExperience < 1) return 'Beginner';
    if (yearsOfExperience < 3) return 'Intermediate';
    if (yearsOfExperience < 5) return 'Advanced';
    return 'Expert';
  },

  getIndustryLabel: (industry?: string): string => {
    const industries: Record<string, string> = {
      'technology': 'Technology',
      'healthcare': 'Healthcare',
      'finance': 'Finance',
      'education': 'Education',
      'manufacturing': 'Manufacturing',
      'retail': 'Retail',
      'hospitality': 'Hospitality',
      'construction': 'Construction',
      'transportation': 'Transportation',
      'energy': 'Energy',
      'entertainment': 'Entertainment',
      'agriculture': 'Agriculture'
    };

    return industry ? industries[industry] || industry : 'Not specified';
  }
};

export default roleProfileService;