import { apiGet, apiPut } from '../lib/api';
import { ROLE_PROFILE } from '../constants/api';

// ─── Shared sub-types ─────────────────────────────────────────────────────────

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface Experience {
  position: string;
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  employmentType?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Language {
  language: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
}

export interface Award {
  title: string;
  issuer: string;
  date?: string;
  description?: string;
}

export interface VolunteerExperience {
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface PortfolioProject {
  title: string;
  description?: string;
  url?: string;
  technologies?: string[];
  budget?: number;
  duration?: string;
  client?: string;
  completionDate?: string;
}

export interface CompanyInfo {
  companyName?: string;
  industry?: string;
  companySize?: string;
  companyType?: string;
  founded?: string;
  registrationNumber?: string;
  taxId?: string;
  description?: string;
  headquarters?: string;
  website?: string;
}

export interface ProfileCompletionInfo {
  percentage: number;
  completedSections: string[];
  requiredFields: string[];
  completedFields: string[];
}

// ─── Role-specific response types ─────────────────────────────────────────────

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

export interface CompanyRoleProfile {
  companyInfo: CompanyInfo;
  specialties: string[];
  mission: string;
  values: string[];
  culture: string;
  portfolio: PortfolioProject[];
  profileCompletion?: ProfileCompletionInfo;
}

export interface OrganizationRoleProfile {
  companyInfo: CompanyInfo;
  specialties: string[];
  mission: string;
  values: string[];
  culture: string;
  portfolio: PortfolioProject[];
  profileCompletion?: ProfileCompletionInfo;
}

// ─── Update payload types ─────────────────────────────────────────────────────

export type UpdateCandidateRoleProfileData = Partial<Omit<CandidateRoleProfile, 'profileCompletion'>>;
export type UpdateFreelancerRoleProfileData = Partial<Omit<FreelancerRoleProfile, 'profileCompletion'>>;
export type UpdateCompanyRoleProfileData = Partial<Pick<CompanyRoleProfile, 'companyInfo' | 'portfolio' | 'specialties' | 'mission' | 'values' | 'culture'>>;
export type UpdateOrganizationRoleProfileData = Partial<Pick<OrganizationRoleProfile, 'companyInfo' | 'portfolio' | 'specialties' | 'mission' | 'values' | 'culture'>>;

// ─── Service ──────────────────────────────────────────────────────────────────

export const roleProfileService = {
  // ── Candidate ──────────────────────────────────────────────────────────────
  getCandidateProfile: async (): Promise<CandidateRoleProfile> => {
    const res = await apiGet<{ success: boolean; data: CandidateRoleProfile }>(ROLE_PROFILE.CANDIDATE);
    return res.data.data;
  },

  updateCandidateProfile: async (data: UpdateCandidateRoleProfileData): Promise<CandidateRoleProfile> => {
    const res = await apiPut<{ success: boolean; data: CandidateRoleProfile }>(ROLE_PROFILE.CANDIDATE, data);
    return res.data.data;
  },

  // ── Freelancer ─────────────────────────────────────────────────────────────
  getFreelancerProfile: async (): Promise<FreelancerRoleProfile> => {
    const res = await apiGet<{ success: boolean; data: FreelancerRoleProfile }>(ROLE_PROFILE.FREELANCER);
    return res.data.data;
  },

  updateFreelancerProfile: async (data: UpdateFreelancerRoleProfileData): Promise<FreelancerRoleProfile> => {
    const res = await apiPut<{ success: boolean; data: FreelancerRoleProfile }>(ROLE_PROFILE.FREELANCER, data);
    return res.data.data;
  },

  // ── Company ────────────────────────────────────────────────────────────────
  getCompanyProfile: async (): Promise<CompanyRoleProfile> => {
    const res = await apiGet<{ success: boolean; data: CompanyRoleProfile }>(ROLE_PROFILE.COMPANY);
    return res.data.data;
  },

  updateCompanyProfile: async (data: UpdateCompanyRoleProfileData): Promise<CompanyRoleProfile> => {
    const res = await apiPut<{ success: boolean; data: CompanyRoleProfile }>(ROLE_PROFILE.COMPANY, data);
    return res.data.data;
  },

  // ── Organization ───────────────────────────────────────────────────────────
  getOrganizationProfile: async (): Promise<OrganizationRoleProfile> => {
    const res = await apiGet<{ success: boolean; data: OrganizationRoleProfile }>(ROLE_PROFILE.ORGANIZATION);
    return res.data.data;
  },

  updateOrganizationProfile: async (data: UpdateOrganizationRoleProfileData): Promise<OrganizationRoleProfile> => {
    const res = await apiPut<{ success: boolean; data: OrganizationRoleProfile }>(ROLE_PROFILE.ORGANIZATION, data);
    return res.data.data;
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  calculateExperienceYears: (experiences: Experience[]): number => {
    let total = 0;
    experiences.forEach((exp) => {
      const start = new Date(exp.startDate);
      const end = exp.current || !exp.endDate ? new Date() : new Date(exp.endDate);
      total += Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    });
    return Math.round(total * 10) / 10;
  },

  formatDateRange: (startDate: string, endDate?: string, current?: boolean): string => {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${fmt(startDate)} – ${current || !endDate ? 'Present' : fmt(endDate)}`;
  },

  getCompanySizeLabel: (size?: string): string => {
    const map: Record<string, string> = {
      '1-10': '1–10 employees', '11-50': '11–50', '51-200': '51–200',
      '201-500': '201–500', '501-1000': '501–1,000', '1000+': '1,000+',
    };
    return size ? map[size] ?? size : 'Not specified';
  },
};
