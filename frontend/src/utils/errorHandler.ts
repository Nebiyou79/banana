// src/utils/errorHandler.ts
import { toast } from '@/hooks/use-toast';

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

export const handleApiError = (error: ApiError, defaultMessage = 'An unexpected error occurred') => {
  console.error('API Error:', error);
  
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
    toast({
      title: 'Connection Error',
      description: 'Cannot connect to server. Please check your internet connection.',
      style: { backgroundColor: '#F1BB03', color: '#0A2540', border: '1px solid #0A2540' },
    });
    return;
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    toast({
      title: 'Timeout',
      description: 'Request took too long. Please try again.',
      style: { backgroundColor: '#F1BB03', color: '#0A2540', border: '1px solid #0A2540' },
    });
    return;
  }
  
  // Backend validation errors with specific field errors
  if (error.response?.data?.errors) {
    const fieldErrors = Object.values(error.response.data.errors).flat();
    if (fieldErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: fieldErrors[0],
        style: { backgroundColor: '#F1BB03', color: '#0A2540', border: '1px solid #0A2540' },
      });
      return;
    }
  }
  
  // Backend error message
  if (error.response?.data?.message) {
    toast({
      title: 'Error',
      description: error.response.data.message,
      style: { backgroundColor: '#F1BB03', color: '#0A2540', border: '1px solid #0A2540' },
    });
    return;
  }
  
  // Generic error message
  if (error.message) {
    toast({
      title: 'Error',
      description: error.message,
      style: { backgroundColor: '#F1BB03', color: '#0A2540', border: '1px solid #0A2540' },
    });
    return;
  }
  
  // Fallback
  toast({
    title: 'Error',
    description: defaultMessage,
    style: { backgroundColor: '#F1BB03', color: '#0A2540', border: '1px solid #0A2540' },
  });
};

// Specific error handler for auth operations
export const handleAuthError = (error: ApiError, operation: 'login' | 'register' | 'logout') => {
  const defaultMessages = {
    login: 'Failed to login. Please check your credentials.',
    register: 'Failed to create account. Please try again.',
    logout: 'Failed to logout properly.',
  };
  
  handleApiError(error, defaultMessages[operation]);
};