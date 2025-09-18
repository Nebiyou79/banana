/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'candidate' | 'freelancer' | 'company' | 'organization' | 'admin';
  verificationStatus: 'none' | 'partial' | 'full';
  profileCompleted: boolean;
  lastLogin?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  skills: string[];
  education?: any[];
  experience?: any[];
  cvUrl?: string; // Add this line
  company?: string;
  hasCompanyProfile?: boolean;
  savedJobs?: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'candidate' | 'freelancer' | 'company' | 'organization';
}
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    requiresVerification: boolean;
  };
}
export interface VerifyResetOTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordWithTokenData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

// Helper function to safely access localStorage
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const setStoredToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('token', token);
    // Store user role from token payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('role', payload.role);
      localStorage.setItem('userId', payload.userId);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  }
};

export const authService = {
  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const { user, token } = response.data.data;
    
    setStoredToken(token);
    return response.data;
  },

  // Register user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { user, token } = response.data.data;
    
    setStoredToken(token);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      const token = getStoredToken();
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setStoredToken(null);
    }
  },

  // Get current user - FIXED: Handle 401 errors properly
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      return response.data.data.user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Clear invalid token
        setStoredToken(null);
        throw new Error('Authentication failed');
      }
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!getStoredToken();
  },

  // Get user role from token
  getUserRole: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('role');
  },

  // Get user ID from token
  getUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userId');
  },

  // Get stored token
  getToken: (): string | null => {
    return getStoredToken();
  },
  // Verify OTP
  verifyOTP: async (data: VerifyOTPData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-otp', data);
    const { user, token } = response.data.data;
    
    setStoredToken(token);
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
 // Verify reset OTP
  verifyResetOTP: async (data: VerifyResetOTPData): Promise<{ 
    success: boolean; 
    message: string; 
    data?: { resetToken: string; email: string } 
  }> => {
    const response = await api.post('/auth/verify-reset-otp', data);
    return response.data;
  },

  // Reset password with token
  resetPasswordWithToken: async (data: ResetPasswordWithTokenData): Promise<{ 
    success: boolean; 
    message: string 
  }> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};