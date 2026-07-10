/**
 * useAuth.ts  (FIXED — minimal patch)
 *
 * ONE CHANGE: useCurrentUser
 *
 * Problem: if /auth/me returns 401 or network error after boot,
 * setUser() is never called → isLoading stays true forever →
 * every screen shows a spinner indefinitely.
 *
 * Fix: wrap queryFn to catch errors and call setLoading(false) before
 * rethrowing, so isLoading is always cleared even on failure.
 * On 401 specifically, also call logout() to wipe the stale token.
 *
 * Everything else is identical to the original.
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
        showError(res.message || 'Registration failed. Please try again.');
        return;
      }
      if (res.data?.requiresVerification && res.data?.email) {
        showSuccess('Account created! Check your email for the verification code.');
        navigation.navigate('OtpVerify', { email: res.data.email });
        return;
      }
      if (res.data?.user?.email) {
        navigation.navigate('OtpVerify', { email: res.data.user.email });
        return;
      }
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
    onError:    doLogout,
  });
};

// ─── useCurrentUser ───────────────────────────────────────────────────────────

export const useCurrentUser = () => {
  const { isAuthenticated, setUser, setLoading, logout } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn:  async () => {
      try {
        const user = await authService.getCurrentUser();
        // setUser now also sets isLoading:false (see authStore fix)
        setUser(user);
        return user;
      } catch (err: any) {
        // Always release the isLoading lock so screens don't spin forever.
        // On 401: wipe the stale token so app redirects to login.
        if (err?.response?.status === 401) {
          await logout();
        } else {
          setLoading(false);
        }
        throw err; // let React Query record the error
      }
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
  const { setAuth }                = useAuthStore();
  const { showError, showSuccess } = useToast();
  const navigation                 = useNavigation<RootNav>();

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