import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  ShoppingCart,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  DollarSign,
  Tag,
  Package,
  Building,
  Mic,
  Home
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import Footer from './Footer';
import MarketplaceSidebarFilters from './MarketplaceSidebarFilters';
import { categoryApi, subcategoryApi } from '../api/categoryApi';
import { voiceSearchByText } from '../api/voiceSearchApi';
import { parseSearchIntent, toSearchIntent } from '../services/intentParserService';
import { getFilterOptions, type FilterOptionsResponse } from '../api/marketplaceApi';
import logo from '../assets/logo.png';

// --- Facet Types ---
interface FacetCategory {
  id: number;
  name: string;
  count: number;
}

interface FacetBrand {
  id: number;
  name: string;
  count: number;
}

interface FacetCount {
  [key: string]: number;
}

interface SearchFacets {
  price_ranges?: FacetCount;
  categories?: FacetCategory[];
  brands?: FacetBrand[];
  ratings?: FacetCount;
  stock_status?: FacetCount;
  discounts?: FacetCount;
  delivery_time?: FacetCount;
}

// API response with nested results structure
interface AdvancedSearchResponse {
  count?: number;  // Total count from outer pagination
  next?: string | null;
  previous?: string | null;
  results: {
    results: MarketplaceProduct[];  // Actual products array
    facets: SearchFacets;
    total_count: number;
    total_pages: number;
    current_page: number;
  } | MarketplaceProduct[];  // Can be either nested or direct array
  facets?: SearchFacets;
  total_count?: number;
  total_pages?: number;
  current_page?: number;
}

// --- Interfaces (unchanged) ---
interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  created_at: string;
}

interface ProductDetails {
  id: number;
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
  ratings_breakdown: { [key: string]: number };
  total_reviews: number;
  view_count: number;
  rank_score: number;
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
}

// --- Constants (unchanged) ---
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
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'discount', label: 'Biggest Discount' },
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

// --- Main Component ---
const MarketplaceAllProducts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, distinctItemCount } = useCart();
  const { user } = useAuth();

  // --- Pricing Helper ---
  const getDisplayPrice = (product: MarketplaceProduct, user: any) => {
    const isB2BUser = user?.b2b_verified === true;
    const isB2BEligible = product.is_b2b_eligible === true;
    if (isB2BUser && isB2BEligible) {
      return {
        currentPrice: product.b2b_discounted_price || product.b2b_price || product.listed_price,
        originalPrice: product.listed_price,
        isB2BPrice: true,
        minQuantity: product.b2b_min_quantity || 1,
        savings: Math.max(0, product.listed_price - (product.b2b_discounted_price || product.b2b_price || product.listed_price)),
      };
    } else {
      return {
        currentPrice: product.discounted_price || product.listed_price,
        originalPrice: product.discounted_price ? product.listed_price : null,
        isB2BPrice: false,
        minQuantity: 1,
        savings: product.discounted_price ? product.listed_price - product.discounted_price : 0,
      };
    }
  };

  // --- State ---
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
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
  const [isListening, setIsListening] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' } | null>(null);

  // New hierarchy state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedSubSubcategoryId, setSelectedSubSubcategoryId] = useState<number | null>(null);

  // Sidebar filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  const [productsPerPage, setProductsPerPage] = useState<number>(50);

  // Server-fetched filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  // New filter selections from server
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRangeValue, setSelectedPriceRangeValue] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('');

  // Advanced search filter states
  const [hasDiscount, setHasDiscount] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [b2bAvailable, setB2bAvailable] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minReviews, setMinReviews] = useState('');
  const [nearMe, setNearMe] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  // Facets from search response
  const [facets, setFacets] = useState<SearchFacets | null>(null);

  const productsGridRef = useRef<HTMLDivElement | null>(null);

  // --- Voice Search ---
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    setIsListening(true);
    setSearchTerm('');
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setSearchTerm(finalTranscript);
        setIsListening(false);
        setDebouncedSearchTerm(finalTranscript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // --- Debounce Search ---
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // --- Fetch Products using Advanced Search API ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Text search
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }

      // Category filters
      if (selectedCategoryId) {
        params.append('category_id', selectedCategoryId.toString());
      } else if (selectedSubcategoryId) {
        params.append('subcategory_id', selectedSubcategoryId.toString());
      } else if (selectedSubSubcategoryId) {
        params.append('sub_subcategory_id', selectedSubSubcategoryId.toString());
      }

      // Brand filters (multiple)
      if (selectedBrandIds.length > 0) {
        selectedBrandIds.forEach(id => params.append('brand_id', id.toString()));
      }

      // Price range - use preset or custom
      if (selectedPriceRangeValue) {
        params.append('price_range', selectedPriceRangeValue);
      } else {
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
      }

      // Rating filter
      if (selectedRating !== 'all') {
        const rating = selectedRating.replace('+', '');
        params.append('min_rating', rating);
      }

      // Min reviews
      if (minReviews) {
        params.append('min_reviews', minReviews);
      }

      // Stock status
      if (inStockOnly) {
        params.append('in_stock', 'true');
      }
      if (selectedStockStatus) {
        params.append('stock_status', selectedStockStatus);
      }

      // Discount filters
      if (hasDiscount) {
        params.append('has_discount', 'true');
      }
      if (onSale) {
        params.append('on_sale', 'true');
      }

      // B2B filter
      if (b2bAvailable) {
        params.append('b2b_available', 'true');
      }

      // Product attributes
      if (selectedSizes.length > 0) {
        selectedSizes.forEach(size => params.append('size', size));
      }
      if (selectedColors.length > 0) {
        selectedColors.forEach(color => params.append('color', color));
      }

      // Location / Near me
      if (nearMe) {
        params.append('near_me', nearMe);
      } else if (userLocation) {
        params.append('near_me', `${userLocation.lat},${userLocation.lng},10`);
      }

      // City filter
      if (selectedCity) {
        params.append('city', selectedCity);
      }

      // Sort
      if (sortBy !== 'relevance') {
        params.append('sort_by', sortBy);
      }

      // Pagination
      params.append('page', currentPage.toString());
      params.append('limit', productsPerPage.toString());

      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/advanced-search/?${params.toString()}`;
      
      const response = await axios.get<AdvancedSearchResponse>(url);
      
      // Handle different possible response structures
      const data = response.data;
      
      // Check for nested structure: response.results.results (actual API format)
      const nestedResults = data?.results;
      const isNested = nestedResults && typeof nestedResults === 'object' && 'results' in nestedResults && Array.isArray(nestedResults.results);
      
      const productsArray = isNested 
        ? (nestedResults as { results: MarketplaceProduct[] }).results 
        : Array.isArray(data?.results) 
          ? data.results 
          : [];
      
      setProducts(productsArray);
      
      // Handle pagination data with fallbacks
      // Outer level: count, next, previous; Inner level: total_count, facets
      const totalCount = isNested 
        ? (nestedResults as { total_count: number }).total_count 
        : data?.count ?? data?.total_count ?? productsArray.length;
      
      // Calculate total pages from count and limit
      const calculatedTotalPages = Math.ceil((totalCount || productsArray.length) / productsPerPage);
      
      setTotalProducts(typeof totalCount === 'number' ? totalCount : productsArray.length);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      
      // Extract current page from URL or use state
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const pageFromUrl = parseInt(urlParams.get('page') || '1', 10);
      setCurrentPage(pageFromUrl);
      
      // Store facets for dynamic filter counts
      const facetsData = isNested 
        ? (nestedResults as { facets: SearchFacets }).facets 
        : data?.facets;
      if (facetsData && typeof facetsData === 'object') {
        setFacets(facetsData);
      } else {
        setFacets(null);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  // Fetch filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setFilterOptionsLoading(true);
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error('Error loading filter options:', err);
      } finally {
        setFilterOptionsLoading(false);
      }
    };
    loadFilterOptions();
  }, []);

  useEffect(() => {
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
    selectedBrandIds,
    selectedSizes,
    selectedColors,
    selectedPriceRangeValue,
    selectedStockStatus,
    selectedDeliveryTime,
    hasDiscount,
    onSale,
    b2bAvailable,
    inStockOnly,
    minReviews,
    nearMe,
    userLocation,
    debouncedSearchTerm,
    productsPerPage,
  ]);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Number(searchParams.get('page') || 1);
    const categoryIdParam = searchParams.get('category_id');
    const subcategoryIdParam = searchParams.get('subcategory_id');
    const subSubcategoryIdParam = searchParams.get('sub_subcategory_id');

    if (category && category !== selectedCategory) setSelectedCategory(category);
    if (search && search !== searchTerm) setSearchTerm(search);
    if (page && page !== currentPage) setCurrentPage(page);

    if (categoryIdParam) {
      const cid = Number(categoryIdParam);
      if (!isNaN(cid) && cid !== selectedCategoryId) {
        setSelectedCategoryId(cid);
        categoryApi.getCategory(cid).then(c => setSelectedCategoryName(c.name)).catch(() => {});
      }
    }
    if (subcategoryIdParam) {
      const scid = Number(subcategoryIdParam);
      if (!isNaN(scid) && scid !== selectedSubcategoryId) {
        setSelectedSubcategoryId(scid);
        subcategoryApi.getSubcategory(scid).then(s => setSelectedSubcategoryName(s.name)).catch(() => {});
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (selectedCategoryId) params.set('category_id', selectedCategoryId.toString());
    else params.delete('category_id');
    if (selectedSubcategoryId) params.set('subcategory_id', selectedSubcategoryId.toString());
    else params.delete('subcategory_id');
    if (selectedSubSubcategoryId) params.set('sub_subcategory_id', selectedSubSubcategoryId.toString());
    else params.delete('sub_subcategory_id');
    params.delete('page');
    setSearchParams(params);
  }, [selectedCategoryId, selectedSubcategoryId, selectedSubSubcategoryId]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (currentPage > 1) params.set('page', currentPage.toString());
    else params.delete('page');
    setSearchParams(params);
    if (productsGridRef.current) {
      productsGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // --- Handlers ---
  const handleSearch = () => {
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedCategory !== 'All') params.append('category', selectedCategory);
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPriceRange('all');
    setSelectedRating('all');
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedSubSubcategoryId(null);
    setMinPrice('');
    setMaxPrice('');
    setMinOrder('');
    setSelectedCity('');
    setSelectedBusinessType('');
    // Reset new server filter selections
    setSelectedBrandIds([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRangeValue('');
    setSelectedStockStatus('');
    setSelectedDeliveryTime('');
    // Reset advanced search filters
    setHasDiscount(false);
    setOnSale(false);
    setB2bAvailable(false);
    setInStockOnly(false);
    setMinReviews('');
    setNearMe('');
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
    if (newWishlist.has(productId)) newWishlist.delete(productId);
    else newWishlist.add(productId);
    setWishlist(newWishlist);
    setMessage({ text: newWishlist.has(productId) ? 'Added to wishlist' : 'Removed from wishlist', type: 'info' });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < Math.floor(rating)
            ? 'text-orange-500 fill-orange-500'
            : index < rating
            ? 'text-orange-300 fill-orange-300'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const ProductCard: React.FC<{ product: MarketplaceProduct }> = ({ product }) => {
    // const isWishlisted = wishlist.has(product.id);
    const mainImage = product.product_details.images?.[0]?.image || '/api/placeholder/300/300';
    const hasOffer = product.is_offer_active && product.percent_off > 0;
    const pricing = getDisplayPrice(product, user);
    const categoryName = product.product_details.category_details || 'Uncategorized';
    // const supplierName = product.producer?.business_name || 'Unknown Supplier';

    const handleImageContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };

    return (
      <a
        href={`/marketplace/${product.id}`}
        className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full no-underline text-inherit"
      >
        <div className="relative h-48 bg-gray-50 overflow-hidden">
          <img
            src={mainImage}
            alt={product.product_details.name}
            draggable={false}
            onContextMenu={handleImageContextMenu}
            className="w-full h-full object-contain p-2 pointer-events-none select-none"
            onError={(e) => (e.currentTarget.src = '/api/placeholder/300/300')}
          />
          {hasOffer && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {product.percent_off}% OFF
            </div>
          )}
          {product.product_details.stock <= 5 && product.product_details.stock > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
              {product.product_details.stock} left
            </div>
          )}
        </div>

        <div className="p-3 flex-1 flex flex-col">
          <div className="mb-1">
            <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-1.5 py-0.5 rounded">
              {categoryName}
            </span>
          </div>

          <h3
            className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 cursor-pointer hover:text-orange-600 transition-colors"
            onClick={() => navigate(`/marketplace/${product.id}`)}
          >
            {product.product_details.name}
          </h3>

          {/* <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3" />
            <span>Delivers in {product.estimated_delivery_days || 'N/A'} days</span>
          </div> */}

          {product.average_rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex gap-0.5">{renderStars(product.average_rating)}</div>
              <span className="text-[10px] text-gray-600">({product.total_reviews})</span>
            </div>
          )}

          <div className="mt-auto space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-orange-600">
                Rs. {pricing.currentPrice?.toLocaleString()}
              </span>
              {pricing.originalPrice && (
                <span className="text-[10px] text-gray-500 line-through">
                  Rs. {pricing.originalPrice?.toLocaleString()}
                </span>
              )}
              {pricing.isB2BPrice && (
                <span className="text-[8px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-bold ml-1">
                  B2B
                </span>
              )}
            </div>

            {pricing.savings > 0 && (
              <div className="text-[10px] text-green-600 font-medium">
                Save Rs. {pricing.savings?.toLocaleString()}
              </div>
            )}

            {(pricing.minQuantity || product.min_order) && (
              <div className="text-[10px] text-gray-600">
                Min. order: {pricing.minQuantity || product.min_order} units
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px]">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  product.product_details.stock > 10
                    ? 'bg-green-500'
                    : product.product_details.stock > 0
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
              <span>
                {product.product_details.stock > 0
                  ? `${product.product_details.stock} in stock`
                  : 'Out of stock'}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.product_details.stock === 0}
            className={`mt-2 w-full py-1.5 text-[11px] font-medium rounded transition-colors ${
              product.product_details.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {product.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </a>
    );
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-orange-600 text-white py-2 text-center text-sm">
        🚚 Free delivery on orders over Rs. 3,000
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-gray-600 hover:text-orange-600">
                <Home className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="w-8 h-8" />
                <div>
                  <h1 className="text-lg font-bold text-orange-600">All Products</h1>
                  {selectedCategory !== 'All' && (
                    <span className="text-xs text-gray-600">
                      in {CATEGORY_OPTIONS.find(cat => cat.code === selectedCategory)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Search & Cart */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-10 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={startVoiceSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleSearch} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm">
                Search
              </button>
              <button onClick={() => navigate('/cart')} className="relative p-2 text-gray-600 hover:text-orange-600">
                <ShoppingCart className="w-5 h-5" />
                {distinctItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {distinctItemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Icons */}
            <div className="md:hidden flex items-center gap-3">
              <button onClick={() => navigate('/cart')} className="relative p-2">
                <ShoppingCart className="w-5 h-5" />
                {distinctItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {distinctItemCount}
                  </span>
                )}
              </button>
              <button onClick={() => setShowMobileSearch(true)} className="p-2 text-gray-600">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-12xl mx-auto px-2 sm:px-6 lg:px-2 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <MarketplaceSidebarFilters
              minPrice={minPrice}
              maxPrice={maxPrice}
              minOrder={minOrder}
              selectedCity={selectedCity}
              selectedCategory={selectedCategoryId}
              selectedSubcategory={selectedSubcategoryId}
              selectedSubSubcategory={selectedSubSubcategoryId}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onMinOrderChange={setMinOrder}
              onCityChange={setSelectedCity}
              onCategoryChange={setSelectedCategoryId}
              onSubcategoryChange={setSelectedSubcategoryId}
              onSubSubcategoryChange={setSelectedSubSubcategoryId}
              onClearFilters={clearAllFilters}
              // Server filter options
              categories={filterOptions?.categories}
              brands={filterOptions?.brands}
              sizes={filterOptions?.sizes}
              colors={filterOptions?.colors}
              priceRanges={filterOptions?.price_ranges}
              stockStatuses={filterOptions?.stock_statuses}
              deliveryTimes={filterOptions?.delivery_times}
              // Selected filter values
              selectedBrandIds={selectedBrandIds}
              selectedSizes={selectedSizes}
              selectedColors={selectedColors}
              selectedPriceRange={selectedPriceRangeValue}
              selectedStockStatus={selectedStockStatus}
              selectedDeliveryTime={selectedDeliveryTime}
              // Filter change handlers
              onBrandChange={setSelectedBrandIds}
              onSizeChange={setSelectedSizes}
              onColorChange={setSelectedColors}
              onPriceRangeChange={setSelectedPriceRangeValue}
              onStockStatusChange={setSelectedStockStatus}
              onDeliveryTimeChange={setSelectedDeliveryTime}
              // Advanced filters
              hasDiscount={hasDiscount}
              onSale={onSale}
              b2bAvailable={b2bAvailable}
              inStockOnly={inStockOnly}
              minReviews={minReviews}
              onHasDiscountChange={setHasDiscount}
              onOnSaleChange={setOnSale}
              onB2bAvailableChange={setB2bAvailable}
              onInStockOnlyChange={setInStockOnly}
              onMinReviewsChange={setMinReviews}
              // Facets from search response
              facets={facets}
            />
          </aside>

          {/* Product Area */}
          <main className="flex-1">
            {/* Active Filters */}
            {(selectedCategory !== 'All' ||
              selectedPriceRange !== 'all' ||
              selectedRating !== 'all' ||
              searchTerm ||
              selectedCategoryId ||
              minPrice ||
              maxPrice ||
              minOrder ||
              selectedCity ||
              selectedBusinessType ||
              selectedBrandIds.length > 0 ||
              selectedSizes.length > 0 ||
              selectedColors.length > 0 ||
              selectedPriceRangeValue ||
              selectedStockStatus ||
              selectedDeliveryTime ||
              hasDiscount ||
              onSale ||
              b2bAvailable ||
              inStockOnly ||
              minReviews ||
              nearMe) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Search className="w-3 h-3" /> "{searchTerm}"
                    <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory !== 'All' && (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {CATEGORY_OPTIONS.find(cat => cat.code === selectedCategory)?.label}
                    <button onClick={() => { setSelectedCategory('All'); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategoryId && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {selectedCategoryName || `Cat #${selectedCategoryId}`}
                    {selectedSubcategoryName && ` > ${selectedSubcategoryName}`}
                    <button onClick={() => {
                      setSelectedCategoryId(null);
                      setSelectedSubcategoryId(null);
                      setCurrentPage(1);
                    }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedBrandIds.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {selectedBrandIds.length} Brand{selectedBrandIds.length > 1 ? 's' : ''}
                    <button onClick={() => { setSelectedBrandIds([]); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedPriceRangeValue && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {filterOptions?.price_ranges.find(r => r.value === selectedPriceRangeValue)?.label || 'Price Range'}
                    <button onClick={() => { setSelectedPriceRangeValue(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minPrice && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Min ₹{minPrice}
                    <button onClick={() => { setMinPrice(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {maxPrice && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Max ₹{maxPrice}
                    <button onClick={() => { setMaxPrice(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSizes.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Size: {selectedSizes.join(', ')}
                    <button onClick={() => { setSelectedSizes([]); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedColors.length > 0 && (
                  <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {selectedColors.length} Color{selectedColors.length > 1 ? 's' : ''}
                    <button onClick={() => { setSelectedColors([]); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedStockStatus && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {filterOptions?.stock_statuses.find(s => s.value === selectedStockStatus)?.label || 'Stock Status'}
                    <button onClick={() => { setSelectedStockStatus(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedDeliveryTime && (
                  <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Delivery: {filterOptions?.delivery_times.find(d => d.value === selectedDeliveryTime)?.label || selectedDeliveryTime}
                    <button onClick={() => { setSelectedDeliveryTime(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minOrder && (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Min Qty: {minOrder}
                    <button onClick={() => { setMinOrder(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCity && (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    City: {selectedCity}
                    <button onClick={() => { setSelectedCity(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Has Discount
                    <button onClick={() => { setHasDiscount(false); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {onSale && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    On Sale
                    <button onClick={() => { setOnSale(false); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {b2bAvailable && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    B2B Available
                    <button onClick={() => { setB2bAvailable(false); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    In Stock Only
                    <button onClick={() => { setInStockOnly(false); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {minReviews && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Min {minReviews} Reviews
                    <button onClick={() => { setMinReviews(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {nearMe && (
                  <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Near Me
                    <button onClick={() => { setNearMe(''); setCurrentPage(1); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-orange-600 text-xs underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}{' '}
                <button onClick={fetchProducts} className="underline">
                  Try again
                </button>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'bg-white border'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'bg-white border'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={productsPerPage}
                  onChange={(e) => { setProductsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm ml-2"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={50}>50</option>
                  <option value={60}>60</option>
                  <option value={60}>100</option>
                </select>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-white h-80 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !Array.isArray(products) || products.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters.</p>
                <button onClick={clearAllFilters} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                ref={productsGridRef}
                className={`grid gap-4 ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    : 'grid-cols-1'
                }`}
              >
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded border disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (currentPage > 3 && currentPage < totalPages - 2) pageNum = currentPage - 2 + i;
                    if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-orange-600 text-white'
                            : 'border hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Search Modal */}
      <Dialog.Root open={showMobileSearch} onOpenChange={setShowMobileSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-0 left-0 right-0 bg-white p-4 z-50">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg"
                  autoFocus
                />
                <button
                  onClick={startVoiceSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Mic className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <button
                onClick={() => {
                  handleSearch();
                  setShowMobileSearch(false);
                }}
                className="bg-orange-600 text-white px-4 py-3 rounded-lg"
              >
                Search
              </button>
              <button onClick={() => setShowMobileSearch(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          setMessage({ text: 'Successfully logged in!', type: 'info' });
        }}
      />

      {message && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-2">
          <div className="text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-gray-900">{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MarketplaceAllProducts;
