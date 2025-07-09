import React from 'react';

interface SidebarFiltersProps {
  minPrice: string;
  maxPrice: string;
  minOrder: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onMinOrderChange: (val: string) => void;
}

const MarketplaceSidebarFilters: React.FC<SidebarFiltersProps> = ({
  minPrice,
  maxPrice,
  minOrder,
  onMinPriceChange,
  onMaxPriceChange,
  onMinOrderChange,
}) => {
  return (
    <div className="w-full md:w-64 bg-white rounded-2xl shadow p-4 flex flex-col gap-4 sticky top-8">
      <h2 className="font-bold text-lg mb-2">Filters</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2 mb-2 bg-gray-50"
          value={minPrice}
          onChange={e => onMinPriceChange(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2 mb-2 bg-gray-50"
          value={maxPrice}
          onChange={e => onMaxPriceChange(e.target.value)}
          placeholder="e.g. 1000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Qty</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2 mb-2 bg-gray-50"
          value={minOrder}
          onChange={e => onMinOrderChange(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
    </div>
  );
};

export default MarketplaceSidebarFilters;
