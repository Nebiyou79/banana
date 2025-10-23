/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/apiErrorHandler.ts - NEW CENTRALIZED ERROR HANDLER
import { toast } from '@/hooks/use-toast';

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
      error?: string;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
  code?: string;
  request?: any;
}

/**
 * Centralized API error handler that shows appropriate toast notifications
 * @param error The error object from API call
 * @param context Context for the error (e.g., 'User Login', 'Company Creation')
 * @param defaultMessage Default message if no specific message can be extracted
 * @returns void - shows toast notification and optionally returns error details
 */
export const handleApiError = (
  error: ApiError, 
  context: string = 'Operation',
  defaultMessage: string = 'An unexpected error occurred'
): void => {
  console.error(`[API Error${context ? ` - ${context}` : ''}]`, error);

  // Network errors (no response from server)
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      toast({
        title: 'Network Error',
        description: 'Please check your internet connection and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (error.code === 'ECONNABORTED') {
      toast({
        title: 'Request Timeout',
        description: 'The request took too long. Please try again.',
        variant: 'warning',
      });
      return;
    }

    // Generic network error
    toast({
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please try again later.',
      variant: 'destructive',
    });
    return;
  }

  const status = error.response?.status;
  const data = error.response?.data;
  
  // Extract error message from response
  let errorMessage = defaultMessage;
  
  if (data?.message) {
    errorMessage = data.message;
  } else if (data?.error) {
    errorMessage = data.error;
  } else if (data?.errors && Object.keys(data.errors).length > 0) {
    // Handle validation errors - take first error
    const firstErrorKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstErrorKey];
    errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
  } else if (error.message) {
    errorMessage = error.message;
  }

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      toast({
        title: 'Bad Request',
        description: errorMessage,
        variant: 'warning',
      });
      break;
    
    case 401:
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue.',
        variant: 'warning',
      });
      break;
    
    case 403:
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      break;
    
    case 404:
      toast({
        title: 'Not Found',
        description: 'The requested resource was not found.',
        variant: 'warning',
      });
      break;
    
    case 409:
      toast({
        title: 'Conflict',
        description: errorMessage || 'This action conflicts with existing data.',
        variant: 'warning',
      });
      break;
    
    case 422:
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'warning',
      });
      break;
    
    case 429:
      toast({
        title: 'Too Many Requests',
        description: 'Please wait a moment before trying again.',
        variant: 'warning',
      });
      break;
    
    case 500:
      toast({
        title: 'Server Error',
        description: 'Something went wrong on our end. Please try again later.',
        variant: 'destructive',
      });
      break;
    
    case 502:
    case 503:
    case 504:
      toast({
        title: 'Service Unavailable',
        description: 'The service is temporarily unavailable. Please try again later.',
        variant: 'destructive',
      });
      break;
    
    default:
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
  }
};

/**
 * Handle successful operations with toast notifications
 * @param message The success message to display
 * @param title Optional title for the toast (default: "Success")
 */
export const handleApiSuccess = (message: string, title: string = 'Success'): void => {
  toast({
    title,
    description: message,
    variant: 'success',
  });
};

/**
 * Handle warning messages with toast notifications
 * @param message The warning message to display
 * @param title Optional title for the toast (default: "Warning")
 */
export const handleApiWarning = (message: string, title: string = 'Warning'): void => {
  toast({
    title,
    description: message,
    variant: 'warning',
  });
};

/**
 * Handle info messages with toast notifications
 * @param message The info message to display
 * @param title Optional title for the toast (default: "Info")
 */
export const handleApiInfo = (message: string, title: string = 'Info'): void => {
  toast({
    title,
    description: message,
    variant: 'info',
  });
};