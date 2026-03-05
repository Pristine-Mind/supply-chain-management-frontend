import React, { useState } from 'react';
import { Tag, AlertCircle, CheckCircle, Loader, Info } from 'lucide-react';
import { setProductDiscount, getProductDiscountInfo } from '../api/marketplaceApi';
import type { DiscountInfo } from '../api/marketplaceApi';

interface DiscountManagerProps {
  productId: number;
  productName: string;
  listedPrice: number;
  currentDiscount?: number;
  maxDiscount?: number; // Optional max discount limit
  minPrice?: number;    // Optional minimum price floor
  onDiscountApplied?: (discountInfo: DiscountInfo) => void;
  onError?: (error: string) => void;
}

/**
 * Validation utilities for discount edge cases
 */
const DiscountValidation = {
  // Validate discount percentage range
  validatePercentage: (value: number, max: number = 100): { valid: boolean; error?: string } => {
    if (isNaN(value)) return { valid: false, error: 'Discount must be a valid number' };
    if (value < 0) return { valid: false, error: 'Discount cannot be negative' };
    if (value > max) return { valid: false, error: `Discount cannot exceed ${max}%` };
    return { valid: true };
  },

  // Validate product price
  validatePrice: (price: number): { valid: boolean; error?: string } => {
    if (!price || isNaN(price)) return { valid: false, error: 'Invalid product price' };
    if (price <= 0) return { valid: false, error: 'Product price must be greater than 0' };
    if (price > 999999999) return { valid: false, error: 'Product price exceeds maximum' };
    return { valid: true };
  },

  // Check if discounted price respects minimum floor
  validateMinFloor: (discountedPrice: number, minPrice: number): { valid: boolean; error?: string } => {
    if (minPrice && discountedPrice < minPrice) {
      return { valid: false, error: `Discounted price cannot be below Rs. ${minPrice}` };
    }
    return { valid: true };
  },

  // Round currency to 2 decimal places safely
  roundCurrency: (value: number): number => {
    return Math.round(value * 100) / 100;
  },

  // Check for floating point precision issues
  checkPrecision: (original: number, calculated: number, tolerance: number = 0.01): boolean => {
    return Math.abs(original - calculated) <= tolerance;
  }
};

const DiscountManager: React.FC<DiscountManagerProps> = ({
  productId,
  productName,
  listedPrice,
  currentDiscount = 0,
  maxDiscount = 100,
  minPrice = 0,
  onDiscountApplied,
  onError,
}) => {
  const [discountPercentage, setDiscountPercentage] = useState(currentDiscount.toString());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Validate initial product price
  const priceValidation = DiscountValidation.validatePrice(listedPrice);
  const hasValidPrice = priceValidation.valid;

  const discountValue = parseFloat(discountPercentage) || 0;
  
  // Use proper currency rounding to avoid floating point errors
  const newPrice = DiscountValidation.roundCurrency(
    listedPrice * (1 - discountValue / 100)
  );
  const savings = DiscountValidation.roundCurrency(
    (listedPrice * discountValue) / 100
  );

  // Validate discount against constraints
  const discountValidation = DiscountValidation.validatePercentage(discountValue, maxDiscount);
  const minFloorValidation = DiscountValidation.validateMinFloor(newPrice, minPrice);

  React.useEffect(() => {
    if (discountValue > 0) {
      fetchDiscountInfo();
    }
  }, [productId]);

  // Set warning if discount is too high
  React.useEffect(() => {
    if (discountValue > 0) {
      if (discountValue > 80) {
        setWarning('⚠️ Very high discount - verify this is intentional');
      } else if (discountValue > 50) {
        setWarning('⚠️ High discount - double-check profitability');
      } else if (minPrice && newPrice < minPrice) {
        setWarning(`⚠️ Discounted price would be below minimum (Rs. ${minPrice})`);
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }
  }, [discountValue, newPrice, minPrice]);

  const fetchDiscountInfo = async () => {
    try {
      const response = await getProductDiscountInfo(productId);
      setDiscountInfo(response.discount_info);
    } catch (err) {
      console.error('Error fetching discount info:', err);
    }
  };

  const handleApplyDiscount = async () => {
    // Clear previous messages
    setError(null);
    setWarning(null);

    // Validation checks
    if (!hasValidPrice) {
      setError(priceValidation.error || 'Invalid product price');
      onError?.(priceValidation.error || 'Invalid product price');
      return;
    }

    if (!discountPercentage) {
      setError('Please enter a discount percentage');
      return;
    }

    const discount = parseFloat(discountPercentage);

    // Validate percentage
    if (!discountValidation.valid) {
      setError(discountValidation.error || 'Invalid discount percentage');
      return;
    }

    // Validate minimum price floor
    if (!minFloorValidation.valid) {
      setError(minFloorValidation.error || 'Discount exceeds minimum price constraint');
      return;
    }

    // Check for unrealistic discounts (edge case)
    if (discount === 100 && minPrice === 0) {
      const confirmFree = confirm(
        '⚠️ This will make the product FREE! Continue?'
      );
      if (!confirmFree) return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const response = await setProductDiscount(productId, discount);
      
      // Verify response data integrity
      if (!response.discount_applied) {
        throw new Error('Invalid response from server');
      }

      setDiscountInfo(response.discount_applied);
      setSuccess(true);
      onDiscountApplied?.(response.discount_applied);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply discount';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDiscountPercentage(currentDiscount.toString());
    setError(null);
    setWarning(null);
    setSuccess(false);
  };

  // Helper: Format currency safely
  const formatCurrency = (value: number): string => {
    return DiscountValidation.roundCurrency(value).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Discount Manager</h3>
      </div>

      {/* Product Info */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
          {productName}
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            Listed Price: <span className="font-bold text-orange-600">Rs. {formatCurrency(listedPrice)}</span>
          </div>
          {minPrice > 0 && (
            <div>
              Min Price: <span className="font-bold text-blue-600">Rs. {formatCurrency(minPrice)}</span>
            </div>
          )}
          {maxDiscount < 100 && (
            <div>
              Max Discount: <span className="font-bold text-purple-600">{maxDiscount}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Validation Error */}
      {!hasValidPrice && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{priceValidation.error}</div>
        </div>
      )}

      {/* Current Discount Info */}
      {discountInfo && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-full text-left text-xs font-bold text-blue-900 mb-1 hover:text-blue-700"
          >
            {showInfo ? '▼' : '▶'} Current Discount Information
          </button>
          {showInfo && (
            <div className="space-y-1 text-xs text-blue-800 mt-2">
              <div>Discount: {discountInfo.discount_percentage}%</div>
              <div>Discounted Price: Rs. {formatCurrency(discountInfo.discounted_price)}</div>
              <div className="text-green-600 font-medium">Savings: Rs. {formatCurrency(discountInfo.savings_amount)}</div>
            </div>
          )}
        </div>
      )}

      {/* Discount Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Discount Percentage (%)
          {maxDiscount < 100 && <span className="text-gray-500 text-xs ml-1">(Max: {maxDiscount}%)</span>}
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            max={maxDiscount}
            step="0.5"
            value={discountPercentage}
            onChange={(e) => {
              setDiscountPercentage(e.target.value);
              setSuccess(false);
              setError(null);
            }}
            placeholder={`0 to ${maxDiscount}`}
            disabled={loading || !hasValidPrice}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
        </div>
      </div>

      {/* Price Preview */}
      {discountPercentage && hasValidPrice && (
        <div className={`p-3 rounded-lg border-2 ${
          warning ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
        }`}>
          <h5 className={`text-xs font-bold ${
            warning ? 'text-yellow-900' : 'text-green-900'
          } mb-2`}>
            {warning ? '⚠️ Preview with Warning' : '✓ Price Preview'}
          </h5>
          <div className={`space-y-1 text-xs ${
            warning ? 'text-yellow-800' : 'text-green-800'
          }`}>
            <div>Discount: {discountValue}%</div>
            <div>New Price: Rs. {formatCurrency(newPrice)}</div>
            <div className={`font-medium ${
              warning ? 'text-yellow-600' : 'text-green-600'
            }`}>
              Customer Saves: Rs. {formatCurrency(savings)}
            </div>
            {minPrice > 0 && (
              <div className={`text-[10px] font-semibold ${
                newPrice >= minPrice ? 'text-green-600' : 'text-red-600'
              }`}>
                {newPrice >= minPrice ? '✓' : '✗'} Min Floor Check: Rs. {formatCurrency(minPrice)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning Message */}
      {warning && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">{warning}</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700">Discount applied successfully!</div>
        </div>
      )}

      {/* Info Box */}
      {discountValue > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            Customers will see a discount badge and save <strong>Rs. {formatCurrency(savings)}</strong> per unit
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          disabled={loading || !hasValidPrice}
        >
          Reset
        </button>
        <button
          onClick={handleApplyDiscount}
          disabled={loading || !discountPercentage || !hasValidPrice || !discountValidation.valid || !minFloorValidation.valid}
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {loading ? 'Applying...' : 'Apply Discount'}
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 border-t pt-3 space-y-1">
        <p>💡 Tips:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Discount must be between 0 and {maxDiscount}%</li>
          <li>Use 0.5% increments for precise pricing</li>
          <li>Final price is rounded to nearest rupee</li>
          <li>All updates are saved immediately</li>
          {minPrice > 0 && <li>Discounted price cannot go below minimum</li>}
        </ul>
      </div>
    </div>
  );
};

export default DiscountManager;
