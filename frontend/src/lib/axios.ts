// src/lib/axios.ts
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Helper function to safely access localStorage
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const getStoredUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId');
};

const getStoredUserRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('role');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear invalid token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
        
        // Show toast message
        toast({
          title: 'Session Expired',
          description: 'Please login again to continue',
          variant: 'destructive',
        });
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      toast({
        title: 'Connection Error',
        description: 'Cannot connect to server. Please check your internet connection.',
        variant: 'destructive',
      });
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      toast({
        title: 'Timeout',
        description: 'Request took too long. Please try again.',
        variant: 'destructive',
      });
    }
    
    return Promise.reject(error);
  }
);

// Add function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  
  return !!(token && userId && role);
};

// Add function to get auth headers
export const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Add function to get user info
export const getUserInfo = () => {
  return {
    token: getStoredToken(),
    userId: getStoredUserId(),
    role: getStoredUserRole()
  };
};

export default api;