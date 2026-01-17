import React, { useState, useCallback } from 'react';
import { Loader, AlertCircle, CheckCircle, X } from 'lucide-react';
import { validateCoupon } from '../api/couponsApi';
import { AppliedCoupon, CouponErrorType } from '../types/coupon';

interface CouponInputProps {
  /**
   * ID of the cart to validate coupon against
   */
  cartId: number;

  /**
   * Current cart total before discount
   */
  cartTotal: number;

  /**
   * Called when coupon is successfully validated and applied
   */
  onCouponApplied?: (coupon: AppliedCoupon) => void;

  /**
   * Called when coupon is removed
   */
  onCouponRemoved?: () => void;

  /**
   * Currently applied coupon (if any)
   */
  appliedCoupon?: AppliedCoupon | null;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Disable the input (e.g., when checkout is in progress)
   */
  disabled?: boolean;
}

/**
 * User-friendly error messages for coupon validation errors
 */
const ERROR_MESSAGES: Record<CouponErrorType, string> = {
  [CouponErrorType.INVALID_CODE]: 'The coupon code is invalid or does not exist.',
  [CouponErrorType.EXPIRED]: 'This coupon has expired.',
  [CouponErrorType.LIMIT_EXCEEDED]: 'This coupon has reached its usage limit.',
  [CouponErrorType.USER_LIMIT_EXCEEDED]: 'You have already used this coupon the maximum number of times.',
  [CouponErrorType.MIN_PURCHASE_NOT_MET]: 'Your cart total does not meet the minimum purchase amount required for this coupon.',
  [CouponErrorType.CART_EMPTY]: 'Your cart is empty. Please add items before applying a coupon.',
  [CouponErrorType.UNAUTHORIZED]: 'You must be logged in to use coupons.',
  [CouponErrorType.NETWORK_ERROR]: 'Network error occurred. Please try again.',
  [CouponErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * CouponInput Component
 * Allows users to enter and apply coupon codes during checkout
 * Handles validation, error states, and displays discount information
 */
const CouponInput: React.FC<CouponInputProps> = ({
  cartId,
  cartTotal,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  className = '',
  disabled = false,
}) => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Handle coupon code input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCouponCode(e.target.value.toUpperCase());
      setError(null);
    },
    []
  );

  /**
   * Validate and apply coupon
   */
  const handleApplyCoupon = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!couponCode.trim()) {
        setError('Please enter a coupon code.');
        return;
      }

      setIsValidating(true);
      setError(null);

      try {
        const response = await validateCoupon(couponCode, cartId);

        if (response.valid) {
          const appliedCoupon: AppliedCoupon = {
            code: response.data.coupon_code,
            discountAmount: parseFloat(response.data.discount_amount),
            finalAmount: parseFloat(response.data.final_amount),
            discountType: response.data.discount_type,
          };

          onCouponApplied?.(appliedCoupon);
          setCouponCode('');
          setIsExpanded(false);
        }
      } catch (err: any) {
        const errorType = err.type || CouponErrorType.UNKNOWN_ERROR;
        const errorMessage =
          ERROR_MESSAGES[errorType as CouponErrorType] ||
          err.message ||
          'An unexpected error occurred.';

        setError(errorMessage);
      } finally {
        setIsValidating(false);
      }
    },
    [couponCode, cartId, onCouponApplied]
  );

  /**
   * Remove applied coupon
   */
  const handleRemoveCoupon = useCallback(() => {
    onCouponRemoved?.();
    setCouponCode('');
    setError(null);
    setIsExpanded(false);
  }, [onCouponRemoved]);

  // If coupon is already applied, show compact view
  if (appliedCoupon) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="text-green-600" size={18} />
            </div>
            <div>
              <p className="font-semibold text-green-900">Coupon Applied</p>
              <p className="text-sm text-green-700 mt-1">
                Code: <span className="font-mono font-bold">{appliedCoupon.code}</span>
              </p>
              <p className="text-sm text-green-700">
                Discount: Rs. {appliedCoupon.discountAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
                {appliedCoupon.discountType === 'percentage' && '%'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            disabled={disabled}
            className="text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
            aria-label="Remove coupon"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Collapsed view
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className={`w-full text-left border-2 border-dashed border-neutral-300 rounded-xl p-4 hover:border-primary-500 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <p className="text-neutral-600 font-medium">Have a coupon code?</p>
        <p className="text-sm text-neutral-500">Click to apply discount</p>
      </button>
    );
  }

  // Expanded form view
  return (
    <div className={`bg-neutral-50 border border-neutral-200 rounded-xl p-4 ${className}`}>
      <form onSubmit={handleApplyCoupon} className="space-y-3">
        <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-900">
          Enter Coupon Code
        </label>

        <div className="flex gap-2">
          <input
            id="coupon-code"
            type="text"
            value={couponCode}
            onChange={handleInputChange}
            placeholder="e.g., SUMMER20"
            disabled={isValidating || disabled}
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
            maxLength={50}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isValidating || !couponCode.trim() || disabled}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span className="hidden sm:inline">Validating</span>
              </>
            ) : (
              <span>Apply</span>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-neutral-500">
          Coupon codes are case-insensitive and must be valid and active.
        </p>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setError(null);
            setCouponCode('');
          }}
          disabled={disabled}
          className="text-neutral-600 text-sm hover:text-neutral-900 disabled:opacity-50 transition-colors"
        >
          Hide coupon field
        </button>
      </form>
    </div>
  );
};

export default CouponInput;
