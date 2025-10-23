/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/error-handler.ts - UPDATED
import { toast } from '@/hooks/use-toast';

export const handleError = (error: any, context?: string): Error => {
  console.error(context ? `[${context}] Error:` : 'Error:', error);
  
  let message = 'An unexpected error occurred';
  let variant: "destructive" | "warning" | "info" = 'destructive';

  if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.response?.data?.errors?.[0]) {
    message = error.response.data.errors[0];
  } else if (error?.response?.status === 401) {
    message = 'Please log in to continue';
    variant = 'warning';
  } else if (error?.response?.status === 403) {
    message = 'You do not have permission to perform this action';
    variant = 'warning';
  } else if (error?.response?.status === 404) {
    message = 'The requested resource was not found';
    variant = 'warning';
  } else if (error?.response?.status === 409) {
    message = 'A resource with these details already exists';
    variant = 'warning';
  } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    message = 'Network connection error. Please check your internet connection.';
    variant = 'warning';
  } else if (error?.message?.includes('timeout')) {
    message = 'Request timed out. Please try again.';
    variant = 'warning';
  }

  toast({
    title: getErrorTitle(message, variant),
    description: message,
    variant,
  });

  return new Error(message);
};

export const handleSuccess = (message: string, title?: string): void => {
  toast({
    title: title || 'Success',
    description: message,
    variant: 'success',
  });
};

const getErrorTitle = (message: string, variant: string): string => {
  if (variant === 'warning') {
    if (message.includes('already exists') || message.includes('duplicate')) return 'Already Exists';
    if (message.includes('not found')) return 'Not Found';
    if (message.includes('validation')) return 'Validation Error';
    if (message.includes('unauthorized') || message.includes('permission')) return 'Access Denied';
    if (message.includes('network') || message.includes('connection')) return 'Connection Issue';
    return 'Attention Needed';
  }
  return 'Something went wrong';
};