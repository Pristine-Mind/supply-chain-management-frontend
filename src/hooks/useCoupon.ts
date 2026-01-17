import { useState, useCallback, useEffect } from 'react';
import { validateCoupon } from '../api/couponsApi';
import { AppliedCoupon, CouponError, CouponErrorType } from '../types/coupon';

interface UseCouponReturn {
  /**
   * Currently applied coupon
   */
  appliedCoupon: AppliedCoupon | null;

  /**
   * Loading state during validation
   */
  isValidating: boolean;

  /**
   * Current error message (if any)
   */
  error: string | null;

  /**
   * Error type for more specific handling
   */
  errorType: CouponErrorType | null;

  /**
   * Apply a coupon code to the cart
   */
  applyCoupon: (code: string, cartId: number) => Promise<void>;

  /**
   * Remove the currently applied coupon
   */
  removeCoupon: () => void;

  /**
   * Clear error message
   */
  clearError: () => void;

  /**
   * Calculate final total with discount
   */
  calculateFinalTotal: (originalTotal: number) => number;
}

/**
 * Custom hook for managing coupon state and operations
 * Handles validation, error states, and discount calculations
 * 
 * @example
 * ```tsx
 * const { appliedCoupon, isValidating, error, applyCoupon, removeCoupon } = useCoupon();
 * 
 * const handleApply = async () => {
 *   await applyCoupon('SUMMER20', cartId);
 * };
 * ```
 */
export const useCoupon = (): UseCouponReturn => {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<CouponErrorType | null>(null);

  /**
   * Apply coupon by validating against cart
   */
  const applyCoupon = useCallback(
    async (code: string, cartId: number) => {
      if (!code.trim()) {
        setError('Please enter a coupon code.');
        setErrorType(CouponErrorType.INVALID_CODE);
        return;
      }

      setIsValidating(true);
      setError(null);
      setErrorType(null);

      try {
        const response = await validateCoupon(code, cartId);

        if (response.valid) {
          const coupon: AppliedCoupon = {
            code: response.data.coupon_code,
            discountAmount: parseFloat(response.data.discount_amount),
            finalAmount: parseFloat(response.data.final_amount),
            discountType: response.data.discount_type,
          };

          setAppliedCoupon(coupon);
          setError(null);
          setErrorType(null);
        } else {
          setError(response.message || 'Invalid coupon code');
          setErrorType(CouponErrorType.INVALID_CODE);
        }
      } catch (err: any) {
        const couponError = err as CouponError;
        const type = couponError.type || CouponErrorType.UNKNOWN_ERROR;
        const message = err.message || 'An error occurred while validating the coupon.';

        setError(message);
        setErrorType(type);
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  /**
   * Remove applied coupon
   */
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setError(null);
    setErrorType(null);
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  /**
   * Calculate final total with coupon discount
   */
  const calculateFinalTotal = useCallback(
    (originalTotal: number): number => {
      if (!appliedCoupon) {
        return originalTotal;
      }

      return appliedCoupon.finalAmount;
    },
    [appliedCoupon]
  );

  return {
    appliedCoupon,
    isValidating,
    error,
    errorType,
    applyCoupon,
    removeCoupon,
    clearError,
    calculateFinalTotal,
  };
};

/**
 * Hook for validating coupon eligibility before applying
 * Useful for pre-validation checks without API call
 */
export const useValidateCouponEligibility = () => {
  /**
   * Check if cart meets minimum purchase requirement
   */
  const meetsMinimumPurchase = (cartTotal: number, minAmount: number): boolean => {
    return cartTotal >= minAmount;
  };

  /**
   * Check if cart is empty
   */
  const isCartEmpty = (cartTotal: number): boolean => {
    return cartTotal <= 0;
  };

  /**
   * Calculate discount based on type and value
   */
  const calculateDiscount = (
    original: number,
    discountValue: number,
    discountType: 'percentage' | 'fixed',
    maxDiscount?: number
  ): number => {
    let discount = discountType === 'percentage'
      ? (original * discountValue) / 100
      : discountValue;

    // Apply maximum discount cap if specified
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }

    return Math.min(discount, original);
  };

  return {
    meetsMinimumPurchase,
    isCartEmpty,
    calculateDiscount,
  };
};

/**
 * Hook for persisting coupon state to localStorage
 * Useful for maintaining coupon across page refreshes
 */
export const useCouponPersistence = (storageKey = 'appliedCoupon') => {
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * Save coupon to localStorage
   */
  const saveCoupon = useCallback(
    (coupon: AppliedCoupon | null) => {
      setAppliedCoupon(coupon);
      if (coupon) {
        localStorage.setItem(storageKey, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(storageKey);
      }
    },
    [storageKey]
  );

  /**
   * Clear persisted coupon
   */
  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    appliedCoupon,
    saveCoupon,
    clearCoupon,
  };
};
