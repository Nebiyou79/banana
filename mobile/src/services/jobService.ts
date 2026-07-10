/**
 * mobile/src/services/jobService.ts
 *
 * ── FIXES IN THIS VERSION ────────────────────────────────────────────────────
 * AVATAR FIX — JobOwner now includes all avatar field names the backend may
 *   return (avatar, avatarUrl, profileImage, avatarPublicId) so TypeScript
 *   doesn't hide them from components.
 *
 * AVATAR FIX — Job now includes ownerPreview (new backend-synthesised field).
 *
 * AVATAR FIX — getOwnerLogo() now delegates to resolveLogoUrl() from
 *   companyPreview.ts so the full priority chain is applied consistently.
 *
 * All prior fixes (TASK 2 remote optional, TASK 3 JobStatus enum,
 * TASK 4 optional chaining) are preserved unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import api, { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { JOBS } from '../constants/api';
import { resolveLogoUrl } from '../models/companyPreview';

// ─── Enums / constants ────────────────────────────────────────────────────────

export const JOB_TYPES = [
  { value: 'full-time',   label: 'Full Time' },
  { value: 'part-time',   label: 'Part Time' },
  { value: 'contract',    label: 'Contract' },
  { value: 'internship',  label: 'Internship' },
  { value: 'temporary',   label: 'Temporary' },
  { value: 'volunteer',   label: 'Volunteer' },
  { value: 'remote',      label: 'Remote' },
  { value: 'hybrid',      label: 'Hybrid' },
] as const;

export const SALARY_MODES = [
  { value: 'negotiable',    label: 'Negotiable' },
  { value: 'range',         label: 'Salary Range' },
  { value: 'hidden',        label: 'Hidden' },
  { value: 'company-scale', label: 'Company Scale' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'fresh-graduate', label: 'Fresh Graduate' },
  { value: 'entry-level',    label: 'Entry Level' },
  { value: 'mid-level',      label: 'Mid Level' },
  { value: 'senior-level',   label: 'Senior Level' },
  { value: 'managerial',     label: 'Managerial' },
  { value: 'director',       label: 'Director' },
  { value: 'executive',      label: 'Executive' },
] as const;

export const EDUCATION_LEVELS = [
  { value: 'primary-education',       label: 'Primary Education' },
  { value: 'secondary-education',     label: 'Secondary Education' },
  { value: 'tvet-level-i',            label: 'TVET Level I' },
  { value: 'tvet-level-ii',           label: 'TVET Level II' },
  { value: 'tvet-level-iii',          label: 'TVET Level III' },
  { value: 'tvet-level-iv',           label: 'TVET Level IV' },
  { value: 'tvet-level-v',            label: 'TVET Level V' },
  { value: 'undergraduate-bachelors', label: "Bachelor's Degree" },
  { value: 'postgraduate-masters',    label: "Master's Degree" },
  { value: 'doctoral-phd',            label: 'PhD / Doctoral' },
  { value: 'none-required',           label: 'No Requirement' },
] as const;

/** Must EXACTLY match server/src/models/Job.js location.region enum */
export const ETHIOPIAN_REGIONS = [
  { value: 'addis-ababa',         label: 'Addis Ababa' },
  { value: 'afar',                label: 'Afar' },
  { value: 'amhara',              label: 'Amhara' },
  { value: 'benishangul-gumuz',   label: 'Benishangul-Gumuz' },
  { value: 'dire-dawa',           label: 'Dire Dawa' },
  { value: 'gambela',             label: 'Gambela' },
  { value: 'harari',              label: 'Harari' },
  { value: 'oromia',              label: 'Oromia' },
  { value: 'sidama',              label: 'Sidama' },
  { value: 'snnpr',               label: 'SNNPR' },
  { value: 'somali',              label: 'Somali' },
  { value: 'south-west-ethiopia', label: 'South West Ethiopia' },
  { value: 'tigray',              label: 'Tigray' },
  { value: 'international',       label: 'International' },
] as const;

// ─── Scalar types ─────────────────────────────────────────────────────────────

export type RegionValue          = typeof ETHIOPIAN_REGIONS[number]['value'];
export type SalaryModeValue      = 'range' | 'hidden' | 'negotiable' | 'company-scale';
export type JobTypeValue         = typeof JOB_TYPES[number]['value'];
export type ExperienceLevelValue = typeof EXPERIENCE_LEVELS[number]['value'];

export type JobStatus =
  | 'active'
  | 'draft'
  | 'paused'
  | 'closed'
  | 'archived'
  | undefined;

export type JobUpdatePayload = Partial<Pick<Job, 'title' | 'description' | 'status'>>;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
  isPublic?: boolean;
  isNegotiable?: boolean;
}

export interface JobLocation {
  region?: RegionValue;
  city?: string;
  subCity?: string;
  woreda?: string;
  specificLocation?: string;
  country?: string;
  // GeoJSON Point — [longitude, latitude] — populated by backend geo queries
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

/**
 * AVATAR FIX — added all field names the backend may populate on company/org.
 * These were previously omitted, causing TypeScript to hide the real avatar
 * values from getEntityAvatarUrl() and resolveLogoUrl().
 */
export interface JobOwner {
  _id: string;
  name: string;
  // Legacy / explicit logo fields
  logoUrl?: string;
  logo?: string;
  // Profile-backed Cloudinary avatar fields (added by fixed populate projection)
  avatar?: string;
  avatarUrl?: string;
  profileImage?: string;
  avatarPublicId?: string;
  // Metadata
  verified?: boolean;
  industry?: string;
  organizationType?: string;
  website?: string;
  description?: string;
  // user ref — present when backend includes it (needed for buildOwnerPreviewFromDoc)
  user?: string;
}

/**
 * Backend-synthesised owner preview — added by the fixed jobController.
 * Always contains a correctly-resolved logoUrl from Profile.avatar.secure_url.
 */
export interface JobOwnerPreview {
  _id?: string;
  type: 'company' | 'organization';
  name: string;
  logoUrl?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  verified?: boolean;
  industry?: string;
  website?: string;
}

export interface JobApplicationInfo {
  isApplyEnabled: boolean;
  canApply: boolean;
  candidatesNeeded?: number;
  candidatesRemaining?: number;
  applicationCount?: number;
  status?: { canApply: boolean; message: string; reason: string };
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  type: JobTypeValue;
  jobType: 'company' | 'organization';
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  skills?: string[];
  salary?: JobSalary;
  salaryMode: SalaryModeValue;
  salaryDisplay?: string;
  location: JobLocation;
  remote: 'remote' | 'hybrid' | 'on-site';
  workArrangement?: 'office' | 'field-work' | 'both';
  experienceLevel: ExperienceLevelValue;
  educationLevel?: string;
  candidatesNeeded: number;
  applicationDeadline?: string;
  company?: JobOwner;
  organization?: JobOwner;
  /**
   * AVATAR FIX — new field added by fixed jobController.
   * Always contains a Profile-backed Cloudinary logoUrl.
   * Components should prefer this over job.company / job.organization.
   */
  ownerPreview?: JobOwnerPreview;
  isApplyEnabled: boolean;
  status: JobStatus;
  createdAt: string;
  updatedAt?: string;
  applicationCount?: number;
  viewCount?: number;
  saveCount?: number;
  featured?: boolean;
  urgent?: boolean;
  premium?: boolean;
  tags?: string[];
  applicationInfo?: JobApplicationInfo;
  opportunityType?: 'job' | 'volunteer' | 'internship' | 'fellowship' | 'training' | 'grant' | 'other';
  demographicRequirements?: {
    sex?: 'male' | 'female' | 'any';
    age?: { min?: number; max?: number };
  };
  jobNumber?: string;
  // Injected by /job/near endpoint — distance from the queried coordinate
  distanceKm?: number;
}

export interface JobFilters {
  remote?: string;
  search?: string;
  category?: string;
  type?: string;
  region?: string;
  experienceLevel?: string;
  educationLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryMode?: string;
  status?: 'active' | 'draft' | 'paused' | 'closed' | 'archived';
  featured?: boolean;
  urgent?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  jobType?: 'company' | 'organization';
}

export interface CreateJobData {
  title:               string;
  description:         string;
  category:            string;
  type:                JobTypeValue;
  experienceLevel:     ExperienceLevelValue;
  candidatesNeeded:    number;
  location:            JobLocation;
  applicationDeadline: string;
  shortDescription?:   string;
  requirements?:       string[];
  responsibilities?:   string[];
  benefits?:           string[];
  skills?:             string[];
  salary?:             JobSalary;
  salaryMode?:         SalaryModeValue;
  educationLevel?:     string;
  remote?:             'remote' | 'hybrid' | 'on-site';
  workArrangement?:    'office' | 'field-work' | 'both';
  isApplyEnabled?:     boolean;
  status?:             'draft' | 'active' | 'paused' | 'closed' | 'archived';
  featured?:           boolean;
  urgent?:             boolean;
  tags?:               string[];
  jobNumber?:          string;
  demographicRequirements?: {
    sex?: 'male' | 'female' | 'any';
    age?: { min?: number; max?: number };
  };
  opportunityType?: 'job' | 'volunteer' | 'internship' | 'fellowship' | 'training' | 'grant' | 'other';
}

export type UpdateJobData = Partial<CreateJobData>;

export interface JobListResponse {
  jobs: Job[];
  pagination: {
    current:        number;
    totalPages:     number;
    totalResults:   number;
    resultsPerPage?: number;
    nextPage?: number | null;
  };
}

export type JobCategory = { _id: string; count: number };

// ─── Rich category list (mirrors Job.js enum, grouped for the UI) ─────────────
// The backend returns raw enum strings; we map them to human-readable labels here
// so the form never needs to make a network call for display names.

export interface CategoryOption { value: string; label: string; group: string }

export const JOB_CATEGORY_OPTIONS: CategoryOption[] = [
  // Technology & ICT
  { value: 'software-developer',             label: 'Software Developer',             group: 'Technology & ICT' },
  { value: 'frontend-developer',             label: 'Frontend Developer',             group: 'Technology & ICT' },
  { value: 'backend-developer',              label: 'Backend Developer',              group: 'Technology & ICT' },
  { value: 'fullstack-developer',            label: 'Fullstack Developer',            group: 'Technology & ICT' },
  { value: 'web-developer',                  label: 'Web Developer',                  group: 'Technology & ICT' },
  { value: 'mobile-app-developer',           label: 'Mobile App Developer',           group: 'Technology & ICT' },
  { value: 'android-developer',              label: 'Android Developer',              group: 'Technology & ICT' },
  { value: 'ios-developer',                  label: 'iOS Developer',                  group: 'Technology & ICT' },
  { value: 'ai-engineer',                    label: 'AI Engineer',                    group: 'Technology & ICT' },
  { value: 'machine-learning-engineer',      label: 'Machine Learning Engineer',      group: 'Technology & ICT' },
  { value: 'data-scientist',                 label: 'Data Scientist',                 group: 'Technology & ICT' },
  { value: 'data-analyst',                   label: 'Data Analyst',                   group: 'Technology & ICT' },
  { value: 'business-intelligence-analyst',  label: 'Business Intelligence Analyst',  group: 'Technology & ICT' },
  { value: 'database-administrator',         label: 'Database Administrator',         group: 'Technology & ICT' },
  { value: 'system-administrator',           label: 'System Administrator',           group: 'Technology & ICT' },
  { value: 'network-engineer',               label: 'Network Engineer',               group: 'Technology & ICT' },
  { value: 'network-administrator',          label: 'Network Administrator',          group: 'Technology & ICT' },
  { value: 'cloud-engineer',                 label: 'Cloud Engineer',                 group: 'Technology & ICT' },
  { value: 'devops-engineer',                label: 'DevOps Engineer',                group: 'Technology & ICT' },
  { value: 'site-reliability-engineer',      label: 'Site Reliability Engineer',      group: 'Technology & ICT' },
  { value: 'cybersecurity-analyst',          label: 'Cybersecurity Analyst',          group: 'Technology & ICT' },
  { value: 'soc-analyst',                    label: 'SOC Analyst',                    group: 'Technology & ICT' },
  { value: 'penetration-tester',             label: 'Penetration Tester',             group: 'Technology & ICT' },
  { value: 'it-support-officer',             label: 'IT Support Officer',             group: 'Technology & ICT' },
  { value: 'it-support-technician',          label: 'IT Support Technician',          group: 'Technology & ICT' },
  { value: 'helpdesk-officer',               label: 'Helpdesk Officer',               group: 'Technology & ICT' },
  { value: 'ui-designer',                    label: 'UI Designer',                    group: 'Technology & ICT' },
  { value: 'ux-designer',                    label: 'UX Designer',                    group: 'Technology & ICT' },
  { value: 'product-designer',               label: 'Product Designer',               group: 'Technology & ICT' },
  { value: 'product-manager',                label: 'Product Manager',                group: 'Technology & ICT' },
  { value: 'scrum-master',                   label: 'Scrum Master',                   group: 'Technology & ICT' },
  { value: 'it-project-manager',             label: 'IT Project Manager',             group: 'Technology & ICT' },
  { value: 'qa-engineer',                    label: 'QA Engineer',                    group: 'Technology & ICT' },
  { value: 'software-tester',                label: 'Software Tester',                group: 'Technology & ICT' },
  { value: 'automation-tester',              label: 'Automation Tester',              group: 'Technology & ICT' },
  { value: 'erp-consultant',                 label: 'ERP Consultant',                 group: 'Technology & ICT' },
  { value: 'sap-consultant',                 label: 'SAP Consultant',                 group: 'Technology & ICT' },
  { value: 'odoo-developer',                 label: 'Odoo Developer',                 group: 'Technology & ICT' },
  { value: 'crm-administrator',              label: 'CRM Administrator',              group: 'Technology & ICT' },
  { value: 'digital-transformation-specialist', label: 'Digital Transformation Specialist', group: 'Technology & ICT' },
  { value: 'fintech-specialist',             label: 'Fintech Specialist',             group: 'Technology & ICT' },
  { value: 'blockchain-developer',           label: 'Blockchain Developer',           group: 'Technology & ICT' },
  { value: 'web3-developer',                 label: 'Web3 Developer',                 group: 'Technology & ICT' },
  { value: 'ict-trainer',                    label: 'ICT Trainer',                    group: 'Technology & ICT' },
  { value: 'computer-lab-technician',        label: 'Computer Lab Technician',        group: 'Technology & ICT' },

  // NGO / Development
  { value: 'project-officer',                label: 'Project Officer',                group: 'NGO / Development' },
  { value: 'project-manager',                label: 'Project Manager',                group: 'NGO / Development' },
  { value: 'program-officer',                label: 'Program Officer',                group: 'NGO / Development' },
  { value: 'program-manager',                label: 'Program Manager',                group: 'NGO / Development' },
  { value: 'me-officer',                     label: 'M&E Officer',                    group: 'NGO / Development' },
  { value: 'me-manager',                     label: 'M&E Manager',                    group: 'NGO / Development' },
  { value: 'wash-officer',                   label: 'WASH Officer',                   group: 'NGO / Development' },
  { value: 'wash-specialist',                label: 'WASH Specialist',                group: 'NGO / Development' },
  { value: 'livelihood-officer',             label: 'Livelihood Officer',             group: 'NGO / Development' },
  { value: 'food-security-officer',          label: 'Food Security Officer',          group: 'NGO / Development' },
  { value: 'nutrition-officer',              label: 'Nutrition Officer',              group: 'NGO / Development' },
  { value: 'protection-officer',             label: 'Protection Officer',             group: 'NGO / Development' },
  { value: 'child-protection-officer',       label: 'Child Protection Officer',       group: 'NGO / Development' },
  { value: 'gender-officer',                 label: 'Gender Officer',                 group: 'NGO / Development' },
  { value: 'gbv-officer',                    label: 'GBV Officer',                    group: 'NGO / Development' },
  { value: 'peacebuilding-officer',          label: 'Peacebuilding Officer',          group: 'NGO / Development' },
  { value: 'community-mobilizer',            label: 'Community Mobilizer',            group: 'NGO / Development' },
  { value: 'community-development-officer',  label: 'Community Development Officer',  group: 'NGO / Development' },
  { value: 'humanitarian-officer',           label: 'Humanitarian Officer',           group: 'NGO / Development' },
  { value: 'emergency-response-officer',     label: 'Emergency Response Officer',     group: 'NGO / Development' },
  { value: 'grant-officer',                  label: 'Grant Officer',                  group: 'NGO / Development' },
  { value: 'grant-manager',                  label: 'Grant Manager',                  group: 'NGO / Development' },
  { value: 'proposal-writer',                label: 'Proposal Writer',                group: 'NGO / Development' },
  { value: 'partnership-officer',            label: 'Partnership Officer',            group: 'NGO / Development' },
  { value: 'advocacy-officer',               label: 'Advocacy Officer',               group: 'NGO / Development' },
  { value: 'enumerator',                     label: 'Enumerator',                     group: 'NGO / Development' },
  { value: 'field-officer',                  label: 'Field Officer',                  group: 'NGO / Development' },
  { value: 'monitoring-assistant',           label: 'Monitoring Assistant',           group: 'NGO / Development' },

  // Finance & Banking
  { value: 'accountant',                     label: 'Accountant',                     group: 'Finance & Banking' },
  { value: 'junior-accountant',              label: 'Junior Accountant',              group: 'Finance & Banking' },
  { value: 'senior-accountant',              label: 'Senior Accountant',              group: 'Finance & Banking' },
  { value: 'auditor',                        label: 'Auditor',                        group: 'Finance & Banking' },
  { value: 'internal-auditor',               label: 'Internal Auditor',               group: 'Finance & Banking' },
  { value: 'external-auditor',               label: 'External Auditor',               group: 'Finance & Banking' },
  { value: 'bank-teller',                    label: 'Bank Teller',                    group: 'Finance & Banking' },
  { value: 'relationship-manager',           label: 'Relationship Manager',           group: 'Finance & Banking' },
  { value: 'branch-manager',                 label: 'Branch Manager',                 group: 'Finance & Banking' },
  { value: 'credit-officer',                 label: 'Credit Officer',                 group: 'Finance & Banking' },
  { value: 'loan-officer',                   label: 'Loan Officer',                   group: 'Finance & Banking' },
  { value: 'credit-analyst',                 label: 'Credit Analyst',                 group: 'Finance & Banking' },
  { value: 'risk-officer',                   label: 'Risk Officer',                   group: 'Finance & Banking' },
  { value: 'compliance-officer-banking',     label: 'Compliance Officer',             group: 'Finance & Banking' },
  { value: 'forex-officer',                  label: 'Forex Officer',                  group: 'Finance & Banking' },
  { value: 'treasury-officer',               label: 'Treasury Officer',               group: 'Finance & Banking' },
  { value: 'cashier',                        label: 'Cashier',                        group: 'Finance & Banking' },
  { value: 'microfinance-officer',           label: 'Microfinance Officer',           group: 'Finance & Banking' },
  { value: 'insurance-officer',              label: 'Insurance Officer',              group: 'Finance & Banking' },
  { value: 'financial-analyst',              label: 'Financial Analyst',              group: 'Finance & Banking' },
  { value: 'tax-consultant',                 label: 'Tax Consultant',                 group: 'Finance & Banking' },

  // Engineering & Construction
  { value: 'civil-engineer',                 label: 'Civil Engineer',                 group: 'Engineering' },
  { value: 'site-engineer',                  label: 'Site Engineer',                  group: 'Engineering' },
  { value: 'structural-engineer',            label: 'Structural Engineer',            group: 'Engineering' },
  { value: 'transport-engineer',             label: 'Transport Engineer',             group: 'Engineering' },
  { value: 'water-engineer',                 label: 'Water Engineer',                 group: 'Engineering' },
  { value: 'electrical-engineer',            label: 'Electrical Engineer',            group: 'Engineering' },
  { value: 'mechanical-engineer',            label: 'Mechanical Engineer',            group: 'Engineering' },
  { value: 'architect',                      label: 'Architect',                      group: 'Engineering' },
  { value: 'quantity-surveyor',              label: 'Quantity Surveyor',              group: 'Engineering' },
  { value: 'construction-manager',           label: 'Construction Manager',           group: 'Engineering' },
  { value: 'project-engineer',               label: 'Project Engineer',               group: 'Engineering' },
  { value: 'site-supervisor',                label: 'Site Supervisor',                group: 'Engineering' },
  { value: 'foreman',                        label: 'Foreman',                        group: 'Engineering' },
  { value: 'survey-engineer',                label: 'Survey Engineer',                group: 'Engineering' },
  { value: 'urban-planner',                  label: 'Urban Planner',                  group: 'Engineering' },

  // Agriculture & Environment
  { value: 'agronomist',                     label: 'Agronomist',                     group: 'Agriculture' },
  { value: 'livestock-production-officer',   label: 'Livestock Production Officer',   group: 'Agriculture' },
  { value: 'veterinarian',                   label: 'Veterinarian',                   group: 'Agriculture' },
  { value: 'forestry-officer',               label: 'Forestry Officer',               group: 'Agriculture' },
  { value: 'environmental-officer',          label: 'Environmental Officer',          group: 'Agriculture' },
  { value: 'climate-change-officer',         label: 'Climate Change Officer',         group: 'Agriculture' },
  { value: 'irrigation-engineer',            label: 'Irrigation Engineer',            group: 'Agriculture' },
  { value: 'extension-agent',                label: 'Extension Agent',                group: 'Agriculture' },
  { value: 'rural-development-officer',      label: 'Rural Development Officer',      group: 'Agriculture' },

  // Health
  { value: 'general-practitioner',           label: 'General Practitioner',           group: 'Health' },
  { value: 'medical-doctor',                 label: 'Medical Doctor',                 group: 'Health' },
  { value: 'nurse',                          label: 'Nurse',                          group: 'Health' },
  { value: 'midwife',                        label: 'Midwife',                        group: 'Health' },
  { value: 'pharmacist',                     label: 'Pharmacist',                     group: 'Health' },
  { value: 'public-health-officer',          label: 'Public Health Officer',          group: 'Health' },
  { value: 'epidemiologist',                 label: 'Epidemiologist',                 group: 'Health' },
  { value: 'nutritionist',                   label: 'Nutritionist',                   group: 'Health' },
  { value: 'psychologist',                   label: 'Psychologist',                   group: 'Health' },
  { value: 'hospital-administrator',         label: 'Hospital Administrator',         group: 'Health' },
  { value: 'biomedical-engineer',            label: 'Biomedical Engineer',            group: 'Health' },
  { value: 'physiotherapist',                label: 'Physiotherapist',                group: 'Health' },

  // Education
  { value: 'primary-teacher',                label: 'Primary Teacher',                group: 'Education' },
  { value: 'secondary-teacher',              label: 'Secondary Teacher',              group: 'Education' },
  { value: 'university-lecturer',            label: 'University Lecturer',            group: 'Education' },
  { value: 'tvet-trainer',                   label: 'TVET Trainer',                   group: 'Education' },
  { value: 'school-director',                label: 'School Director',                group: 'Education' },
  { value: 'curriculum-developer',           label: 'Curriculum Developer',           group: 'Education' },
  { value: 'academic-coordinator',           label: 'Academic Coordinator',           group: 'Education' },
  { value: 'guidance-counselor',             label: 'Guidance Counselor',             group: 'Education' },
  { value: 'librarian',                      label: 'Librarian',                      group: 'Education' },
  { value: 'e-learning-specialist',          label: 'E-Learning Specialist',          group: 'Education' },

  // Admin, HR & Business
  { value: 'administrative-assistant',       label: 'Administrative Assistant',       group: 'Admin & HR' },
  { value: 'executive-secretary',            label: 'Executive Secretary',            group: 'Admin & HR' },
  { value: 'hr-officer',                     label: 'HR Officer',                     group: 'Admin & HR' },
  { value: 'hr-manager',                     label: 'HR Manager',                     group: 'Admin & HR' },
  { value: 'recruitment-officer',            label: 'Recruitment Officer',            group: 'Admin & HR' },
  { value: 'general-manager',                label: 'General Manager',                group: 'Admin & HR' },
  { value: 'operations-manager',             label: 'Operations Manager',             group: 'Admin & HR' },
  { value: 'business-development-officer',   label: 'Business Development Officer',   group: 'Admin & HR' },
  { value: 'customer-service-representative',label: 'Customer Service Representative',group: 'Admin & HR' },
  { value: 'sales-representative',           label: 'Sales Representative',           group: 'Admin & HR' },
  { value: 'sales-manager',                  label: 'Sales Manager',                  group: 'Admin & HR' },
  { value: 'marketing-officer',              label: 'Marketing Officer',              group: 'Admin & HR' },
  { value: 'procurement-officer',            label: 'Procurement Officer',            group: 'Admin & HR' },
  { value: 'supply-chain-officer',           label: 'Supply Chain Officer',           group: 'Admin & HR' },
  { value: 'logistics-officer',              label: 'Logistics Officer',              group: 'Admin & HR' },

  // Drivers & Transport
  { value: 'driver',                         label: 'Driver',                         group: 'Drivers & Transport' },
  { value: 'truck-driver',                   label: 'Truck Driver',                   group: 'Drivers & Transport' },
  { value: 'heavy-truck-driver',             label: 'Heavy Truck Driver',             group: 'Drivers & Transport' },
  { value: 'forklift-operator',              label: 'Forklift Operator',              group: 'Drivers & Transport' },
  { value: 'auto-mechanic',                  label: 'Auto Mechanic',                  group: 'Drivers & Transport' },
  { value: 'fleet-manager',                  label: 'Fleet Manager',                  group: 'Drivers & Transport' },
  { value: 'transport-coordinator',          label: 'Transport Coordinator',          group: 'Drivers & Transport' },

  // Hospitality & Tourism
  { value: 'hotel-manager',                  label: 'Hotel Manager',                  group: 'Hospitality' },
  { value: 'receptionist',                   label: 'Receptionist',                   group: 'Hospitality' },
  { value: 'waiter',                         label: 'Waiter',                         group: 'Hospitality' },
  { value: 'chef',                           label: 'Chef',                           group: 'Hospitality' },
  { value: 'cook',                           label: 'Cook',                           group: 'Hospitality' },
  { value: 'tour-guide',                     label: 'Tour Guide',                     group: 'Hospitality' },
  { value: 'event-coordinator',              label: 'Event Coordinator',              group: 'Hospitality' },
  { value: 'restaurant-manager',             label: 'Restaurant Manager',             group: 'Hospitality' },

  // Security & Support
  { value: 'security-guard',                 label: 'Security Guard',                 group: 'Security & Support' },
  { value: 'safety-officer',                 label: 'Safety Officer',                 group: 'Security & Support' },
  { value: 'cleaner',                        label: 'Cleaner',                        group: 'Security & Support' },
  { value: 'maintenance-worker',             label: 'Maintenance Worker',             group: 'Security & Support' },
  { value: 'messenger',                      label: 'Messenger',                      group: 'Security & Support' },

  // Graduate / Entry Level
  { value: 'graduate-trainee',               label: 'Graduate Trainee',               group: 'Graduate & Internship' },
  { value: 'intern',                         label: 'Intern',                         group: 'Graduate & Internship' },
  { value: 'internship',                     label: 'Internship',                     group: 'Graduate & Internship' },
  { value: 'apprentice',                     label: 'Apprentice',                     group: 'Graduate & Internship' },
  { value: 'volunteer',                      label: 'Volunteer',                      group: 'Graduate & Internship' },

  { value: 'other',                          label: 'Other',                          group: 'Other' },
];

// ─── Nearby Jobs ──────────────────────────────────────────────────────────────

/**
 * Filters for the /job/near endpoint.
 * lat & lng are required; all others are optional filters identical to JobFilters.
 */
export interface NearbyJobFilters extends Omit<JobFilters, 'page' | 'region'> {
  lat:     number;
  lng:     number;
  /** Search radius in km. Default 25, max 200. */
  radius?: number;
  page?:   number;
}

/** A job returned from /job/near — always has distanceKm populated. */
export type NearbyJob = Job & { distanceKm: number };

export interface NearbyJobListResponse {
  jobs: NearbyJob[];
  meta: {
    userLocation: { lat: number; lng: number };
    radiusKm:     number;
  };
  pagination: JobListResponse['pagination'];
}

// ─── Error parser ─────────────────────────────────────────────────────────────

const parseApiError = (e: any): string => {
  const d = e?.response?.data;
  if (!d) return e?.message ?? 'Request failed';
  if (Array.isArray(d.errors))  return d.errors.map((x: any)  => x.msg ?? x.message ?? x).filter(Boolean).join('; ');
  if (Array.isArray(d.details)) return d.details.map((x: any) => x.message ?? x.msg ?? x).filter(Boolean).join('; ');
  if (d.message) return d.message;
  return e.message ?? 'Request failed';
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const jobService = {

  // ── Public browse ─────────────────────────────────────────────────────────

  getJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.LIST, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  getJob: async (id: string): Promise<Job> => {
    const res = await apiGet<{ success: boolean; data: Job }>(JOBS.DETAIL(id))
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  getJobById: async (id: string): Promise<Job> => jobService.getJob(id),

  getCategories: async (): Promise<JobCategory[]> => {
    try {
      const res = await apiGet<{ success: boolean; data: JobCategory[] }>(JOBS.CATEGORIES);
      return res.data.data ?? [];
    } catch { return []; }
  },

  getJobsForCandidate: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.CANDIDATE_JOBS, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  getSavedJobs: async (): Promise<Job[]> => {
    try {
      const res = await apiGet<{ success: boolean; data: Job[] }>(JOBS.SAVED_JOBS);
      return res.data.data ?? [];
    } catch { return []; }
  },

  // ── Nearby jobs (geo) ─────────────────────────────────────────────────────

  getNearbyJobs: async (filters: NearbyJobFilters): Promise<NearbyJobListResponse> => {
    const { lat, lng, radius = 25, page = 1, limit = 12, ...rest } = filters;

    // Build query string — omit undefined/empty values
    const params = new URLSearchParams();
    params.set('lat',    String(lat));
    params.set('lng',    String(lng));
    params.set('radius', String(radius));
    params.set('page',   String(page));
    params.set('limit',  String(limit));

    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) {
        params.set(k, String(v));
      }
    });

    // JOBS.LIST is e.g. '/api/v1/job' — derive base from it
    const JOBS_BASE = (JOBS.LIST as string).replace(/\/$/, '');
    const res = await apiGet<{
      success:    boolean;
      data:       NearbyJob[];
      meta:       NearbyJobListResponse['meta'];
      pagination: NearbyJobListResponse['pagination'];
    }>(`${JOBS_BASE}/near?${params.toString()}`)
      .catch(e => { throw new Error(parseApiError(e)); });

    return {
      jobs:       res.data.data       ?? [],
      meta:       res.data.meta       ?? { userLocation: { lat, lng }, radiusKm: radius },
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 }
    };
  },

  saveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.SAVE(jobId)).catch(e => { throw new Error(parseApiError(e)); });
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiPost(JOBS.UNSAVE(jobId)).catch(e => { throw new Error(parseApiError(e)); });
  },

  // ── Company CRUD ─────────────────────────────────────────────────────────

  getCompanyJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.COMPANY_JOBS, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  createJob: async (data: CreateJobData): Promise<Job> => {
    const res = await apiPost<{ success: boolean; data: Job }>(JOBS.CREATE, data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  updateJob: async (id: string, data: UpdateJobData): Promise<Job> => {
    const res = await apiPut<{ success: boolean; data: Job }>(JOBS.UPDATE(id), data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiDelete(JOBS.DELETE(id)).catch(e => { throw new Error(parseApiError(e)); });
  },

  // ── Organization CRUD ────────────────────────────────────────────────────

  getOrganizationJobs: async (filters?: JobFilters): Promise<JobListResponse> => {
    const res = await apiGet<{ success: boolean; data: Job[]; pagination: any }>(
      JOBS.ORG_JOBS, { params: filters }
    ).catch(e => { throw new Error(parseApiError(e)); });
    return {
      jobs:       res.data.data ?? [],
      pagination: res.data.pagination ?? { current: 1, totalPages: 1, totalResults: 0 },
    };
  },

  createOrganizationJob: async (data: CreateJobData): Promise<Job> => {
    const res = await apiPost<{ success: boolean; data: Job }>(JOBS.CREATE_ORG, data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  updateOrganizationJob: async (id: string, data: UpdateJobData): Promise<Job> => {
    const res = await apiPut<{ success: boolean; data: Job }>(JOBS.UPDATE_ORG(id), data)
      .catch(e => { throw new Error(parseApiError(e)); });
    return res.data.data;
  },

  deleteOrganizationJob: async (id: string): Promise<void> => {
    await apiDelete(JOBS.DELETE_ORG(id)).catch(e => { throw new Error(parseApiError(e)); });
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

  getOwnerName: (job: Job): string =>
    job?.ownerPreview?.name ??
    job?.company?.name ??
    job?.organization?.name ??
    'Unknown',

  /**
   * AVATAR FIX — delegates to resolveLogoUrl() which checks every field name
   * in the correct priority order, including the new ownerPreview field.
   */
  getOwnerLogo: (job: Job): string | undefined => {
    // Prefer ownerPreview (Profile-backed, always correct)
    if (job?.ownerPreview) {
      return resolveLogoUrl(job.ownerPreview as Record<string, any>);
    }
    const owner = job?.company ?? job?.organization;
    return resolveLogoUrl(owner as Record<string, any>);
  },

  formatSalary: (job: Job): string => {
    if (job?.salaryDisplay) return job.salaryDisplay;
    switch (job?.salaryMode) {
      case 'negotiable':    return 'Negotiable';
      case 'hidden':        return 'Salary Hidden';
      case 'company-scale': return 'As per company scale';
      case 'range': {
        const min      = job?.salary?.min;
        const max      = job?.salary?.max;
        const currency = job?.salary?.currency ?? 'ETB';
        if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
        if (min)        return `${currency} ${min.toLocaleString()}+`;
        if (max)        return `Up to ${currency} ${max.toLocaleString()}`;
        return 'Negotiable';
      }
      default: return 'Not specified';
    }
  },

  formatLocation: (location?: Job['location']): string => {
    if (!location) return 'Ethiopia';
    return (
      location.specificLocation?.trim() ||
      location.city?.trim() ||
      location.region?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) ||
      location.country?.trim() ||
      'Ethiopia'
    );
  },

  formatFullLocation: (location?: Job['location']): string => {
    if (!location) return 'Ethiopia';
    const parts = [
      location.specificLocation?.trim(),
      location.subCity?.trim(),
      location.city?.trim(),
      location.region?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()),
      location.country?.trim(),
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Ethiopia';
  },

  buildDefaultJobData: (isOrg = false): CreateJobData => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    return {
      title:               '',
      description:         '',
      category:            'software-developer',
      type:                'full-time',
      experienceLevel:     'mid-level',
      educationLevel:      'none-required',
      candidatesNeeded:    1,
      salaryMode:          'negotiable',
      location:            { region: 'addis-ababa', city: '', country: 'Ethiopia' },
      applicationDeadline: deadline.toISOString(),
      remote:              'on-site',
      workArrangement:     'office',
      isApplyEnabled:      true,
      status:              'draft',
      skills:              [],
      requirements:        [],
      responsibilities:    [],
      benefits:            [],
      featured:            false,
      urgent:              false,
      ...(isOrg ? { opportunityType: 'job' as const } : {}),
    };
  },
};

// ─── Legacy alias ─────────────────────────────────────────────────────────────

export const JobService = {
  getCompanyJobs: jobService.getCompanyJobs,
  updateJob: async (id: string, data: JobUpdatePayload) => {
    const response = await api.patch(`/jobs/${id}`, data);
    return response.data;
  },
};