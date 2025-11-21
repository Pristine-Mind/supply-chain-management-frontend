import React, { useState, useEffect, useRef } from 'react';
import { categoryApi, subcategoryApi, subSubcategoryApi } from '../api/categoryApi';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as Select from '@radix-ui/react-select';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { X, ChevronDown, Check, User, ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import FeaturedProducts from './FeaturedProducts';
import CategoryMenu from './CategoryMenu';
import SearchSuggestions from './SearchSuggestions';

import logo from '../assets/logo.png';
import Footer from './Footer';
import BannerSaleImage from '../assets/banner_sale.png';

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
  ratings_breakdown: {
    [key: string]: number;
  };
  total_reviews: number;
  view_count: number;
  rank_score: number;
}

const PLACEHOLDER = 'https://via.placeholder.com/150';

const Marketplace: React.FC = () => {
  
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  // Dynamic category hierarchy state
  const [categories, setCategories] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<any[]>([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [subSubcategories, setSubSubcategories] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedSubSubcategoryId, setSelectedSubSubcategoryId] = useState<number | null>(null);
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minOrder, setMinOrder] = useState('');
  // Additional filter states for unified interface
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  const [businessTypeDropdownOpen, setBusinessTypeDropdownOpen] = useState(false);
  
  
  const [productsError, setProductsError] = useState('');
  const [flashSaleError, setFlashSaleError] = useState('');
  const [dealsError, setDealsError] = useState('');
  const [todaysPickError, setTodaysPickError] = useState('');
  const [madeInNepalError, setMadeInNepalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Initialize currentView based on URL parameters
  // (view concept removed) we always render marketplace product grid
  const [flashSaleProducts, setFlashSaleProducts] = useState<MarketplaceProduct[]>([]);
  const [dealsProducts, setDealsProducts] = useState<MarketplaceProduct[]>([]);
  const [todaysPickProducts, setTodaysPickProducts] = useState<MarketplaceProduct[]>([]);
  const [madeInNepalProducts, setMadeInNepalProducts] = useState<MarketplaceProduct[]>([]);
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [todaysPickLoading, setTodaysPickLoading] = useState(false);
  const [madeInNepalLoading, setMadeInNepalLoading] = useState(false);
  const { addToCart, distinctItemCount } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const trendingRef = useRef<HTMLDivElement | null>(null);
  const [pendingProduct, setPendingProduct] = useState<MarketplaceProduct | null>(null);

  // Close user menu on outside click or ESC
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isUserMenuOpen]);

  // Focus first menu item when opening for accessibility
  useEffect(() => {
    if (isUserMenuOpen && firstMenuItemRef.current) {
      firstMenuItemRef.current.focus();
    }
  }, [isUserMenuOpen]);
  const itemsPerPage = 48;

  const fetchMarketplaceProducts = async (page: number = 1) => {
    setLoading(true);
    setProductsError('');
    try {
      // If there's a debounced query string, call the dedicated search endpoint
      if (debouncedQuery && debouncedQuery.trim() !== '') {
        const searchUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/?keyword=${encodeURIComponent(
          debouncedQuery.trim()
        )}`;
        const { data } = await axios.get(searchUrl);
        setProducts(data.results || []);
        setTotalCount(data.count || (data.results || []).length || 0);
        setLoading(false);
        return;
      }

      const params: Record<string, any> = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
      };
      // Include category filters when present (use the same param names as MarketplaceAllProducts)
      if (selectedCategoryId) params.category_id = selectedCategoryId;
      if (selectedSubcategoryId) params.subcategory_id = selectedSubcategoryId;
      if (selectedSubSubcategoryId) params.sub_subcategory_id = selectedSubSubcategoryId;
      // ...existing code...
      const { data } = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
        {
          params,
        }
      );
      setProducts(data.results);
      setTotalCount(data.count || 0);
    } catch {
      setProductsError('Error fetching marketplace products');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSaleProducts = async () => {
    setFlashSaleLoading(true);
    setFlashSaleError('');
    try {
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/most_viewed/`;
      const { data } = await axios.get(url, { timeout: 8000 });
      setFlashSaleProducts(data.results);
    } catch {
      setFlashSaleError('Error fetching flash sale products');
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const fetchDealsProducts = async () => {
    setDealsLoading(true);
    setDealsError('');
    try {
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/deals/`;
      const { data } = await axios.get(url, { timeout: 8000 });
      setDealsProducts(data.results);
    } catch {
      setDealsError('Error fetching deals products');
    } finally {
      setDealsLoading(false);
    }
  };

  const fetchTodaysPick = async () => {
    setTodaysPickLoading(true);
    setTodaysPickError('');
    try {
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/new_trending/`;
      const { data } = await axios.get(url, { timeout: 8000 });
      setTodaysPickProducts(data.results);
    } catch {
      setTodaysPickError('Error fetching todays pick products');
    } finally {
      setTodaysPickLoading(false);
    }
  };

  const fetchMadeInNepal = async () => {
    console.log('🇳🇵 [Made in Nepal] Starting fetch...');
    setMadeInNepalLoading(true);
    setMadeInNepalError('');
    
    try {
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/made-in-nepal/`;
      console.log('🇳🇵 [Made in Nepal] API URL:', url);
      console.log('🇳🇵 [Made in Nepal] Environment variable VITE_REACT_APP_API_URL:', import.meta.env.VITE_REACT_APP_API_URL);
      
      const response = await axios.get(url, { timeout: 8000 });
      console.log('🇳🇵 [Made in Nepal] Raw response:', response);
      console.log('🇳🇵 [Made in Nepal] Response status:', response.status);
      console.log('🇳🇵 [Made in Nepal] Response data:', response.data);
      
      if (response.data && response.data.results) {
        console.log('🇳🇵 [Made in Nepal] Products found:', response.data.results.length);
        console.log('🇳🇵 [Made in Nepal] First few products:', response.data.results.slice(0, 3));
        setMadeInNepalProducts(response.data.results);
      } else {
        console.warn('🇳🇵 [Made in Nepal] No results in response data:', response.data);
        setMadeInNepalProducts([]);
      }
    } catch (error: any) {
      console.error('🇳🇵 [Made in Nepal] Error fetching products:', error);
      console.error('🇳🇵 [Made in Nepal] Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      setMadeInNepalError('Error fetching Made in Nepal products');
    } finally {
      setMadeInNepalLoading(false);
      console.log('🇳🇵 [Made in Nepal] Fetch completed');
    }
  };

  // Helpers for trending strip scrolling
  const scrollTrendingBy = (distance: number) => {
    if (trendingRef.current) {
      trendingRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };
  
  // Navigate to full results page when user presses Enter in search
  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Navigate to marketplace all-products with search query
      navigate(`/marketplace/all-products?search=${encodeURIComponent(query)}`);
    }
  };

  // Debounce query input so search is performed after typing pauses
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch categories on mount
  useEffect(() => {
    categoryApi.getCategories().then(setCategories).catch(() => setCategories([]));
    categoryApi.getCategoryHierarchy().then(setCategoryHierarchy).catch(() => setCategoryHierarchy([]));
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      subcategoryApi.getSubcategories(selectedCategoryId).then(setSubcategories).catch(() => setSubcategories([]));
      setSelectedSubcategoryId(null);
      setSubSubcategories([]);
      setSelectedSubSubcategoryId(null);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId(null);
      setSubSubcategories([]);
      setSelectedSubSubcategoryId(null);
    }
  }, [selectedCategoryId]);

  // Fetch sub-subcategories when subcategory changes
  useEffect(() => {
    if (selectedSubcategoryId) {
      subSubcategoryApi.getSubSubcategories(selectedSubcategoryId).then(setSubSubcategories).catch(() => setSubSubcategories([]));
      setSelectedSubSubcategoryId(null);
    } else {
      setSubSubcategories([]);
      setSelectedSubSubcategoryId(null);
    }
  }, [selectedSubcategoryId]);

  useEffect(() => {
    fetchMarketplaceProducts(1);
  }, [debouncedQuery, selectedCategoryId, selectedSubcategoryId, selectedSubSubcategoryId, minPrice, maxPrice, minOrder, selectedCity, selectedBusinessType]);

  useEffect(() => {
    // Fetch all trending section data on component mount for immediate loading
    fetchDealsProducts();
    fetchMadeInNepal();
    fetchTodaysPick();
    fetchFlashSaleProducts();
  }, []);

  // Effect to handle URL parameter changes
  useEffect(() => {
  }, [searchParams]);

  // Debug effect to track Made in Nepal products changes
  useEffect(() => {
    console.log('🇳🇵 [Made in Nepal State Change] Products updated:', {
      count: madeInNepalProducts.length,
      products: madeInNepalProducts,
      loading: madeInNepalLoading,
      error: madeInNepalError
    });
  }, [madeInNepalProducts, madeInNepalLoading, madeInNepalError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.business-type-dropdown')) {
        setBusinessTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!isAuthenticated) {
        setPendingProduct(product);
        setShowLoginModal(true);
        return;
      }
      await addToCart(product);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Do not block the whole screen on an API error — render available sections and show inline errors.

  return (
    <div className="marketplace-root">
      <div className="min-h-screen bg-neutral-50">
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => {
              setShowLoginModal(false);
              setPendingProduct(null);
            }}
            onSuccess={async () => {
              setShowLoginModal(false);
              if (pendingProduct) {
                try {
                  await addToCart(pendingProduct);
                } catch (e) {
                  console.error('Add to cart after login failed:', e);
                } finally {
                  setPendingProduct(null);
                }
              }
            }}
          />
        )}

        {/* Top Navigation Bar - Responsive: search moves to its own line on mobile, sign/register hidden on mobile */}
        <div className="bg-white shadow-elevation-sm border-b border-neutral-200">
          <div className="container mx-auto container-padding py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
              {/* Logo / Brand */}
              <div className="flex items-center justify-start">
                <img src={logo} alt="Logo" className="w-8 h-8 sm:w-12 sm:h-12 mr-2 sm:mr-3" />
                <span className="font-bold text-h2 sm:text-h1 text-primary-500">MulyaBazzar</span>
              </div>

              {/* Centered large search on desktop */}
              <div className="hidden md:flex justify-center">
                <div className="relative w-full max-w-xl">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="input-field w-full pl-12 pr-20 focus:border-primary-500 focus:ring-primary-200 text-lg font-medium rounded-full"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchEnter}
                  />
                    <div className="relative">
                            <SearchSuggestions
                              query={query}
                              onSelect={(val) => {
                                // navigate to all-products with search param when suggestion clicked
                                navigate(`/marketplace/all-products?search=${encodeURIComponent(val)}`);
                              }}
                            />
                    </div>
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <button
                    onClick={() => navigate(`/marketplace/all-products?search=${encodeURIComponent(query)}`)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-primary px-4 sm:px-6 py-2 text-caption font-medium rounded-full"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Desktop auth & cart */}
              <div className="hidden md:flex items-center justify-end space-x-4">
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen((s) => !s)}
                      className="flex items-center gap-2 text-neutral-700 hover:text-primary-500"
                      aria-haspopup="menu"
                      aria-expanded={isUserMenuOpen}
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-semibold text-caption">
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-base font-medium hidden sm:inline">{user?.name || user?.email}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUserMenuOpen && (
                      <div ref={userMenuRef} role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-2">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-semibold text-caption">
                              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                            </div>
                          </div>
                          <button
                            ref={firstMenuItemRef}
                            onClick={() => { navigate('/user-profile'); setIsUserMenuOpen(false); }}
                            className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => { navigate('/my-orders'); setIsUserMenuOpen(false); }}
                            className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                          >
                            My Orders
                          </button>
                          <button
                            onClick={async () => { await logout(); navigate('/'); setIsUserMenuOpen(false); }}
                            className="w-full text-left py-2 text-status-error hover:text-red-700"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-2 text-neutral-700 hover:text-primary-500"
                    onClick={() => navigate('/login')}
                  >
                    <User className="w-6 h-6" />
                    <span className="text-base font-medium">Sign in / Register</span>
                  </button>
                )}

                <button
                  className="flex items-center gap-2 text-neutral-700 hover:text-primary-500 relative"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {distinctItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {distinctItemCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile: stacked search and small cart icon */}
              <div className="md:hidden col-span-1 w-full flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 text-neutral-600"
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </div>
                <div className="relative flex-1 mx-2">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="input-field w-full pl-10 pr-12 focus:border-primary-500 focus:ring-primary-200 text-base rounded-full"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchEnter}
                  />
                  <div className="relative">
                    <SearchSuggestions
                      query={query}
                      onSelect={(val) => navigate(`/marketplace/all-products?search=${encodeURIComponent(val)}`)}
                    />
                  </div>
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <button
                  className="ml-3 p-2 text-neutral-600"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category/Menu Bar - With Category List and Filters */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container mx-auto container-padding flex items-center justify-between py-3 relative">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 lg:flex-none lg:w-auto flex gap-2">
                {/* Category Button triggers grouped menu */}
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all text-sm font-medium shadow-sm w-full max-w-xs"
                  onClick={() => setShowCategoryMenu((v) => !v)}
                >
                  <span>Categories</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {/* Show grouped menu if triggered */}
                {showCategoryMenu && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/40 z-40"
                      onClick={() => setShowCategoryMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 z-50 w-full max-w-4xl">
                      <CategoryMenu
                        categories={categoryHierarchy}
                        onSelect={(categoryId?: any, subcategoryId?: any) => {
                          // update selected filters based on choice
                          const catId = categoryId ? Number(categoryId) : null;
                          const subId = subcategoryId ? Number(subcategoryId) : null;
                          setSelectedCategoryId(catId);
                          setSelectedSubcategoryId(subId);
                          // clear deeper selection
                          setSelectedSubSubcategoryId(null);

                          // close the menu
                          setShowCategoryMenu(false);

                          // Redirect to the full products page with applied filters so URL shares the state
                          const qp: string[] = [];
                          if (catId) qp.push(`category_id=${encodeURIComponent(catId.toString())}`);
                          if (subId) qp.push(`subcategory_id=${encodeURIComponent(subId.toString())}`);
                          const queryString = qp.length ? `?${qp.join('&')}` : '';
                          navigate(`/marketplace/all-products${queryString}`);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Desktop links - hide on small screens */}
              <div className="hidden lg:flex items-center ml-3 space-x-4">
                <button
                  onClick={() => navigate('/featured')}
                  className="text-neutral-700 font-medium cursor-pointer bg-transparent border-0 p-0"
                  aria-label="Featured Selection"
                >
                  Featured Selection
                </button>
                <button
                  onClick={() => navigate('/sell')}
                  className="text-neutral-700 font-medium cursor-pointer bg-transparent border-0 p-0"
                  aria-label="Sell"
                >
                  Sell
                </button>
                <button
                  onClick={() => navigate('/support')}
                  className="text-neutral-700 font-medium cursor-pointer bg-transparent border-0 p-0"
                  aria-label="Support"
                >
                  Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA banner image - replace previous CTA */}
        <div className="w-full">
          <div className="relative w-full h-64 md:h-96 overflow-hidden">
            <img src={BannerSaleImage} alt="Christmas Sale" className="w-full h-full object-cover" />

            {/* Shop Now button positioned at the bottom-center of the banner */}
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-6">
              <button
                onClick={() => navigate('/deals')}
                aria-label="Shop Now"
                className="pointer-events-auto bg-primary-600 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-primary-700 transition"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>

        {/* Trending strip + Promo/Top picks layout */}
        <div className="container mx-auto px-4 py-8">
          {/* Show any trending-related errors but continue rendering available content */}
          {(flashSaleError || dealsError || todaysPickError || madeInNepalError) && (
            <div className="mb-4 space-y-2">
              {flashSaleError && <div className="text-sm text-red-600">{flashSaleError}</div>}
              {dealsError && <div className="text-sm text-red-600">{dealsError}</div>}
              {todaysPickError && <div className="text-sm text-red-600">{todaysPickError}</div>}
              {madeInNepalError && <div className="text-sm text-red-600">{madeInNepalError}</div>}
            </div>
          )}
          {/* Top horizontal trending cards with nav */}
          <div className="relative">
            <button
              onClick={() => scrollTrendingBy(-300)}
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-md hidden lg:inline-flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={trendingRef}
              onMouseEnter={() => {
                // All trending data is already fetched on mount, no need to fetch again
              }}
              className="flex gap-4 overflow-x-auto no-scrollbar py-2"
            >
              {/* Render up to 4 trending placeholders / products */}
              { flashSaleProducts && flashSaleProducts.length > 0 ? (
                flashSaleProducts.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[220px] bg-white rounded-xl border border-neutral-200 overflow-hidden group hover:shadow-lg hover:border-neutral-300 transition-all duration-300 cursor-pointer flex flex-col"
                    onClick={() => navigate(`/marketplace/${p.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="aspect-square w-full overflow-hidden flex-shrink-0">
                      <img src={p.product_details?.images?.[0]?.image ?? PLACEHOLDER} alt={p.product_details?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm font-semibold line-clamp-2 text-neutral-900">{p.product_details?.name}</h3>
                      <div className="mt-2 text-xs text-neutral-500">Rs. {p.discounted_price ?? p.listed_price}</div>
                    </div>
                  </div>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[220px] bg-neutral-100 rounded-xl h-64" />
                ))
              )}
            </div>

            <button
              onClick={() => scrollTrendingBy(300)}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-md hidden lg:inline-flex"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Two-column promo / top picks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="relative bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-8 flex flex-col items-center justify-center overflow-hidden shadow-lg">
              {/* Animated background circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-300 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span>HOT DEALS</span>
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                  Limited Time Deals
                </h3>

                {/* Subtitle */}
                <p className="text-neutral-600 mb-6 text-sm">
                  Exclusive offers you don't want to miss
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/deals')}
                  className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Explore Deals
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>

                {/* Decorative dots */}
                <div className="flex justify-center gap-1 mt-6">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-orange-300 rounded-tr-2xl opacity-30"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-orange-300 rounded-bl-2xl opacity-30"></div>
            </div>

            <div className="bg-neutral-100 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Top picks today</h3>
              <div className="grid grid-cols-3 gap-3">
                {todaysPickProducts && todaysPickProducts.length > 0 ? (
                  todaysPickProducts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/marketplace/${p.id}`)}
                      className="bg-white rounded-xl border border-neutral-200 overflow-hidden group hover:shadow-lg hover:border-neutral-300 transition-all duration-300 cursor-pointer"
                    >
                      <div className="aspect-square w-full overflow-hidden">
                        <img src={p.product_details?.images?.[0]?.image ?? PLACEHOLDER} alt={p.product_details?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold line-clamp-2 text-neutral-900">{p.product_details?.name}</h4>
                        <div className="mt-1 text-xs text-neutral-500">Rs. {p.discounted_price ?? p.listed_price}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-neutral-200 rounded-xl h-64" />
                  ))
                )}
              </div>
            </div>
          </div>
          {/* Promo banner */}
          <div className="relative w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 h-40 overflow-hidden px-6 rounded-xl mt-10 flex items-center justify-center">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10"></div>
            
            <div className="container mx-auto px-4 h-full relative z-10">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
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
            </div>
            
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
              <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10">
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-white rounded-br-lg"></div>
            </div>
          </div>

        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="bg-white w-80 h-full p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-4">
                <a href="/featured" className="block py-2 text-neutral-700 hover:text-primary-600">Featured Selection</a>
                <a href="/sell" className="block py-2 text-neutral-700 hover:text-primary-600">Sell</a>
                <a href="/support" className="block py-2 text-neutral-700 hover:text-primary-600">Support</a>

                <div className="pt-4 border-t border-neutral-200">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-semibold text-caption">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-body font-medium text-neutral-900">{user?.name || 'User'}</p>
                          <p className="text-caption text-neutral-500">{user?.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                        className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => { navigate('/my-orders'); setIsMobileMenuOpen(false); }}
                        className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                      >
                        My Orders
                      </button>
                      <button
                        onClick={async () => { await logout(); navigate('/'); setIsMobileMenuOpen(false); }}
                        className="w-full text-left py-2 text-status-error hover:text-red-700"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                        className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                        className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}

      <FeaturedProducts/>

      {/* Made in Nepal Section */}
      <div className="bg-neutral-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
              <span>🇳🇵</span>
              <span>MADE IN NEPAL</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent mb-2">
              Proudly Made in Nepal
            </h2>
            <p className="text-neutral-600 text-sm">
              Support local businesses and craftsmanship
            </p>
          </div>

          {(() => {
            console.log('🇳🇵 [Made in Nepal Render] Current state:', {
              productsCount: madeInNepalProducts.length,
              isLoading: madeInNepalLoading,
              hasError: !!madeInNepalError,
              error: madeInNepalError,
              products: madeInNepalProducts
            });
            
            return madeInNepalProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {madeInNepalProducts.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden group hover:shadow-lg hover:border-neutral-300 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/marketplace/${p.id}`)}
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img 
                      src={p.product_details?.images?.[0]?.image ?? 'https://via.placeholder.com/150'} 
                      alt={p.product_details?.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold line-clamp-2 text-neutral-900">{p.product_details?.name}</h3>
                    <div className="mt-2 text-xs text-neutral-500">Rs. {p.discounted_price ?? p.listed_price}</div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <span>🇳🇵</span>
                      <span>Made in Nepal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : madeInNepalLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-neutral-100 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-600">
                {madeInNepalError ? madeInNepalError : 'No Made in Nepal products available at the moment'}
              </p>
              <p className="text-neutral-400 text-xs mt-2">
                Debug: Products array length: {madeInNepalProducts.length}, Loading: {madeInNepalLoading.toString()}, Error: {madeInNepalError || 'None'}
              </p>
            </div>
          );
          })()}

          {madeInNepalProducts.length > 8 && (
            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/marketplace/all-products?made_in_nepal=true')}
                className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors"
              >
                View All Made in Nepal Products
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Injected CategorySection (user-provided) - renders 4 category cards in a single responsive row */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>CATEGORIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent mb-2">
            Explore by Category
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base">
            Discover our curated collections for every room and style
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              name: 'Home Decor',
              description: 'Stylish home accessories',
              image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop',
              gradient: 'from-blue-100 to-blue-200',
              accentColor: 'blue',
            },
            {
              name: 'Kitchenware',
              description: 'Premium kitchen essentials',
              image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=150&h=150&fit=crop',
              gradient: 'from-purple-100 to-purple-200',
              accentColor: 'purple',
            },
            {
              name: 'Bath & Body',
              description: 'Luxury self-care products',
              image: 'https://images.unsplash.com/photo-1514066359479-47a54d1a48d4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1632',
              gradient: 'from-teal-100 to-teal-200',
              accentColor: 'teal',
            },
            {
              name: 'Clothing',
              description: 'Trendy fashion apparel',
              image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=150&h=150&fit=crop',
              gradient: 'from-pink-100 to-pink-200',
              accentColor: 'pink',
            },
          ].map((category, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${category.gradient} rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
            >
              {/* Decorative pattern overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
                <div className="absolute inset-0 bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0l15 15-15 15L0 15z' fill='%23000000' fill-opacity='0.1'/%3E%3C/svg%3E")`,
                }}></div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -translate-x-full group-hover:translate-x-full transition-all duration-700"></div>

              <div className="relative z-10">
                {/* Category icon badge */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <svg className={`w-5 h-5 sm:w-6 sm:h-6 text-${category.accentColor}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  {category.description}
                </p>

                <button
                  onClick={() => navigate('/marketplace/all-products')}
                  className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-white transition-all text-sm sm:text-base shadow-sm hover:shadow-md group/btn inline-flex items-center gap-2"
                >
                  Shop Now
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Category image with enhanced styling */}
              <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-white/30 rounded-xl sm:rounded-2xl blur-sm"></div>
                  <img
                    src={category.image}
                    alt={category.name}
                    className="relative w-full h-full object-cover rounded-xl sm:rounded-2xl shadow-lg"
                  />
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
                <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-white rounded-tr-2xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Trending Deals Section - Only show if deals are available */}
      {dealsProducts.length > 0 && (
        <div className="bg-neutral-50 py-8">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center space-x-2">
                    <span>🏷️</span>
                    <span>Trending Deals & Discounts</span>
                  </h2>
                  <p className="text-green-100 mt-2">Save big on selected products!</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{dealsProducts.length}</div>
                  <div className="text-sm text-green-100">Deals Available</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {dealsProducts.slice(0, 8).map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/marketplace/${item.id}`)}
                  className="bg-white rounded-xl shadow-elevation-sm hover:shadow-elevation-md transition-all duration-300 cursor-pointer overflow-hidden group border border-neutral-200"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {item.percent_off > 0 && (
                      <div className="absolute top-3 left-3 bg-accent-success-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10 shadow-sm">
                        {Math.round(item.percent_off)}% OFF
                      </div>
                    )}
                    
                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add wishlist functionality here
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-sm z-10"
                    >
                      <Heart className="w-4 h-4 text-neutral-400 hover:text-accent-error-500 transition-colors" />
                    </button>
                    
                    <img
                      src={item.product_details.images?.[0]?.image ?? PLACEHOLDER}
                      alt={item.product_details.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-white text-neutral-900 px-6 py-2 rounded-lg font-medium hover:bg-neutral-50 transition-colors shadow-sm">
                        Quick View
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {/* Category and Rating */}
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-neutral-100 text-neutral-600 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
                        {item.product_details.category_details}
                      </span>
                      {item.average_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent-warning-400 text-accent-warning-400" />
                          <span className="text-sm font-medium text-neutral-700">
                            {item.average_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            ({item.total_reviews})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Title */}
                    <h3 className="font-semibold text-neutral-900 line-clamp-2 text-body group-hover:text-accent-success-600 transition-colors leading-tight">
                      {item.product_details.name}
                    </h3>
                    
                    {/* Price Section */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.discounted_price && item.discounted_price < item.listed_price ? (
                          <>
                            <span className="text-h3 font-bold text-accent-success-600">
                              Rs.{item.discounted_price}
                            </span>
                            <span className="text-body text-neutral-500 line-through">
                              Rs.{item.listed_price}
                            </span>
                          </>
                        ) : (
                          <span className="text-h3 font-bold text-accent-success-600">
                            Rs.{item.listed_price}
                          </span>
                        )}
                      </div>
                      {item.discounted_price && item.discounted_price < item.listed_price && (
                        <div className="text-xs text-accent-success-600 font-medium bg-accent-success-50 px-2 py-1 rounded-full inline-block">
                          You save Rs.{(item.listed_price - item.discounted_price).toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    {/* Stock Info */}
                    <div className="flex items-center gap-1 text-xs text-neutral-600">
                      <div className={`w-2 h-2 rounded-full ${item.product_details.stock > 10 ? 'bg-accent-success-500' : item.product_details.stock > 0 ? 'bg-accent-warning-500' : 'bg-accent-error-500'}`}></div>
                      <span className="font-medium">
                        {item.product_details.stock > 0 ? `${item.product_details.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    
                    {/* Action Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item, e);
                      }}
                      disabled={item.product_details.stock === 0}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        item.product_details.stock === 0
                          ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                          : 'bg-orange-600 text-white hover:bg-accent-success-700 hover:shadow-md'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{item.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* View All Deals Button */}
            {dealsProducts.length > 8 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    navigate('/deals');
                  }}
                  className="bg-accent-success-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-accent-success-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  View All {dealsProducts.length} Deals
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-3 sm:py-4">
        {/* Filters removed as requested */}

        {/* Section title for personalized recommendations */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-neutral-900">Just For You</h3>
        </div>

                {/* Products Grid */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-gray-600">Loading products...</span>
                  </div>
                ) : productsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 text-lg mb-2">⚠️ Error Loading Products</div>
                    <p className="text-gray-600">{productsError}</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                    <button
                      onClick={() => {
                        setQuery('');
                        setMinPrice('');
                        setMaxPrice('');
                        setMinOrder('');
                        setSelectedCity('');
                        setSelectedBusinessType('');
                      }}
                      className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map(item => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/marketplace/${item.id}`)}
                      className="bg-white rounded-xl border border-neutral-200 overflow-hidden group hover:shadow-lg hover:border-neutral-300 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="relative aspect-square overflow-hidden bg-neutral-50">
                        {item.percent_off > 0 && (
                          <div className="absolute top-3 left-3 bg-accent-error-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                            {Math.round(item.percent_off)}% OFF
                          </div>
                        )}
                        
                        {/* Stock Status Badge */}
                        {item.product_details.stock > 0 && item.product_details.stock <= 5 && (
                          <div className="absolute bottom-3 left-3 bg-accent-warning-500 text-white px-2 py-1 rounded-full text-xs font-medium z-10">
                            Only {item.product_details.stock} left
                          </div>
                        )}
                        
                        <img
                          src={item.product_details.images?.[0]?.image ?? PLACEHOLDER}
                          alt={item.product_details.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button className="bg-white text-neutral-900 px-6 py-2 rounded-lg font-medium hover:bg-neutral-50 transition-colors shadow-sm">
                            Quick View
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {/* Category and Rating */}
                        <div className="flex items-center justify-between">
                          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
                            {item.product_details.category_details}
                          </span>
                          {item.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-accent-warning-400 text-accent-warning-400" />
                              <span className="text-sm font-medium text-neutral-700">
                                {item.average_rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-neutral-500">
                                ({item.total_reviews})
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Title */}
                        <h3 className="font-semibold text-neutral-900 leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {item.product_details.name}
                        </h3>
                        
                        {/* Price Section */}
                        <div className="space-y-1">
                          {item.discounted_price && item.discounted_price < item.listed_price ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg font-bold text-accent-error-600">
                                Rs. {item.discounted_price?.toLocaleString()}
                              </span>
                              <span className="text-sm text-neutral-500 line-through">
                                Rs. {item.listed_price?.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-neutral-900">
                              Rs. {item.listed_price?.toLocaleString()}
                            </span>
                          )}
                          {item.discounted_price && item.discounted_price < item.listed_price && (
                            <div className="text-xs text-accent-success-600 font-medium">
                              Save Rs. {((item.listed_price - item.discounted_price) || 0)?.toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            item.product_details.stock > 10 
                              ? 'bg-accent-success-500' 
                              : item.product_details.stock > 0 
                                ? 'bg-accent-warning-500' 
                                : 'bg-accent-error-500'
                          }`}></div>
                          <span className="text-xs text-neutral-600">
                            {item.product_details.stock > 0 
                              ? `${item.product_details.stock} in stock` 
                              : 'Out of stock'
                            }
                          </span>
                        </div>
                        
                        {/* Action Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item, e);
                          }}
                          disabled={item.product_details.stock === 0}
                          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                            item.product_details.stock === 0
                              ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{item.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

                {totalCount > products.length && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => navigate('/marketplace/all-products')}
                      className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm sm:text-base font-medium"
                    >
                      View More Products
                    </button>
                  </div>
                )}
        
      </div>
    <Footer />
    </div>
    {/* Closing tag for marketplace-root */}
  </div>
  );
};

export default Marketplace;
