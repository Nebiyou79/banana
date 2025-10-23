// src/services/authService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler'; // ADD THIS IMPORT

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
  cvUrl?: string;
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
    requiresVerification?: boolean;
    email?: string;
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

export interface ResetPasswordDirectData {
  email: string;
  password: string;
  confirmPassword: string;
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
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('role', payload.role);
      localStorage.setItem('userId', payload.userId);
    } catch (error) {
      console.error('Error decoding token:', error);
      handleError(error, 'Failed to process authentication token');
    }
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }
};

// Error message mapping for user-friendly responses
const errorMessages: Record<string, string> = {
  'Invalid credentials': 'The email or password you entered is incorrect',
  'User not found': 'No account found with this email address',
  'Account not verified': 'Please verify your email before logging in',
  'Email not registered': 'No account found with this email address',
  'Email already exists': 'An account with this email already exists. Please try logging in.',
  'Password too weak': 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
  'Invalid email format': 'Please enter a valid email address',
  'Name is required': 'Please enter your full name',
  'Network Error': 'Cannot connect to server. Please check your internet connection.',
  'ECONNREFUSED': 'Cannot connect to server. Please make sure the backend is running.',
  'ECONNABORTED': 'Request timeout. Please try again.',
  'Internal server error': 'Server encountered an error. Please try again later.',
  '500': 'Server error. Please try again later.',
};

const getErrorMessage = (error: any): string => {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
    return errorMessages[error.code] || errorMessages[error.message] || 'Connection error';
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return errorMessages[error.code] || 'Request timeout';
  }

  // Server errors
  if (error.response?.status === 500) {
    return errorMessages['500'] || 'Internal server error';
  }

  // Backend error messages
  if (error.response?.data?.message) {
    return errorMessages[error.response.data.message] || error.response.data.message;
  }

  // Default error
  return error.message || 'An unexpected error occurred. Please try again.';
};

export const authService = {
  // Login user with enhanced error handling
login: async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', data, {
      timeout: 10000,
    });
    
    // If backend returns success: true
    if (response.data.success) {
      const { user, token } = response.data.data;
      setStoredToken(token);
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      handleSuccess('Login successful! Welcome back!');
      return response.data;
    } else {
      // If backend returns success: false with a message (like invalid credentials)
      const errorMessage = response.data.message || 'Login failed';
      
      // Show the toast notification
      handleError(errorMessage);
      
      // Return a structured error that won't cause runtime errors
      // This allows components to handle the error gracefully
      return {
        success: false,
        message: errorMessage,
        data: response.data.data || null,
        _isHandled: true // Flag to indicate we've already shown toast
      } as AuthResponse;
    }
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    handleError(errorMessage);
    
    // Return a structured error response instead of throwing
    return {
      success: false,
      message: errorMessage,
      data: null,
      _isHandled: true
    } as unknown as AuthResponse;
  }
},

  // Register user with enhanced error handling
register: async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    if (response.data.success) {
      // Handle OTP verification flow - no token yet
      if (response.data.data?.requiresVerification) {
        handleSuccess('Registration successful! Please check your email for verification code.');
        return response.data;
      }
      
      // Handle immediate login case (if backend returns token)
      const { user, token } = response.data.data;
      if (token) {
        setStoredToken(token);
      }
      handleSuccess('Registration successful! Your account has been created.');
      return response.data;
    } else {
      const errorMessage = response.data.message || 'Registration failed';
      handleError(errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    handleError(errorMessage);
    throw new Error(errorMessage);
  }
},

  // Logout user
  logout: async (): Promise<void> => {
    try {
      const token = getStoredToken();
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
      }
    } catch (error: any) {
      // Handle network errors gracefully
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        console.warn('Logout API unavailable, proceeding with client-side cleanup');
        handleInfo('Logged out successfully (offline mode)');
      } else {
        console.error('Logout error:', error);
        handleError(error, 'Error during logout');
      }
    } finally {
      setStoredToken(null);
      handleSuccess('Logged out successfully');
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      return response.data.data.user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        setStoredToken(null);
        handleError('Authentication failed. Please login again.');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorMessage = getErrorMessage(error);
      handleError(errorMessage);
      throw new Error(errorMessage);
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
    try {
      const response = await api.post<AuthResponse>('/auth/verify-otp', data);
      const { user, token } = response.data.data;
      setStoredToken(token);
      handleSuccess('OTP verified successfully!');
      return response.data;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      handleError(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Resend OTP
  resendOTP: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      handleSuccess('OTP sent successfully! Check your email.');
      return response.data;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      handleError(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/forgot-password', data);
      handleSuccess('Password reset instructions sent to your email.');
      return response.data;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      handleError(errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post('/auth/reset-password', data);
      handleSuccess('Password reset successfully! You can now login with your new password.');
      return response.data;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      handleError(errorMessage);
      throw new Error(errorMessage);
    }
  },

// Add this to your authService exports
resetPasswordDirect: async (data: ResetPasswordDirectData): Promise<{ 
  success: boolean; 
  message: string;
}> => {
  try {
    const response = await api.post('/auth/reset-password-direct', data);
    handleSuccess('Password reset successfully! You can now login with your new password.');
    return response.data;
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    handleError(errorMessage);
    throw new Error(errorMessage);
  }
},
// Verify reset OTP - enhanced response
verifyResetOTP: async (data: VerifyResetOTPData): Promise<{ 
  success: boolean; 
  message: string; 
  data?: { resetToken: string; email: string } 
}> => {
  try {
    const response = await api.post('/auth/verify-reset-otp', data);
    handleSuccess('OTP verified successfully! You can now reset your password.');
    return response.data;
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    handleError(errorMessage);
    throw new Error(errorMessage);
  }
},

// Reset password with token
resetPasswordWithToken: async (data: ResetPasswordWithTokenData): Promise<{ 
  success: boolean; 
  message: string;
  data?: { email: string }
}> => {
  try {
    const response = await api.post('/auth/reset-password', data);
    handleSuccess('Password reset successfully! You can now login with your new password.');
    return response.data;
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    handleError(errorMessage);
    throw new Error(errorMessage);
  }
},
};

function handleInfo(arg0: string) {
  throw new Error('Function not implemented.');
}
