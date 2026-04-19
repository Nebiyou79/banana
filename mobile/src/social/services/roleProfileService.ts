import api from '../../lib/api';
import type {
  Certification,
  CompanyInfo,
  Education,
  Experience,
  PortfolioItem,
  Skill,
  UserRole,
} from '../types';

/**
 * Role-specific profile data. These endpoints live under /profile/<role>
 * and return only the subset of the Profile relevant to that role.
 */

export interface CandidateProfileData {
  skills?: (string | Skill)[];
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  languages?: { language: string; proficiency: string }[];
  interests?: string[];
  awards?: { title: string; issuer: string; date?: string; description?: string }[];
  volunteerExperience?: {
    organization: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
}

export interface FreelancerProfileData extends CandidateProfileData {
  portfolio?: PortfolioItem[];
}

export interface CompanyProfileData {
  companyInfo?: CompanyInfo;
  portfolio?: PortfolioItem[];
}

export interface OrganizationProfileData {
  companyInfo?: CompanyInfo;
  portfolio?: PortfolioItem[];
  mission?: string;
  focusAreas?: string[];
}

export type RoleProfileData =
  | CandidateProfileData
  | FreelancerProfileData
  | CompanyProfileData
  | OrganizationProfileData;

export const roleProfileService = {
  // Candidate
  getCandidateProfile: () => api.get('/profile/candidate'),
  updateCandidateProfile: (data: CandidateProfileData) =>
    api.put('/profile/candidate', data),

  // Freelancer
  getFreelancerProfile: () => api.get('/profile/freelancer'),
  updateFreelancerProfile: (data: FreelancerProfileData) =>
    api.put('/profile/freelancer', data),

  // Company
  getCompanyProfile: () => api.get('/profile/company'),
  updateCompanyProfile: (data: CompanyProfileData) =>
    api.put('/profile/company', data),

  // Organization
  getOrganizationProfile: () => api.get('/profile/organization'),
  updateOrganizationProfile: (data: OrganizationProfileData) =>
    api.put('/profile/organization', data),

  // Generic dispatcher — pick the right endpoint by role
  getByRole: (role: UserRole) => {
    switch (role) {
      case 'candidate':
        return roleProfileService.getCandidateProfile();
      case 'freelancer':
        return roleProfileService.getFreelancerProfile();
      case 'company':
        return roleProfileService.getCompanyProfile();
      case 'organization':
        return roleProfileService.getOrganizationProfile();
    }
  },

  updateByRole: (role: UserRole, data: RoleProfileData) => {
    switch (role) {
      case 'candidate':
        return roleProfileService.updateCandidateProfile(
          data as CandidateProfileData
        );
      case 'freelancer':
        return roleProfileService.updateFreelancerProfile(
          data as FreelancerProfileData
        );
      case 'company':
        return roleProfileService.updateCompanyProfile(
          data as CompanyProfileData
        );
      case 'organization':
        return roleProfileService.updateOrganizationProfile(
          data as OrganizationProfileData
        );
    }
  },
};

export default roleProfileService;
