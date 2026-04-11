/**
 * src/hooks/usePromoCode.ts
 * React Query hooks for referral / promo-code feature.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promoCodeService } from '../services/promoCodeService';
import toast from '../lib/toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const PROMO_KEYS = {
  stats:       ['promo', 'stats']              as const,
  leaderboard: (limit: number) => ['promo', 'leaderboard', limit] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Authenticated user's referral statistics. */
export const useMyReferralStats = (page = 1) =>
  useQuery({
    queryKey: PROMO_KEYS.stats,
    queryFn:  () => promoCodeService.getMyReferralStats(page),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

/** Public leaderboard. */
export const useLeaderboard = (limit = 10) =>
  useQuery({
    queryKey: PROMO_KEYS.leaderboard(limit),
    queryFn:  () => promoCodeService.getLeaderboard(limit),
    staleTime: 10 * 60 * 1000,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Generate a referral code for the current user (one-time operation). */
export const useGenerateReferralCode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promoCodeService.generateMyReferralCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROMO_KEYS.stats });
      toast.success('Your referral code is ready!');
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Failed to generate referral code.');
    },
  });
};

/**
 * Validate a promo / referral code.
 * Does NOT auto-toast — let the calling screen handle result display.
 */
export const useValidatePromoCode = () =>
  useMutation({
    mutationFn: (code: string) => promoCodeService.validatePromoCode(code),
    // No onSuccess/onError toast — caller drives the UX
  });