/**
 * Voice Search Result Component
 * Displays agentic voice search results with personalization insights
 * Shows extracted intent, filters, and ranked product recommendations
 */

import React, { useState } from 'react';
import { VoiceSearchProduct, SearchIntent } from '../types/voiceSearch';
import { getPersonalizationInsight } from '../services/recommendationEngineService';
import { explainIntent } from '../services/intentParserService';
import { FiFilter, FiStar, FiMapPin, FiTruck, FiShoppingCart } from 'react-icons/fi';

interface VoiceSearchResultsProps {
  /** Search results */
  results: VoiceSearchProduct[];

  /** Original query */
  query: string;

  /** Extracted search intent */
  intent: SearchIntent | null;

  /** Whether results are loading */
  isLoading: boolean;

  /** Error message if search failed */
  error: string | null;

  /** Total number of results across all pages */
  totalResults: number;

  /** Current page number */
  currentPage: number;

  /** Total number of pages */
  totalPages: number;

  /** Callback when product is clicked */
  onProductClick?: (product: VoiceSearchProduct) => void;

  /** Callback to add product to cart */
  onAddToCart?: (product: VoiceSearchProduct) => void;

  /** Callback to go to specific page */
  onPageChange?: (page: number) => void;

  /** Show personalization insights */
  showPersonalizationInsights?: boolean;
}

/**
 * Component to display voice search results with intent visualization
 */
export const VoiceSearchResults: React.FC<VoiceSearchResultsProps> = ({
  results,
  query,
  intent,
  isLoading,
  error,
  totalResults,
  currentPage,
  totalPages,
  onProductClick,
  onAddToCart,
  onPageChange,
  showPersonalizationInsights = true,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Search Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-4 text-gray-600">Searching...</span>
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Results Found</h3>
        <p className="text-gray-600">
          Try adjusting your search query or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intent Summary */}
      {intent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiFilter className="text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Search Intent Detected</h3>
              <p className="text-blue-800 text-sm mt-1">{explainIntent(intent)}</p>

              {/* Intent Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {intent.is_b2b && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    B2B Wholesale
                  </span>
                )}

                {intent.made_in_nepal && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                    <FiMapPin className="w-3 h-3" />
                    Local Products
                  </span>
                )}

                {intent.max_price && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Under Rs. {intent.max_price}
                  </span>
                )}

                {intent.urgency !== 'normal' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 gap-1">
                    <FiTruck className="w-3 h-3" />
                    {intent.urgency === 'high' ? 'Fast' : 'Very Fast'} Delivery
                  </span>
                )}

                {intent.color && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                    {intent.color.charAt(0) + intent.color.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Search Results
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Found {totalResults} products matching "{query}"
            {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Products Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }
      >
        {results.map((product) => (
          <VoiceSearchProductCard
            key={product.id}
            product={product}
            intent={intent}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            showPersonalizationInsights={showPersonalizationInsights}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    pageNum === currentPage
                      ? 'bg-primary-500 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

interface VoiceSearchProductCardProps {
  product: VoiceSearchProduct;
  intent: SearchIntent | null;
  onProductClick?: (product: VoiceSearchProduct) => void;
  onAddToCart?: (product: VoiceSearchProduct) => void;
  showPersonalizationInsights: boolean;
  viewMode: 'grid' | 'list';
}

/**
 * Individual product card component for voice search results
 */
const VoiceSearchProductCard: React.FC<VoiceSearchProductCardProps> = ({
  product,
  intent,
  onProductClick,
  onAddToCart,
  showPersonalizationInsights,
  viewMode,
}) => {
  const [imageError, setImageError] = useState(false);

  const displayPrice = intent?.is_b2b ? product.b2b_price : product.listed_price;
  const originalPrice = product.listed_price;
  const discount =
    product.discounted_price && displayPrice
      ? Math.round(((displayPrice - product.discounted_price) / displayPrice) * 100)
      : 0;

  if (viewMode === 'list') {
    return (
      <div
        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onProductClick?.(product)}
      >
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            {!imageError && product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {product.name}
                </h3>

                {/* Brand */}
                {product.brand && (
                  <p className="text-sm text-gray-600 mt-1">{product.brand}</p>
                )}

                {/* Attributes */}
                <div className="flex gap-2 mt-2">
                  {product.color && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {product.color}
                    </span>
                  )}
                  {product.size && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {product.size}
                    </span>
                  )}
                </div>
              </div>

              {/* Featured Badge */}
              {product.is_featured && (
                <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Featured
                </span>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex items-end justify-between mt-3">
              <div>
                {intent?.is_b2b && product.b2b_price ? (
                  <div>
                    <p className="text-sm text-gray-600">B2B Price</p>
                    <p className="text-lg font-bold text-green-600">
                      Rs. {product.b2b_price.toLocaleString()}
                    </p>
                    {originalPrice > product.b2b_price && (
                      <p className="text-xs text-gray-500 line-through">
                        Rs. {originalPrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      Rs. {displayPrice?.toLocaleString()}
                    </p>
                    {product.discounted_price && discount > 0 && (
                      <p className="text-xs text-red-600 font-semibold">
                        {discount}% off
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(product);
                }}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <FiShoppingCart className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onProductClick?.(product)}
    >
      {/* Image */}
      <div className="relative w-full pt-[100%] bg-gray-100 overflow-hidden">
        {!imageError && product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 space-y-2">
          {product.is_featured && (
            <div className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">
              Featured
            </div>
          )}

          {product.is_made_in_nepal && (
            <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
              <FiMapPin className="w-3 h-3" />
              Local
            </div>
          )}

          {discount > 0 && (
            <div className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{discount}%
            </div>
          )}
        </div>

        {/* Delivery Info */}
        {product.estimated_delivery_days && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <FiTruck className="w-3 h-3" />
            {product.estimated_delivery_days} days
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
          {product.name}
        </h3>

        {/* Brand & Rating */}
        <div className="flex items-center justify-between text-sm">
          {product.brand && (
            <p className="text-gray-600">{product.brand}</p>
          )}

          {product.rating && (
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-semibold text-gray-900">{product.rating}</span>
              {product.review_count && (
                <span className="text-gray-600">
                  ({product.review_count})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Attributes */}
        {(product.color || product.size) && (
          <div className="flex gap-2 flex-wrap">
            {product.color && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {product.color}
              </span>
            )}
            {product.size && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {product.size}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="space-y-1">
          {intent?.is_b2b && product.b2b_price ? (
            <div>
              <p className="text-xs text-gray-600">B2B Price</p>
              <p className="text-xl font-bold text-green-600">
                Rs. {product.b2b_price}
              </p>
              {originalPrice > product.b2b_price && (
                <p className="text-xs text-gray-500 line-through">
                  Rs. {originalPrice}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold text-gray-900">
                Rs. {displayPrice}
              </p>
              {product.discounted_price && (
                <p className="text-xs text-gray-500 line-through">
                  Rs. {originalPrice}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default VoiceSearchResults;
