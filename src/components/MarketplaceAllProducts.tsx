import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  Heart, 
  ShoppingCart, 
  MapPin, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Menu,
  DollarSign,
  Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import Footer from './Footer';

import logo from '../assets/logo.png';

// Types
interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  created_at: string;
}

interface ProductDetails {
  id: number
  name: string;
  description: string;
  images: ProductImage[];
  category_details: string;
  category: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_marketplace_created: boolean;
  avg_daily_demand: number;
  stddev_daily_demand: number;
  safety_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  lead_time_days: number;
  projected_stockout_date_field: string | null;
  producer: any;
  user: number;
  location: number;
}

interface MarketplaceProduct {
  id: number;
  product: number;
  product_details: ProductDetails;
  discounted_price: number | null;
  listed_price: number;
  percent_off: number;
  savings_amount: number;
  offer_start: string | null;
  offer_end: string | null;
  is_offer_active: boolean | null;
  offer_countdown: string | null;
  estimated_delivery_days: number | null;
  shipping_cost: string;
  is_free_shipping: boolean;
  recent_purchases_count: number;
  listed_date: string;
  is_available: boolean;
  min_order: number | null;
  latitude: number;
  longitude: number;
  bulk_price_tiers: any[];
  variants: any[];
  reviews: any[];
  average_rating: number;
  ratings_breakdown: {
    [key: string]: number;
  };
  total_reviews: number;
  view_count: number;
  rank_score: number;
}

// Constants
const CATEGORY_OPTIONS = [
  { code: 'All', label: 'All Categories' },
  { code: 'FA', label: 'Fashion & Apparel' },
  { code: 'EG', label: 'Electronics & Gadgets' },
  { code: 'GE', label: 'Groceries & Essentials' },
  { code: 'HB', label: 'Health & Beauty' },
  { code: 'HL', label: 'Home & Living' },
  { code: 'TT', label: 'Travel & Tourism' },
  { code: 'IS', label: 'Industrial Supplies' },
  { code: 'OT', label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
];

const PRICE_RANGES = [
  { value: 'all', label: 'All Prices' },
  { value: '0-1000', label: 'Under Rs. 1,000' },
  { value: '1000-5000', label: 'Rs. 1,000 - 5,000' },
  { value: '5000-10000', label: 'Rs. 5,000 - 10,000' },
  { value: '10000-25000', label: 'Rs. 10,000 - 25,000' },
  { value: '25000-50000', label: 'Rs. 25,000 - 50,000' },
  { value: '50000+', label: 'Above Rs. 50,000' },
];

const RATING_FILTERS = [
  { value: 'all', label: 'All Ratings' },
  { value: '4+', label: '4★ & Above' },
  { value: '3+', label: '3★ & Above' },
  { value: '2+', label: '2★ & Above' },
  { value: '1+', label: '1★ & Above' },
];

const MarketplaceAllProducts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, distinctItemCount } = useCart();
  const { user } = useAuth();

  // State
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' } | null>(null);

  const productsPerPage = 12;

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedPriceRange !== 'all') {
        if (selectedPriceRange === '50000+') {
          params.append('min_price', '50000');
        } else {
          const [min, max] = selectedPriceRange.split('-');
          if (min) params.append('min_price', min);
          if (max) params.append('max_price', max);
        }
      }
      if (selectedRating !== 'all') {
        const rating = selectedRating.replace('+', '');
        params.append('min_rating', rating);
      }
      params.append('page', currentPage.toString());
      params.append('limit', productsPerPage.toString());
      params.append('sort', sortBy);

      const response = await axios.get(`https://appmulyabazzar.com/api/v1/marketplace/?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.results)) {
        setProducts(response.data.results);
        setTotalPages(Math.ceil(response.data.count / productsPerPage));
        setTotalProducts(response.data.count);
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy, selectedCategory, selectedPriceRange, selectedRating]);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (search && search !== searchTerm) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedCategory !== 'All') params.append('category', selectedCategory);
    setSearchParams(params);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (category !== 'All') params.append('category', category);
    setSearchParams(params);
  };

  const handlePriceRangeChange = (priceRange: string) => {
    setSelectedPriceRange(priceRange);
    setCurrentPage(1);
  };

  const handleRatingChange = (rating: string) => {
    setSelectedRating(rating);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPriceRange('all');
    setSelectedRating('all');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleAddToCart = async (product: MarketplaceProduct) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      await addToCart(product, 1);
      setMessage({ text: `${product.product_details.name} added to cart!`, type: 'info' });
    } catch (error) {
      setMessage({ text: 'Failed to add item to cart', type: 'info' });
    }
  };

  const toggleWishlist = (productId: number) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
      setMessage({ text: 'Removed from wishlist', type: 'info' });
    } else {
      newWishlist.add(productId);
      setMessage({ text: 'Added to wishlist', type: 'info' });
    }
    setWishlist(newWishlist);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : index < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const ProductCard: React.FC<{ product: MarketplaceProduct }> = ({ product }) => {
    const isWishlisted = wishlist.has(product.id);
    const mainImage = product.product_details.images?.[0]?.image || '/api/placeholder/300/300';
    const hasOffer = product.is_offer_active && product.percent_off > 0;

    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden border border-gray-100">
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <img
            src={mainImage}
            alt={product.product_details.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/300/300';
            }}
          />
          
          {/* Offer Badge */}
          {hasOffer && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {product.percent_off}% OFF
            </div>
          )}

          {/* Stock Badge */}
          {product.product_details.stock <= 5 && product.product_details.stock > 0 && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Only {product.product_details.stock} left
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={() => navigate(`/marketplace/${product.id}`)}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.product_details.category_details}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {product.product_details.name}
          </h3>

          {/* Rating */}
          {product.average_rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {renderStars(product.average_rating)}
              </div>
              <span className="text-sm text-gray-600">
                ({product.total_reviews})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-orange-600">
              Rs.{hasOffer ? product.discounted_price?.toFixed(2) : product.listed_price.toFixed(2)}
            </span>
            {hasOffer && (
              <span className="text-sm text-gray-500 line-through">
                Rs.{product.listed_price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock and Delivery Info */}
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <span className="font-medium">Stock:</span>
              <span className={`${product.product_details.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                {product.product_details.stock} units
              </span>
            </div>
            {product.estimated_delivery_days && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{product.estimated_delivery_days} days</span>
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.product_details.stock === 0}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              product.product_details.stock === 0
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-md'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange Header Bar */}
      <div className="bg-orange-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm">
          Welcome to MulyaBazzar - Your Premium Marketplace
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center">
                <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3" />
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl font-bold text-orange-600">
                    All Products
                  </h1>
                  {selectedCategory !== 'All' && (
                    <span className="text-sm text-gray-600">
                      in {CATEGORY_OPTIONS.find(cat => cat.code === selectedCategory)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Search and Cart */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 w-80 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Search
              </button>
              
              {/* Cart Icon */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 sm:p-3 text-gray-600 hover:text-orange-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {distinctItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                    {distinctItemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Icons */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {distinctItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    {distinctItemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowMobileSearch(true)}
                className="p-2 text-gray-600 hover:text-orange-600"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 border-t border-gray-100 gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Filter */}
              <Select.Root value={selectedCategory} onValueChange={handleCategoryChange}>
                <Select.Trigger className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors">
                  <Filter className="w-4 h-4" />
                  <Select.Value />
                  <ChevronDown className="w-4 h-4" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      {CATEGORY_OPTIONS.map((category) => (
                        <Select.Item
                          key={category.code}
                          value={category.code}
                          className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Select.ItemText>{category.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              {/* Price Range Filter */}
              <Select.Root value={selectedPriceRange} onValueChange={handlePriceRangeChange}>
                <Select.Trigger className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors">
                  <DollarSign className="w-4 h-4" />
                  <Select.Value />
                  <ChevronDown className="w-4 h-4" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      {PRICE_RANGES.map((range) => (
                        <Select.Item
                          key={range.value}
                          value={range.value}
                          className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Select.ItemText>{range.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              {/* Rating Filter */}
              <Select.Root value={selectedRating} onValueChange={handleRatingChange}>
                <Select.Trigger className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors">
                  <Star className="w-4 h-4" />
                  <Select.Value />
                  <ChevronDown className="w-4 h-4" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      {RATING_FILTERS.map((rating) => (
                        <Select.Item
                          key={rating.value}
                          value={rating.value}
                          className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Select.ItemText>{rating.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              {/* Sort Filter */}
              <Select.Root value={sortBy} onValueChange={setSortBy}>
                <Select.Trigger className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-orange-100 rounded-lg transition-colors">
                  <SlidersHorizontal className="w-4 h-4" />
                  <Select.Value />
                  <ChevronDown className="w-4 h-4" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      {SORT_OPTIONS.map((option) => (
                        <Select.Item
                          key={option.value}
                          value={option.value}
                          className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <Select.ItemText>{option.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              {/* Clear Filters Button */}
              {(selectedCategory !== 'All' || selectedPriceRange !== 'all' || selectedRating !== 'all' || searchTerm) && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}

              {/* Results Count */}
              <span className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${totalProducts} products found`}
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-400 hover:text-orange-600'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-400 hover:text-orange-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Filters */}
        {(selectedCategory !== 'All' || selectedPriceRange !== 'all' || selectedRating !== 'all' || searchTerm) && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-orange-800">Active Filters:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  <Search className="w-3 h-3" />
                  Search: "{searchTerm}"
                  <button
                    onClick={() => {setSearchTerm(''); setCurrentPage(1);}}
                    className="ml-1 hover:text-orange-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  <Tag className="w-3 h-3" />
                  {CATEGORY_OPTIONS.find(cat => cat.code === selectedCategory)?.label}
                  <button
                    onClick={() => {setSelectedCategory('All'); setCurrentPage(1);}}
                    className="ml-1 hover:text-orange-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {selectedPriceRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  <DollarSign className="w-3 h-3" />
                  {PRICE_RANGES.find(range => range.value === selectedPriceRange)?.label}
                  <button
                    onClick={() => {setSelectedPriceRange('all'); setCurrentPage(1);}}
                    className="ml-1 hover:text-orange-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {selectedRating !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  <Star className="w-3 h-3" />
                  {RATING_FILTERS.find(rating => rating.value === selectedRating)?.label}
                  <button
                    onClick={() => {setSelectedRating('all'); setCurrentPage(1);}}
                    className="ml-1 hover:text-orange-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-full hover:bg-orange-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse different categories.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                    const pageNumber = currentPage <= 3 
                      ? index + 1 
                      : currentPage >= totalPages - 2
                      ? totalPages - 4 + index
                      : currentPage - 2 + index;
                    
                    if (pageNumber < 1 || pageNumber > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-orange-600 text-white'
                            : 'border border-gray-300 hover:bg-orange-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Search Modal */}
      <Dialog.Root open={showMobileSearch} onOpenChange={setShowMobileSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-0 left-0 right-0 bg-white p-4 z-50">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                      setShowMobileSearch(false);
                    }
                  }}
                  className="pl-10 pr-4 py-3 w-full border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  handleSearch();
                  setShowMobileSearch(false);
                }}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Search
              </button>
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 text-gray-600 hover:text-orange-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          setMessage({ text: 'Successfully logged in!', type: 'info' });
        }}
      />

      {/* Message Component */}
      {message && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
          <div className="text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-900">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MarketplaceAllProducts;
