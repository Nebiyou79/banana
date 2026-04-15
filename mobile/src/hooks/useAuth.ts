/**
 * useAuth.ts
 *
 * React Query mutation/query hooks for all auth flows.
 *
 * Registration flow:
 *  1. User submits form → register.mutate(data)
 *  2. authService.register sends { name, email, password, confirmPassword, role, promoCode }
 *  3. Backend creates unverified user, sends OTP email
 *  4. Backend responds: { success: true, data: { email, requiresVerification: true } }
 *  5. useRegister navigates to OtpVerify with the email
 *  6. User enters OTP → verifyOtp.mutate({ email, otp })
 *  7. Backend returns { user, token }
 *  8. useVerifyOtp calls setAuth and resets nav to role dashboard
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  authService,
  LoginData,
  RegisterData,
  OtpData,
  ForgotPasswordData,
  ResetPasswordData,
} from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { Role } from '../constants/roles';
import { RootStackParamList } from '../navigation/RootNavigator';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type RootNav = NativeStackNavigationProp<RootStackParamList>;
type AuthNav  = NativeStackNavigationProp<AuthStackParamList>;

// ─── Helper ───────────────────────────────────────────────────────────────────

const getDashboardRoute = (role: Role): keyof RootStackParamList => {
  const map: Record<Role, keyof RootStackParamList> = {
    candidate:    'CandidateRoot',
    freelancer:   'FreelancerRoot',
    company:      'CompanyRoot',
    organization: 'OrganizationRoot',
    admin:        'CandidateRoot',
  };
  return map[role] ?? 'CandidateRoot';
};

/**
 * Pull the best human-readable message from an axios error.
 * Handles both network failures (no .response) and backend 4xx/5xx responses.
 */
const extractError = (err: unknown, fallback: string): string => {
  const e = err as any;
  if (!e) return fallback;
  if (!e.response) return 'Cannot reach the server. Check your network connection or API URL.';
  return e.response?.data?.message ?? fallback;
};

// ─── useLogin ─────────────────────────────────────────────────────────────────

export const useLogin = () => {
  const { setAuth }   = useAuthStore();
  const { showError } = useToast();
  const navigation    = useNavigation<RootNav>();

  return useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (res) => {
      if (res.success && res.data?.user && res.data?.token) {
        setAuth(res.data.user, res.data.token, res.data.user.role);
        navigation.reset({ index: 0, routes: [{ name: getDashboardRoute(res.data.user.role) }] });
      } else {
        showError(res.message || 'Login failed. Please try again.');
      }
    },
    onError: (err) => showError(extractError(err, 'Login failed. Please try again.')),
  });
};

// ─── useRegister ──────────────────────────────────────────────────────────────

export const useRegister = () => {
  const { showError, showSuccess } = useToast();
  const navigation = useNavigation<AuthNav>();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),

    onSuccess: (res) => {
      if (!res.success) {
        // Backend returned a 2xx with success:false (shouldn't normally happen)
        showError(res.message || 'Registration failed. Please try again.');
        return;
      }

      // Normal path — backend always sends requiresVerification: true
      if (res.data?.requiresVerification && res.data?.email) {
        showSuccess('Account created! Check your email for the verification code.');
        navigation.navigate('OtpVerify', { email: res.data.email });
        return;
      }

      // Fallback — if somehow a token came back immediately (dev mode, etc.)
      if (res.data?.user?.email) {
        navigation.navigate('OtpVerify', { email: res.data.user.email });
        return;
      }

      // Catch-all
      showError('Unexpected server response. Please try again.');
    },

    onError: (err) => showError(extractError(err, 'Registration failed. Please try again.')),
  });
};

// ─── useLogout ────────────────────────────────────────────────────────────────

export const useLogout = () => {
  const { logout }  = useAuthStore();
  const queryClient = useQueryClient();
  const navigation  = useNavigation<RootNav>();

  const doLogout = async () => {
    await logout();
    queryClient.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess:  doLogout,
    onError:    doLogout, // always clear local state even if API fails
  });
};

// ─── useCurrentUser ───────────────────────────────────────────────────────────

export const useCurrentUser = () => {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn:  async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    },
    enabled:   isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: (count, err: any) => {
      if (err?.response?.status === 401) return false;
      return count < 2;
    },
  });
};

// ─── useVerifyOtp ─────────────────────────────────────────────────────────────

export const useVerifyOtp = () => {
  const { setAuth }              = useAuthStore();
  const { showError, showSuccess } = useToast();
  const navigation               = useNavigation<RootNav>();

  return useMutation({
    mutationFn: (data: OtpData) => authService.verifyOtp(data),
    onSuccess: (res) => {
      if (res.success && res.data?.user && res.data?.token) {
        setAuth(res.data.user, res.data.token, res.data.user.role);
        showSuccess('Email verified! Welcome to Banana 🍌');
        navigation.reset({ index: 0, routes: [{ name: getDashboardRoute(res.data.user.role) }] });
      } else {
        showError(res.message || 'OTP verification failed. Please try again.');
      }
    },
    onError: (err) => showError(extractError(err, 'Invalid OTP. Please try again.')),
  });
};

// ─── useResendOtp ─────────────────────────────────────────────────────────────

export const useResendOtp = () => {
  const { showError, showSuccess } = useToast();

  return useMutation({
    mutationFn: (email: string) => authService.resendOtp(email),
    onSuccess: (res) => {
      if (res.success) showSuccess('A new code has been sent to your email.');
      else showError(res.message || 'Failed to resend code.');
    },
    onError: (err) => showError(extractError(err, 'Failed to resend code.')),
  });
};

// ─── useForgotPassword ───────────────────────────────────────────────────────

export const useForgotPassword = () => {
  const { showError } = useToast();

  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authService.forgotPassword(data),
    onError:    (err) => showError(extractError(err, 'Failed to send reset email.')),
  });
};

// ─── useVerifyResetOtp ───────────────────────────────────────────────────────

export const useVerifyResetOtp = () => {
  const { showError } = useToast();

  return useMutation({
    mutationFn: (data: OtpData) => authService.verifyResetOtp(data),
    onError:    (err) => showError(extractError(err, 'Invalid code. Please try again.')),
  });
};

// ─── useResetPassword ────────────────────────────────────────────────────────

export const useResetPassword = () => {
  const { showError, showSuccess } = useToast();
  const navigation = useNavigation<AuthNav>();

  return useMutation({
    mutationFn: (data: ResetPasswordData) => authService.resetPassword(data),
    onSuccess: (res) => {
      if (res.success) {
        showSuccess('Password reset successfully! You can now sign in.');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        showError(res.message || 'Failed to reset password.');
      }
    },
    onError: (err) => showError(extractError(err, 'Failed to reset password.')),
  });
};
