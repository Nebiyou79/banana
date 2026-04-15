// src/constants/roles.ts

export const ROLES = {
  CANDIDATE:    'candidate',
  FREELANCER:   'freelancer',
  COMPANY:      'company',
  ORGANIZATION: 'organization',
  ADMIN:        'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface RoleConfig {
  label:          string;
  description:    string;
  icon:           string;   // Ionicons name
  emoji:          string;
  dashboardRoute: string;
  /** Matches a key in AppColors for dynamic theming via useTheme() */
  colorKey:       'candidate' | 'freelancer' | 'company' | 'organization';
  /** Static hex — safe to use outside React context (e.g. LinearGradient stops) */
  primaryHex:     string;
  lightHex:       string;
}

export const roleConfig: Record<Exclude<Role, 'admin'>, RoleConfig> = {
  candidate: {
    label:          'Job Seeker',
    description:    'Find jobs, apply, and grow your career',
    icon:           'briefcase-outline',
    emoji:          '🎯',
    dashboardRoute: 'CandidateDashboard',
    colorKey:       'candidate',
    primaryHex:     '#3B82F6',
    lightHex:       '#EFF6FF',
  },
  freelancer: {
    label:          'Freelancer',
    description:    'Showcase your skills and win freelance projects',
    icon:           'laptop-outline',
    emoji:          '💼',
    dashboardRoute: 'FreelancerDashboard',
    colorKey:       'freelancer',
    primaryHex:     '#10B981',
    lightHex:       '#ECFDF5',
  },
  company: {
    label:          'Company',
    description:    'Post jobs, manage applicants, and hire talent',
    icon:           'business-outline',
    emoji:          '🏢',
    dashboardRoute: 'CompanyDashboard',
    colorKey:       'company',
    primaryHex:     '#F1BB03',
    lightHex:       '#FEF3C7',
  },
  organization: {
    label:          'Organization',
    description:    'Post tenders, manage proposals, find professionals',
    icon:           'people-outline',
    emoji:          '🏛️',
    dashboardRoute: 'OrganizationDashboard',
    colorKey:       'organization',
    primaryHex:     '#8B5CF6',
    lightHex:       '#F5F3FF',
  },
};

export const adminConfig = {
  label:          'Admin',
  description:    'Manage the platform',
  icon:           'shield-outline',
  emoji:          '🛡️',
  dashboardRoute: 'AdminDashboard',
  primaryHex:     '#64748B',
  lightHex:       '#F1F5F9',
};

export const getDisplayRole = (role: string): string =>
  role === 'admin'
    ? adminConfig.label
    : roleConfig[role as Exclude<Role, 'admin'>]?.label ?? role;

export const getRolePrimaryHex = (role: string): string =>
  role === 'admin'
    ? adminConfig.primaryHex
    : roleConfig[role as Exclude<Role, 'admin'>]?.primaryHex ?? '#F1BB03';