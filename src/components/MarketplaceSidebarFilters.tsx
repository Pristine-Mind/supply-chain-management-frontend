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
  onBusinessTypeChange: (val: string) => void;
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
  onBusinessTypeChange,
  onCategoryChange,
  onSubcategoryChange,
  onSubSubcategoryChange,
  onClearFilters,
}) => {
  const hasActiveFilters = minPrice || maxPrice || minOrder || selectedCity || selectedBusinessType || selectedCategory || selectedSubcategory || selectedSubSubcategory;

  return (
    <div className="w-full md:w-64 bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 flex flex-col gap-6 sticky top-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-900">Filters</h2>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
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

      {/* Price Range Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price (₹)
            </label>
            <input
              type="number"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              value={minPrice}
              onChange={e => onMinPriceChange(e.target.value)}
              placeholder="e.g. 100"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price (₹)
            </label>
            <input
              type="number"
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              value={maxPrice}
              onChange={e => onMaxPriceChange(e.target.value)}
              placeholder="e.g. 1000"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Minimum Order Quantity Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Order Quantity</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Order Quantity
          </label>
          <input
            type="number"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            value={minOrder}
            onChange={e => onMinOrderChange(e.target.value)}
            placeholder="e.g. 10"
            min="1"
          />
        </div>
      </div>

      {/* City Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            value={selectedCity}
            onChange={e => onCityChange(e.target.value)}
            placeholder="Enter city name"
          />
        </div>
      </div>

      {/* Business Type Filter */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Business Type</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Type
          </label>
          <select
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            value={selectedBusinessType}
            onChange={e => onBusinessTypeChange(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="farmer">Farmer</option>
            <option value="producer">Producer</option>
            <option value="distributor">Distributor</option>
            <option value="retailer">Retailer</option>
            <option value="exporter">Exporter</option>
            <option value="importer">Importer</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Active Filters:</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {minPrice && <p>Min Price: ₹{minPrice}</p>}
            {maxPrice && <p>Max Price: ₹{maxPrice}</p>}
            {minOrder && <p>Min Order: {minOrder}</p>}
            {selectedCity && <p>City: {selectedCity}</p>}
            {selectedBusinessType && <p>Business Type: {selectedBusinessType}</p>}
            {selectedCategory && <p>Category filter applied</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSidebarFilters;
