import React, { useState, useEffect, useRef } from 'react';
import { categoryApi } from '../api/categoryApi';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { X, ChevronDown, User, ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Menu, Mic } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import FeaturedProducts from './FeaturedProducts';
import CategoryMenu from './CategoryMenu';
import SearchSuggestions from './SearchSuggestions';
import ShoppableVideoFeed from './ShoppableVideoFeed';
import { createSlug } from '../utils/slugUtils';

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
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
}

interface Brand {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  logo_url: string | null;
  website: string;
  country_of_origin: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  manufacturer_info: string;
  contact_email: string;
  contact_phone: string;
  products_count: number;
}

const PLACEHOLDER = 'https://via.placeholder.com/150';

const Marketplace: React.FC = () => {
  
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isListening, setIsListening] = useState(false);
  const [showVideoFeed, setShowVideoFeed] = useState(false);

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
    setQuery('');

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setQuery(finalTranscript);
        setIsListening(false);
        navigate(`/marketplace/all-products?search=${encodeURIComponent(finalTranscript)}`);
      } else {
        setQuery(interimTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  // Dynamic category hierarchy state
  const [categoryHierarchy, setCategoryHierarchy] = useState<any[]>([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState('');
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
  const brandsRef = useRef<HTMLDivElement | null>(null);
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

  const fetchMarketplaceProducts = async (page: number = 1) => {
    setLoading(true);
    setProductsError('');
    try {
      // Get authentication token for API request
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Token ${token}` } : {};
      
      const params: Record<string, any> = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
      };
      
      // Include price filters
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minOrder) params.min_order_quantity = minOrder;
      
      // Include location and business type filters
      if (selectedCity) params.city = selectedCity;
      if (selectedBusinessType) params.profile_type = selectedBusinessType;


      // If there's a debounced query string, call the dedicated search endpoint
      if (debouncedQuery && debouncedQuery.trim() !== '') {
        params.keyword = debouncedQuery.trim();
        const searchUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/`;
        const { data } = await axios.get(searchUrl, { params, headers });
        setProducts(data.results || []);
        setTotalCount(data.count || (data.results || []).length || 0);
        setLoading(false);
        return;
      }

      // Regular marketplace endpoint for category filtering without search
      const marketplaceUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`;
      const { data } = await axios.get(marketplaceUrl, { params, headers });
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Token ${token}` } : {};
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/most_viewed/`;
      const { data } = await axios.get(url, { timeout: 8000, headers });
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Token ${token}` } : {};
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/deals/`;
      const { data } = await axios.get(url, { timeout: 8000, headers });
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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Token ${token}` } : {};
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/new_trending/`;
      const { data } = await axios.get(url, { timeout: 8000, headers });
      setTodaysPickProducts(data.results);
    } catch {
      setTodaysPickError('Error fetching todays pick products');
    } finally {
      setTodaysPickLoading(false);
    }
  };

  const fetchMadeInNepal = async () => {
    setMadeInNepalLoading(true);
    setMadeInNepalError('');
    
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Token ${token}` } : {};
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/made-in-nepal/`;
      
      const response = await axios.get(url, { timeout: 8000, headers });
      
      if (response.data && response.data.results) {
      
        setMadeInNepalProducts(response.data.results);
      } else {
        setMadeInNepalProducts([]);
      }
    } catch (error: any) {
      setMadeInNepalError('Error fetching Made in Nepal products');
    } finally {
      setMadeInNepalLoading(false);
    }
  };

  const fetchBrands = async () => {
    setBrandsLoading(true);
    setBrandsError('');
    
    try {
      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/brands/`;
      
      const response = await axios.get(url, { timeout: 8000 });
      
      if (response.data && response.data.results) {
        setBrands(response.data.results);
      } else {
        setBrands([]);
      }
    } catch (error: any) {
      setBrandsError('Error fetching brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  // Helpers for trending strip scrolling
  const scrollTrendingBy = (distance: number) => {
    if (trendingRef.current) {
      trendingRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  const scrollBrandsBy = (distance: number) => {
    if (brandsRef.current) {
      brandsRef.current.scrollBy({ left: distance, behavior: 'smooth' });
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
    categoryApi.getCategoryHierarchy().then(setCategoryHierarchy).catch(() => setCategoryHierarchy([]));
  }, []);



  useEffect(() => {
    fetchMarketplaceProducts(1);
  }, [debouncedQuery, minPrice, maxPrice, minOrder, selectedCity, selectedBusinessType]);

  useEffect(() => {
    // Fetch all trending section data on component mount for immediate loading
    fetchDealsProducts();
    fetchMadeInNepal();
    fetchTodaysPick();
    fetchFlashSaleProducts();
    fetchBrands();
  }, []);

  // Effect to handle URL parameter changes
  useEffect(() => {
  }, [searchParams]);

  // Debug effect to track Made in Nepal products changes
  useEffect(() => {
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

  // Auto-scroll for flash sale products
  useEffect(() => {
    const scrollContainer = trendingRef.current;
    if (!scrollContainer || !flashSaleProducts.length) return;

    let scrollDirection = 1;
    const scrollSpeed = 50; // pixels per second
    const intervalTime = 50; // milliseconds

    const autoScroll = setInterval(() => {
      const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      
      if (scrollContainer.scrollLeft >= maxScrollLeft) {
        scrollDirection = -1;
      } else if (scrollContainer.scrollLeft <= 0) {
        scrollDirection = 1;
      }
      
      scrollContainer.scrollLeft += scrollDirection * (scrollSpeed * intervalTime / 1000);
    }, intervalTime);

    // Pause auto-scroll on hover
    const handleMouseEnter = () => clearInterval(autoScroll);
    const handleMouseLeave = () => {
      // Restart auto-scroll when mouse leaves
      setTimeout(() => {
        if (scrollContainer) {
          const newAutoScroll = setInterval(() => {
            const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            
            if (scrollContainer.scrollLeft >= maxScrollLeft) {
              scrollDirection = -1;
            } else if (scrollContainer.scrollLeft <= 0) {
              scrollDirection = 1;
            }
            
            scrollContainer.scrollLeft += scrollDirection * (scrollSpeed * intervalTime / 1000);
          }, intervalTime);
          
          // Store the interval reference
          scrollContainer.dataset.autoScrollInterval = newAutoScroll.toString();
        }
      }, 1000);
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(autoScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
        const intervalId = scrollContainer.dataset.autoScrollInterval;
        if (intervalId) {
          clearInterval(parseInt(intervalId));
        }
      }
    };
  }, [flashSaleProducts]);

  
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
                <div className={`relative w-full max-w-xl transition-all duration-300 ${isListening ? 'scale-[1.02]' : ''}`}>
                  <input
                    type="text"
                    placeholder={isListening ? "Listening..." : "Search products..."}
                    className={`input-field w-full pl-12 pr-32 text-lg font-medium rounded-full transition-all ${isListening ? 'border-red-400 ring-4 ring-red-100' : 'focus:border-primary-500 focus:ring-primary-200'}`}
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
                  <MagnifyingGlassIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isListening ? 'text-red-500 animate-bounce' : 'text-neutral-400'}`} />
                  <button
                    onClick={startVoiceSearch}
                    className={`absolute right-28 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-neutral-100 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`}
                    title="Search by voice"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
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
                  <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isListening ? 'text-red-500 animate-bounce' : 'text-neutral-400'}`} />
                  <button
                    onClick={startVoiceSearch}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-neutral-100 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
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
                          // close the menu
                          setShowCategoryMenu(false);

                          // Find category and subcategory names for URL
                          const category = categoryHierarchy.find(cat => cat.id === categoryId);
                          if (!category) return;
                          
                          const categorySlug = createSlug(category.name);
                          
                          if (subcategoryId) {
                            // Find subcategory name
                            const subcategory = category.subcategories?.find((sub: any) => sub.id === subcategoryId);
                            if (subcategory) {
                              const subcategorySlug = createSlug(subcategory.name);
                              navigate(`/marketplace/categories/${categorySlug}/${subcategorySlug}`);
                            } else {
                              // Fallback to category only
                              navigate(`/marketplace/categories/${categorySlug}`);
                            }
                          } else {
                            // Category only
                            navigate(`/marketplace/categories/${categorySlug}`);
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Desktop links - hide on small screens */}
              <div className="hidden md:flex items-center ml-3 space-x-4">
                <button
                  onClick={() => navigate('/featured')}
                  className="text-neutral-700 font-medium cursor-pointer bg-transparent border-0 p-0"
                  aria-label="Featured Selection"
                >
                  Featured Selection
                </button>
                <button
                  onClick={() => setShowVideoFeed(true)}
                  className="text-neutral-700 font-medium cursor-pointer bg-transparent border-0 p-0 flex items-center gap-1"
                  aria-label="Just For You"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  Just For You
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

        {/* CTA banner with categories overlapping */}
        <div className="w-full relative">
          <div className="relative w-full h-auto min-h-[250px] sm:min-h-[300px] md:min-h-[400px] overflow-hidden">
            {/* Background Banner Image */}
            <img src={BannerSaleImage} alt="Christmas Sale" className="w-full h-full object-cover absolute inset-0" />

            {/* Gradient overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
          </div>

          {/* Categories positioned to overlap banner - only 10% inside */}
          <div className="absolute bottom-0 left-0 right-0 z-0 transform translate-y-[90%]">
            <div className="container mx-auto px-4 sm:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    title: 'Shop Electronics',
                    description: 'Shop the full selection now',
                    image: 'https://himstar.com.np/Media/TV/ht-55u4ksdj.png',
                    searchTerm: 'electronics',
                    categoryName: 'Electronics & Gadgets'
                  },
                  {
                    title: 'Everything for your home',
                    description: 'See more',
                    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
                    searchTerm: 'home',
                    categoryName: 'Home & Living'
                  },
                  {
                    title: 'Premium beauty',
                    description: 'See more',
                    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop',
                    searchTerm: 'beauty',
                    categoryName: 'Health & Beauty'
                  },
                  {
                    title: 'Shop pantry food',
                    description: 'Shop now',
                    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop',
                    searchTerm: 'food',
                    categoryName: 'Food & Beverages'
                  }
                ].map((card, index) => {
                  const handleCategoryClick = () => {
                    // Try to find matching category in the hierarchy first
                    const matchingCategory = categoryHierarchy.find(cat => 
                      cat.name.toLowerCase().includes(card.searchTerm.toLowerCase()) ||
                      card.categoryName.toLowerCase().includes(cat.name.toLowerCase())
                    );

                    if (matchingCategory) {
                      // If we found a matching category, navigate to it
                      const categorySlug = createSlug(matchingCategory.name);
                      navigate(`/marketplace/categories/${categorySlug}`);
                    } else {
                      // Fallback to search-based filtering
                      navigate(`/marketplace/all-products?search=${encodeURIComponent(card.searchTerm)}`);
                    }
                  };

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                      onClick={handleCategoryClick}
                    >
                      <div className="p-3">
                        <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {card.title}
                        </h3>
                        
                        <div className="aspect-[3/2] mb-2 overflow-hidden rounded">
                          <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        
                        <button className="text-orange-600 hover:text-orange-700 hover:underline font-medium text-xm">
                          {card.description}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Add spacing to account for overlapping categories */}
        <div className="pt-96 sm:pt-80 md:pt-64"></div>

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
          {/* Flash Sale Section - Revamped with auto-scroll */}
          <div className="relative mb-12 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 sm:p-8 border border-orange-100 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

            {/* Section Header with Timer */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    Flash Sale
                    <span className="text-sm font-normal text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">
                      Ending Soon
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500">Grab these deals before they're gone!</p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={() => scrollTrendingBy(-300)}
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border hover:bg-white hover:shadow-xl transition-all duration-300 hidden lg:inline-flex"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Products Container */}
            <div
              ref={trendingRef}
              className="flex gap-4 overflow-x-auto no-scrollbar py-2 scroll-smooth relative z-10"
              style={{ scrollBehavior: 'smooth' }}
            >
              {flashSaleProducts && flashSaleProducts.length > 0 ? (
                flashSaleProducts.slice(0, 12).map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[240px] bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:shadow-xl hover:border-orange-200 transition-all duration-300 cursor-pointer flex flex-col relative"
                    onClick={() => navigate(`/marketplace/${p.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Sale Badge */}
                    {p.percent_off > 0 && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10 shadow-md">
                        {Math.round(p.percent_off)}% OFF
                      </div>
                    )}
                    
                    {/* Product Image */}
                    <div className="aspect-square w-full overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={p.product_details?.images?.[0]?.image ?? PLACEHOLDER} 
                        alt={p.product_details?.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-gray-900 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          Quick View
                        </div>
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold line-clamp-2 text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {p.product_details?.name}
                        </h3>
                        
                        {/* Price Section */}
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const pricing = getDisplayPrice(p, user);
                            return (
                              <>
                                <span className="text-lg font-bold text-orange-600">
                                  Rs. {pricing.currentPrice?.toLocaleString()}
                                </span>
                                {pricing.originalPrice && (
                                  <span className="text-sm text-gray-500 line-through">
                                    Rs. {pricing.originalPrice?.toLocaleString()}
                                  </span>
                                )}
                                {pricing.isB2BPrice && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                    B2B
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* B2B Minimum Quantity Info */}
                        {(() => {
                          const pricing = getDisplayPrice(p, user);
                          return pricing.isB2BPrice && pricing.minQuantity > 1 ? (
                            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full inline-block">
                              Min. order: {pricing.minQuantity} units
                            </div>
                          ) : null;
                        })()}
                        
                        {/* Savings */}
                        {(() => {
                          const pricing = getDisplayPrice(p, user);
                          return pricing.savings > 0 ? (
                            <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full inline-block">
                              Save Rs. {pricing.savings?.toLocaleString()}
                            </div>
                          ) : null;
                        })()}

                        {/* Sold Progress Bar (Mock) */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Available: {p.product_details?.stock || 0}</span>
                            <span className="text-orange-500 font-medium">Almost Gone!</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Loading placeholders with shimmer effect
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-[240px] bg-gray-100 rounded-2xl h-80 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => scrollTrendingBy(300)}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border hover:bg-white hover:shadow-xl transition-all duration-300 hidden lg:inline-flex"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Flat 5% OFF Promotional Banner */}
          <div className="relative w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-xl mt-6 overflow-hidden shadow-md">
            {/* Decorative circles */}
            <div className="absolute top-2 left-2 w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="absolute top-4 right-4 w-6 h-6 bg-white/15 rounded-full"></div>
            <div className="absolute bottom-2 left-4 w-4 h-4 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-4 right-2 w-6 h-6 bg-white/20 rounded-full"></div>

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-repeat" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 20m-4 0a4 4 0 1 1 8 0a4 4 0 1 1 -8 0'/%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left side - Discount tag */}
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg font-bold text-sm shadow-md transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    5%
                  </div>
                  
                  {/* Main offer text */}
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                      Flat 5% OFF
                    </h2>
                    <p className="text-pink-100 text-sm">
                      Upto Rs. 200
                    </p>
                  </div>
                </div>

                {/* Right side - Promo code */}
                <div className="flex flex-col items-center md:items-end gap-2">
                  <div className="bg-green-400 text-green-900 px-4 py-2 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-center">
                      <div className="text-xs font-medium">Min. Purchase Rs. 3000</div>
                      <div className="text-sm font-bold">Use Code "FLAT5"</div>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <button 
                    onClick={() => navigate('/marketplace/all-products')}
                    className="bg-white text-pink-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-pink-50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 transform"
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-1000 transform -translate-x-full hover:translate-x-full"></div>
          </div>

          {/* Two-column promo / top picks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            
            {/* Left: Limited Time Deals */}
            <div className="lg:col-span-1 relative bg-[#FDFBF7] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center overflow-hidden border border-orange-100/50 shadow-sm min-h-[400px]">
              {/* Diagonal Stripes Background */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 40px)' }}></div>
              
              {/* Decorative corner lines */}
              <div className="absolute bottom-6 left-6 w-32 h-32 border-l-2 border-b-2 border-orange-200/40 rounded-bl-[2rem]"></div>
              <div className="absolute top-6 right-6 w-32 h-32 border-t-2 border-r-2 border-orange-200/40 rounded-tr-[2rem]"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center h-full justify-center py-8">
                  <div className="inline-flex items-center gap-2 bg-[#FFEAD5] text-orange-600 px-5 py-2 rounded-full text-xs font-bold mb-6 uppercase tracking-wider shadow-sm">
                    <span className="animate-pulse">🔔</span> HOT DEALS
                  </div>
                  
                  <h3 className="text-4xl font-extrabold text-gray-800 mb-3 leading-tight tracking-tight">
                    Limited Time Deals
                  </h3>
                  <p className="text-gray-500 mb-10 max-w-[200px] mx-auto text-sm font-medium">
                    Exclusive offers you don't want to miss
                  </p>
                  
                  <button onClick={() => navigate('/deals')} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm shadow-orange-200 shadow-lg">
                    Explore Deals 
                    <span className="text-lg leading-none mb-0.5">→</span>
                  </button>
                  
                  <div className="flex gap-2 mt-12 justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-200"></div>
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    <div className="w-2 h-2 rounded-full bg-orange-200"></div>
                  </div>
              </div>
            </div>

            {/* Right: Top Picks Today */}
            <div className="lg:col-span-2 bg-[#F8F9FA] rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Top picks today</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-grow">
                  {todaysPickProducts && todaysPickProducts.length > 0 ? (
                    todaysPickProducts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/marketplace/${p.id}`)}
                        className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:border-orange-100 transition-all duration-300 cursor-pointer flex flex-col h-full group"
                      >
                        <div className="aspect-[5/4] w-full overflow-hidden bg-white rounded-xl mb-4 relative flex items-center justify-center p-2">
                           <img src={p.product_details?.images?.[0]?.image ?? PLACEHOLDER} alt={p.product_details?.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        
                        <div className="mt-auto">
                            <h4 className="font-bold text-gray-900 text-sm mb-1.5 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                                {p.product_details?.name}
                            </h4>
                            <div className="text-xs text-gray-500 font-medium">
                                Rs. {getDisplayPrice(p, user).currentPrice?.toLocaleString()}
                            </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl h-full min-h-[240px] animate-pulse border border-gray-100"></div>
                    ))
                  )}
              </div>
            </div>
          </div>
          {/* Promo banner */}
          <div className="relative w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 min-h-[10rem] h-auto py-6 overflow-hidden px-6 rounded-xl mt-10 flex items-center justify-center">
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
                <button 
                  onClick={() => { setShowVideoFeed(true); setIsMobileMenuOpen(false); }}
                  className="w-full text-left py-2 text-neutral-700 hover:text-primary-600 flex items-center gap-2"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  Just For You
                </button>
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

      {/* Made in Nepal Section - Revamped */}
      <div className="relative py-16 overflow-hidden">
        {/* Background with gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-yellow-50"></div>
        
        {/* Decorative elements - Abstract representation of mountains/flag triangles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-6 py-2 bg-white border border-orange-100 text-orange-700 rounded-full text-sm font-bold shadow-sm">
              <span className="animate-pulse">🇳🇵</span>
              <span className="tracking-wide uppercase">Authentic Nepali Products</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Crafted in <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-800">Nepal</span>
            </h2>
            
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Discover unique products that tell a story of tradition, culture, and local craftsmanship. 
              Directly from local artisans to your doorstep.
            </p>
            
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-2 mt-6 opacity-50">
                <div className="h-1 w-12 bg-orange-600 rounded-full"></div>
                <div className="h-1 w-2 bg-yellow-500 rounded-full"></div>
                <div className="h-1 w-12 bg-orange-600 rounded-full"></div>
            </div>
          </div>

          {(() => {
            return madeInNepalProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {madeInNepalProducts.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border-none shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden relative transform hover:-translate-y-2"
                  onClick={() => navigate(`/marketplace/${p.id}`)}
                >
                  {/* Card Border Gradient on Hover */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-100 rounded-2xl transition-colors z-20 pointer-events-none"></div>

                  {/* Image Container */}
                  <div className="aspect-[4/5] w-full overflow-hidden relative bg-gray-100">
                    <img 
                      src={p.product_details?.images?.[0]?.image ?? 'https://via.placeholder.com/150'} 
                      alt={p.product_details?.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    
                    {/* Floating Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-orange-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10 flex items-center gap-1">
                        <span>🇳🇵</span> Local
                    </div>

                    {/* Content Overlay at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="text-xs font-medium text-orange-200 mb-1 uppercase tracking-wider">
                            {p.product_details?.category_details || 'Handmade'}
                        </div>
                        <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2 group-hover:text-orange-100 transition-colors">
                            {p.product_details?.name}
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-bold">
                                Rs. {getDisplayPrice(p, user).currentPrice?.toLocaleString()}
                            </span>
                            <button className="bg-white text-orange-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-lg hover:bg-orange-50">
                                <ShoppingCart className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : madeInNepalLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-96 shadow-sm animate-pulse overflow-hidden">
                    <div className="h-2/3 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">🏔️</div>
              <p className="text-gray-600 font-medium">
                {madeInNepalError ? madeInNepalError : 'No Made in Nepal products available at the moment'}
              </p>
              <p className="text-neutral-400 text-xs mt-2">
                Debug: Products array length: {madeInNepalProducts.length}, Loading: {madeInNepalLoading.toString()}, Error: {madeInNepalError || 'None'}
              </p>
            </div>
          );
          })()}

          {madeInNepalProducts.length > 8 && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/marketplace/all-products?made_in_nepal=true')}
                className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-orange-700 rounded-full overflow-hidden transition-all duration-300 hover:bg-orange-800 hover:shadow-lg hover:-translate-y-1"
              >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
                <span className="relative flex items-center gap-2">
                    Explore All Nepali Products
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          )}
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
                        {(() => {
                          const pricing = getDisplayPrice(item, user);
                          return (
                            <>
                              <span className="text-h3 font-bold text-accent-success-600">
                                Rs.{pricing.currentPrice}
                              </span>
                              {pricing.originalPrice && (
                                <span className="text-body text-neutral-500 line-through">
                                  Rs.{pricing.originalPrice}
                                </span>
                              )}
                              {pricing.isB2BPrice && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                  B2B
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      {(() => {
                        const pricing = getDisplayPrice(item, user);
                        return pricing.savings > 0 ? (
                          <div className="text-xs text-accent-success-600 font-medium bg-accent-success-50 px-2 py-1 rounded-full inline-block">
                            You save Rs.{pricing.savings.toFixed(2)}
                          </div>
                        ) : null;
                      })()}
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

      {/* Brands Section */}
      <div className="bg-white py-12 border-t border-neutral-100">
        <div className="container mx-auto px-4 relative group">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Top Brands
            </h2>
            <p className="text-gray-500">Shop from your favorite brands</p>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => scrollBrandsBy(-300)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 border border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 hidden lg:block"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => scrollBrandsBy(300)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 border border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-600 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 hidden lg:block"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            ref={brandsRef}
            className="flex items-center gap-8 overflow-x-auto no-scrollbar py-4 px-4 scroll-smooth"
          >
            {brandsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse"></div>
                </div>
              ))
            ) : brandsError ? (
              <div className="w-full text-center py-8">
                <p className="text-red-600">{brandsError}</p>
              </div>
            ) : brands.length > 0 ? (
              brands.map((brand) => (
                <div
                  key={brand.id}
                  onClick={() => navigate(`/brand-products/${brand.id}`)}
                  className="flex-shrink-0 cursor-pointer group/brand flex flex-col items-center gap-3"
                >
                  {/* Ring Container */}
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-gray-200 via-gray-100 to-white shadow-inner relative transition-transform duration-300 group-hover/brand:scale-105">
                     {/* Outer Ring Gradient */}
                     <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-300 to-gray-100 opacity-50"></div>
                     
                     {/* Inner White Circle */}
                     <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center p-4 shadow-sm group-hover/brand:shadow-md transition-all duration-300 border border-gray-100">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="max-w-full max-h-full object-contain filter grayscale group-hover/brand:grayscale-0 transition-all duration-300"
                          />
                        ) : (
                          <span className="text-xs font-bold text-center text-gray-400 group-hover/brand:text-gray-800 line-clamp-2">
                            {brand.name}
                          </span>
                        )}
                     </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8">
                <p className="text-gray-600">No brands available</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
                        {/* {item.product_details.stock > 0 && item.product_details.stock <= 5 && (
                          <div className="absolute bottom-3 left-3 bg-accent-warning-500 text-white px-2 py-1 rounded-full text-xs font-medium z-10">
                            Only {item.product_details.stock} left
                          </div>
                        )} */}
                        
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
                        </div>
                        
                        {/* Product Title */}
                        <h6 className="font-semibold text-neutral-500 leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {item.product_details.name}
                        </h6>
                        
                        {/* Price Section */}
                        <div className="space-y-1">
                          {(() => {
                            const pricing = getDisplayPrice(item, user);
                            return (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-lg font-bold text-accent-error-600">
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
                            );
                          })()}
                          {(() => {
                            const pricing = getDisplayPrice(item, user);
                            return pricing.savings > 0 ? (
                              <div className="text-xs text-accent-success-600 font-medium">
                                Save Rs. {pricing.savings?.toLocaleString()}
                              </div>
                            ) : null;
                          })()}
                        </div>
                        
                        {/* Stock Status */}
                        {/* <div className="flex items-center gap-2">
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
                        </div> */}
                        
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
      {showVideoFeed && (
        <ShoppableVideoFeed 
          onClose={() => setShowVideoFeed(false)} 
          onRequireLogin={() => setShowLoginModal(true)}
        />
      )}
    </div>
  );
};
export default Marketplace;
