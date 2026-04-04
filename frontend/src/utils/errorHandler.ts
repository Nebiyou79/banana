/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/errorHandler.ts - UPDATED TO USE TOAST SYSTEM
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

/**
 * @deprecated Use handleApiError from '@/utils/apiErrorHandler' instead
 * Legacy error handler - maintained for backward compatibility
 */
export const handleApiError = (error: ApiError, defaultMessage = 'An unexpected error occurred') => {
  console.error('API Error:', error);
  
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
    toast({
      title: 'Connection Error',
      description: 'Cannot connect to server. Please check your internet connection.',
      variant: 'warning',
    });
    return;
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    toast({
      title: 'Timeout',
      description: 'Request took too long. Please try again.',
      variant: 'warning',
    });
    return;
  }
  
  // Backend validation errors with specific field errors
  if (error.response?.data?.errors) {
    const fieldErrors = Object.values(error.response.data.errors).flat();
    if (fieldErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: fieldErrors[0] as string,
        variant: 'warning',
      });
      return;
    }
  }
  
  // Backend error message
  if (error.response?.data?.message) {
    toast({
      title: 'Error',
      description: error.response.data.message,
      variant: 'destructive',
    });
    return;
  }
  
  // Generic error message
  if (error.message) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
    return;
  }
  
  // Fallback
  toast({
    title: 'Error',
    description: defaultMessage,
    variant: 'destructive',
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

/**
 * Legacy success handler - maintained for backward compatibility
 * @deprecated Use handleApiSuccess from '@/utils/apiErrorHandler' instead
 */
export const handleSuccess = (message: string, title: string = 'Success') => {
  toast({
    title,
    description: message,
    variant: 'success',
  });
};

/**
 * Legacy error handler - maintained for backward compatibility
 * @deprecated Use handleApiError from '@/utils/apiErrorHandler' instead
 */
export const handleError = (error: any, context?: string) => {
  console.error(`[ErrorHandler${context ? ` - ${context}` : ''}]`, error);
  
  const apiError: ApiError = {
    message: error?.message || 'An unexpected error occurred',
    code: error?.code,
    response: error?.response,
  };
  
  handleApiError(apiError, context || 'Operation failed');
};