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
  // backend also returns these at root level on some error responses
  requiresVerification?: boolean;
  email?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {

  // ── Register ─────────────────────────────────────────────────────────────
  //
  // ROOT CAUSE OF "Passwords do not match" BUG:
  // The backend registerUser does:
  //   const { name, email, password, confirmPassword, role, promoCode } = req.body;
  //   if (password !== confirmPassword) → 400 "Passwords do not match"
  //
  // The old mobile code never sent `confirmPassword` at all, so the backend
  // received undefined, which !== password, causing the error on every register.
  //
  // Also: backend field for referral is `promoCode`, not `referralCode`.
  //
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const payload = {
      name:            data.name,
      email:           data.email,
      password:        data.password,
      confirmPassword: data.password,        // ← REQUIRED: backend validates this matches password
      role:            data.role,
      promoCode:       data.referralCode,    // ← REQUIRED: backend field is promoCode not referralCode
    };

    const res = await api.post<AuthResponse>(AUTH.REGISTER, payload);

    // Registration always enters OTP verification flow (requiresVerification: true).
    // No token is returned here. Token only arrives after verifyOtp().
    // We intentionally do NOT call setToken/setRole/setUserId here.
    return res.data;
  },

  // ── Login ────────────────────────────────────────────────────────────────
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

  // ── Logout ───────────────────────────────────────────────────────────────
  logout: async (): Promise<void> => {
    try {
      await api.post(AUTH.LOGOUT);
    } catch {
      // Always clear storage regardless of API failure
    } finally {
      await clearAll();
    }
  },

  // ── Get current user ─────────────────────────────────────────────────────
  // Backend returns { success: true, data: { user: { _id, name, email, role, ... } } }
  getCurrentUser: async (): Promise<AuthUser> => {
    const res = await api.get<{ success: boolean; data: { user: AuthUser } }>(AUTH.ME);
    return res.data.data.user;
  },

  // ── Verify OTP (email confirmation after register) ───────────────────────
  // On success backend returns: { success, data: { user, token } }
  // We persist token + role + userId immediately.
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

  // ── Resend OTP ───────────────────────────────────────────────────────────
  resendOtp: async (email: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.RESEND_OTP, { email });
    return res.data;
  },

  // ── Forgot password ──────────────────────────────────────────────────────
  forgotPassword: async (data: ForgotPasswordData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.FORGOT_PASSWORD, data);
    return res.data;
  },

  // ── Verify reset OTP ─────────────────────────────────────────────────────
  verifyResetOtp: async (data: OtpData): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(AUTH.VERIFY_RESET_OTP, data);
    return res.data;
  },

  // ── Reset password ────────────────────────────────────────────────────────
  // Backend field names differ from our internal types:
  //   - uses "token" not "otp"
  //   - uses "password" not "newPassword"
  //   - requires "confirmPassword"
  resetPassword: async (data: ResetPasswordData): Promise<AuthResponse> => {
    const payload = {
      email:           data.email,
      token:           data.otp,           // backend uses "token"
      password:        data.newPassword,   // backend uses "password"
      confirmPassword: data.newPassword,   // backend validates match
    };
    const res = await api.post<AuthResponse>(AUTH.RESET_PASSWORD, payload);
    return res.data;
  },
};