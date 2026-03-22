/**
 * Authentication Error Messages and Validation Utilities
 * Provides standardized error handling, categorization, and user-friendly messages
 */

import axios, { AxiosError } from 'axios';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AuthError {
  type: 'validation' | 'network' | 'server' | 'auth' | 'unknown';
  message: string;
  details?: string;
  fieldErrors?: Record<string, string[]>;
  statusCode?: number;
}

/**
 * Categorizes different types of login errors
 */
export function categorizeLoginError(error: any): AuthError {
  if (!error) {
    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  // Network errors
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection and try again.',
      details: 'Unable to reach the server. Check your network connection.',
    };
  }

  // Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // 401 Unauthorized - Invalid credentials
    if (axiosError.response?.status === 401) {
      return {
        type: 'auth',
        message: 'Invalid username or password. Please check and try again.',
        statusCode: 401,
      };
    }

    // 400 Bad Request - Validation error
    if (axiosError.response?.status === 400) {
      const data = axiosError.response.data as any;
      return {
        type: 'validation',
        message: data?.error || data?.message || 'Invalid input. Please check your details.',
        fieldErrors: data?.field_errors || {},
        statusCode: 400,
      };
    }

    // 429 Too Many Requests - Rate limiting
    if (axiosError.response?.status === 429) {
      return {
        type: 'auth',
        message: 'Too many login attempts. Please wait a few minutes before trying again.',
        statusCode: 429,
      };
    }

    // 500 Server Error
    if (axiosError.response?.status === 500) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        statusCode: 500,
        details: 'An error occurred on our end. Please wait and try again.',
      };
    }

    // Generic server error
    if (axiosError.response?.status && axiosError.response.status >= 400) {
      return {
        type: 'server',
        message: (axiosError.response.data as any)?.error || 'Server error occurred. Please try again.',
        statusCode: axiosError.response.status,
      };
    }
  }

  // Generic error
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Categorizes registration errors
 */
export function categorizeRegisterError(error: any): AuthError {
  if (!error) {
    return {
      type: 'unknown',
      message: 'Registration failed. Please try again.',
    };
  }

  // Network errors
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      details: 'Unable to reach the server. Check your network connection.',
    };
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const data = axiosError.response?.data as any;

    // 400 Bad Request - Validation errors (duplicate username/email, etc.)
    if (axiosError.response?.status === 400) {
      const fieldErrors: Record<string, string[]> = {};

      // Handle common field errors
      if (data?.username) {
        fieldErrors.username = Array.isArray(data.username) ? data.username : [data.username];
      }
      if (data?.email) {
        fieldErrors.email = Array.isArray(data.email) ? data.email : [data.email];
      }
      if (data?.phone_number) {
        fieldErrors.phone = Array.isArray(data.phone_number) ? data.phone_number : [data.phone_number];
      }
      if (data?.password) {
        fieldErrors.password = Array.isArray(data.password) ? data.password : [data.password];
      }

      return {
        type: 'validation',
        message: data?.message || 'Please check your information and try again.',
        fieldErrors,
        statusCode: 400,
      };
    }

    // 409 Conflict - Username or email already exists
    if (axiosError.response?.status === 409) {
      return {
        type: 'validation',
        message: 'This username or email is already registered. Please use a different one.',
        fieldErrors: {
          username: ['Username already exists'],
          email: ['Email already registered'],
        },
        statusCode: 409,
      };
    }

    // 413 Payload Too Large
    if (axiosError.response?.status === 413) {
      return {
        type: 'validation',
        message: 'File size is too large. Please upload smaller files.',
        statusCode: 413,
      };
    }

    // 500 Server Error
    if (axiosError.response?.status === 500) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        statusCode: 500,
        details: 'An error occurred while processing your registration.',
      };
    }

    // Generic server errors
    if (axiosError.response?.status && axiosError.response.status >= 400) {
      return {
        type: 'server',
        message: data?.message || 'Registration failed. Please try again.',
        statusCode: axiosError.response.status,
      };
    }
  }

  return {
    type: 'unknown',
    message: error.message || 'Registration failed. Please try again.',
  };
}

/**
 * Validates username format
 */
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username) {
    return { valid: false, message: 'Username is required' };
  }

  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }

  if (username.length > 20) {
    return { valid: false, message: 'Username must not exceed 20 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (!/[@$!%*?&_-]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (@$!%*?&_-)' };
  }

  return { valid: true };
}

/**
 * Validates phone number
 */
export function validatePhoneNumber(phone: string): { valid: boolean; message?: string } {
  if (!phone) {
    return { valid: false, message: 'Phone number is required' };
  }

  // Remove common formatting characters
  const cleanedPhone = phone.replace(/[\s\-\+()]/g, '');

  if (!/^[0-9]{7,15}$/.test(cleanedPhone)) {
    return { valid: false, message: 'Phone number must be between 7 and 15 digits' };
  }

  return { valid: true };
}

/**
 * Validates file type and size
 */
export function validateFile(file: File | null, maxSizeMB: number = 5, allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf']): { valid: boolean; message?: string } {
  if (!file) {
    return { valid: false, message: 'File is required' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}` };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return { valid: false, message: `File size must not exceed ${maxSizeMB}MB. Current size: ${fileSizeMB.toFixed(2)}MB` };
  }

  return { valid: true };
}

/**
 * Sanitizes user input for security
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 255); // Limit length
}

/**
 * Generates user-friendly error messages from validation errors
 */
export function formatValidationError(error: ValidationError | string): string {
  if (typeof error === 'string') {
    return error;
  }

  return error.message;
}

export default {
  categorizeLoginError,
  categorizeRegisterError,
  validateUsername,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateFile,
  sanitizeInput,
  formatValidationError,
};
