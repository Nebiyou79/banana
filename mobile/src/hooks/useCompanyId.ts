/**
 * mobile/src/hooks/useCompanyId.ts  (FIXED v6 — minimal patch)
 *
 * ROOT CAUSE OF ALL PREVIOUS FAILURES
 * ─────────────────────────────────────
 * The ?? chain for isReady was:
 *   authStore.isHydrated ?? authStore._hasHydrated ?? authStore.hasHydrated ?? (user !== undefined)
 *
 * None of isHydrated / _hasHydrated / hasHydrated existed in the store.
 * All resolved to undefined. The ?? chain hit the final fallback:
 *   user !== undefined
 * user is null (not undefined) after hydration, so null !== undefined = TRUE.
 * → isReady = true, companyId = null
 * → enabled = true && !!'' = false... BUT
 * → enabled = undefined && !!'' = undefined (when isReady was undefined earlier)
 * → React Query treated undefined as enabled → query fired with empty companyId → 500
 *
 * THE FIX (two lines changed):
 * 1. Read authStore.isHydrated and authStore.isLoading directly.
 *    authStore now exports isHydrated (boolean, starts false).
 * 2. isReady = isHydrated && !isLoading
 *    This is FALSE during boot (isHydrated=false) and stays false while
 *    useCurrentUser is fetching /auth/me (isLoading=true).
 *    It becomes TRUE only after both hydration and user-fetch are complete.
 *
 * Also adds isAuthenticated to UseCompanyIdResult for screen branching.
 */

import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { debugAuthStore, debugCompanyId } from '../utils/productDebug';

export interface UseCompanyIdResult {
  companyId: string | null;
  /**
   * True once hydration + user fetch are both complete.
   * While false, companyId=null means "unknown" not "definitely no company".
   */
  isReady: boolean;
  /**
   * Mirrors authStore.isAuthenticated — token found + not logged out.
   */
  isAuthenticated: boolean;
}

// ── Pure resolver (no hooks, safe anywhere) ───────────────────────────────────

export function resolveCompanyId(user: any): string | null {
  if (!user) return null;

  // Priority 1: company is a plain ObjectId string
  if (typeof user.company === 'string' && user.company.trim()) {
    return user.company.trim();
  }

  // Priority 2: company is a populated object { _id, name, ... }
  if (
    user.company &&
    typeof user.company === 'object' &&
    '_id' in user.company &&
    typeof (user.company as { _id: string })._id === 'string' &&
    (user.company as { _id: string })._id.trim()
  ) {
    return (user.company as { _id: string })._id.trim();
  }

  // Priority 3: user.role === 'company' but company field not populated.
  if (user.role === 'company' && user._id) {
    return user._id;
  }

  return null;
}

// ── Overloads ─────────────────────────────────────────────────────────────────

/** Backward-compat: returns string | null */
export function useCompanyId(): string | null;
/** Full result with ready + auth flags */
export function useCompanyId(withReady: true): UseCompanyIdResult;

export function useCompanyId(withReady?: true): string | null | UseCompanyIdResult {
  // Read the three signals we need directly from the store
  const { user, isLoading, isHydrated, isAuthenticated } = useAuthStore();

  // ── isReady: BOTH conditions must be true ─────────────────────────────────
  // isHydrated = AsyncStorage read is done (set in authStore.hydrateFromStorage finally)
  // !isLoading = useCurrentUser fetch is done (set in authStore.setUser)
  //
  // This is a boolean expression — never undefined, never null.
  // React Query's `enabled` field receiving a real boolean is critical.
  const isReady: boolean = isHydrated === true && isLoading === false;

  const companyId = useMemo(() => resolveCompanyId(user), [user]);

  if (__DEV__) {
    debugAuthStore(user, isReady);
    debugCompanyId(companyId, isReady);
  }

  if (withReady) {
    return { companyId, isReady, isAuthenticated };
  }
  return companyId;
}