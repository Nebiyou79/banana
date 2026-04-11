export const ROLES = {
  CANDIDATE: 'candidate',
  FREELANCER: 'freelancer',
  COMPANY: 'company',
  ORGANIZATION: 'organization',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface RoleConfig {
  label: string;
  description: string;
  icon: string;       // Ionicons name
  emoji: string;
  dashboardRoute: string;
  primaryColor: string;
  accentColor: string;
}

export const roleConfig: Record<Role, RoleConfig> = {
  candidate: {
    label: 'Job Seeker',
    description: 'Find jobs, apply, and grow your career',
    icon: 'briefcase-outline',
    emoji: '🎯',
    dashboardRoute: 'CandidateDashboard',
    primaryColor: '#2563EB',
    accentColor: '#DBEAFE',
  },
  freelancer: {
    label: 'Freelancer',
    description: 'Showcase your skills and find freelance work',
    icon: 'laptop-outline',
    emoji: '💼',
    dashboardRoute: 'FreelancerDashboard',
    primaryColor: '#7C3AED',
    accentColor: '#EDE9FE',
  },
  company: {
    label: 'Company',
    description: 'Post jobs, manage applications, and hire talent',
    icon: 'business-outline',
    emoji: '🏢',
    dashboardRoute: 'CompanyDashboard',
    primaryColor: '#059669',
    accentColor: '#D1FAE5',
  },
  organization: {
    label: 'Organization',
    description: 'Post tenders, manage proposals, and find professionals',
    icon: 'people-outline',
    emoji: '🏛️',
    dashboardRoute: 'OrganizationDashboard',
    primaryColor: '#DC2626',
    accentColor: '#FEE2E2',
  },
  admin: {
    label: 'Admin',
    description: 'Manage the platform',
    icon: 'shield-outline',
    emoji: '🛡️',
    dashboardRoute: 'AdminDashboard',
    primaryColor: '#374151',
    accentColor: '#F3F4F6',
  },
};

export const getDisplayRole = (role: string): string => {
  return roleConfig[role as Role]?.label ?? role;
};