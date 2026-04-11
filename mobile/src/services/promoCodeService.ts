/**
 * src/services/promoCodeService.ts
 * Referral / Promo Code — typed API layer.
 * Endpoints: /api/v1/promo-codes/*
 */

import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromoCodeBenefits {
  discountPercentage?: number;
  rewardPoints?: number;
  cashback?: number;
  freeMonths?: number;
}

export interface ReferralCodeInfo {
  code: string;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
}

export interface ReferralActivityEntry {
  id: string;
  user: string;
  email?: string;
  status: 'pending' | 'email_verified' | 'completed' | 'cancelled' | 'expired';
  date: string;
  rewardEarned: number;
}

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  successRate: string;
  rewardPoints: number;
  rewardBalance: number;
  totalRewardsEarned: number;
}

export interface ShareableLinks {
  link: string;
  text: string;
  emailSubject: string;
  emailBody: string;
  telegramMessage: string;
  whatsappMessage: string;
}

export interface ReferralStatsData {
  user: { name: string; email: string; memberSince: string };
  referralCode: ReferralCodeInfo;
  stats: ReferralStats;
  recentActivity: ReferralActivityEntry[];
  shareable: ShareableLinks;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LeaderboardEntry {
  _id?: string;
  name: string;
  email?: string;
  avatar?: string;
  totalReferrals: number;
  rewardPoints?: number;
}

export interface PromoValidationResult {
  success: boolean;
  message?: string;
  data?: {
    code: string;
    benefits: PromoCodeBenefits;
    referrer?: { id: string; name: string; code: string };
    expiresAt?: string;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const promoCodeService = {
  /** Validate any promo/referral code. Public — no auth required. */
  validatePromoCode: async (code: string): Promise<PromoValidationResult> => {
    const res = await api.post<PromoValidationResult>('/promo-codes/validate', { code });
    return res.data;
  },

  /** Generate a referral code for the authenticated user. */
  generateMyReferralCode: async (): Promise<ReferralCodeInfo> => {
    const res = await api.post<{ success: boolean; message: string; data: any }>(
      '/promo-codes/generate',
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to generate referral code');
    const d = res.data.data;
    return {
      code:      d.code,
      usedCount: d.usedCount ?? 0,
      maxUses:   d.maxUses ?? 100,
      isActive:  true,
    };
  },

  /** Get referral statistics for the authenticated user. */
  getMyReferralStats: async (page = 1, limit = 20): Promise<ReferralStatsData> => {
    const res = await api.get<{ success: boolean; data: ReferralStatsData }>(
      '/promo-codes/my-stats',
      { params: { page, limit } },
    );
    if (!res.data.success) throw new Error('Failed to fetch referral stats');
    return res.data.data;
  },

  /** Public leaderboard. */
  getLeaderboard: async (limit = 10): Promise<LeaderboardEntry[]> => {
    const res = await api.get<{ success: boolean; data: LeaderboardEntry[] }>(
      '/promo-codes/leaderboard',
      { params: { limit } },
    );
    if (!res.data.success) throw new Error('Failed to fetch leaderboard');
    return res.data.data;
  },
};