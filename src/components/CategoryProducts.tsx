import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { categoryApi, subcategoryApi, type Subcategory } from '../api/categoryApi';
import { createSlug } from '../utils/slugUtils';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import { 
  Search, 
  Grid3X3, 
  List, 
  Star, 
  ShoppingCart, 
  MapPin, 
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import Footer from './Footer';
import MarketplaceSidebarFilters from './MarketplaceSidebarFilters';

import logo from '../assets/logo.png';

interface CategoryProductsProps {}

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
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
];

const CategoryProducts: React.FC<CategoryProductsProps> = () => {
  const { categorySlug, subcategorySlug } = useParams<{
    categorySlug: string;
    subcategorySlug?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, distinctItemCount } = useCart();
  const { user } = useAuth();

  // State
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [notFound, setNotFound] = useState(false);
  const [categoryName, setCategoryName] = useState<string>('');
  const [subcategoryName, setSubcategoryName] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' } | null>(null);
  
  // Filter state for sidebar
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  const [productsPerPage, setProductsPerPage] = useState<number>(50);

  const productsGridRef = useRef<HTMLDivElement | null>(null);

  const findCategoryBySlug = async (slug: string) => {
    try {
      const categories = await categoryApi.getCategories();
      return categories.find(cat => createSlug(cat.name) === slug || cat.code.toLowerCase() === slug);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return null;
    }
  };

  const findSubcategoryBySlug = async (categoryId: number, slug: string) => {
    try {
      const subcategories = await subcategoryApi.getSubcategories(categoryId);
      return subcategories.find((sub: Subcategory) => createSlug(sub.name) === slug || sub.code.toLowerCase() === slug);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return null;
    }
  };

  // Debounce the searchTerm so fetchProducts is called only after user pauses typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch products with comprehensive filtering, search, and category support
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get category/subcategory IDs from slugs
      let categoryId: number | null = null;
      let subcategoryId: number | null = null;

      if (categorySlug) {
        const category = await findCategoryBySlug(categorySlug);
        if (!category) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        categoryId = category.id;
        setCategoryName(category.name);

        if (subcategorySlug) {
          const subcategory = await findSubcategoryBySlug(category.id, subcategorySlug);
          if (!subcategory) {
            setNotFound(true);
            setLoading(false);
            return;
          }
          subcategoryId = subcategory.id;
          setSubcategoryName(subcategory.name);
        }
      }

      // If debouncedSearchTerm is present, use the search endpoint (Elasticsearch-backed)
      if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
        const searchParams = new URLSearchParams();
        searchParams.append('keyword', debouncedSearchTerm.trim());
        const offset = (currentPage - 1) * productsPerPage;
        searchParams.append('offset', offset.toString());
        searchParams.append('limit', productsPerPage.toString());

        // Add category filters to search
        if (categoryId) {
          searchParams.append('category', categoryId.toString());
        }
        if (subcategoryId) {
          searchParams.append('subcategory', subcategoryId.toString());
        }

        const searchUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/?${searchParams.toString()}`;
        console.log('🔍 [CategoryProducts] Searching products with:', searchUrl);
        const response = await axios.get(searchUrl);

        if (response.data && Array.isArray(response.data.results)) {
          const results = response.data.results;
          const resultsLen = results.length;
          const count = typeof response.data.count === 'number' ? response.data.count : null;
          setProducts(results);
          if (count !== null) {
            setTotalPages(Math.max(1, Math.ceil(count / productsPerPage)));
            setTotalProducts(count);
          } else {
            const pages = resultsLen === productsPerPage ? currentPage + 1 : 1;
            setTotalPages(pages);
            setTotalProducts(resultsLen);
          }
        } else {
          setProducts([]);
          setTotalPages(1);
          setTotalProducts(0);
        }
        return;
      }

      // Regular marketplace listing endpoint with filters
      const params = new URLSearchParams();
      
      // Apply category filters from URL slugs
      if (categoryId) {
        params.append('category', categoryId.toString());
        console.log('🔍 [CategoryProducts] Applied category filter:', categoryId);
      }
      
      if (subcategoryId) {
        params.append('subcategory', subcategoryId.toString());
        console.log('🔍 [CategoryProducts] Applied subcategory filter:', subcategoryId);
      }
      
      // Location filter
      if (selectedCity) {
        params.append('city', selectedCity);
      }
      
      // Business type filter
      if (selectedBusinessType) {
        params.append('profile_type', selectedBusinessType);
      }
      
      // Price filters - prioritize sidebar filters over legacy price ranges
      if (minPrice) {
        params.append('min_price', minPrice);
      } else if (selectedPriceRange !== 'all') {
        if (selectedPriceRange === '50000+') {
          params.append('min_price', '50000');
        } else {
          const [min] = selectedPriceRange.split('-');
          if (min) params.append('min_price', min);
        }
      }
      
      if (maxPrice) {
        params.append('max_price', maxPrice);
      } else if (selectedPriceRange !== 'all' && selectedPriceRange !== '50000+') {
        const [, max] = selectedPriceRange.split('-');
        if (max) params.append('max_price', max);
      }
      
      // Minimum order quantity
      if (minOrder) {
        params.append('min_order_quantity', minOrder);
      }
      
      // Rating filter
      if (selectedRating !== 'all') {
        const rating = selectedRating.replace('+', '');
        params.append('min_rating', rating);
      }
      
      // Pagination and sorting
      params.append('limit', productsPerPage.toString());
      params.append('offset', ((currentPage - 1) * productsPerPage).toString());
      
      if (sortBy && sortBy !== 'relevance') {
        params.append('sort', sortBy);
      }

      const apiUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/?${params.toString()}`;
      console.log('🔍 [CategoryProducts] Fetching products from:', apiUrl);
      
      const response = await axios.get(apiUrl);
      
      console.log('🔍 [CategoryProducts] API Response:', {
        url: apiUrl,
        resultCount: response.data?.results?.length || 0,
        totalCount: response.data?.count || 0,
        hasResults: Array.isArray(response.data?.results)
      });
      
      if (response.data && Array.isArray(response.data.results)) {
        const results = response.data.results;
        const resultsLen = results.length;
        const count = typeof response.data.count === 'number' ? response.data.count : null;
        setProducts(results);
        if (count !== null) {
          setTotalPages(Math.max(1, Math.ceil(count / productsPerPage)));
          setTotalProducts(count);
        } else {
          const pages = resultsLen === productsPerPage ? currentPage + 1 : 1;
          setTotalPages(pages);
          setTotalProducts(resultsLen);
        }
      } else {
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
    } catch (error) {
      console.error('🔍 [CategoryProducts] Error fetching products:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    console.log('🔍 [CategoryProducts] fetchProducts triggered by state change:', {
      currentPage, 
      sortBy, 
      selectedPriceRange,
      selectedRating,
      debouncedSearchTerm,
      categorySlug,
      subcategorySlug
    });
    fetchProducts();
  }, [
    currentPage, 
    sortBy, 
    selectedPriceRange, 
    selectedRating,
    minPrice,
    maxPrice,
    minOrder,
    selectedCity,
    selectedBusinessType,
    debouncedSearchTerm,
    productsPerPage,
    categorySlug,
    subcategorySlug
  ]);

  useEffect(() => {
    const search = searchParams.get('search');
    const page = Number(searchParams.get('page') || 1);
    
    if (search && search !== searchTerm) {
      setSearchTerm(search);
    }
    if (page && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [searchParams]);

  // Keep the URL in sync with the current page and scroll grid into view on page change
  useEffect(() => {
    // Update search params with page (remove if first page)
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentPage > 1) params.set('page', currentPage.toString());
    else params.delete('page');
    setSearchParams(params);

    // Scroll products into view for better UX when paging
    if (productsGridRef.current) {
      productsGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

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
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedPriceRange('all');
    setSelectedRating('all');
    setMinPrice('');
    setMaxPrice('');
    setMinOrder('');
    setSelectedCity('');
    setSelectedBusinessType('');
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-3.5 h-3.5 ${
          index < Math.floor(rating)
            ? 'fill-accent-warning-400 text-accent-warning-400'
            : index < rating
            ? 'fill-accent-warning-200 text-accent-warning-400'
            : 'fill-neutral-200 text-neutral-200'
        }`}
      />
    ));
  };

  const ProductCard: React.FC<{ product: MarketplaceProduct }> = ({ product }) => {
    const mainImage = product.product_details.images?.[0]?.image || '/api/placeholder/300/300';
    const hasOffer = product.is_offer_active && product.percent_off > 0;

    return (
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden group hover:shadow-lg hover:border-neutral-300 transition-all duration-300 hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-neutral-50 h-56 sm:h-64">
          <img
            src={mainImage}
            alt={product.product_details.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/300/300';
            }}
          />
          
          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasOffer && (
              <div className="bg-accent-error-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                {product.percent_off}% OFF
              </div>
            )}
            {product.product_details.stock <= 5 && product.product_details.stock > 0 && (
              <div className="bg-accent-warning-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                Only {product.product_details.stock} left
              </div>
            )}
          </div>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={() => navigate(`/marketplace/${product.id}`)}
              className="bg-white text-neutral-900 px-6 py-2 rounded-lg font-medium hover:bg-neutral-50 transition-colors shadow-sm"
            >
              Quick View
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-2 space-y-2 text-sm">
          {/* Category & Rating */}
          <div className="flex items-center justify-between">
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
              {product.product_details.category_details}
            </span>
            {product.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {renderStars(product.average_rating)}
                </div>
                <span className="text-xs text-neutral-600 ml-1">
                  ({product.total_reviews})
                </span>
              </div>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-neutral-900 text-sm leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors cursor-pointer" onClick={() => navigate(`/marketplace/${product.id}`)}>
            {product.product_details.name}
          </h3>

          {/* Price Section */}
          <div className="space-y-1">
            {hasOffer ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-accent-error-600">
                  Rs. {product.discounted_price?.toLocaleString()}
                </span>
                <span className="text-sm text-neutral-500 line-through">
                  Rs. {product.listed_price?.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-neutral-900">
                Rs. {product.listed_price?.toLocaleString()}
              </span>
            )}
            {hasOffer && (
              <div className="text-xs text-accent-success-600 font-medium">
                Save Rs. {((product.listed_price - (product.discounted_price || 0)) || 0)?.toLocaleString()}
              </div>
            )}
          </div>

          {/* Stock and Delivery Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                product.product_details.stock > 10 
                  ? 'bg-accent-success-500' 
                  : product.product_details.stock > 0 
                    ? 'bg-accent-warning-500' 
                    : 'bg-accent-error-500'
              }`}></div>
              <span className="text-xs text-neutral-600">
                {product.product_details.stock > 0 
                  ? `${product.product_details.stock} in stock` 
                  : 'Out of stock'
                }
              </span>
            </div>
            {product.estimated_delivery_days && (
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <MapPin className="w-3 h-3" />
                <span>{product.estimated_delivery_days} days delivery</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.product_details.stock === 0}
            className={`w-full py-1.5 px-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              product.product_details.stock === 0
                ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
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
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
        <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/marketplace/all-products')}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Banner */}
      <div className="bg-primary-500 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto text-center text-caption">
          Welcome to MulyaBazzar - Your Premium Marketplace
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-elevation-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Top Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Home</span>
              </button>
              <div className="h-6 w-px bg-neutral-300 hidden sm:block" />
              <div className="flex items-center">
                <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3" />
                <div className="flex flex-col">
                  <h1 className="text-h2 sm:text-h1 font-bold text-primary-500">
                    {subcategoryName || categoryName}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <button onClick={() => navigate('/')} className="hover:text-primary-600">
                      Home
                    </button>
                    <span>/</span>
                    <button onClick={() => navigate('/marketplace/all-products')} className="hover:text-primary-600">
                      Products
                    </button>
                    <span>/</span>
                    <span className="text-neutral-900 font-medium">{categoryName}</span>
                    {subcategoryName && (
                      <>
                        <span>/</span>
                        <span className="text-neutral-900 font-medium">{subcategoryName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Search and Cart */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-10 pr-4 w-80 focus:border-primary-500 focus:ring-primary-200"
                />
              </div>
              <button
                onClick={handleSearch}
                className="btn-primary"
              >
                Search
              </button>
              
              {/* Cart Icon */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 sm:p-3 text-neutral-600 hover:text-primary-500 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {distinctItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-caption rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium">
                    {distinctItemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Icons */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 text-neutral-600 hover:text-primary-500 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {distinctItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-caption rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {distinctItemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowMobileSearch(true)}
                className="p-2 text-neutral-600 hover:text-primary-500"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block">
            <MarketplaceSidebarFilters
              minPrice={minPrice}
              maxPrice={maxPrice}
              minOrder={minOrder}
              selectedCity={selectedCity}
              selectedBusinessType={selectedBusinessType}
              selectedCategory={null}
              selectedSubcategory={null}
              selectedSubSubcategory={null}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onMinOrderChange={setMinOrder}
              onCityChange={setSelectedCity}
              onBusinessTypeChange={setSelectedBusinessType}
              onCategoryChange={() => {}} // Category is fixed from URL
              onSubcategoryChange={() => {}} // Subcategory is fixed from URL
              onSubSubcategoryChange={() => {}}
              onClearFilters={clearAllFilters}
            />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Active Filters */}
            {(selectedPriceRange !== 'all' || selectedRating !== 'all' || searchTerm || minPrice || maxPrice || minOrder || selectedCity || selectedBusinessType) && (
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

                  {minPrice && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      <DollarSign className="w-3 h-3" />
                      Min: ₹{minPrice}
                      <button
                        onClick={() => {setMinPrice(''); setCurrentPage(1);}}
                        className="ml-1 hover:text-green-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {maxPrice && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      <DollarSign className="w-3 h-3" />
                      Max: ₹{maxPrice}
                      <button
                        onClick={() => {setMaxPrice(''); setCurrentPage(1);}}
                        className="ml-1 hover:text-green-900"
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

            {products.length === 0 && !loading ? (
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
                {/* Products Grid Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="text-sm text-neutral-600">
                    Showing {products.length} of {totalProducts} products
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <label className="text-sm text-neutral-600 mr-2">Sort:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                      className="input-field text-sm"
                      aria-label="Sort products"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'bg-white border'}`}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'bg-white border'}`}
                        aria-label="List view"
                      >
                        <List className="w-4 h-4" />
                      </button>

                      <label className="sr-only">Items per page</label>
                      <select
                        value={productsPerPage}
                        onChange={(e) => { setProductsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="input-field text-sm ml-2"
                        aria-label="Items per page"
                      >
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                          <option value={48}>48</option>
                          <option value={50}>50</option>
                          <option value={60}>60</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div ref={productsGridRef} className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-neutral-600">Page {currentPage} of {totalPages}</div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          aria-label="Previous page"
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
                              aria-current={currentPage === pageNumber}
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
                          aria-label="Next page"
                          className="p-2 rounded-lg border border-gray-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
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

export default CategoryProducts;