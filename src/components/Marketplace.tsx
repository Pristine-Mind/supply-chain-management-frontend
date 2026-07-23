import React, { useState, useEffect, useRef } from 'react';
import { categoryApi } from '../api/categoryApi';
import { voiceSearchByText } from '../api/voiceSearchApi';
import { createSafeRecognitionInstance } from '../utils/voiceSearchBrowserPolyfill';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { X, ChevronDown, User, ShoppingCart, Menu, Mic, Gift, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLoyalty } from '../context/LoyaltyContext';
import LoginModal from './auth/LoginModal';
import CategoryMenu from './CategoryMenu';
import SearchSuggestions from './SearchSuggestions';
import CommandPalette from './CommandPalette';
import { createSlug } from '../utils/slugUtils';

const FlashSale = React.lazy(() => import('./FlashSale'));
const MadeForYou = React.lazy(() => import('./MadeForYou'));
const ProductHubSections = React.lazy(() => import('./ProductHubSections'));
const BestDealsSection = React.lazy(() => import('./BestDealsSection'));
const FeaturedProducts = React.lazy(() => import('./FeaturedProducts'));
const BrandsSection = React.lazy(() => import('./BrandsSection'));
const MadeInNepal = React.lazy(() => import('./MadeInNepal'));
const DiaperSection = React.lazy(() => import('./DiaperSection'));
const TopBrands = React.lazy(() => import('./TopBrands'));
const NearbyProducts = React.lazy(() => import('./NearbyProducts'));
const ShoppableVideoFeed = React.lazy(() => import('./ShoppableVideoFeed'));
const NayaBarshaBanner = React.lazy(() => import('./NayaBarshaBanner'));

import logo from '../assets/logo.png';
import Footer from './Footer';
import SEOHead from './SEOHead';
import HeroBanner from './HeroBanner';
import PromoBanner from './PromoBanner';
import FreeDeliveryBanner from './FreeDeliveryBanner';
import LazySection from './ui/LazySection';
import CategoryCarousel from './CategoryCarousel';
import { PageContainer } from './ui/page-container';
import { SectionHeader } from './ui/section-header';
import { EmptyState } from './ui/empty-state';
import { Badge } from './ui/badge';

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
  is_delivery_free: boolean;
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


const PLACEHOLDER = 'https://via.placeholder.com/150';

const Marketplace: React.FC = () => {
  
  const { isAuthenticated, user, logout } = useAuth();
  const { userLoyalty } = useLoyalty();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isListening, setIsListening] = useState(false);
  const [showVideoFeed, setShowVideoFeed] = useState(false);
  const [, startTransition] = React.useTransition();

  const startVoiceSearch = () => {
    const { recognition, error: initError } = createSafeRecognitionInstance();

    if (!recognition) {
      const message = initError || 'Voice search is not supported in your browser. Please use text search instead.';
      alert(message);
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = 'en-US';

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

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      alert(`Voice search error: ${event.error}. Please try text search instead.`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [searchFocused, setSearchFocused] = useState(false);
  // Dynamic category hierarchy state
  const [categoryHierarchy, setCategoryHierarchy] = useState<any[]>([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minOrder, setMinOrder] = useState('');
  // Additional filter states for unified interface
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  
  const [productsError, setProductsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { addToCart, distinctItemCount } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const [pendingProduct, setPendingProduct] = useState<MarketplaceProduct | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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


      // If there's a debounced query string, use agentic voice search API
      if (debouncedQuery && debouncedQuery.trim() !== '') {
        try {
          // Try new voice search API first
          const voiceResponse = await voiceSearchByText(
            debouncedQuery.trim(),
            1,
            itemsPerPage
          );
          setProducts(voiceResponse.results);
          setTotalCount(voiceResponse.metadata.total_results);
        } catch (voiceErr) {
          // Fallback to old API if new API fails
          console.warn('Voice search API failed, falling back to old API:', voiceErr);
          params.keyword = debouncedQuery.trim();
          const searchUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/`;
          const { data } = await axios.get(searchUrl, { params, headers });
          setProducts(data.results || []);
          setTotalCount(data.count || (data.results || []).length || 0);
        }
        setLoading(false);
        return;
      }

      // Regular marketplace endpoint for category filtering without search
      const marketplaceUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`;
      const { data } = await axios.get(marketplaceUrl, { params, headers });
      const results = data.results || (Array.isArray(data) ? data : []);
      setProducts(results);
      setTotalCount(data.count || results.length || 0);
    } catch {
      setProductsError('Error fetching marketplace products');
    } finally {
      setLoading(false);
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

  // Effect to handle URL parameter changes
  useEffect(() => {
  }, [searchParams]);

  
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
      <SEOHead
        title="Shop Online in Nepal — Fresh Produce, Handmade Goods & More"
        description="Mulya Bazzar is Nepal's marketplace for fresh produce, handmade goods, electronics, and more. Shop from local sellers with fast delivery across Nepal."
        url="/"
        type="website"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Mulya Bazzar',
          url: 'https://appmulyabazzar.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://appmulyabazzar.com/?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <CommandPalette />
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
        <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-medium border-b border-neutral-200/80' : 'bg-white shadow-elevation-sm border-b border-neutral-200'}`}>
          <div className="container mx-auto container-padding py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
              {/* Logo / Brand */}
              <div className="flex items-center justify-start">
                <img src={logo} alt="Logo" className="h-16 w-auto sm:h-16 mr-3 object-contain" />
                {/* <span className="font-bold text-h2 sm:text-h1 text-primary-500">MulyaBazzar</span> */}
              </div>

              {/* Centered large search on desktop */}
              <div className="hidden md:flex justify-center">
                <div className={`relative w-full max-w-xl transition-all duration-300 bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2.5 flex items-center shadow-soft hover:shadow-medium focus-within:shadow-medium focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-100 ${isListening ? 'scale-[1.02]' : ''}`}>
                  <MagnifyingGlassIcon className={`text-neutral-400 w-5 h-5 mr-3 ${isListening ? 'text-red-500 animate-bounce' : ''}`} />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={isListening ? "Listening..." : "Search products..."}
                      className={`w-full bg-transparent text-lg font-medium placeholder:text-neutral-400 outline-none`}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleSearchEnter}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                    />
                    <div className="absolute top-full left-0 right-0 z-40">
                      <SearchSuggestions
                        query={query}
                        isFocused={searchFocused}
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
                    className="ml-3 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-soft hover:shadow-medium transition-all active:scale-[0.985]"
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

                          {/* Loyalty Points Display */}
                          {userLoyalty && userLoyalty.current_tier && (
                            <div className="px-3 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-amber-700">Loyalty Points</span>
                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                  {userLoyalty.current_tier.name}
                                </span>
                              </div>
                              <p className="text-xl font-bold text-amber-600 mb-1">{userLoyalty.current_points}</p>
                              <p className="text-xs text-gray-600 mb-2">
                                Earn {userLoyalty.current_tier.point_multiplier}x on purchases
                              </p>
                              <button
                                onClick={() => { navigate('/loyalty'); setIsUserMenuOpen(false); }}
                                className="w-full text-xs font-bold text-amber-600 hover:text-amber-700 bg-white hover:bg-amber-50 py-1.5 rounded transition-colors flex items-center justify-center gap-1 border border-amber-200"
                              >
                                <Gift className="w-3 h-3" />
                                View Details
                              </button>
                            </div>
                          )}

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
                  <div className="relative bg-neutral-50 border border-neutral-200 rounded-full px-3 py-2 flex items-center shadow-soft focus-within:shadow-medium focus-within:border-primary-300 transition-all">
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
        {/* <div className="bg-white">
          <div className="container mx-auto px-4 py-10">
            <LazySection>
              <NayaBarshaBanner />
            </LazySection>
          </div>
        </div> */}

        <div className="bg-gradient-to-r from-primary-50/50 to-orange-50/30 border-y border-primary-100/50">
          <div className="container mx-auto px-4 py-10">
            <LazySection>
              <FlashSale /> 
            </LazySection>
          </div>
        </div>
        
        <div className="bg-neutral-50/50">
          <div className="container mx-auto px-4 py-10">
            <LazySection>
              <MadeForYou />
            </LazySection>
          </div>
        </div>

        <div className="bg-white">
          <div className="container mx-auto px-4 py-10">
            <LazySection>
              <ProductHubSections />
            </LazySection>

            <PromoBanner />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary-50/50 to-orange-50/30 border-y border-primary-100/50">
          <div className="container mx-auto px-4 py-10">
            <LazySection>
              <BestDealsSection user={user} />          
            </LazySection>
          </div>
        </div>

        <div className="bg-white">
          <div className="container mx-auto px-4 py-10">
            <FreeDeliveryBanner />
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
                  onClick={() => { 
                    startTransition(() => {
                      setShowVideoFeed(true); 
                    });
                    setIsMobileMenuOpen(false); 
                  }}
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

                      {/* Loyalty Points Display - Mobile */}
                      {userLoyalty && userLoyalty.current_tier && (
                        <div className="px-3 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 mx-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-amber-700">Loyalty Points</span>
                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                              {userLoyalty.current_tier.name}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-amber-600 mb-1">{userLoyalty.current_points}</p>
                          <p className="text-xs text-gray-600 mb-2">
                            Earn {userLoyalty.current_tier.point_multiplier}x on purchases
                          </p>
                          <button
                            onClick={() => { navigate('/loyalty'); setIsMobileMenuOpen(false); }}
                            className="w-full text-xs font-bold text-amber-600 hover:text-amber-700 bg-white hover:bg-amber-50 py-1.5 rounded transition-colors flex items-center justify-center gap-1 border border-amber-200"
                          >
                            <Gift className="w-3 h-3" />
                            View Dashboard
                          </button>
                        </div>
                      )}

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

      <div className="bg-white border-y border-neutral-100">
        <div className="container mx-auto px-4 py-10">
          <CategoryCarousel />
        </div>
      </div>
      
      {/* <div className="bg-neutral-50/50">
        <div className="container mx-auto px-4 py-10">
          <LazySection>
            <NearbyProducts radiusKm={50} limit={8} />
          </LazySection>
        </div>
      </div> */}

      <div className="bg-white">
        <div className="container mx-auto px-4 py-10">
          <LazySection>
            <FeaturedProducts/>
          </LazySection>
        </div>
      </div>

      <div className="bg-neutral-50/50 border-y border-neutral-100">
        <div className="container mx-auto px-4 py-10">
          <LazySection>
            <BrandsSection />
          </LazySection>
        </div>
      </div>

      {/* Made in Nepal Section - Revamped */}
      <div className="bg-gradient-to-r from-red-50/40 via-white to-blue-50/40">
        <div className="container mx-auto px-4 py-10">
          <LazySection>
            <MadeInNepal />
          </LazySection>
        </div>
      </div>
      
      {/* Diaper Section */}
      <div className="bg-white border-y border-neutral-100">
        <div className="container mx-auto px-4 py-10">
          <LazySection>
            <DiaperSection /> 
          </LazySection>
        </div>
      </div>

      <div className="bg-neutral-50/50">
        <div className="container mx-auto px-4 py-10">
          <LazySection>
            <TopBrands />
          </LazySection>
        </div>
      </div>

      <div className="bg-white">
        <PageContainer className="py-10">
          {/* Section title for personalized recommendations */}
          <SectionHeader
            title="Just For You"
            subtitle="Handpicked recommendations based on your browsing"
            action={{ label: 'View All', to: '/marketplace/all-products' }}
          />
                {/* Products Grid */}
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-xl md:rounded-2xl border border-neutral-200 overflow-hidden">
                        <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
                        <div className="p-2.5 md:p-5 space-y-2 md:space-y-3">
                          <div className="h-3 md:h-4 bg-neutral-100 rounded animate-pulse w-1/3" />
                          <div className="h-4 md:h-5 bg-neutral-100 rounded animate-pulse" />
                          <div className="h-3 md:h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
                          <div className="h-8 md:h-10 bg-neutral-100 rounded animate-pulse mt-3 md:mt-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 text-lg mb-2">⚠️ Error Loading Products</div>
                    <p className="text-gray-600">{productsError}</p>
                  </div>
                ) : products.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="No Products Found"
                    description="Try adjusting your filters or search terms to find what you're looking for."
                    action={
                      <button
                        onClick={() => {
                          setQuery('');
                          setMinPrice('');
                          setMaxPrice('');
                          setMinOrder('');
                          setSelectedCity('');
                          setSelectedBusinessType('');
                        }}
                        className="btn-secondary px-6 py-2.5"
                      >
                        Clear All Filters
                      </button>
                    }
                  />
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                  {products.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/marketplace/${item.id}`)}
                      className="bg-white rounded-xl md:rounded-2xl border border-neutral-200 overflow-hidden group hover:shadow-xl hover:border-primary-200 transition-all duration-500 hover:-translate-y-1.5 cursor-pointer animate-slide-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50">
                        {item.percent_off > 0 && (
                          <Badge variant="discount" size="sm" className="absolute top-2 left-2 md:top-3 md:left-3 shadow-sm z-10">
                            {Math.round(item.percent_off)}% OFF
                          </Badge>
                        )}
                        {item.is_delivery_free && (
                          <Badge variant="success" size="sm" className="absolute top-2 right-2 md:top-3 md:right-3 shadow-sm z-10">
                            🚚 Free Delivery
                          </Badge>
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
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <button className="bg-white text-neutral-900 px-6 py-2.5 rounded-xl font-medium hover:bg-neutral-50 transition-all shadow-md transform translate-y-3 group-hover:translate-y-0 duration-300">
                            Quick View
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-2.5 md:p-4 space-y-2 md:space-y-3">
                        {/* Category and Rating */}
                        <div className="flex items-center justify-between">
                          <span className="inline-block bg-primary-100 text-primary-700 text-[9px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-full uppercase tracking-wide truncate max-w-full">
                            {item.product_details.category_details}
                          </span>
                        </div>
                        
                        {/* Product Title */}
                        <h6 className="text-sm md:text-base font-semibold text-neutral-900 leading-tight line-clamp-2 group-hover:text-primary-700 transition-colors">
                          {item.product_details.name}
                        </h6>
                        
                        {/* Price Section */}
                        <div className="space-y-1">
                          {(() => {
                            const pricing = getDisplayPrice(item, user);
                            return (
                              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                                <span className="text-sm md:text-lg font-bold text-primary-700">
                                  Rs. {pricing.currentPrice?.toLocaleString()}
                                </span>
                                {pricing.originalPrice && (
                                  <span className="text-xs md:text-sm text-neutral-500 line-through">
                                    Rs. {pricing.originalPrice?.toLocaleString()}
                                  </span>
                                )}
                                {pricing.isB2BPrice && (
                                  <span className="text-[9px] md:text-xs bg-blue-100 text-blue-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium">
                                    B2B
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          {(() => {
                            const pricing = getDisplayPrice(item, user);
                            return pricing.savings > 0 ? (
                              <Badge variant="success" size="sm">
                                Save Rs. {pricing.savings?.toLocaleString()}
                              </Badge>
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
                          className={`w-full py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl text-xs md:text-base font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2 ${
                            item.product_details.stock === 0
                              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                              : 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft hover:shadow-medium active:scale-[0.985]'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span className="truncate">{item.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

                {totalCount > products.length && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => navigate('/marketplace/all-products')}
                      className="btn-primary px-8 py-3"
                    >
                      View More Products
                    </button>
                  </div>
                )}

        </PageContainer>
      </div>
    <Footer />
    </div>
    {/* Closing tag for marketplace-root */}
      {showVideoFeed && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"><Spinner size="lg" color="white" /></div>}>
          <ShoppableVideoFeed 
            onClose={() => setShowVideoFeed(false)} 
            onRequireLogin={() => setShowLoginModal(true)}
          />
        </React.Suspense>
      )}
    </div>
  );
};
export default Marketplace;