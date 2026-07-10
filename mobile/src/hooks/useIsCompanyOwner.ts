/**
 * mobile/src/hooks/useIsCompanyOwner.ts  (FIXED v4)
 *
 * KEY CHANGES FROM v3
 * ───────────────────
 * • Now returns { isOwner, isReady, isAuthenticated } via overload so callers
 *   can distinguish "not ready yet" from "definitively not an owner".
 * • Default export (no args / no product) returns boolean for backward compat.
 *
 * ROOT CAUSE THIS FIXES
 * ─────────────────────
 * v3 returned false immediately when user===null, even before checking isReady.
 * The screen was therefore showing "Company access only" wall when the real
 * situation was "auth store hydrated but user is null → not logged in".
 * With v4 the screen can branch correctly: not ready → spinner,
 * not authenticated → login prompt, not owner → access wall.
 */

import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCompanyId } from './useCompanyId';

interface MinimalProduct {
  companyId?: string | { _id?: string } | null;
}

export interface IsCompanyOwnerResult {
  isOwner: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
}

// ── Overloads ─────────────────────────────────────────────────────────────────

/** Backward-compat: checks "is current user a company owner?" → boolean */
export function useIsCompanyOwner(product?: null): boolean;
/** With a product: "does this user own this product?" → boolean */
export function useIsCompanyOwner(product: MinimalProduct): boolean;
/** Full result with ready + auth flags (pass true to opt in) */
export function useIsCompanyOwner(withResult: true): IsCompanyOwnerResult;

export function useIsCompanyOwner(
  arg?: MinimalProduct | null | true,
): boolean | IsCompanyOwnerResult {
  const { user } = useAuthStore();
  const { companyId, isReady, isAuthenticated } = useCompanyId(true);

  const withResult = arg === true;
  const product = arg === true ? undefined : (arg as MinimalProduct | null | undefined);

  const isOwner = useMemo(() => {
    if (!user) return false;

    // ── Mode 1: No product — is user a company owner? ──────────────────────
    if (!product) {
      if (user.role === 'company') return true;
      if ((user as any).hasCompanyProfile === true) return true;
      if (companyId !== null) return true;
      return false;
    }

    // ── Mode 2: Does user own this specific product? ────────────────────────
    if (!companyId) return false;

    const ownerRaw = product.companyId;
    const ownerId =
      typeof ownerRaw === 'string'
        ? ownerRaw
        : ownerRaw && typeof ownerRaw === 'object' && '_id' in ownerRaw
        ? (ownerRaw as { _id?: string })._id ?? ''
        : '';

    return !!ownerId && ownerId === companyId;
  }, [user, product, companyId]);

  if (withResult) {
    return { isOwner, isReady, isAuthenticated };
  }
  return isOwner;
}