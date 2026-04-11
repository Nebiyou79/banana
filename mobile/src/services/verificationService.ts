import { apiGet, apiPost } from '../lib/api';
import { VERIFICATION } from '../constants/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerificationDetails {
  profileVerified:   boolean;
  socialVerified:    boolean;
  documentsVerified: boolean;
  emailVerified:     boolean;
  phoneVerified:     boolean;
  lastVerified?:     string;
  verifiedBy?:       string;
  verificationNotes?: string;
}

export interface VerificationStatusResponse {
  success:             boolean;
  verificationStatus:  'none' | 'partial' | 'full';
  verificationDetails: VerificationDetails;
  verificationMessage: string;
  user: {
    id:        string;
    name:      string;
    email:     string;
    role:      string;
    avatar?:   string;
    headline?: string;
  };
}

export interface VerificationRequestData {
  verificationType: 'profile' | 'social' | 'document';
  description?:     string;
}

export interface VerificationRequestResponse {
  success: boolean;
  message: string;
  request: {
    userId:       string;
    verificationType: string;
    description?: string;
    status:       string;
    requestedAt:  string;
  };
}

// Fallback used when backend returns nothing (new user, no record yet)
export const VERIFICATION_FALLBACK: VerificationStatusResponse = {
  success:            true,
  verificationStatus: 'none',
  verificationDetails: {
    profileVerified:   false,
    socialVerified:    false,
    documentsVerified: false,
    emailVerified:     false,
    phoneVerified:     false,
  },
  verificationMessage: 'Not yet verified',
  user: { id: '', name: '', email: '', role: '' },
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const verificationService = {
  // GET /verification/my-status
  // NOTE: backend returns the fields at root level, not nested under .data
  getMyStatus: async (): Promise<VerificationStatusResponse> => {
    const res = await apiGet<VerificationStatusResponse>(VERIFICATION.MY_STATUS);
    return res.data ?? VERIFICATION_FALLBACK;
  },

  // GET /verification/status/:userId  (public)
  getPublicStatus: async (userId: string): Promise<VerificationStatusResponse> => {
    const res = await apiGet<VerificationStatusResponse>(VERIFICATION.PUBLIC_STATUS(userId));
    return res.data ?? VERIFICATION_FALLBACK;
  },

  // POST /verification/request
  requestVerification: async (data: VerificationRequestData): Promise<VerificationRequestResponse> => {
    const res = await apiPost<VerificationRequestResponse>(VERIFICATION.REQUEST, data);
    return res.data;
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  getBadgeConfig: (status: 'none' | 'partial' | 'full') => {
    switch (status) {
      case 'full':
        return { label: 'Fully Verified', color: '#10B981', icon: 'checkmark-circle' };
      case 'partial':
        return { label: 'Partially Verified', color: '#F59E0B', icon: 'alert-circle' };
      case 'none':
      default:
        return { label: 'Not Verified', color: '#EF4444', icon: 'close-circle' };
    }
  },

  canRequestVerification: (
    status: 'none' | 'partial' | 'full',
    lastVerified?: string
  ): boolean => {
    if (status === 'full') return false;
    if (lastVerified) {
      const last = new Date(lastVerified);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return last < thirtyDaysAgo;
    }
    return true;
  },
};
