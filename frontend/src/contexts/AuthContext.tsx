/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginData, RegisterData, User } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { handleError, handleSuccess } from '@/lib/error-handler'; // ADD THIS IMPORT

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user?: User;
    token?: string;
    requiresVerification?: boolean;
    email?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth',
  '/terms',
  '/privacy'
];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Convert runtime error to toast notification
    if (typeof window !== 'undefined') {
      handleError('useAuth must be used within an AuthProvider');
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get initial auth state from localStorage
  const getInitialAuthState = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    return !!token;
  };

  const [hasToken, setHasToken] = useState(getInitialAuthState());

  const {
    data: user,
    isLoading: userLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await authService.getCurrentUser();
      } catch (error: any) {
        handleError('Session expired. Please login again.');
        throw error;
      }
    },
    enabled: hasToken && isInitialized,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        handleError('Authentication failed. Please login again.');
        authService.logout();
        setHasToken(false);
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });

  // In AuthContext.tsx - Update the loginMutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data: AuthResponse) => {
      // Check if login was actually successful
      if (data.success && data.data?.user) {
        // Successful login with user data
        setHasToken(true);

        if (data.data.user) {
          queryClient.setQueryData(['currentUser'], data.data.user);
        }

        handleSuccess("Login Successful");

        return data;
      } else if (data.success === false) {
        // This is a failed login that returned a structured response
        // The error toast was already shown in authService
        // Don't proceed with login flow
        console.log('Login failed in mutation:', data.message);
        return Promise.reject({ message: data.message, isHandled: true });
      } else {
        // This should not happen, but handle gracefully
        handleError("Login response format invalid");
        return Promise.reject(new Error("Invalid login response"));
      }
    },
    onError: (error: any) => {
      console.error('Login mutation error:', error);
      authService.logout();
      setHasToken(false);

      // Only show toast if it wasn't already shown in authService
      if (!error._toastShown && !error.isHandled) {
        handleError(error.message || "An error occurred during login");
      }
      throw error;
    },
  });

  // In AuthContext.tsx - Update the registerMutation
  // In AuthContext.tsx - Fix the registerMutation
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data: AuthResponse) => {
      // Check if registration was actually successful
      if (data.success) {
        // Handle OTP verification required case
        if (data.data?.requiresVerification) {
          handleInfo("Please check your email to verify your account.");
          return data;
        }

        // Handle immediate login case (if user and token are present)
        if (data.data?.user && data.data?.token) {
          setHasToken(true);
          queryClient.setQueryData(['currentUser'], data.data.user);
          handleSuccess("Registration Successful");
        } else {
          // This is the OTP verification flow - don't set token or user yet
          handleInfo("Please check your email to verify your account.");
        }
      } else if (data.success === false) {
        // Failed registration that returned structured response
        console.log('Registration failed in mutation:', data.message);
        return Promise.reject({ message: data.message, isHandled: true });
      } else {
        handleError("Registration response format invalid");
        return Promise.reject(new Error("Invalid registration response"));
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);

      // Don't clear token for OTP flow errors
      if (!error.message?.includes('verification') && !error.isHandled) {
        authService.logout();
        setHasToken(false);
      }

      if (!error._toastShown && !error.isHandled) {
        handleError(error.message || "An error occurred during registration");
      }
      throw error;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setHasToken(false);
      queryClient.setQueryData(['currentUser'], null);
      queryClient.removeQueries({ queryKey: ['currentUser'] });

      // Success toast is now handled in authService.logout
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still clear client-side state even if API fails
      setHasToken(false);
      queryClient.setQueryData(['currentUser'], null);

      handleInfo('You have been logged out.');
    },
  });

  const login = async (data: LoginData) => {
    return await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterData) => {
    return await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

  const refetchUser = () => {
    refetch();
  };

  const isAuthenticated = !!user && !isError;

  // Initialize auth state
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Handle authentication errors
  useEffect(() => {
    if (isError && isInitialized) {
      authService.logout();
      setHasToken(false);
    }
  }, [isError, isInitialized]);

  // Redirect logic
  useEffect(() => {
    if (!isInitialized) return;

    const currentPath = router.pathname;
    const isPublic = PUBLIC_ROUTES.some(route =>
      currentPath === route || currentPath.startsWith(`${route}/`)
    );

    // If we have a token but user data is still loading, wait
    if (hasToken && userLoading) return;

    // If not authenticated and trying to access protected route
    if (!hasToken && !isPublic) {
      handleError('Please login to access this page.');
      router.push('/login');
      return;
    }

    // If authenticated and on auth pages, redirect to dashboard
    if (hasToken && isAuthenticated &&
      (currentPath === '/login' || currentPath === '/register')) {
      const userRole = user?.role || authService.getUserRole();
      if (userRole) {
        router.push(`/dashboard/${userRole}`);
      }
    }
  }, [hasToken, isAuthenticated, isInitialized, userLoading, router, user]);

  const isLoading = userLoading || loginMutation.isPending || registerMutation.isPending || !isInitialized;

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function handleInfo(arg0: string) {
  throw new Error('Function not implemented.');
}

export type { User };
