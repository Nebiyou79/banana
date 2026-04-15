/**
 * mobile/src/navigation/types.ts
 * Role-Based-Navigator: Strictly typed param lists for all navigators.
 */

export type RootStackParamList = {
  Auth:      undefined;
  Main:      undefined;
};

export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

// ─── Candidate ────────────────────────────────────────────────────────────────

export type CandidateTabParamList = {
  CandidateHome:    undefined;
  JobExplorer:      undefined;
  MyApplications:   undefined;
  SavedJobs:        undefined;
  CandidateProfile: undefined;
};

export type CandidateStackParamList = {
  CandidateTabs:    undefined;
  JobDetail:        { jobId: string };
  ApplyJob:         { jobId: string; jobTitle: string };
  ApplicationDetail:{ applicationId: string };
};

// ─── Company ──────────────────────────────────────────────────────────────────

export type CompanyTabParamList = {
  CompanyHome:    undefined;
  JobManagement:  undefined;
  Notifications:  undefined;
  CompanyProfile: undefined;
};

export type CompanyStackParamList = {
  CompanyTabs:       undefined;
  JobCreate:         undefined;
  JobEdit:           { jobId: string };
  CompanyJobDetail:  { jobId: string };
  ApplicantManager:  { jobId: string; jobTitle: string };
  ApplicantDetail:   { applicationId: string; jobTitle?: string };
};

// ─── Organization ─────────────────────────────────────────────────────────────

export type OrgTabParamList = {
  OrgHome:    undefined;
  OrgJobs:    undefined;
  OrgProfile: undefined;
};

export type OrgStackParamList = {
  OrgTabs:         undefined;
  OrgJobCreate:    undefined;
  OrgJobEdit:      { jobId: string };
  OrgJobDetail:    { jobId: string };
  OrgApplicants:   { jobId: string; jobTitle: string };
  OrgApplicantDetail: { applicationId: string };
};