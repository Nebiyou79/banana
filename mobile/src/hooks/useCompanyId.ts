/**
 * mobile/src/hooks/useCompanyId.ts
 *
 * Resolves the id the backend's /products/company/:id endpoint expects.
 * Backend (server/src/controllers/ProductController.js) accepts EITHER
 * Company._id OR User._id (it falls back via Company.findOne({ user })).
 *
 * Resolution priority — exactly mirrors frontend rule:
 *   1. user.company  (when stored as a string id)
 *   2. user.company._id  (when populated as an object)
 *   3. user._id  (last-resort fallback — backend accepts this)
 */
import { useAuthStore } from '../store/authStore';

export function useCompanyId(): string | null {
  const { user } = useAuthStore();
  if (!user) return null;
  if (typeof user.company === 'string' && user.company) return user.company;
  if (user.company && typeof user.company === 'object' && user.company._id) {
    return user.company._id;
  }
  return user._id ?? null;
}