import React, { useState, useEffect, useRef } from 'react';
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
  DollarSign,
  Tag,
  Package,
  Building
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import Footer from './Footer';
import MarketplaceSidebarFilters from './MarketplaceSidebarFilters';
import { categoryApi, subcategoryApi } from '../api/categoryApi';

import logo from '../assets/logo.png';

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
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
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

  // Helper function to get the appropriate price based on user's B2B status
  const getDisplayPrice = (product: MarketplaceProduct, user: any) => {
    const isB2BUser = user?.b2b_verified === true;
    const isB2BEligible = product.is_b2b_eligible === true;
    
    if (isB2BUser && isB2BEligible) {
      // Show B2B pricing
      return {
        currentPrice: product.b2b_discounted_price || product.b2b_price || product.listed_price,
        originalPrice: product.listed_price, // Always show listed price as crossed-out for B2B
        isB2BPrice: true,
        minQuantity: product.b2b_min_quantity || 1,
        savings: Math.max(0, product.listed_price - (product.b2b_discounted_price || product.b2b_price || product.listed_price))
      };
    } else {
      // Show regular pricing
      return {
        currentPrice: product.discounted_price || product.listed_price,
        originalPrice: product.discounted_price ? product.listed_price : null,
        isB2BPrice: false,
        minQuantity: 1,
        savings: product.discounted_price ? (product.listed_price - product.discounted_price) : 0
      };
    }
  };

  // State
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  // Debounced search term to avoid calling the search API on every keystroke
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' } | null>(null);

  // New category hierarchy state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedSubSubcategoryId, setSelectedSubSubcategoryId] = useState<number | null>(null);
  
  // Filter state for sidebar
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState('');

  const [productsPerPage, setProductsPerPage] = useState<number>(50);

  // Debounce the searchTerm so fetchProducts is called only after user pauses typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // If debouncedSearchTerm is present, use the search endpoint (Elasticsearch-backed)
      if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
        // Include pagination params when using the search endpoint so page changes work correctly
        const searchParams = new URLSearchParams();
        searchParams.append('keyword', debouncedSearchTerm.trim());
  // Use offset/limit for pagination so servers that expect offsets return correct pages
  const offset = (currentPage - 1) * productsPerPage;
  searchParams.append('offset', offset.toString());
  searchParams.append('limit', productsPerPage.toString());

        const searchUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/?${searchParams.toString()}`;
        console.log('Searching products with:', searchUrl);
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
            // If API doesn't return a total count but returned a full page of results,
            // assume there may be more and allow navigating to next page (optimistic).
            const pages = resultsLen === productsPerPage ? currentPage + 1 : 1;
            setTotalPages(pages);
            setTotalProducts(resultsLen);
          }
        } else {
          setProducts([]);
          setTotalPages(1);
          setTotalProducts(0);
        }

        // Return early since search endpoint already provided results
        return;
      }

      const params = new URLSearchParams();
      // Search parameter (legacy listing) - only used when debouncedSearchTerm is empty
      if (searchTerm) params.append('search', searchTerm);
      
      // Category filters - prioritize hierarchy filters over legacy
      if (selectedCategoryId) {
        // Try both parameter names to see which one works
        params.append('category', selectedCategoryId.toString());
        params.append('category_id', selectedCategoryId.toString());
        console.log('🔍 Applied category filter:', selectedCategoryId);
      } else if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
        console.log('🔍 Applied legacy category filter:', selectedCategory);
      }
      
      if (selectedSubcategoryId) {
        params.append('subcategory', selectedSubcategoryId.toString());
        params.append('subcategory_id', selectedSubcategoryId.toString());
        console.log('🔍 Applied subcategory filter:', selectedSubcategoryId);
      }
      
      if (selectedSubSubcategoryId) {
        params.append('sub_subcategory', selectedSubSubcategoryId.toString());
        params.append('sub_subcategory_id', selectedSubSubcategoryId.toString());
        console.log('🔍 Applied sub_subcategory filter:', selectedSubSubcategoryId);
      }
      
      // Location filter
      if (selectedCity) {
        params.append('city', selectedCity);
        console.log('Applied city filter:', selectedCity);
      }
      
      // Business type filter
      if (selectedBusinessType) {
        params.append('profile_type', selectedBusinessType);
        console.log('Applied profile_type filter:', selectedBusinessType);
      }
      
      // Price filters - prioritize sidebar filters over legacy price ranges
      if (minPrice) {
        params.append('min_price', minPrice);
      } else if (selectedPriceRange !== 'all') {
        // Legacy price range support
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
        // Legacy price range support for max price
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
      
  // Pagination and sorting - use offset/limit for broader API compatibility
  params.append('limit', productsPerPage.toString());
  params.append('offset', ((currentPage - 1) * productsPerPage).toString());
      
      if (sortBy && sortBy !== 'relevance') {
        params.append('sort', sortBy);
      }

      const apiUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/?${params.toString()}`;
      console.log('🔍 Current filter state:', {
        selectedCategoryId,
        selectedSubcategoryId,
        selectedSubSubcategoryId,
        searchTerm,
        debouncedSearchTerm
      });
      console.log('Fetching products from:', apiUrl);
      
      const response = await axios.get(apiUrl);
      
      console.log('🔍 API Response:', {
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
      console.error('Error fetching products:', error);
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

  const productsGridRef = useRef<HTMLDivElement | null>(null);

  // Effects
  useEffect(() => {
    console.log('🔍 fetchProducts triggered by state change:', {
      currentPage, 
      sortBy, 
      selectedCategory, 
      selectedCategoryId,
      selectedSubcategoryId,
      selectedSubSubcategoryId,
      debouncedSearchTerm
    });
    fetchProducts();
  }, [
    currentPage, 
    sortBy, 
    selectedCategory, 
    selectedPriceRange, 
    selectedRating,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedSubSubcategoryId,
    minPrice,
    maxPrice,
    minOrder,
    selectedCity,
    selectedBusinessType,
    debouncedSearchTerm,
    productsPerPage
  ]);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Number(searchParams.get('page') || 1);
    
    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (search && search !== searchTerm) {
      setSearchTerm(search);
    }
    if (page && page !== currentPage) {
      setCurrentPage(page);
    }
    // New: support hierarchy filters passed via query params
    const categoryIdParam = searchParams.get('category_id');
    const subcategoryIdParam = searchParams.get('subcategory_id');
    const subSubcategoryIdParam = searchParams.get('sub_subcategory_id');

    if (categoryIdParam) {
      const cid = Number(categoryIdParam);
      console.log('🔍 URL category_id parameter:', categoryIdParam, 'parsed as:', cid);
      if (!Number.isNaN(cid) && cid !== selectedCategoryId) {
        console.log('🔍 Setting selectedCategoryId to:', cid);
        setSelectedCategoryId(cid);
      }
    } else if (selectedCategoryId) {
      console.log('🔍 No category_id in URL, clearing selectedCategoryId');
      setSelectedCategoryId(null);
    }

    if (subcategoryIdParam) {
      const scid = Number(subcategoryIdParam);
      if (!Number.isNaN(scid) && scid !== selectedSubcategoryId) {
        setSelectedSubcategoryId(scid);
      }
    } else if (selectedSubcategoryId) {
      setSelectedSubcategoryId(null);
    }

    if (subSubcategoryIdParam) {
      const sscid = Number(subSubcategoryIdParam);
      if (!Number.isNaN(sscid) && sscid !== selectedSubSubcategoryId) {
        setSelectedSubSubcategoryId(sscid);
      }
    } else if (selectedSubSubcategoryId) {
      setSelectedSubSubcategoryId(null);
    }

    // Fetch and set category/subcategory display names
    if (categoryIdParam) {
      const cid = Number(categoryIdParam);
      if (!Number.isNaN(cid)) {
        categoryApi.getCategory(cid).then(c => setSelectedCategoryName(c.name)).catch(() => setSelectedCategoryName(null));
      }
    } else {
      setSelectedCategoryName(null);
    }

    if (subcategoryIdParam) {
      const scid = Number(subcategoryIdParam);
      if (!Number.isNaN(scid)) {
        subcategoryApi.getSubcategory(scid).then(s => setSelectedSubcategoryName(s.name)).catch(() => setSelectedSubcategoryName(null));
      }
    } else {
      setSelectedSubcategoryName(null);
    }
  }, [searchParams]);

  // When sidebar hierarchical category selections change, sync them into URL search params
  useEffect(() => {
    // Skip URL sync if state was just set from URL to avoid infinite loop
    const categoryIdParam = searchParams.get('category_id');
    const subcategoryIdParam = searchParams.get('subcategory_id');
    const subSubcategoryIdParam = searchParams.get('sub_subcategory_id');
    
    const urlCategoryId = categoryIdParam ? Number(categoryIdParam) : null;
    const urlSubcategoryId = subcategoryIdParam ? Number(subcategoryIdParam) : null;
    const urlSubSubcategoryId = subSubcategoryIdParam ? Number(subSubcategoryIdParam) : null;
    
    // Only update URL if state differs from what's in URL (user changed filters via UI)
    if (selectedCategoryId === urlCategoryId && 
        selectedSubcategoryId === urlSubcategoryId && 
        selectedSubSubcategoryId === urlSubSubcategoryId) {
      return; // State matches URL, no sync needed
    }

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    // Update category hierarchy params
    if (selectedCategoryId) {
      params.set('category_id', selectedCategoryId.toString());
    } else {
      params.delete('category_id');
    }

    if (selectedSubcategoryId) {
      params.set('subcategory_id', selectedSubcategoryId.toString());
    } else {
      params.delete('subcategory_id');
    }

    if (selectedSubSubcategoryId) {
      params.set('sub_subcategory_id', selectedSubSubcategoryId.toString());
    } else {
      params.delete('sub_subcategory_id');
    }

    // Reset page when filters change
    params.delete('page');
    setSearchParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, selectedSubcategoryId, selectedSubSubcategoryId]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter handlers - using existing clearAllFilters function

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
    // Clear new category hierarchy
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedSubSubcategoryId(null);
    setMinPrice('');
    setMaxPrice('');
    setMinOrder('');
    // Clear new filter options
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
    const isWishlisted = wishlist.has(product.id);
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

          {/* Top Right Wishlist Button */}
          {/* <button
            onClick={() => toggleWishlist(product.id)}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isWishlisted 
                ? 'bg-accent-error-500 text-white hover:bg-accent-error-600' 
                : 'bg-white/90 text-neutral-600 hover:text-accent-error-500 hover:bg-white'
            }`}
          >
            <Heart className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
          </button> */}

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
            {(() => {
              const pricing = getDisplayPrice(product, user);
              
              return (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-accent-error-600">
                      Rs. {pricing.currentPrice?.toLocaleString()}
                    </span>
                    {pricing.originalPrice && (
                      <span className="text-sm text-neutral-500 line-through">
                        Rs. {pricing.originalPrice?.toLocaleString()}
                      </span>
                    )}
                    {pricing.isB2BPrice && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        B2B
                      </span>
                    )}
                  </div>
                  {pricing.savings > 0 && (
                    <div className="text-xs text-accent-success-600 font-medium">
                      Save Rs. {pricing.savings?.toLocaleString()}
                    </div>
                  )}
                </>
              );
            })()}
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
                    All Products
                  </h1>
                  {selectedCategory !== 'All' && (
                    <span className="text-body text-neutral-600">
                      in {CATEGORY_OPTIONS.find(cat => cat.code === selectedCategory)?.label}
                    </span>
                  )}
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

          {/* Filters Row */}
          
        </div>
      </div>

      {/* Promo banner (match Marketplace screen design) */}
      <div className="relative w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 h-40 overflow-hidden px-6 rounded-xl mt-10 flex items-center justify-center">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10"></div>
        
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full relative z-10 flex items-center">
          <div className="text-center w-full">
            {/* Icon */}
            <div className="inline-flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            
            {/* Main text */}
            <div className="text-white text-2xl font-bold mb-1 tracking-tight">
              Free Delivery on First Order
            </div>
            
            {/* Subtext */}
            <div className="text-orange-100 text-sm font-medium flex items-center justify-center gap-2">
              <span className="inline-block w-8 h-px bg-orange-200"></span>
              <span>Shop now and save on shipping</span>
              <span className="inline-block w-8 h-px bg-orange-200"></span>
            </div>
            
            {/* CTA Button */}
            <button onClick={() => navigate('/marketplace/all-products')} className="mt-3 px-6 py-2 bg-white text-orange-600 rounded-full font-semibold text-sm hover:bg-orange-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
              Start Shopping
            </button>
          </div>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
          <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-white rounded-br-lg"></div>
        </div>
      </div>

      {/* Categories row - mirror Marketplace categories */}
  <div className="w-full px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Home Decor', desc: 'Stylish home accessories', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop', gradient: 'from-blue-100 to-blue-200' },
            { title: 'Kitchenware', desc: 'Premium kitchen essentials', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=150&h=150&fit=crop', gradient: 'from-purple-100 to-purple-200' },
            { title: 'Bath & Body', desc: 'Luxury self-care products', img: 'https://images.unsplash.com/photo-1514066359479-47a54d1a48d4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1632', gradient: 'from-teal-100 to-teal-200' },
            { title: 'Clothing', desc: 'Trendy fashion apparel', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=150&h=150&fit=crop', gradient: 'from-pink-100 to-pink-200' }
          ].map((c, i) => (
            <div key={i} className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-4 sm:p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer`}>
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{c.title}</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{c.desc}</p>
                <button onClick={() => navigate('/marketplace/all-products')} className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors">Shop Now</button>
              </div>
              <div className="absolute right-3 bottom-3 w-20 h-20 sm:w-24 sm:h-24">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover rounded-xl sm:rounded-2xl shadow-lg" />
              </div>
            </div>
          ))}
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
              selectedCategory={selectedCategoryId}
              selectedSubcategory={selectedSubcategoryId}
              selectedSubSubcategory={selectedSubSubcategoryId}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onMinOrderChange={setMinOrder}
              onCityChange={setSelectedCity}
              onBusinessTypeChange={setSelectedBusinessType}
              onCategoryChange={setSelectedCategoryId}
              onSubcategoryChange={setSelectedSubcategoryId}
              onSubSubcategoryChange={setSelectedSubSubcategoryId}
              onClearFilters={clearAllFilters}
            />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
        {/* Active Filters */}
        {(selectedCategory !== 'All' || selectedPriceRange !== 'all' || selectedRating !== 'all' || searchTerm || selectedCategoryId || minPrice || maxPrice || minOrder || selectedCity || selectedBusinessType) && (
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
                    onClick={() => {
                      setSelectedCategory('All');
                      setCurrentPage(1);
                      const params = new URLSearchParams(Array.from(searchParams.entries()));
                      params.delete('category');
                      // reset page param when clearing filters
                      params.delete('page');
                      setSearchParams(params);
                    }}
                    className="ml-1 hover:text-orange-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* New Category Hierarchy Filter Display */}
              {selectedCategoryId && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  <Tag className="w-3 h-3" />
                  {selectedCategoryName ?? `Category #${selectedCategoryId}`}
                  {selectedSubcategoryName && (
                    <span className="mx-1">›</span>
                  )}
                  {selectedSubcategoryName && <span className="text-sm text-blue-700">{selectedSubcategoryName}</span>}
                  <button
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setSelectedSubcategoryId(null);
                      setCurrentPage(1);
                      const params = new URLSearchParams(Array.from(searchParams.entries()));
                      params.delete('category_id');
                      params.delete('subcategory_id');
                      params.delete('sub_subcategory_id');
                      params.delete('page');
                      setSearchParams(params);
                    }}
                    className="ml-1 hover:text-blue-900"
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

              {minOrder && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  <Package className="w-3 h-3" />
                  Min Order: {minOrder}
                  <button
                    onClick={() => {setMinOrder(''); setCurrentPage(1);}}
                    className="ml-1 hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCity && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                  <MapPin className="w-3 h-3" />
                  City: {selectedCity}
                  <button
                    onClick={() => {setSelectedCity(''); setCurrentPage(1);}}
                    className="ml-1 hover:text-indigo-900"
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
            {/* Products Grid Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
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
          </div> {/* Close Main Content Area */}
        </div> {/* Close flex container */}
      </div> {/* Close max-w-7xl container */}

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
