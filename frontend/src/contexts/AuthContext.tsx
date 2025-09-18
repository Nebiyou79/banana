/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginData, RegisterData, User } from '@/services/authService';

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
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth',
];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = authService.getToken();
      const isAuth = authService.isAuthenticated();
      
      console.log('Auth initialization - Token exists:', !!token, 'Is authenticated:', isAuth);
      
      setHasToken(isAuth);
      setIsInitialized(true);
    };

    checkAuth();
  }, []);

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: hasToken && isInitialized,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        authService.logout();
        setHasToken(false);
        return false;
      }
      return failureCount < 2;
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data: AuthResponse) => {
      if (data.data?.requiresVerification) {
        // Instead of throwing error, let the component handle it
        return Promise.reject({ message: 'EMAIL_VERIFICATION_REQUIRED', email: data.data.email });
      }
      
      console.log('Login successful, setting token state');
      setHasToken(true);
      queryClient.setQueryData(['currentUser'], data.data.user);
      
      const userRole = data.data.user?.role || localStorage.getItem('role');
      if (userRole === 'company') {
        router.push('/dashboard/company');
      } else {
        const dashboardPath = `/dashboard/${userRole}`;
        router.push(dashboardPath);
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      authService.logout();
      setHasToken(false);
      throw error;
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data: AuthResponse) => {
      if (data.data?.requiresVerification) {
        // Return the data instead of throwing error
        return data;
      }
      
      console.log('Registration successful, setting token state');
      setHasToken(true);
      queryClient.setQueryData(['currentUser'], data.data.user);
      
      const userRole = data.data.user?.role;
      if (userRole === 'company') {
        router.push('/dashboard/company/profile');
      } else {
        const dashboardPath = `/dashboard/${userRole}`;
        router.push(dashboardPath);
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      authService.logout();
      setHasToken(false);
      throw error;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      console.log('Logout successful, clearing token state');
      setHasToken(false);
      queryClient.setQueryData(['currentUser'], null);
      queryClient.removeQueries({ queryKey: ['currentUser'] });
      router.push('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      setHasToken(false);
      queryClient.setQueryData(['currentUser'], null);
      router.push('/login');
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
  };

  const refetchUser = () => {
    refetch();
  };

  const isAuthenticated = !!user && !isError;

  useEffect(() => {
    if (isError) {
      console.log('Authentication error detected, clearing token');
      authService.logout();
      setHasToken(false);
      queryClient.setQueryData(['currentUser'], null);
    }
  }, [isError, queryClient]);

  useEffect(() => {
    if (isInitialized && !hasToken) {
      // Get current path without query parameters
      const currentPath = router.pathname;
      
      // Check if current route is not a public route
      const isPublicRoute = PUBLIC_ROUTES.some(route => 
        currentPath.startsWith(route) || 
        currentPath === route
      );
      
      if (!isPublicRoute && currentPath !== '/') {
        console.log('No valid token, redirecting to login. Current path:', currentPath);
        router.push('/login');
      }
    }
  }, [hasToken, isInitialized, router]);

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || !isInitialized,
    isAuthenticated,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};