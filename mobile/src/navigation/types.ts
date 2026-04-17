// ============================================================
// NAVIGATION TYPES — All Roles
// ============================================================

// ─── AUTH ────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  RoleSelection: undefined;
};

// ─── SHARED SOCIAL (used by all roles) ───────────────────────
export type SocialTabParamList = {
  Feed: undefined;           // ⚠️ Screen not yet created
  MyPosts: undefined;        // ⚠️ Screen not yet created
  Network: undefined;        // ⚠️ Screen not yet created
  SocialProfile: undefined;  // ⚠️ Screen not yet created
  SavedPosts: undefined;     // ⚠️ Screen not yet created
};

// ────────────────────────────────────────────────────────────
// 1. CANDIDATE
// ────────────────────────────────────────────────────────────
export type CandidateMainTabParamList = {
  Home: undefined;
  Jobs: undefined;         // opens CandidateJobsTab navigator
  Social: undefined;       // opens shared SocialTab navigator
  Profile: undefined;
  More: undefined;
};

export type CandidateJobsTabParamList = {
  JobsList: undefined;
  SavedJobs: undefined;
  Applications: undefined;
  BackToHome: undefined;   // triggers navigation.navigate('Home')
};

export type CandidateMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Help: undefined;
  // Add future screens here ⬇
};

// ────────────────────────────────────────────────────────────
// 2. FREELANCER
// ────────────────────────────────────────────────────────────
export type FreelancerMainTabParamList = {
  Home: undefined;
  Tenders: undefined;      // opens FreelancerTendersTab navigator
  Social: undefined;       // opens shared SocialTab navigator
  Profile: undefined;
  More: undefined;
};

export type FreelancerTendersTabParamList = {
  TendersList: undefined;
  SavedTenders: undefined;
  Proposals: undefined;
  BackToHome: undefined;   // triggers navigation.navigate('Home')
};

export type FreelancerMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Help: undefined;
  // Add future screens here ⬇
};

// ────────────────────────────────────────────────────────────
// 3. COMPANY
// ────────────────────────────────────────────────────────────
export type CompanyMainTabParamList = {
  Home: undefined;
  Jobs: undefined;         // opens CompanyJobsTab navigator
  Social: undefined;       // opens shared SocialTab navigator
  Tenders: undefined;      // opens CompanyTendersTab navigator
  Profile: undefined;      // opens CompanyProfileTab navigator
  More: undefined;
};

export type CompanyJobsTabParamList = {
  JobsList: undefined;
  CreateJob: undefined;
  JobApplications: undefined;
  BackToHome: undefined;
};

// Tenders is the most complex navigator for Company
export type CompanyTendersTabParamList = {
  TenderDashboard: undefined;   // ⚠️ Screen not yet created
  Tenders: undefined;           // opens CompanyTendersInner stack
  Bids: undefined;              // opens CompanyBidsInner stack
  Proposals: undefined;         // ⚠️ Screen not yet created
  BackToHome: undefined;
};

export type CompanyTendersInnerStackParamList = {
  MyFreelanceTenders: undefined;    // ⚠️ Screen not yet created
  ProfessionalTenders: undefined;   // ⚠️ Screen not yet created
  BrowseTenders: undefined;         // ⚠️ Screen not yet created
  SavedTenders: undefined;          // ⚠️ Screen not yet created
  Invitations: undefined;           // ⚠️ Screen not yet created
  BackToTenders: undefined;         // returns to CompanyTendersTab
};

export type CompanyBidsInnerStackParamList = {
  MyBids: undefined;       // ⚠️ Screen not yet created
  ReceivedBids: undefined; // ⚠️ Screen not yet created
  BackToTenders: undefined;
};

export type CompanyProfileTabParamList = {
  CompanyProfile: undefined;
  Products: undefined;              // ⚠️ Screen not yet created
  FreelanceMarketplace: undefined;  // ⚠️ Screen not yet created
  BackToHome: undefined;
};

export type CompanyMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Analytics: undefined;   // ⚠️ Screen not yet created
  Help: undefined;
  // Add future screens here ⬇
};

// ────────────────────────────────────────────────────────────
// 4. ORGANIZATION
// ────────────────────────────────────────────────────────────
export type OrganizationMainTabParamList = {
  Home: undefined;
  Jobs: undefined;         // opens OrganizationJobsTab navigator
  Social: undefined;       // opens shared SocialTab navigator
  Tenders: undefined;      // opens OrganizationTendersTab navigator
  Profile: undefined;      // opens OrganizationProfileTab navigator
  More: undefined;
};

export type OrganizationJobsTabParamList = {
  JobsList: undefined;
  CreateJob: undefined;
  JobApplications: undefined;
  BackToHome: undefined;
};

export type OrganizationTendersTabParamList = {
  TendersList: undefined;  // ⚠️ Screen not yet created
  Bids: undefined;         // ⚠️ Screen not yet created
  Proposals: undefined;    // ⚠️ Screen not yet created
  BackToHome: undefined;
};

export type OrganizationProfileTabParamList = {
  OrganizationProfile: undefined;
  FreelanceMarketplace: undefined;  // ⚠️ Screen not yet created
  BackToHome: undefined;
};

export type OrganizationMoreStackParamList = {
  MoreMenu: undefined;
  Notifications: undefined;
  Settings: undefined;
  Members: undefined;      // ⚠️ Screen not yet created
  Analytics: undefined;    // ⚠️ Screen not yet created
  Help: undefined;
  // Add future screens here ⬇
};
