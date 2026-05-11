// src/navigation/types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Canonical navigation param lists for all roles.
// Keep this file as the single source of truth for tab/stack param shapes.
// ─────────────────────────────────────────────────────────────────────────────

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelect: undefined;
  OtpVerify: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  PhoneRegister: undefined;
  PhoneOtp: { phone: string };
};

// ────────────────────────────────────────────────────────────────────────────
// 1. CANDIDATE
// ────────────────────────────────────────────────────────────────────────────

export type CandidateMainTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Social: undefined;
  Profile: undefined;
  More: undefined;
};

export type CandidateJobsTabParamList = {
  JobsList: undefined;
  SavedJobs: undefined;
  Applications: undefined;
};

export type CandidateMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Help: undefined;
};

// ────────────────────────────────────────────────────────────────────────────
// 2. FREELANCER
// ────────────────────────────────────────────────────────────────────────────

export type FreelancerMainTabParamList = {
  Home: undefined;
  Tenders: undefined;
  Social: undefined;
  Profile: undefined;
  More: undefined;
};

export type FreelancerTendersTabParamList = {
  TendersList: undefined;
  SavedTenders: undefined;
  Proposals: undefined;
};

export type FreelancerMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Help: undefined;
};

// ────────────────────────────────────────────────────────────────────────────
// 3. COMPANY
// ────────────────────────────────────────────────────────────────────────────

export type CompanyMainTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Social: undefined;
  Tenders: undefined;
  Profile: undefined;
  More: undefined;
};

export type CompanyJobsTabParamList = {
  JobsList: undefined;
  CreateJob: undefined;
  JobApplications: undefined;
};

export type CompanyProfileTabParamList = {
  CompanyProfile: undefined;
  Products: undefined;
  FreelanceMarketplace: undefined;
};

export type CompanyMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Analytics: undefined;
  Help: undefined;
};

// ────────────────────────────────────────────────────────────────────────────
// 4. ORGANIZATION
// ────────────────────────────────────────────────────────────────────────────

export type OrganizationMainTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Social: undefined;
  Tenders: undefined;
  Profile: undefined;
  More: undefined;
};

export type OrganizationJobsTabParamList = {
  JobsList: undefined;
  CreateJob: undefined;
  JobApplications: undefined;
};

export type OrganizationProfileTabParamList = {
  OrganizationProfile: undefined;
  FreelanceMarketplace: undefined;
};

export type OrganizationMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Members: undefined;
  Analytics: undefined;
  Help: undefined;
};