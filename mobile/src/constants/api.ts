export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.7:4000/api/v1';

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const AUTH = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_RESET_OTP: '/auth/verify-reset-otp',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const PROFILE = {
  BASE: '/profile',
  AVATAR: '/profile/avatar',
  COVER: '/profile/cover',
  PUBLIC: (userId: string) => `/profile/public/${userId}`,
  PROFESSIONAL_INFO: '/profile/professional-info',
  SOCIAL_LINKS: '/profile/social-links',
  COMPLETION: '/profile/completion',
  PRIVACY: '/profile/privacy-settings',
  NOTIFICATIONS: '/profile/notification-preferences',
  SUMMARY: '/profile/summary',
} as const;

// ─── ROLE PROFILE ─────────────────────────────────────────────────────────────
export const ROLE_PROFILE = {
  CANDIDATE: '/role-profile/candidate',
  COMPANY: '/role-profile/company',
  FREELANCER: '/role-profile/freelancer',
  ORGANIZATION: '/role-profile/organization',
} as const;

// ─── VERIFICATION ─────────────────────────────────────────────────────────────
export const VERIFICATION = {
  MY_STATUS: '/verification/my-status',
  REQUEST: '/verification/request',
  PUBLIC_STATUS: (userId: string) => `/verification/status/${userId}`,
} as const;

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const JOBS = {
  LIST: '/job',
  CATEGORIES: '/job/categories',
  DETAIL: (id: string) => `/job/${id}`,
  CANDIDATE_JOBS: '/job/candidate/jobs',
  SAVED_JOBS: '/job/saved/jobs',
  SAVE: (jobId: string) => `/job/${jobId}/save`,
  UNSAVE: (jobId: string) => `/job/${jobId}/unsave`,
  COMPANY_JOBS: '/job/company/my-jobs',
  ORG_JOBS: '/job/organization/my-jobs',
  CREATE: '/job',
  CREATE_ORG: '/job/organization',
  UPDATE: (id: string) => `/job/${id}`,
  UPDATE_ORG: (id: string) => `/job/organization/${id}`,
  DELETE: (id: string) => `/job/${id}`,
  DELETE_ORG: (id: string) => `/job/organization/${id}`,
} as const;

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const APPLICATIONS = {
  MY_CVS: '/applications/my-cvs',
  MY_APPLICATIONS: '/applications/my-applications',
  APPLY: (jobId: string) => `/applications/apply/${jobId}`,
  WITHDRAW: (id: string) => `/applications/${id}/withdraw`,
  DETAIL: (id: string) => `/applications/${id}`,
  ATTACHMENTS: (id: string) => `/applications/${id}/attachments`,
  DOWNLOAD_FILE: (appId: string, fileId: string) => `/applications/${appId}/files/${fileId}/download`,
  COMPANY_LIST: '/applications/company/applications',
  COMPANY_DETAIL: (id: string) => `/applications/company/${id}`,
  ORG_LIST: '/applications/organization/applications',
  ORG_DETAIL: (id: string) => `/applications/organization/${id}`,
  JOB_APPLICATIONS: (jobId: string) => `/applications/job/${jobId}`,
  UPDATE_STATUS: (id: string) => `/applications/${id}/status`,
  COMPANY_RESPONSE: (id: string) => `/applications/${id}/company-response`,
  DOWNLOAD_CV: (cvId: string) => `/applications/cv/${cvId}/download`,
  STATISTICS: '/applications/statistics/overview',
} as const;


const BASE = '/freelancer';
 
export const FREELANCER = {
  // Dashboard & Stats
  DASHBOARD:       `${BASE}/dashboard/overview`,
  STATS:           `${BASE}/stats`,
 
  // Profile
  PROFILE:         `${BASE}/profile`,
 
  // Portfolio
  PORTFOLIO:       `${BASE}/portfolio`,
  PORTFOLIO_ITEM:  (id: string) => `${BASE}/portfolio/${id}`,
 
  // Services
  SERVICES:        `${BASE}/services`,
SERVICE: (id: string) => `/freelancer/services/${id}`, 
  // Certifications
  CERTIFICATIONS:  `${BASE}/certifications`,
  CERTIFICATION:   (id: string) => `${BASE}/certifications/${id}`,
 
  // Uploads
  UPLOAD_PORTFOLIO: `${BASE}/upload/portfolio`,
  UPLOAD_AVATAR:    `${BASE}/upload/avatar`,
} as const;

// ─── FREELANCER MARKETPLACE ────────────────────────────────────────────────────
export const FREELANCERS = {
  LIST: '/freelancers',
  DETAIL: (id: string) => `/freelancers/${id}`,
  REVIEWS: (id: string) => `/freelancers/${id}/reviews`,
  SUBMIT_REVIEW: (id: string) => `/freelancers/${id}/reviews`,
} as const;

// ─── COMPANY SHORTLIST ────────────────────────────────────────────────────────
export const SHORTLIST = {
  TOGGLE: (freelancerId: string) => `/company/shortlist/${freelancerId}`,
  LIST: '/company/shortlist',
} as const;

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
// In your PRODUCTS object, add these two entries:
export const PRODUCTS = {
  LIST:          '/products',
  DETAIL:        (id: string) => `/products/${id}`,
  FEATURED:      '/products/featured',
  CATEGORIES:    '/products/categories',
  COMPANY:       (id: string) => `/products/company/${id}`,
  RELATED:       (id: string) => `/products/${id}/related`,
  CREATE:        '/products',
  UPDATE:        (id: string) => `/products/${id}`,
  UPDATE_STATUS: (id: string) => `/products/${id}/status`,
  DELETE:        (id: string) => `/products/${id}`,
  // ── NEW ──
  SAVE:          (id: string) => `/products/${id}/save`,
  SAVED:         '/products/saved',
} as const;

// ─── CV GENERATOR ─────────────────────────────────────────────────────────────
export const CV_GENERATOR = {
  TEMPLATES: '/candidate/cv-generator/templates',
  LIST: '/candidate/cv-generator/list',
  PREVIEW: '/candidate/cv-generator/preview',
  GENERATE: '/candidate/cv-generator/generate',
  REGENERATE: (cvId: string) => `/candidate/cv-generator/regenerate/${cvId}`,
  DOWNLOAD: (cvId: string) => `/candidate/cv-generator/download/${cvId}`,
} as const;

// ─── TENDERS ──────────────────────────────────────────────────────────────────
export const TENDERS = {
  LIST: '/tender',
  DETAIL: (id: string) => `/tender/${id}`,
  CREATE: '/tender',
  UPDATE: (id: string) => `/tender/${id}`,
  DELETE: (id: string) => `/tender/${id}`,
} as const;

// ─── SEARCH ───────────────────────────────────────────────────────────────────
export const SEARCH = {
  GLOBAL: '/search',
  SOCIAL: '/social-search',
} as const;