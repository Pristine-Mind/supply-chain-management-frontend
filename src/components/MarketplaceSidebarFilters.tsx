import React from 'react';
import { CategorySelector } from './CategoryHierarchy';
import type {
  FilterCategory,
  FilterBrand,
  FilterSize,
  FilterColor,
  FilterPriceRange,
  FilterStockStatus,
  FilterDeliveryTime,
} from '../api/marketplaceApi';

interface SidebarFiltersProps {
  // Existing filters
  minPrice: string;
  maxPrice: string;
  minOrder: string;
  selectedCity: string;
  selectedBusinessType: string;
  selectedCategory?: number | null;
  selectedSubcategory?: number | null;
  selectedSubSubcategory?: number | null;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onMinOrderChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onCategoryChange?: (categoryId: number | null) => void;
  onSubcategoryChange?: (subcategoryId: number | null) => void;
  onSubSubcategoryChange?: (subSubcategoryId: number | null) => void;
  onClearFilters?: () => void;

  // Server-fetched filter options
  categories?: FilterCategory[];
  brands?: FilterBrand[];
  sizes?: FilterSize[];
  colors?: FilterColor[];
  priceRanges?: FilterPriceRange[];
  stockStatuses?: FilterStockStatus[];
  deliveryTimes?: FilterDeliveryTime[];

  // Selected filter values
  selectedBrandIds?: number[];
  selectedSizes?: string[];
  selectedColors?: string[];
  selectedPriceRange?: string;
  selectedStockStatus?: string;
  selectedDeliveryTime?: string;

  // Filter change handlers
  onBrandChange?: (brandIds: number[]) => void;
  onSizeChange?: (sizes: string[]) => void;
  onColorChange?: (colors: string[]) => void;
  onPriceRangeChange?: (priceRange: string) => void;
  onStockStatusChange?: (stockStatus: string) => void;
  onDeliveryTimeChange?: (deliveryTime: string) => void;

  // Advanced filters
  hasDiscount?: boolean;
  onSale?: boolean;
  b2bAvailable?: boolean;
  inStockOnly?: boolean;
  minReviews?: string;
  onHasDiscountChange?: (val: boolean) => void;
  onOnSaleChange?: (val: boolean) => void;
  onB2bAvailableChange?: (val: boolean) => void;
  onInStockOnlyChange?: (val: boolean) => void;
  onMinReviewsChange?: (val: string) => void;

  // Facets for dynamic counts
  facets?: {
    price_ranges?: { [key: string]: number };
    categories?: Array<{ id: number; name: string; count: number }>;
    brands?: Array<{ id: number; name: string; count: number }>;
    ratings?: { [key: string]: number };
    stock_status?: { [key: string]: number };
    discounts?: { [key: string]: number };
    delivery_time?: { [key: string]: number };
  };
}

const MarketplaceSidebarFilters: React.FC<SidebarFiltersProps> = ({
  // Existing
  minPrice,
  maxPrice,
  minOrder,
  selectedCity,
  selectedBusinessType,
  selectedCategory,
  selectedSubcategory,
  selectedSubSubcategory,
  onMinPriceChange,
  onMaxPriceChange,
  onMinOrderChange,
  onCityChange,
  onCategoryChange,
  onSubcategoryChange,
  onSubSubcategoryChange,
  onClearFilters,

  // Server options
  categories = [],
  brands = [],
  sizes = [],
  colors = [],
  priceRanges = [],
  stockStatuses = [],
  deliveryTimes = [],

  // Selected values
  selectedBrandIds = [],
  selectedSizes = [],
  selectedColors = [],
  selectedPriceRange = '',
  selectedStockStatus = '',
  selectedDeliveryTime = '',

  // Handlers
  onBrandChange,
  onSizeChange,
  onColorChange,
  onPriceRangeChange,
  onStockStatusChange,
  onDeliveryTimeChange,

  // Advanced filters
  hasDiscount = false,
  onSale = false,
  b2bAvailable = false,
  inStockOnly = false,
  minReviews = '',
  onHasDiscountChange,
  onOnSaleChange,
  onB2bAvailableChange,
  onInStockOnlyChange,
  onMinReviewsChange,

  // Facets
  facets,
}) => {
  const hasActiveFilters =
    minPrice ||
    maxPrice ||
    minOrder ||
    selectedCity ||
    selectedBusinessType ||
    selectedCategory ||
    selectedSubcategory ||
    selectedSubSubcategory ||
    selectedBrandIds.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedPriceRange ||
    selectedStockStatus ||
    selectedDeliveryTime ||
    hasDiscount ||
    onSale ||
    b2bAvailable ||
    inStockOnly ||
    minReviews;

  // Input style class
  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors';

  // Checkbox style
  const checkboxClass =
    'w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500';

  // Handle brand checkbox toggle
  const handleBrandToggle = (brandId: number) => {
    if (!onBrandChange) return;
    const newSelection = selectedBrandIds.includes(brandId)
      ? selectedBrandIds.filter((id) => id !== brandId)
      : [...selectedBrandIds, brandId];
    onBrandChange(newSelection);
  };

  // Handle size checkbox toggle
  const handleSizeToggle = (sizeValue: string) => {
    if (!onSizeChange) return;
    const newSelection = selectedSizes.includes(sizeValue)
      ? selectedSizes.filter((s) => s !== sizeValue)
      : [...selectedSizes, sizeValue];
    onSizeChange(newSelection);
  };

  // Handle color checkbox toggle
  const handleColorToggle = (colorValue: string) => {
    if (!onColorChange) return;
    const newSelection = selectedColors.includes(colorValue)
      ? selectedColors.filter((c) => c !== colorValue)
      : [...selectedColors, colorValue];
    onColorChange(newSelection);
  };

  // Get color style for color swatch
  const getColorStyle = (colorValue: string): React.CSSProperties => {
    const colorMap: Record<string, string> = {
      RED: '#ef4444',
      BLUE: '#3b82f6',
      GREEN: '#22c55e',
      YELLOW: '#eab308',
      BLACK: '#000000',
      WHITE: '#ffffff',
      GRAY: '#6b7280',
      BROWN: '#8b4513',
      ORANGE: '#f97316',
      PURPLE: '#a855f7',
      PINK: '#ec4899',
      NAVY: '#1e3a8a',
      BEIGE: '#d4c4a8',
      GOLD: '#ffd700',
      SILVER: '#c0c0c0',
      MULTICOLOR: 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)',
      TRANSPARENT: 'transparent',
      CUSTOM: '#e5e7eb',
    };

    const background = colorMap[colorValue] || '#e5e7eb';
    
    if (background.startsWith('linear-gradient')) {
      return {
        background,
        border: '1px solid #d1d5db',
      };
    }
    
    return {
      backgroundColor: background,
      border: colorValue === 'WHITE' || colorValue === 'TRANSPARENT' ? '1px solid #d1d5db' : 'none',
    };
  };

  return (
    <div className="w-full lg:w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-5 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      {/* <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Category</h3>
        <CategorySelector
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          selectedSubSubcategory={selectedSubSubcategory}
          onCategoryChange={onCategoryChange}
          onSubcategoryChange={onSubcategoryChange}
          onSubSubcategoryChange={onSubSubcategoryChange}
          showHierarchy={false}
          mode="dropdown"
        />
      </div> */}

      {/* Categories from Server */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Categories</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 py-1 px-1 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={selectedCategory === category.id}
                  onChange={() =>
                    onCategoryChange?.(selectedCategory === category.id ? null : category.id)
                  }
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Brands</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center gap-2 py-1 px-1 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={selectedBrandIds.includes(brand.id)}
                  onChange={() => handleBrandToggle(brand.id)}
                />
                <span className="text-sm text-gray-700">{brand.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Ranges */}
      {priceRanges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Price Range</h3>
          <div className="space-y-1">
            {priceRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center gap-2 py-1 px-1 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="radio"
                  name="priceRange"
                  className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  checked={selectedPriceRange === range.value}
                  onChange={() => onPriceRangeChange?.(range.value)}
                />
                <span className="text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Custom Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Custom Price (Rs)</h3>
        <div className="space-y-2">
          <input
            type="number"
            className={inputClass}
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="Min"
            min="0"
          />
          <input
            type="number"
            className={inputClass}
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="Max"
            min="0"
          />
        </div>
      </div>

      {/* Sizes */}
      {sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Sizes</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size.value}
                onClick={() => handleSizeToggle(size.value)}
                className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                  selectedSizes.includes(size.value)
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                }`}
                title={size.label}
              >
                {size.value}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Colors</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorToggle(color.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColors.includes(color.value)
                    ? 'border-orange-600 ring-2 ring-orange-200'
                    : 'border-gray-300 hover:border-orange-400'
                }`}
                style={getColorStyle(color.value)}
                title={color.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stock Status */}
      {stockStatuses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Stock Status</h3>
          <div className="space-y-1">
            {stockStatuses.map((status) => (
              <label
                key={status.value}
                className="flex items-center gap-2 py-1 px-1 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="radio"
                  name="stockStatus"
                  className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  checked={selectedStockStatus === status.value}
                  onChange={() => onStockStatusChange?.(status.value)}
                />
                <span className="text-sm text-gray-700">{status.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Times */}
      {deliveryTimes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Time</h3>
          <div className="space-y-1">
            {deliveryTimes.map((time) => (
              <label
                key={time.value}
                className="flex items-center gap-2 py-1 px-1 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="radio"
                  name="deliveryTime"
                  className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  checked={selectedDeliveryTime === time.value}
                  onChange={() => onDeliveryTimeChange?.(time.value)}
                />
                <span className="text-sm text-gray-700">{time.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Order */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Min. Order Qty</h3>
        <input
          type="number"
          className={inputClass}
          value={minOrder}
          onChange={(e) => onMinOrderChange(e.target.value)}
          placeholder="e.g. 10"
          min="1"
        />
      </div>

      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">City</h3>
        <input
          type="text"
          className={inputClass}
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="Enter city"
        />
      </div>

      {/* Advanced Filters Section */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">More Filters</h3>
        
        {/* Has Discount */}
        <label className="flex items-center gap-2 py-1.5 px-1 hover:bg-gray-50 rounded cursor-pointer">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={hasDiscount}
            onChange={(e) => onHasDiscountChange?.(e.target.checked)}
          />
          <span className="text-sm text-gray-700">Has Discount</span>
          {facets?.discounts?.has_discount !== undefined && (
            <span className="text-xs text-gray-500 ml-auto">({facets.discounts.has_discount})</span>
          )}
        </label>

        {/* On Sale */}
        <label className="flex items-center gap-2 py-1.5 px-1 hover:bg-gray-50 rounded cursor-pointer">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={onSale}
            onChange={(e) => onOnSaleChange?.(e.target.checked)}
          />
          <span className="text-sm text-gray-700">On Sale</span>
        </label>

        {/* B2B Available */}
        <label className="flex items-center gap-2 py-1.5 px-1 hover:bg-gray-50 rounded cursor-pointer">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={b2bAvailable}
            onChange={(e) => onB2bAvailableChange?.(e.target.checked)}
          />
          <span className="text-sm text-gray-700">B2B Available</span>
        </label>

        {/* In Stock Only */}
        <label className="flex items-center gap-2 py-1.5 px-1 hover:bg-gray-50 rounded cursor-pointer">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={inStockOnly}
            onChange={(e) => onInStockOnlyChange?.(e.target.checked)}
          />
          <span className="text-sm text-gray-700">In Stock Only</span>
          {facets?.stock_status?.in_stock !== undefined && (
            <span className="text-xs text-gray-500 ml-auto">({facets.stock_status.in_stock})</span>
          )}
        </label>

        {/* Min Reviews */}
        <div className="mt-3">
          <h4 className="text-xs font-medium text-gray-600 mb-1.5">Minimum Reviews</h4>
          <input
            type="number"
            className={inputClass}
            value={minReviews}
            onChange={(e) => onMinReviewsChange?.(e.target.value)}
            placeholder="e.g. 10"
            min="0"
          />
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSidebarFilters;
