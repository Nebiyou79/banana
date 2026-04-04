/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import {
  CreateFreelanceTenderData,
  CreateProfessionalTenderData,
  freelanceTenderSchema,
  professionalTenderSchema,
  invitationSchema
} from '@/services/tenderService';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string> | null;
}

/**
 * Validate freelance tender data
 */
export const validateFreelanceTender = (data: any): ValidationResult => {
  try {
    // Convert the data to match the schema structure
    const validationData = {
      ...data,
      // Ensure all required fields are present
      tenderCategory: data.tenderCategory || 'freelance',
      workflowType: data.workflowType || 'open',
      status: data.status || 'draft',
      engagementType: data.engagementType || 'fixed_price',
    };

    // Parse with schema
    freelanceTenderSchema.parse(validationData);
    return { isValid: true, errors: null };
  } catch (error: any) {
    if (error.errors) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

/**
 * Validate professional tender data
 */
export const validateProfessionalTender = (data: any): ValidationResult => {
  try {
    // Convert the data to match the schema structure
    const validationData = {
      ...data,
      // Ensure all required fields are present
      tenderCategory: data.tenderCategory || 'professional',
      workflowType: data.workflowType || 'open',
      status: data.status || 'draft',
      visibilityType: data.visibilityType || 'public',
    };

    // Parse with schema
    professionalTenderSchema.parse(validationData);
    return { isValid: true, errors: null };
  } catch (error: any) {
    if (error.errors) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

/**
 * Validate invitation data
 */
export const validateInvitation = (data: any): ValidationResult => {
  try {
    invitationSchema.parse(data);
    return { isValid: true, errors: null };
  } catch (error: any) {
    return { 
      isValid: false, 
      errors: { general: error.message || 'Validation failed' } 
    };
  }
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: Record<string, string>): string[] => {
  const messages: string[] = [];
  
  Object.entries(errors).forEach(([field, message]) => {
    if (field === 'general') {
      messages.push(message);
    } else {
      // Format field name for display
      const fieldName = field
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      messages.push(`${fieldName}: ${message}`);
    }
  });
  
  return messages;
};

/**
 * Validate tender deadline
 */
export const validateDeadline = (deadline: string | Date): ValidationResult => {
  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (deadlineDate <= now) {
      return {
        isValid: false,
        errors: { deadline: 'Deadline must be in the future' }
      };
    }
    
    return { isValid: true, errors: null };
  } catch (error) {
    return {
      isValid: false,
      errors: { deadline: 'Invalid date format' }
    };
  }
};

/**
 * Validate budget range
 */
export const validateBudget = (budget: { min: number; max: number; currency: string }): ValidationResult => {
  if (budget.min < 0 || budget.max < 0) {
    return {
      isValid: false,
      errors: { budget: 'Budget values must be positive' }
    };
  }
  
  if (budget.min > budget.max) {
    return {
      isValid: false,
      errors: { budget: 'Minimum budget cannot exceed maximum budget' }
    };
  }
  
  return { isValid: true, errors: null };
};

/**
 * Validate skills array
 */
export const validateSkills = (skills: string[]): ValidationResult => {
  if (!Array.isArray(skills)) {
    return {
      isValid: false,
      errors: { skills: 'Skills must be an array' }
    };
  }
  
  if (skills.length === 0) {
    return {
      isValid: false,
      errors: { skills: 'At least one skill is required' }
    };
  }
  
  // Check each skill is a non-empty string
  for (const skill of skills) {
    if (typeof skill !== 'string' || skill.trim().length === 0) {
      return {
        isValid: false,
        errors: { skills: 'All skills must be non-empty strings' }
      };
    }
  }
  
  return { isValid: true, errors: null };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
  files: File[],
  maxSize: number = 50 * 1024 * 1024, // 50MB default
  maxCount: number = 10
): ValidationResult => {
  if (files.length > maxCount) {
    return {
      isValid: false,
      errors: { 
        files: `Maximum ${maxCount} files allowed. You selected ${files.length} files.`
      }
    };
  }
  
  const invalidFiles: string[] = [];
  
  files.forEach((file, index) => {
    if (file.size > maxSize) {
      invalidFiles.push(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds limit)`);
    }
  });
  
  if (invalidFiles.length > 0) {
    return {
      isValid: false,
      errors: { 
        files: `Files exceed maximum size (${maxSize / (1024 * 1024)}MB): ${invalidFiles.join(', ')}`
      }
    };
  }
  
  return { isValid: true, errors: null };
};

/**
 * Quick validation for required fields
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): ValidationResult => {
  const errors: Record<string, string> = {};
  
  requiredFields.forEach(field => {
    const value = data[field];
    
    if (value === undefined || value === null || value === '') {
      errors[field] = 'This field is required';
    } else if (Array.isArray(value) && value.length === 0) {
      errors[field] = 'At least one item is required';
    } else if (typeof value === 'object' && Object.keys(value).length === 0) {
      errors[field] = 'This field is required';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : null
  };
};