/**
 * mobile/src/context/AuthContext.tsx
 * Role-Based-Navigator: AuthContext drives all navigation decisions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiPost, apiGet } from '../lib/api';

export type UserRole = 'candidate' | 'company' | 'organization' | 'admin'|'freelancer';

export interface AuthUser {
  _id:       string;
  name:      string;
  email:     string;
  role:      UserRole;
  avatar?:   string;
  phone?:    string;
  isVerified?: boolean;
  company?:    { _id: string; name: string; logoUrl?: string };
  organization?: { _id: string; name: string; logoUrl?: string };
}

interface AuthState {
  user:       AuthUser | null;
  token:      string | null;
  isLoading:  boolean;
  isLoggedIn: boolean;
}

interface AuthContextValue extends AuthState {
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null, token: null, isLoading: true, isLoggedIn: false,
  });

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          const res = await apiGet<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
          setState({ user: res.data.data.user, token, isLoading: false, isLoggedIn: true });
        } else {
          setState(s => ({ ...s, isLoading: false }));
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        setState(s => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<{ success: boolean; token: string; data: { user: AuthUser } }>(
      '/auth/login', { email, password }
    );
    const { token, data } = res.data;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setState({ user: data.user, token, isLoading: false, isLoggedIn: true });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setState({ user: null, token: null, isLoading: false, isLoggedIn: false });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
      setState(s => ({ ...s, user: res.data.data.user }));
    } catch { /* silent */ }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};