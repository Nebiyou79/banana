/**
 * roleProfileService.ts
 * Matches backend: roleProfileController.js + roleProfileRoutes.js
 * Endpoints: GET/PUT /role-profile/{candidate|company|freelancer|organization}
 */
import { apiGet, apiPut } from '../lib/api';
import { ROLE_PROFILE } from '../constants/api';
import type { Education, Experience, Certification, PortfolioProject, Language, CompanyInfo } from './profileService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Award {
  _id?: string;
  title: string;
  issuer: string;
  date?: string;
  description?: string;
  url?: string;
}

export interface VolunteerExperience {
  _id?: string;
  organization: string;
  role: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description?: string;
  hoursPerWeek?: number;
  totalHours?: number;
}

export interface ProfileCompletionInfo {
  percentage: number;
  completedSections: string[];
  requiredFields: string[];
  completedFields: string[];
}

// Candidate
export interface CandidateRoleProfile {
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  languages: Language[];
  interests: string[];
  awards: Award[];
  volunteerExperience: VolunteerExperience[];
  profileCompletion?: ProfileCompletionInfo;
}

// Freelancer
export interface FreelancerRoleProfile {
  skills: string[];
  education: Education[];
  experience: Experience[];
  certifications: Certification[];
  portfolio: PortfolioProject[];
  languages: Language[];
  interests: string[];
  awards: Award[];
  volunteerExperience: VolunteerExperience[];
  profileCompletion?: ProfileCompletionInfo;
}

// Company
export interface CompanyRoleProfile {
  companyInfo: CompanyInfo;
  specialties: string[];
  mission: string;
  values: string[];
  culture: string;
  portfolio: PortfolioProject[];
  profileCompletion?: ProfileCompletionInfo;
}

// Organization
export interface OrganizationRoleProfile {
  companyInfo: CompanyInfo;
  specialties: string[];
  mission: string;
  values: string[];
  culture: string;
  portfolio: PortfolioProject[];
  profileCompletion?: ProfileCompletionInfo;
}

// Update types
export type UpdateCandidateData = Partial<Omit<CandidateRoleProfile, 'profileCompletion'>>;
export type UpdateFreelancerData = Partial<Omit<FreelancerRoleProfile, 'profileCompletion'>>;
export type UpdateCompanyData = Partial<Omit<CompanyRoleProfile, 'profileCompletion'>>;
export type UpdateOrganizationData = Partial<Omit<OrganizationRoleProfile, 'profileCompletion'>>;

// ─── API Response wrapper ─────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const roleProfileService = {
  // ── Candidate ──────────────────────────────────────────────────────────────

  getCandidateProfile: async (): Promise<CandidateRoleProfile> => {
    const res = await apiGet<ApiResponse<CandidateRoleProfile>>(ROLE_PROFILE.CANDIDATE);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to fetch candidate profile');
    }
    return res.data.data;
  },

  updateCandidateProfile: async (data: UpdateCandidateData): Promise<CandidateRoleProfile> => {
    const res = await apiPut<ApiResponse<CandidateRoleProfile>>(ROLE_PROFILE.CANDIDATE, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to update candidate profile');
    }
    return res.data.data;
  },

  // ── Freelancer ─────────────────────────────────────────────────────────────

  getFreelancerProfile: async (): Promise<FreelancerRoleProfile> => {
    const res = await apiGet<ApiResponse<FreelancerRoleProfile>>(ROLE_PROFILE.FREELANCER);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to fetch freelancer profile');
    }
    return res.data.data;
  },

  updateFreelancerProfile: async (data: UpdateFreelancerData): Promise<FreelancerRoleProfile> => {
    const res = await apiPut<ApiResponse<FreelancerRoleProfile>>(ROLE_PROFILE.FREELANCER, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to update freelancer profile');
    }
    return res.data.data;
  },

  // ── Company ────────────────────────────────────────────────────────────────

  getCompanyProfile: async (): Promise<CompanyRoleProfile> => {
    const res = await apiGet<ApiResponse<CompanyRoleProfile>>(ROLE_PROFILE.COMPANY);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to fetch company profile');
    }
    return res.data.data;
  },

  updateCompanyProfile: async (data: UpdateCompanyData): Promise<CompanyRoleProfile> => {
    const res = await apiPut<ApiResponse<CompanyRoleProfile>>(ROLE_PROFILE.COMPANY, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to update company profile');
    }
    return res.data.data;
  },

  // ── Organization ───────────────────────────────────────────────────────────

  getOrganizationProfile: async (): Promise<OrganizationRoleProfile> => {
    const res = await apiGet<ApiResponse<OrganizationRoleProfile>>(ROLE_PROFILE.ORGANIZATION);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to fetch organization profile');
    }
    return res.data.data;
  },

  updateOrganizationProfile: async (data: UpdateOrganizationData): Promise<OrganizationRoleProfile> => {
    const res = await apiPut<ApiResponse<OrganizationRoleProfile>>(ROLE_PROFILE.ORGANIZATION, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? 'Failed to update organization profile');
    }
    return res.data.data;
  },

  // ── Helpers ────────────────────────────────────────────────────────────────

  formatDateRange: (start?: string, end?: string, current?: boolean): string => {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!start) return '';
    return `${fmt(start)} – ${current || !end ? 'Present' : fmt(end)}`;
  },

  validateEducation: (edu: Partial<Education>): string | null => {
    if (!edu.institution?.trim()) return 'Institution is required';
    if (!edu.degree?.trim()) return 'Degree is required';
    if (!edu.startDate) return 'Start date is required';
    return null;
  },

  validateExperience: (exp: Partial<Experience>): string | null => {
    if (!exp.company?.trim()) return 'Company is required';
    if (!exp.position?.trim()) return 'Position is required';
    if (!exp.startDate) return 'Start date is required';
    return null;
  },

  validateCertification: (cert: Partial<Certification>): string | null => {
    if (!cert.name?.trim()) return 'Name is required';
    if (!cert.issuer?.trim()) return 'Issuer is required';
    if (!cert.issueDate) return 'Issue date is required';
    return null;
  },
};
