/**
 * Voice Search Result Component
 * Displays agentic voice search results with personalization insights
 * Shows extracted intent, filters, and ranked product recommendations
 */

import React, { useState } from 'react';
import { VoiceSearchProduct, SearchIntent } from '../types/voiceSearch';
import { explainIntent } from '../services/intentParserService';
import { FiFilter, FiMapPin, FiTruck, FiShoppingCart } from 'react-icons/fi';
import { Search } from 'lucide-react';
import { ProductCard, type ProductCardData } from './product/ProductCard';
import { EmptyState } from './ui/empty-state';
import { Spinner } from './ui/spinner';
import { Badge } from './ui/badge';

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

const toProductCardData = (product: VoiceSearchProduct, intent: SearchIntent | null): ProductCardData => {
  const displayPrice = intent?.is_b2b ? product.b2b_price : product.listed_price;
  const hasDiscount =
    product.discounted_price != null &&
    displayPrice != null &&
    product.discounted_price > 0 &&
    product.discounted_price < displayPrice;

  return {
    id: product.id,
    name: product.name,
    image: product.images?.[0],
    href: `/marketplace/${product.id}`,
    price: hasDiscount ? product.discounted_price! : displayPrice ?? product.listed_price,
    originalPrice: hasDiscount ? displayPrice ?? product.listed_price : null,
    percentOff: hasDiscount
      ? Math.round(((displayPrice! - product.discounted_price!) / displayPrice!) * 100)
      : 0,
    savings: hasDiscount ? displayPrice! - product.discounted_price! : 0,
    stock: 0,
    category: product.category,
    rating: product.rating,
    reviewCount: product.review_count,
    isB2B: intent?.is_b2b ?? false,
    isAvailable: product.is_available,
    estimatedDeliveryDays: product.estimated_delivery_days,
  };
};

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
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <span className="mt-4 text-neutral-600">Searching...</span>
      </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={Search}
        title="No Results Found"
        description="Try adjusting your search query or filters."
      />
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
                  <Badge variant="primary" size="sm">
                    B2B Wholesale
                  </Badge>
                )}

                {intent.made_in_nepal && (
                  <Badge variant="success" size="sm" className="gap-1">
                    <FiMapPin className="w-3 h-3" />
                    Local Products
                  </Badge>
                )}

                {intent.max_price && (
                  <Badge variant="neutral" size="sm">
                    Under Rs. {intent.max_price}
                  </Badge>
                )}

                {intent.urgency !== 'normal' && (
                  <Badge variant="warning" size="sm" className="gap-1">
                    <FiTruck className="w-3 h-3" />
                    {intent.urgency === 'high' ? 'Fast' : 'Very Fast'} Delivery
                  </Badge>
                )}

                {intent.color && (
                  <Badge variant="outline" size="sm">
                    {intent.color.charAt(0) + intent.color.slice(1).toLowerCase()}
                  </Badge>
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
            Found {totalResults} products matching &quot;{query}&quot;
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
        {results.map((product) =>
          viewMode === 'grid' ? (
            <ProductCard
              key={product.id}
              product={toProductCardData(product, intent)}
              size="md"
              showAddToCart
              onAddToCart={() => onAddToCart?.(product)}
              onNavigate={() => onProductClick?.(product)}
            />
          ) : (
            <VoiceSearchProductListItem
              key={product.id}
              product={product}
              intent={intent}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
            />
          )
        )}
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

interface VoiceSearchProductListItemProps {
  product: VoiceSearchProduct;
  intent: SearchIntent | null;
  onProductClick?: (product: VoiceSearchProduct) => void;
  onAddToCart?: (product: VoiceSearchProduct) => void;
}

const VoiceSearchProductListItem: React.FC<VoiceSearchProductListItemProps> = ({
  product,
  intent,
  onProductClick,
  onAddToCart,
}) => {
  const [imageError, setImageError] = useState(false);

  const displayPrice = intent?.is_b2b ? product.b2b_price : product.listed_price;
  const originalPrice = product.listed_price;
  const discount =
    product.discounted_price && displayPrice
      ? Math.round(((displayPrice - product.discounted_price) / displayPrice) * 100)
      : 0;

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
                  <Badge variant="neutral" size="sm">
                    {product.color}
                  </Badge>
                )}
                {product.size && (
                  <Badge variant="neutral" size="sm">
                    {product.size}
                  </Badge>
                )}
              </div>
            </div>

            {/* Featured Badge */}
            {product.is_featured && (
              <Badge variant="warning" size="sm">
                Featured
              </Badge>
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
                    <Badge variant="discount" size="sm">
                      {discount}% off
                    </Badge>
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
};

export default VoiceSearchResults;
