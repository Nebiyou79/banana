/**
 * authService.ts
 *
 * CRITICAL FIX HISTORY
 * ────────────────────
 * The backend registerUser controller does:
 *
 *   const { name, email, password, confirmPassword, role, promoCode } = req.body;
 *   if (password !== confirmPassword) → 400 "Passwords do not match"
 *
 * The old mobile service sent:
 *   { name, email, password, role, referralCode }          ← WRONG
 *
 * It never sent `confirmPassword` so the backend received undefined,
 * which never equals password → every register attempt returned 400.
 *
 * It also used `referralCode` but backend reads `promoCode` → referrals silently ignored.
 *
 * This file fixes both issues permanently.
 */

import api from '../lib/api';
import { AUTH } from '../constants/api';
import { setToken, setRole, setUserId, clearAll } from '../lib/storage';
import type { Role } from '../constants/roles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OtpData {
  email: string;
  otp: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  emailVerified?: boolean;
  company?: { _id: string; name: string } | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user?: AuthUser;
    token?: string;
    requiresVerification?: boolean;
    email?: string;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {

  /**
   * POST /auth/register
   *
   * Backend requires:
   *   name, email, password, confirmPassword  ← both required and must match
   *   role                                    ← must be one of the valid roles
   *   promoCode                               ← optional referral code (NOT referralCode)
   *
   * Backend ALWAYS responds with requiresVerification: true and sends an OTP email.
   * No token is returned here — token only arrives after verifyOtp().
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const payload = {
      name:            data.name,
      email:           data.email,
      password:        data.password,
      confirmPassword: data.password,      // ← THE FIX: backend requires this field
      role:            data.role,
      promoCode:       data.referralCode,  // ← THE FIX: backend reads promoCode not referralCode
    };

    const res = await api.post<AuthResponse>(AUTH.REGISTER, payload);

    // Registration never returns a token — do NOT try to persist anything here.
    // Token arrives only after OTP verification (verifyOtp below).
    return res.data;
  },

  /**
   * POST /auth/login
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.LOGIN, data);
    const { user, token } = res.data.data ?? {};
    if (token && user) {
      await setToken(token);
      await setRole(user.role);
      await setUserId(user._id);
    }
    return res.data;
  },

  /**
   * POST /auth/logout
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(AUTH.LOGOUT);
    } catch {
      // Always clear storage even if API call fails
    } finally {
      await clearAll();
    }
  },

  /**
   * GET /auth/me
   * Backend returns { success, data: { user: {...} } }
   */
  getCurrentUser: async (): Promise<AuthUser> => {
    const res = await api.get<{ success: boolean; data: { user: AuthUser } }>(AUTH.ME);
    return res.data.data.user;
  },

  /**
   * POST /auth/verify-otp
   * Called after registration. Backend returns user + token on success.
   */
  verifyOtp: async (data: OtpData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.VERIFY_OTP, data);
    const { user, token } = res.data.data ?? {};
    if (token && user) {
      await setToken(token);
      await setRole(user.role);
      await setUserId(user._id);
    }
    return res.data;
  },

  /**
   * POST /auth/resend-otp
   */
  resendOtp: async (email: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.RESEND_OTP, { email });
    return res.data;
  },

  /**
   * POST /auth/forgot-password
   */
  forgotPassword: async (data: ForgotPasswordData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.FORGOT_PASSWORD, data);
    return res.data;
  },

  /**
   * POST /auth/verify-reset-otp
   */
  verifyResetOtp: async (data: OtpData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.VERIFY_RESET_OTP, data);
    return res.data;
  },

  /**
   * POST /auth/reset-password
   *
   * Backend reads: { email, token, password, confirmPassword }
   * Our internal type uses: { email, otp, newPassword }
   * We map them here so the rest of the app keeps clean types.
   */
  resetPassword: async (data: ResetPasswordData): Promise<AuthResponse> => {
    const payload = {
      email:           data.email,
      token:           data.otp,           // backend reads "token"
      password:        data.newPassword,   // backend reads "password"
      confirmPassword: data.newPassword,   // backend validates match
    };
    const res = await api.post<AuthResponse>(AUTH.RESET_PASSWORD, payload);
    return res.data;
  },
};
