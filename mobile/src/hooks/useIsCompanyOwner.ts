/**
 * mobile/src/hooks/useIsCompanyOwner.ts
 *
 * Single source of truth for "is the current user a company owner?".
 * Mirrors web: frontend/src/services/productService.ts → canManageProduct.
 *
 * Usage:
 *   const isOwner = useIsCompanyOwner();
 *   const isOwnerOf = useIsCompanyOwner(product); // product-aware check
 */
import { useAuthStore } from '../store/authStore';
import type { Product } from '../services/productService';

const extractProductCompanyId = (product: Product | null | undefined): string | null => {
  if (!product?.companyId) return null;
  if (typeof product.companyId === 'string') return product.companyId;
  return product.companyId._id ?? null;
};

const extractUserCompanyId = (
  user: { _id?: string; company?: { _id?: string } | string | null } | null | undefined,
): string | null => {
  if (!user) return null;
  if (typeof user.company === 'string' && user.company) return user.company;
  if (user.company && typeof user.company === 'object' && user.company._id) return user.company._id;
  return user._id ?? null;
};

export function useIsCompanyOwner(product?: Product | null): boolean {
  const { user } = useAuthStore();
  if (!user) return false;

  // Admin can manage anything
  if (user.role === 'admin') return true;
  if (user.role !== 'company') return false;

  // Generic "is the user a company-role at all" check (no product passed)
  if (product === undefined) return true;
  if (product === null) return false;

  const userCid = extractUserCompanyId(user);
  const prodCid = extractProductCompanyId(product);
  return !!userCid && !!prodCid && userCid === prodCid;
}