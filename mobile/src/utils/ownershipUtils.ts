/**
 * mobile/src/utils/ownershipUtils.ts
 *
 * FIXES IN THIS VERSION
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaced the loose `MinimalUser` interface with the real `AuthUser` type
 * from AuthContext so the helpers are consistent with useProducts.ts and
 * TypeScript stops complaining about unknown property access.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHY THIS FILE EXISTS
 * ─────────────────────
 * user.company arrives from the API in three possible shapes:
 *   (a) populated object  → { _id: string; name: string; logoUrl?: string }
 *   (b) bare MongoDB id   → "64f3a1b2c8e9d00012345abc"
 *   (c) null / undefined  → user has no company profile yet
 *
 * product.companyId can be:
 *   (a) populated object  → { _id: string; name: string; ... }
 *   (b) bare MongoDB id   → "64f3a1b2c8e9d00012345abc"
 *
 * USAGE
 * ──────
 * import { resolveIsOwner } from '../../utils/ownershipUtils';
 * import { useAuthStore }   from '../../store/authStore';
 * import type { AuthUser }  from '../../context/AuthContext';
 * import { useProduct }     from '../../hooks/useProducts';
 *
 * const user    = (useAuthStore().user ?? null) as AuthUser | null;
 * const { data: product } = useProduct(productId);
 * const isOwner = resolveIsOwner(user, product ?? null);
 *
 * // Gate owner-only UI:
 * {isOwner && <OwnerActionBar ... />}
 * // Gate save/contact UI (public only):
 * {!isOwner && <ContactSellerButton ... />}
 */

import type { AuthUser } from '../context/AuthContext';
import type { Product, ProductCompany } from '../services/productService';

// ── Resolve helpers ────────────────────────────────────────────────────────────

/**
 * Extract the company _id string from user.company regardless of runtime shape.
 * Returns '' if the user has no company or the value is unresolvable.
 */
export function resolveUserCompanyId(user: AuthUser | null | undefined): string {
  if (!user?.company) return '';

  // Populated object shape → { _id: string; name: string; logoUrl?: string }
  if (typeof user.company === 'object' && '_id' in user.company) {
    return (user.company as { _id: string })._id ?? '';
  }

  // Bare string id
  if (typeof user.company === 'string') return user.company;

  return '';
}

/**
 * Extract the company _id string from product.companyId regardless of shape.
 * Returns '' if the product has no companyId.
 */
export function resolveProductCompanyId(product: Product | null | undefined): string {
  if (!product?.companyId) return '';

  if (typeof product.companyId === 'string') {
    return product.companyId;
  }

  if (typeof product.companyId === 'object' && '_id' in product.companyId) {
    return (product.companyId as ProductCompany)._id ?? '';
  }

  return '';
}

/**
 * Returns true when the logged-in user is the owner of the given product.
 *
 * Rules:
 *  - user must have a resolvable company id
 *  - product must have a resolvable company id
 *  - both ids must be non-empty strings that are strictly equal
 *
 * Import and call this everywhere rather than duplicating the id-comparison logic.
 */
export function resolveIsOwner(
  user: AuthUser | null | undefined,
  product: Product | null | undefined,
): boolean {
  const userCompanyId    = resolveUserCompanyId(user);
  const productCompanyId = resolveProductCompanyId(product);

  if (!userCompanyId || !productCompanyId) return false;

  return userCompanyId === productCompanyId;
}