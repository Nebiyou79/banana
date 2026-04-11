import { create } from 'zustand';
import { getToken, setToken, setRole, setUserId, clearAll, getRole, getUserId } from '../lib/storage';
import { Role } from '../constants/roles';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  company?: { _id: string; name: string } | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setAuth: (user: AuthUser, token: string, role: Role) => Promise<void>;
  setUser: (user: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  hydrateFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token, role) => {
    await setToken(token);
    await setRole(role);
    await setUserId(user._id);
    set({ user, token, role, isAuthenticated: true, isLoading: false });
  },

  setUser: (partial) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial } });
    }
  },

  logout: async () => {
    await clearAll();
    set({ user: null, token: null, role: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  hydrateFromStorage: async () => {
    try {
      set({ isLoading: true });
      const [token, role] = await Promise.all([getToken(), getRole()]);
      if (token && role) {
        set({ token, role: role as Role, isAuthenticated: true });
      } else {
        set({ isAuthenticated: false });
      }
    } catch {
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));