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
import BrandsSection from './BrandsSection';
import DiaperSection from './DiaperSection';
import CategoryMenu from './CategoryMenu';
import SearchSuggestions from './SearchSuggestions';
import ShoppableVideoFeed from './ShoppableVideoFeed';
import { createSlug } from '../utils/slugUtils';
import MadeForYou from './MadeForYou';
import ProductHubSections from './ProductHubSections';
import TopBrands from './TopBrands';
import MadeInNepal from './MadeInNepal';
import FlashSale from './FlashSale';

import logo from '../assets/logo.png';
import Footer from './Footer';
import BannerSaleImage from '../assets/banner_sale.png';
import HeroBanner from './HeroBanner';
import PromoBanner from './PromoBanner';
import BestDealsSection from './BestDealsSection';
import FreeDeliveryBanner from './FreeDeliveryBanner';

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
  // start with no tab selected — only render For You when user explicitly clicks it
  const [currentTab, setCurrentTab] = useState<'none' | 'for_you' | 'following'>('none');
  
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

  // const fetchMadeInNepal = async () => {
  //   setMadeInNepalLoading(true);
  //   setMadeInNepalError('');
    
  //   try {
  //     const token = localStorage.getItem('token');
  //     const headers = token ? { Authorization: `Token ${token}` } : {};
  //     const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/made-in-nepal/`;
      
  //     const response = await axios.get(url, { timeout: 8000, headers });
      
  //     if (response.data && response.data.results) {
      
  //       setMadeInNepalProducts(response.data.results);
  //     } else {
  //       setMadeInNepalProducts([]);
  //     }
  //   } catch (error: any) {
  //     setMadeInNepalError('Error fetching Made in Nepal products');
  //   } finally {
  //     setMadeInNepalLoading(false);
  //   }
  // };

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
    // fetchMadeInNepal();
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
                <div className={`relative w-full max-w-xl transition-all duration-300 bg-white border border-neutral-200 rounded-full px-4 py-2 flex items-center ${isListening ? 'scale-[1.02]' : ''}`}>
                  <MagnifyingGlassIcon className={`text-neutral-400 w-5 h-5 mr-3 ${isListening ? 'text-red-500 animate-bounce' : ''}`} />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={isListening ? "Listening..." : "Search products..."}
                      className={`w-full bg-transparent text-lg font-medium placeholder:text-neutral-400 outline-none`}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleSearchEnter}
                    />
                    <div className="absolute top-full left-0 right-0 z-40">
                      <SearchSuggestions
                        query={query}
                        onSelect={(val) => {
                          navigate(`/marketplace/all-products?search=${encodeURIComponent(val)}`);
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={startVoiceSearch}
                    className={`ml-3 p-2 rounded-full hover:bg-neutral-100 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-500'}`}
                    title="Search by voice"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => navigate(`/marketplace/all-products?search=${encodeURIComponent(query)}`)}
                    className="ml-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md"
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
                  <div className="relative bg-white border border-neutral-200 rounded-full px-3 py-2 flex items-center">
                    <MagnifyingGlassIcon className={`text-neutral-400 w-4 h-4 mr-3 ${isListening ? 'text-red-500 animate-bounce' : ''}`} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full bg-transparent text-base placeholder:text-neutral-400 outline-none"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleSearchEnter}
                    />
                    <button
                      onClick={startVoiceSearch}
                      className={`ml-2 p-1.5 rounded-full hover:bg-neutral-100 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
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
                  onClick={() => navigate('/just-for-you')}
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

        {/* Render main view depending on tab */}
        <div>
          {/* For You is shown on the dedicated `/just-for-you` route —
              do not render the `ForYouGrid` inline here. */}

          {/* {currentTab === 'following' && (
            (isAuthenticated) ? <MyFollowing /> : (
              <div className="container mx-auto container-padding p-6">
                <div className="bg-white rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Following</h3>
                  <p className="text-sm text-muted">Sign in to see creators you follow.</p>
                  <div className="mt-4">
                    <button onClick={() => navigate('/login')} className="btn-primary px-4 py-2 rounded">Sign in</button>
                  </div>
                </div>
              </div>
            )
          )} */}
        </div>

        {/* CTA banner with categories overlapping */}
        <HeroBanner/>
        {/* Trending strip + Promo/Top picks layout */}
        <div className="container mx-auto px-4 py-8">
          <FlashSale /> 
          <MadeForYou />
          <ProductHubSections />
          <PromoBanner />
          <BestDealsSection todaysPickProducts={todaysPickProducts} user={user} />          
          <FreeDeliveryBanner />
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
      <BrandsSection />

      {/* Made in Nepal Section - Revamped */}
      <MadeInNepal />
      
      {/* Diaper Section */}
      <DiaperSection /> 
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
      <TopBrands />

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
