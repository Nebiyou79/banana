/**
 * src/hooks/usePromoCode.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React Query hooks for the Referral / Promo Code module.
 * Parity: matches web PromoCodeDashboard hook usage exactly.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promoCodeService } from '../services/promoCodeService';
import toast from '../lib/toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const PROMO_KEYS = {
  stats:       ['promo', 'stats']                    as const,
  leaderboard: (limit: number) => ['promo', 'leaderboard', limit] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Current user's referral statistics + activity. */
export const useMyReferralStats = (page = 1) =>
  useQuery({
    queryKey: PROMO_KEYS.stats,
    queryFn:  () => promoCodeService.getMyReferralStats(page),
    staleTime: 5 * 60 * 1000,
    retry:    1,
    select:   (res) => res.data,   // unwrap to ReferralStatsData directly
  });

/** Public referral leaderboard. */
export const useLeaderboard = (limit = 10) =>
  useQuery({
    queryKey: PROMO_KEYS.leaderboard(limit),
    queryFn:  () => promoCodeService.getLeaderboard(limit),
    staleTime: 10 * 60 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Generate referral code for current user (one-time).
 * Mirrors web generateCode() handler in PromoCodeDashboard.
 */
export const useGenerateReferralCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promoCodeService.generateMyReferralCode,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: PROMO_KEYS.stats });
      toast.success(res.message ?? 'Your referral code is ready!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to generate referral code.');
    },
  });
};

/**
 * Validate a promo / referral code.
 * Uses useMutation (not useQuery) so validation is triggered on demand.
 * Caller drives success/error UX — no auto-toast here (mirrors web behaviour).
 */
export const useValidatePromoCode = () =>
  useMutation({
    mutationFn: (code: string) => promoCodeService.validatePromoCode(code),
  });
