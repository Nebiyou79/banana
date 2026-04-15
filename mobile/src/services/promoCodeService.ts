/**
 * src/services/promoCodeService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Parity: Matches frontend/src/services/promoCodeService.ts field names and
 * endpoint paths. Fixes prior naming mismatches (promoCode → promo-codes,
 * snake_case → camelCase fields, etc.).
 *
 * Key alignments:
 *  - validatePromoCode  POST /promo-codes/validate       { code }
 *  - generateMyReferralCode POST /promo-codes/generate
 *  - getMyReferralStats  GET /promo-codes/my-stats
 *  - getLeaderboard      GET /promo-codes/leaderboard
 *  - getShareableContent — pure helper matching web getShareableContent()
 */

import api from '../lib/api';

// ─── Types (1-to-1 with web PromoCodeService) ────────────────────────────────

export interface PromoCodeBenefits {
  discountPercentage: number;
  rewardPoints:       number;
  cashback:           number;
  freeMonths:         number;
  customReward?:      string;
}

/** Matches web PromoCodeValidationResponse */
export interface PromoCodeValidationResponse {
  success: boolean;
  message: string;
  data: {
    code:      string;
    benefits:  PromoCodeBenefits;
    referrer?: { id: string; name: string; code: string };
    expiresAt?: string;
  };
}

export interface ReferralCodeInfo {
  code:      string;
  usedCount: number;
  maxUses:   number;
  isActive:  boolean;
}

export interface ReferralActivityEntry {
  id:          string;
  user:        string;
  email?:      string;
  status:      'pending' | 'email_verified' | 'completed' | 'cancelled' | 'expired';
  date:        string;
  rewardEarned: number;
}

export interface ReferralStats {
  totalReferrals:    number;
  completedReferrals: number;
  pendingReferrals:  number;
  successRate:       string;
  rewardPoints:      number;
  rewardBalance:     number;
  totalRewardsEarned: number;
}

export interface ShareableLinks {
  link:             string;
  text:             string;
  emailSubject:     string;
  emailBody:        string;
  telegramMessage:  string;
  whatsappMessage:  string;
}

/** Matches web ReferralStatsResponse.data shape */
export interface ReferralStatsData {
  user: {
    name:        string;
    email:       string;
    memberSince: string;
  };
  referralCode: ReferralCodeInfo;
  stats:        ReferralStats;
  recentActivity: ReferralActivityEntry[];
  shareable:    ShareableLinks;
  pagination: {
    currentPage: number;
    totalPages:  number;
    totalItems:  number;
    hasNext:     boolean;
    hasPrev:     boolean;
  };
}

export interface LeaderboardEntry {
  _id?:           string;
  name:           string;
  email?:         string;
  avatar?:        string;
  totalReferrals: number;
  rewardPoints?:  number;
}

/** Matches web GenerateCodeResponse.data */
export interface GenerateCodeData {
  code:          string;
  usedCount:     number;
  maxUses:       number;
  benefits:      PromoCodeBenefits;
  shareableLink: string;
  shareableText: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const promoCodeService = {
  /**
   * Validate any promo/referral code.
   * Matches: POST /promo-codes/validate  { code }
   */
  validatePromoCode: async (code: string): Promise<PromoCodeValidationResponse> => {
    const res = await api.post<PromoCodeValidationResponse>('/promo-codes/validate', { code });
    return res.data;
  },

  /**
   * Generate a referral code for the current user.
   * Matches: POST /promo-codes/generate
   * Returns normalised ReferralCodeInfo (same shape as web hook normalisation).
   */
  generateMyReferralCode: async (): Promise<{
    success: boolean;
    message: string;
    data: GenerateCodeData;
  }> => {
    const res = await api.post<{ success: boolean; message: string; data: GenerateCodeData }>(
      '/promo-codes/generate',
    );
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to generate referral code');
    return res.data;
  },

  /**
   * Get referral statistics for the current user.
   * Matches: GET /promo-codes/my-stats
   */
  getMyReferralStats: async (
    page  = 1,
    limit = 20,
  ): Promise<{ success: boolean; data: ReferralStatsData }> => {
    const res = await api.get<{ success: boolean; data: ReferralStatsData }>(
      '/promo-codes/my-stats',
      { params: { page, limit } },
    );
    if (!res.data.success) throw new Error('Failed to fetch referral stats');
    return res.data;
  },

  /**
   * Public leaderboard.
   * Matches: GET /promo-codes/leaderboard
   */
  getLeaderboard: async (limit = 10): Promise<LeaderboardEntry[]> => {
    const res = await api.get<{ success: boolean; data: LeaderboardEntry[] }>(
      '/promo-codes/leaderboard',
      { params: { limit } },
    );
    if (!res.data.success) throw new Error('Failed to fetch leaderboard');
    return res.data.data;
  },

  /**
   * Pure helper — mirrors web getShareableContent() exactly.
   * Matches web PromoCodeService.getShareableContent(code, platform)
   */
  getShareableContent: (
    code: string,
    platform: 'whatsapp' | 'telegram' | 'email' | 'copy',
  ): string => {
    const baseUrl = process.env.APP_URL ?? 'https://yourapp.com';
    const link    = `${baseUrl}/register?ref=${code}`;
    const text    = `Join me on this platform! Use my referral code: ${code}`;

    switch (platform) {
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      case 'email':
        return `mailto:?subject=${encodeURIComponent('Join me on this platform')}&body=${encodeURIComponent(text + '\n\n' + link)}`;
      case 'copy':
      default:
        return `${text}\n\n${link}`;
    }
  },
};
