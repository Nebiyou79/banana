/**
 * src/store/authStore.ts  (FIXED — minimal patch)
 *
 * THREE TARGETED CHANGES only. Everything else is identical to the original.
 *
 * 1. Added `isHydrated: boolean` (starts false).
 *    Set to true in hydrateFromStorage finally-block.
 *    useCompanyId reads this instead of guessing via ?? chain.
 *
 * 2. setUser() now also sets isLoading:false.
 *    After boot: hydrateFromStorage leaves isLoading=true (token found),
 *    useCurrentUser fetches /auth/me → setUser() is called → isLoading=false.
 *    Without this, isLoading stayed true after setUser() and screens spun forever.
 *    IMPORTANT: also handles user===null case (sets user even when current=null).
 *
 * 3. hydrateFromStorage: does NOT set isLoading=false in finally when a token
 *    was found. isLoading stays true until setUser() resolves it (see above).
 *    If no token → isLoading=false immediately (nothing to fetch).
 */

import { create } from 'zustand';
import {
  getToken, setToken, setRole, setUserId,
  clearAll, getRole, getUserId,
} from '../lib/storage';
import { Role } from '../constants/roles';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  company?: string | { _id: string; name: string } | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** NEW: true once hydrateFromStorage() has fully run (regardless of outcome). */
  isHydrated: boolean;
  // Actions
  setAuth:            (user: AuthUser, token: string, role: Role) => Promise<void>;
  setUser:            (user: Partial<AuthUser>) => void;
  logout:             () => Promise<void>;
  setLoading:         (loading: boolean) => void;
  hydrateFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  token:           null,
  role:            null,
  isAuthenticated: false,
  isLoading:       true,
  isHydrated:      false,   // ← NEW

  // ── setAuth: called by login / OTP verify ────────────────────────────────
  setAuth: async (user, token, role) => {
    await setToken(token);
    await setRole(role);
    await setUserId(user._id);
    set({ user, token, role, isAuthenticated: true, isLoading: false, isHydrated: true });
  },

  // ── setUser: called by useCurrentUser after fetching /auth/me ────────────
  // FIX: always set user (even when current===null) and always clear isLoading.
  setUser: (partial) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial }, isLoading: false });
    } else {
      // current is null: token existed but user was never populated.
      // Cast is safe — useCurrentUser always passes the full AuthUser object.
      set({ user: partial as AuthUser, isLoading: false });
    }
  },

  // ── logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    await clearAll();
    set({ user: null, token: null, role: null,
          isAuthenticated: false, isLoading: false, isHydrated: true });
  },

  setLoading: (isLoading) => set({ isLoading }),

  // ── hydrateFromStorage: runs once at app boot ────────────────────────────
  // FIX: when a token is found, do NOT clear isLoading in finally —
  // leave it true so the spinner shows while useCurrentUser fetches /auth/me.
  // setUser() will flip it to false once the user object arrives.
  // When no token → set isLoading:false immediately (nothing to fetch).
  hydrateFromStorage: async () => {
    let tokenFound = false;
    try {
      set({ isLoading: true });
      const [token, role] = await Promise.all([getToken(), getRole()]);
      if (token && role) {
        tokenFound = true;
        set({ token, role: role as Role, isAuthenticated: true });
        // isLoading stays true — cleared by setUser() after /auth/me returns
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    } finally {
      // Mark hydration complete regardless of outcome.
      // If token was found, keep isLoading=true; setUser() will clear it.
      set({ isHydrated: true });
    }
  },
}));