import axios, { AxiosError } from 'axios';
import {
  Coupon,
  ValidateCouponRequest,
  ValidateCouponResponse,
  ValidateCouponSuccessResponse,
  CouponError,
  CouponErrorType,
} from '../types/coupon';

const API_BASE_URL = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/coupons`;

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }
  return token;
};

/**
 * Get axios instance with authentication headers
 */
const getAuthHeaders = () => ({
  'Authorization': `Token ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

/**
 * Parse coupon validation error from API response
 */
const parseCouponError = (error: AxiosError<any>): CouponError => {
  const message = error.response?.data?.message || error.message;
  
  let errorType: CouponErrorType = CouponErrorType.UNKNOWN_ERROR;
  
  if (error.response?.status === 401) {
    errorType = CouponErrorType.UNAUTHORIZED;
  } else if (error.response?.status === 404) {
    errorType = CouponErrorType.INVALID_CODE;
  } else if (error.response?.status === 400) {
    // Parse specific error messages
    if (message.toLowerCase().includes('expired')) {
      errorType = CouponErrorType.EXPIRED;
    } else if (message.toLowerCase().includes('limit')) {
      errorType = CouponErrorType.LIMIT_EXCEEDED;
    } else if (message.toLowerCase().includes('user limit')) {
      errorType = CouponErrorType.USER_LIMIT_EXCEEDED;
    } else if (message.toLowerCase().includes('minimum') || message.toLowerCase().includes('min_purchase')) {
      errorType = CouponErrorType.MIN_PURCHASE_NOT_MET;
    } else if (message.toLowerCase().includes('empty') || message.toLowerCase().includes('cart')) {
      errorType = CouponErrorType.CART_EMPTY;
    }
  } else if (!error.response) {
    errorType = CouponErrorType.NETWORK_ERROR;
  }

  const couponError = new Error(message) as CouponError;
  couponError.type = errorType;
  couponError.details = error.response?.data;
  
  return couponError;
};

/**
 * Validates if a coupon code can be applied to a specific cart
 * @param code - Coupon code to validate
 * @param cartId - ID of the cart to validate against
 * @returns Validation response with discount details if valid
 * @throws CouponError with specific error type
 */
export const validateCoupon = async (
  code: string,
  cartId: number
): Promise<ValidateCouponSuccessResponse> => {
  try {
    const request: ValidateCouponRequest = {
      code: code.toUpperCase(),
      cart_id: cartId,
    };

    const response = await axios.post<ValidateCouponResponse>(
      `${API_BASE_URL}/validate/`,
      request,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.data.valid) {
      const error = new Error(response.data.message) as CouponError;
      error.type = CouponErrorType.INVALID_CODE;
      throw error;
    }

    return response.data as ValidateCouponSuccessResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw parseCouponError(error);
    }
    throw error;
  }
};

/**
 * List all available coupons (Admin only)
 * @returns Array of coupon objects
 */
export const listCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await axios.get<{ results: Coupon[] }>(
      `${API_BASE_URL}/`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data.results || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw parseCouponError(error);
    }
    throw error;
  }
};

/**
 * Get specific coupon details by code (Admin only)
 * @param code - Coupon code
 * @returns Coupon object
 */
export const getCoupon = async (code: string): Promise<Coupon> => {
  try {
    const response = await axios.get<Coupon>(
      `${API_BASE_URL}/${code.toUpperCase()}/`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw parseCouponError(error);
    }
    throw error;
  }
};

/**
 * Create a new coupon (Admin only)
 * @param coupon - Coupon data to create
 * @returns Created coupon object
 */
export const createCoupon = async (coupon: Partial<Coupon>): Promise<Coupon> => {
  try {
    const response = await axios.post<Coupon>(
      `${API_BASE_URL}/`,
      coupon,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw parseCouponError(error);
    }
    throw error;
  }
};

/**
 * Update an existing coupon (Admin only)
 * @param code - Coupon code to update
 * @param coupon - Updated coupon data
 * @returns Updated coupon object
 */
export const updateCoupon = async (
  code: string,
  coupon: Partial<Coupon>
): Promise<Coupon> => {
  try {
    const response = await axios.patch<Coupon>(
      `${API_BASE_URL}/${code.toUpperCase()}/`,
      coupon,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw parseCouponError(error);
    }
    throw error;
  }
};

/**
 * Delete a coupon (Admin only)
 * @param code - Coupon code to delete
 */
export const deleteCoupon = async (code: string): Promise<void> => {
  try {
    await axios.delete(
      `${API_BASE_URL}/${code.toUpperCase()}/`,
      {
        headers: getAuthHeaders(),
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw parseCouponError(error);
    }
    throw error;
  }
};

/**
 * Coupon API object for unified access
 */
export const couponApi = {
  validateCoupon,
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
