import { useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { useAdmin } from '../contexts/AdminContext';

export const useAuth = () => {
  const { dispatch } = useAdmin();
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        
        dispatch({ type: 'SET_USER', payload: response.data.user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        
        return response;
      }
      throw new Error(response.message);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_AUTHENTICATED', payload: false });
  }, [dispatch]);

  return {
    login,
    logout,
    loading,
    isAuthenticated: authService.isAuthenticated(),
  };
};