/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

interface AdminState {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  sidebarOpen: boolean;
  notifications: any[];
}

type AdminAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: any | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: AdminState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  sidebarOpen: true,
  notifications: [],
};

const adminReducer = (state: AdminState, action: AdminAction): AdminState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload) 
      };
    default:
      return state;
  }
};

const AdminContext = createContext<{
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
} | null>(null);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');
      
      if (token && user) {
        dispatch({ type: 'SET_USER', payload: JSON.parse(user) });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authService.login(credentials);
      
      if (response.success) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        
        dispatch({ type: 'SET_USER', payload: response.data.user });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: Date.now().toString(),
            type: 'success',
            title: 'Login Successful',
            message: 'Welcome to the admin panel',
          }
        });
      }
    } catch (error: any) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          title: 'Login Failed',
          message: error.response?.data?.message || 'Invalid credentials',
        }
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_AUTHENTICATED', payload: false });
    
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type: 'info',
        title: 'Logged Out',
        message: 'You have been successfully logged out',
      }
    });
  };

  return (
    <AdminContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};