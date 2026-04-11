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
type AuthNav = NativeStackNavigationProp<AuthStackParamList>;

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
 * Extract the most useful error message from an axios error or response.
 * Covers: network errors, 4xx backend messages, and fallback strings.
 */
const getErrorMessage = (err: any, fallback: string): string => {
  // Network / no response (device can't reach server)
  if (!err?.response) {
    return 'Cannot reach the server. Check your internet connection or API URL.';
  }
  // Backend returned a structured error message
  return err.response?.data?.message ?? fallback;
};

// ─── useLogin ─────────────────────────────────────────────────────────────────
export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const { showError } = useToast();
  const navigation = useNavigation<RootNav>();

  return useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (res) => {
      if (res.success && res.data?.user && res.data?.token) {
        setAuth(res.data.user, res.data.token, res.data.user.role);
        const route = getDashboardRoute(res.data.user.role);
        navigation.reset({ index: 0, routes: [{ name: route }] });
      } else {
        // Backend returned success:false (e.g. unverified email)
        showError(res.message || 'Login failed');
      }
    },
    onError: (err: any) => {
      showError(getErrorMessage(err, 'Login failed. Please try again.'));
    },
  });
};

// ─── useRegister ──────────────────────────────────────────────────────────────
//
// Registration flow:
//   1. User fills form → POST /auth/register (with confirmPassword + promoCode)
//   2. Backend creates unverified user, sends OTP email
//   3. Backend responds: { success: true, data: { email, requiresVerification: true } }
//   4. We navigate to OtpVerify with the email
//   5. User enters OTP → POST /auth/verify-otp → receives token + user
//   6. useVerifyOtp sets auth and navigates to role's dashboard
//   7. RoleSelectScreen is shown when user wants to change role (optional)
//
export const useRegister = () => {
  const { showError, showSuccess } = useToast();
  const navigation = useNavigation<AuthNav>();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (res) => {
      if (!res.success) {
        showError(res.message || 'Registration failed');
        return;
      }

      // Normal path: backend always returns requiresVerification: true
      // Email is in res.data.email
      if (res.data?.requiresVerification && res.data?.email) {
        showSuccess('Account created! Check your email for the verification code.');
        navigation.navigate('OtpVerify', { email: res.data.email });
        return;
      }

      // Edge case: backend returned a token immediately (shouldn't happen but handle it)
      // This would mean email verification was bypassed (dev mode, etc.)
      if (res.data?.user && res.data?.token) {
        // We can't call setAuth here easily without importing store in hook,
        // so just navigate to OTP. In practice this path never triggers.
        navigation.navigate('OtpVerify', { email: res.data.user.email });
        return;
      }

      // Fallback: if we got success but no useful data, show error
      showError('Unexpected response from server. Please try again.');
    },
    onError: (err: any) => {
      showError(getErrorMessage(err, 'Registration failed. Please try again.'));
    },
  });
};

// ─── useLogout ────────────────────────────────────────────────────────────────
export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const navigation = useNavigation<RootNav>();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      await logout();
      queryClient.clear();
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    },
    onError: async () => {
      // Even if API call fails, always clear local state and redirect
      await logout();
      queryClient.clear();
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    },
  });
};

// ─── useCurrentUser ───────────────────────────────────────────────────────────
export const useCurrentUser = () => {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: (count, err: any) => {
      if (err?.response?.status === 401) return false;
      return count < 2;
    },
  });
};

// ─── useVerifyOtp ─────────────────────────────────────────────────────────────
//
// After OTP verification the backend returns token + user.
// We then navigate to the role-specific dashboard (not RoleSelect).
// RoleSelect is only shown to existing users wanting to change their role.
//
export const useVerifyOtp = () => {
  const { setAuth } = useAuthStore();
  const { showError, showSuccess } = useToast();
  const navigation = useNavigation<RootNav>();

  return useMutation({
    mutationFn: (data: OtpData) => authService.verifyOtp(data),
    onSuccess: (res) => {
      if (res.success && res.data?.user && res.data?.token) {
        setAuth(res.data.user, res.data.token, res.data.user.role);
        showSuccess('Email verified! Welcome to Banana 🍌');
        const route = getDashboardRoute(res.data.user.role);
        navigation.reset({ index: 0, routes: [{ name: route }] });
      } else {
        showError(res.message || 'OTP verification failed');
      }
    },
    onError: (err: any) => {
      showError(getErrorMessage(err, 'Invalid OTP. Please try again.'));
    },
  });
};

// ─── useResendOtp ─────────────────────────────────────────────────────────────
export const useResendOtp = () => {
  const { showError, showSuccess } = useToast();

  return useMutation({
    mutationFn: (email: string) => authService.resendOtp(email),
    onSuccess: (res) => {
      if (res.success) {
        showSuccess('A new OTP has been sent to your email.');
      } else {
        showError(res.message || 'Failed to resend OTP.');
      }
    },
    onError: (err: any) => {
      showError(getErrorMessage(err, 'Failed to resend OTP.'));
    },
  });
};

// ─── useForgotPassword ───────────────────────────────────────────────────────
export const useForgotPassword = () => {
  const { showError } = useToast();

  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authService.forgotPassword(data),
    onError: (err: any) => {
      showError(getErrorMessage(err, 'Failed to send reset email.'));
    },
  });
};

// ─── useVerifyResetOtp ───────────────────────────────────────────────────────
export const useVerifyResetOtp = () => {
  const { showError } = useToast();

  return useMutation({
    mutationFn: (data: OtpData) => authService.verifyResetOtp(data),
    onError: (err: any) => {
      showError(getErrorMessage(err, 'Invalid OTP. Please try again.'));
    },
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
        showSuccess('Password reset successfully! You can now log in.');
        // Navigate back to login after successful reset
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        showError(res.message || 'Failed to reset password.');
      }
    },
    onError: (err: any) => {
      showError(getErrorMessage(err, 'Failed to reset password.'));
    },
  });
};