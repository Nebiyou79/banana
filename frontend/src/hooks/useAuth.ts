// src/hooks/useAuth.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { handleError } from '@/lib/error-handler'; // ADD THIS IMPORT

export const useAuth = () => {
  const { user, login: contextLogin, logout: contextLogout } = useAuthContext();
  const [loading, setLoading] = useState(false);

const login = useCallback(async (credentials: { email: string; password: string }) => {
  setLoading(true);
  try {
    const response = await authService.login(credentials);
    
    // Check if login was successful
    if (response.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user._id);
      localStorage.setItem('role', response.data.user.role);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response;
    } else {
      // If login failed but we got a structured response
      // The error toast was already shown in authService
      // We can return the response or throw a silent error
      return response;
    }
  } catch (error: any) {
    // This should rarely happen now since authService catches errors
    if (!error._isHandled) {
      console.error('Login error:', error);
    }
    throw error;
  } finally {
    setLoading(false);
  }
}, []);

  const logout = useCallback(() => {
    try {
      authService.logout();
      // Clear all auth-related items from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      // Success toast is now handled in authService.logout
    } catch (error: any) {
      handleError(error, 'Error during logout');
    }
  }, []);

  return {
    login,
    logout,
    loading,
    isAuthenticated: authService.isAuthenticated(),
    user,
  };
};