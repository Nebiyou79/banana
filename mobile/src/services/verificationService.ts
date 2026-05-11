/**
 * src/services/verificationService.ts
 * Updated with correct appointment endpoints and better error handling
 */

import { apiGet, apiPost, apiPatch } from '../lib/api';
import { VERIFICATION } from '../constants/api';

// ─── Shared Types (1-to-1 with web) ──────────────────────────────────────────

export interface VerificationDetails {
  profileVerified:    boolean;
  socialVerified:     boolean;
  documentsVerified:  boolean;
  emailVerified:      boolean;
  phoneVerified:      boolean;
  lastVerified?:      string;
  verifiedBy?:        string;
  verificationNotes?: string;
}

export interface VerificationStatusResponse {
  success:             boolean;
  verificationStatus:  'none' | 'partial' | 'full';
  verificationDetails: VerificationDetails;
  verificationMessage: string;
  user: {
    _id?:      string;
    id?:       string;
    name:      string;
    email:     string;
    role:      string;
    avatar?:   string;
    headline?: string;
  };
}

/** Matches web VerificationRequestData */
export interface VerificationRequestData {
  verificationType: 'profile' | 'social' | 'document';
  description?:     string;
}

export interface VerificationRequestResponse {
  success: boolean;
  message: string;
  request: {
    userId:           string;
    verificationType: string;
    description?:     string;
    status:           string;
    requestedAt:      string;
  };
}

// ─── Appointment types (mirrors AppointmentModal.tsx) ────────────────────────

export interface AppointmentSlot {
  id:          string;
  startTime:   string;
  endTime:     string;
  isAvailable: boolean;
}

export interface AppointmentSlotsResponse {
  success: boolean;
  slots:   AppointmentSlot[];
}

/** Exact shape sent by web AppointmentModal handleSubmit */
export interface AppointmentRequest {
  userId:           string;
  fullName:         string;
  email:            string;
  phone:            string;
  verificationType: 'candidate' | 'freelancer' | 'company' | 'organization';
  appointmentDate:  string;   // ISO date string "YYYY-MM-DD"
  appointmentTime:  string;   // "HH:MM"
  additionalNotes?: string;
   role?: string;
}

export interface AppointmentResponse {
  success:     boolean;
  message:     string;
  appointment: {
    id:               string;
    appointmentDate:  string;
    appointmentTime:  string;
    verificationType: string;
    status:           string;
  };
}

export interface OfficeLocation {
  address:      string;
  workingHours: string;
  contactPhone: string;
}

// ─── Admin types (mirrors web UpdateVerificationRequest) ─────────────────────

export interface UpdateVerificationRequest {
  profileVerified?:    boolean;
  socialVerified?:     boolean;
  documentsVerified?:  boolean;
  verificationNotes?:  string;
  verificationStatus?: 'none' | 'partial' | 'full';
}

// ─── Fallback for unauthenticated / no-record state ──────────────────────────

export const VERIFICATION_FALLBACK: VerificationStatusResponse = {
  success:             true,
  verificationStatus:  'none',
  verificationDetails: {
    profileVerified:   false,
    socialVerified:    false,
    documentsVerified: false,
    emailVerified:     false,
    phoneVerified:     false,
  },
  verificationMessage: 'Not yet verified',
  user: { name: '', email: '', role: '' },
};

// Helper to get user ID from auth store user object
export const getUserId = (user: any): string | undefined => {
  return user?._id ?? user?.id ?? user?.userId;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const verificationService = {
  // ── Status endpoints ────────────────────────────────────────────────────────

  /** GET /verification/my-status */
  getMyStatus: async (): Promise<VerificationStatusResponse> => {
    try {
      const res = await apiGet<VerificationStatusResponse>(VERIFICATION.MY_STATUS);
      return res.data ?? VERIFICATION_FALLBACK;
    } catch (err: any) {
      // If 404 or 401, return fallback instead of throwing
      if (err?.response?.status === 404 || err?.response?.status === 401) {
        return VERIFICATION_FALLBACK;
      }
      throw err;
    }
  },

  /** GET /verification/status/:userId  (public) */
  getPublicStatus: async (userId: string): Promise<VerificationStatusResponse> => {
    try {
      const res = await apiGet<VerificationStatusResponse>(VERIFICATION.PUBLIC_STATUS(userId));
      return res.data ?? VERIFICATION_FALLBACK;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return VERIFICATION_FALLBACK;
      }
      throw err;
    }
  },

  // ── Request endpoints ───────────────────────────────────────────────────────

  /** POST /verification/request  — mirrors web requestVerification() */
  requestVerification: async (
    data: VerificationRequestData,
  ): Promise<VerificationRequestResponse> => {
    const res = await apiPost<VerificationRequestResponse>(VERIFICATION.REQUEST, data);
    return res.data;
  },

  // ── Appointment endpoints (mirrors web appointmentService) ──────────────────

  /** GET /verification/appointment/slots?date=&type= */
  getAvailableSlots: async (
    date: string,
    verificationType: string,
  ): Promise<AppointmentSlotsResponse> => {
    try {
      const res = await apiGet<AppointmentSlotsResponse>(
        `/verification/appointment/slots?date=${date}&type=${verificationType}`,
      );
      return res.data;
    } catch (err: any) {
      // If 404, return empty slots (will trigger mock fallback)
      if (err?.response?.status === 404) {
        return { success: true, slots: [] };
      }
      throw err;
    }
  },

  /** GET /verification/appointment/office-location */
  getOfficeLocation: async (): Promise<OfficeLocation> => {
    try {
      const res = await apiGet<{ success: boolean; location: OfficeLocation }>(
        '/verification/appointment/office-location',
      );
      return (
        res.data?.location ?? {
          address:      'Head Office, Verification Department\nBole Road, Addis Ababa, Ethiopia',
          workingHours: 'Monday – Friday, 9:00 AM – 5:00 PM',
          contactPhone: '+251 11 558 0000',
        }
      );
    } catch (err) {
      // Return default office location on error
      return {
        address:      'Head Office, Verification Department\nBole Road, Addis Ababa, Ethiopia',
        workingHours: 'Monday – Friday, 9:00 AM – 5:00 PM',
        contactPhone: '+251 11 558 0000',
      };
    }
  },

  /** POST /verification/appointment/book  — exact shape from AppointmentModal.tsx */
  bookAppointment: async (data: AppointmentRequest): Promise<AppointmentResponse> => {
    const res = await apiPost<AppointmentResponse>(
      '/verification/appointment/book',
      data,
    );
    return res.data;
  },

  // ── Admin endpoints (mirrors web UpdateVerificationRequest) ─────────────────

  /** PATCH /verification/update/:userId */
  updateVerification: async (
    userId: string,
    data: UpdateVerificationRequest,
  ): Promise<VerificationStatusResponse> => {
    const res = await apiPatch<VerificationStatusResponse>(
      `/verification/update/${userId}`,
      data,
    );
    return res.data;
  },

  // ── Pure helpers ────────────────────────────────────────────────────────────

  /** Mirrors web calculateVerificationProgress() */
  calculateProgress: (details: VerificationDetails): number => {
    const checks = [
      details.profileVerified,
      details.socialVerified,
      details.documentsVerified,
      details.emailVerified,
      details.phoneVerified,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  },

  /** Mirrors web getVerificationBadgeConfig() */
  getBadgeConfig: (status: 'none' | 'partial' | 'full') => {
    switch (status) {
      case 'full':
        return {
          label:   'Fully Verified',
          color:   '#10B981',
          bgColor: '#D1FAE5',
          icon:    'checkmark-circle' as const,
        };
      case 'partial':
        return {
          label:   'Partially Verified',
          color:   '#F59E0B',
          bgColor: '#FEF3C7',
          icon:    'alert-circle' as const,
        };
      case 'none':
      default:
        return {
          label:   'Not Verified',
          color:   '#EF4444',
          bgColor: '#FEE2E2',
          icon:    'close-circle' as const,
        };
    }
  },

  /** Mirrors web canRequestVerification() */
  canRequestVerification: (
    status: 'none' | 'partial' | 'full',
    lastVerified?: string,
  ): boolean => {
    if (status === 'full') return false;
    if (lastVerified) {
      const last         = new Date(lastVerified);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return last < thirtyDaysAgo;
    }
    return true;
  },
};