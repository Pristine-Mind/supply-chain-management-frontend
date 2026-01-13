import { AxiosError } from 'axios';

/**
 * Maps axios error responses to a user-friendly strings.
 * Handles DRF style errors: { detail: "msg" }, { non_field_errors: ["msg"] }, etc.
 */
export const mapErrorResponse = (error: unknown, defaultMsg: string = 'Service unavailable. Please try again.'): string => {
  if (!(error instanceof AxiosError)) {
    return defaultMsg;
  }

  const data = error.response?.data;

  if (!data) return defaultMsg;

  // 1. Detailed error message from backend
  if (data.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // 2. Multi-exception or generic error field
  if (data.error && typeof data.error === 'string') {
    return data.error;
  }

  // 3. non_field_errors (common in DRF)
  if (data.non_field_errors && Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors[0];
  }

  // 4. Validation errors mapping (return first error of first field)
  if (typeof data === 'object' && !Array.isArray(data)) {
    const fields = Object.keys(data);
    if (fields.length > 0) {
      const firstField = fields[0];
      const errors = data[firstField];
      if (Array.isArray(errors) && errors.length > 0) {
        return `${firstField}: ${errors[0]}`;
      }
      if (typeof errors === 'string') {
        return `${firstField}: ${errors}`;
      }
    }
  }

  return defaultMsg;
};
