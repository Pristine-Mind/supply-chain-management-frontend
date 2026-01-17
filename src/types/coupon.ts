/**
 * Coupon and Redemption System Types
 * Defines all interfaces and types for coupon validation and redemption
 */

/**
 * Discount type for the coupon
 */
export type DiscountType = 'percentage' | 'fixed';

/**
 * Coupon model representing a discount code
 */
export interface Coupon {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  user_limit: number;
  is_active: boolean;
  used_count: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Request body for coupon validation
 */
export interface ValidateCouponRequest {
  code: string;
  cart_id: number;
}

/**
 * Validation response data with discount details
 */
export interface CouponValidationData {
  original_amount: string;
  discount_amount: string;
  final_amount: string;
  coupon_code: string;
  discount_type: DiscountType;
}

/**
 * Success response from coupon validation
 */
export interface ValidateCouponSuccessResponse {
  valid: true;
  message: string;
  data: CouponValidationData;
}

/**
 * Error response from coupon validation
 */
export interface ValidateCouponErrorResponse {
  valid: false;
  message: string;
}

/**
 * Union type for coupon validation response
 */
export type ValidateCouponResponse =
  | ValidateCouponSuccessResponse
  | ValidateCouponErrorResponse;

/**
 * Applied coupon details for checkout
 */
export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  finalAmount: number;
  discountType: DiscountType;
}

/**
 * Coupon state in checkout context
 */
export interface CouponState {
  appliedCoupon: AppliedCoupon | null;
  couponCode: string;
  isValidating: boolean;
  validationError: string | null;
}

/**
 * Coupon validation error types
 */
export enum CouponErrorType {
  INVALID_CODE = 'INVALID_CODE',
  EXPIRED = 'EXPIRED',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  USER_LIMIT_EXCEEDED = 'USER_LIMIT_EXCEEDED',
  MIN_PURCHASE_NOT_MET = 'MIN_PURCHASE_NOT_MET',
  CART_EMPTY = 'CART_EMPTY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured coupon error for better error handling
 */
export interface CouponError extends Error {
  type: CouponErrorType;
  message: string;
  details?: Record<string, any>;
}

/**
 * Response for order creation with coupon
 */
export interface CreateOrderWithCouponRequest {
  cart_id: number;
  delivery_info: {
    customer_name: string;
    phone_number: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number;
    longitude?: number;
  };
  payment_method: string;
  coupon_code?: string;
}

/**
 * Order response with coupon discount applied
 */
export interface OrderResponse {
  id: number;
  order_id: string;
  original_amount: number;
  discount_amount?: number;
  final_amount: number;
  coupon_code?: string;
  status: string;
  created_at: string;
  [key: string]: any;
}
