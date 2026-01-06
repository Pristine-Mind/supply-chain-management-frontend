import React from 'react';
import { CategorySelector } from './CategoryHierarchy';

interface SidebarFiltersProps {
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
}

const MarketplaceSidebarFilters: React.FC<SidebarFiltersProps> = ({
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
}) => {
  const hasActiveFilters =
    minPrice ||
    maxPrice ||
    minOrder ||
    selectedCity ||
    selectedBusinessType ||
    selectedCategory ||
    selectedSubcategory ||
    selectedSubSubcategory;

  // Input style class
  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors';

  return (
    <div className="w-full lg:w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-5 sticky top-6">
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
      <div>
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
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Price Range (Rs)</h3>
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
    </div>
  );
};

export default MarketplaceSidebarFilters;