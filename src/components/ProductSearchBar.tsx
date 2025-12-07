import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  FiSearch, 
  FiX, 
  FiClock, 
  FiTrendingUp, 
  FiFilter,
  FiShoppingCart,
  FiUser,
  FiHeart,
  FiMenu,
  FiMic
} from 'react-icons/fi';
import logo from '../assets/logo.png';

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string | null;
}

interface ProductDetails {
  id: number;
  name: string;
  images: ProductImage[];
  category_details?: string;
  category?: string;
  brand?: string;
  rating?: number;
}

interface MarketplaceProduct {
  id: number;
  product_details?: ProductDetails;
  listed_price: number;
  discount_percentage?: number;
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock';
  discounted_price?: number;
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
}

interface TrendingSearch {
  query: string;
  category?: string;
  count: number;
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const addToHistory = useCallback((query: string, resultCount: number) => {
    const newEntry: SearchHistory = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      resultCount
    };

    setHistory(prev => {
      const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      const updated = [newEntry, ...filtered].slice(0, 10); // Keep only 10 recent searches
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  return { history, addToHistory, clearHistory };
};

const ProductSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<MarketplaceProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const { isAuthenticated, user, logout } = useAuth();
  const { distinctItemCount } = useCart();

  // Helper function to get the appropriate price based on user's B2B status
  const getDisplayPrice = (product: MarketplaceProduct) => {
    const isB2BUser = user?.b2b_verified === true;
    const isB2BEligible = product.is_b2b_eligible === true;
    
    if (isB2BUser && isB2BEligible) {
      return product.b2b_discounted_price || product.b2b_price || product.listed_price;
    } else {
      return product.discounted_price || product.listed_price;
    }
  };
  
  const navigate = useNavigate();
  const location = useLocation();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/auth/logout/`,
        {},
        { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      setShowUserDropdown(false);
      navigate('/');
    }
  }, [navigate]);

  const startVoiceSearch = useCallback(() => {
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
    setQuery(''); // Clear query when starting to listen

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
        setShowSuggestions(true);
        setIsListening(false);
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
  }, []);

  useEffect(() => {
    const fetchTrendingSearches = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/trending-searches/`,
          { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
        );
        setTrendingSearches(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch trending searches:', error);
      }
    };

    fetchTrendingSearches();
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancel('New search initiated');
        }

        cancelTokenRef.current = axios.CancelToken.source();

        setIsLoading(true);
        
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
          {
            params: { 
              search: debouncedQuery,
              limit: 8   
            },
            cancelToken: cancelTokenRef.current.token
          }
        );
        
        setRecommendations(response.data.results || []);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setRecommendations([]);
          console.error('Search error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [debouncedQuery]);

  const handleSearch = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    addToHistory(trimmedQuery, recommendations.length);
    setShowSuggestions(false);
    setQuery('');
    navigate(`/marketplace?search=${encodeURIComponent(trimmedQuery)}`);
  }, [recommendations.length, addToHistory, navigate]);

  const handleProductSelect = useCallback((product: MarketplaceProduct) => {
    setShowSuggestions(false);
    setQuery('');
    navigate(`/marketplace/${product.id}`);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  }, [query, handleSearch]);

  const suggestionContent = useMemo(() => {
    const hasQuery = query.length >= 2;
    const hasRecommendations = recommendations.length > 0;
    const hasHistory = history.length > 0;
    const hasTrending = trendingSearches.length > 0;

    if (!hasQuery && !hasHistory && !hasTrending) return null;

    return (
      <div className="absolute left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-96 overflow-hidden mt-2 z-30">
        {hasQuery && (
          <div className="border-b border-neutral-100">
            {isLoading ? (
              <div className="px-4 py-3 text-neutral-500 text-sm">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  Searching...
                </div>
              </div>
            ) : hasRecommendations ? (
              <>
                <div className="px-4 py-2 text-xs font-medium text-neutral-600 uppercase bg-neutral-50">
                  Products ({recommendations.length})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {recommendations.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {product.product_details?.images?.length ? (
                          <img 
                            src={product.product_details.images[0].image} 
                            alt={product.product_details.images[0].alt_text || ''} 
                            className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                            <FiSearch className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 line-clamp-1">
                          {product.product_details?.name}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-lg font-bold text-primary-600">
                            Rs. {getDisplayPrice(product).toLocaleString()}
                          </span>
                          {user?.b2b_verified && product.is_b2b_eligible && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium ml-2">
                              B2B
                            </span>
                          )}
                          {product.discount_percentage && (
                            <span className="ml-2 text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-medium">
                              {product.discount_percentage}% OFF
                            </span>
                          )}
                        </div>
                        {product.product_details?.brand && (
                          <div className="text-xs text-neutral-500 mt-1">
                            by {product.product_details.brand}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {product.availability === 'low_stock' && (
                          <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
                            Low Stock
                          </span>
                        )}
                        {product.availability === 'out_of_stock' && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 py-3 border-t bg-gray-50">
                  <button
                    onClick={() => handleSearch(query)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    <FiSearch className="w-4 h-4 mr-1" />
                    Search for "{query}"
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 text-neutral-500 text-sm">
                No products found for "{query}"
              </div>
            )}
          </div>
        )}

        {!hasQuery && hasHistory && (
          <div className="border-b">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 flex items-center justify-between">
              <span>Recent Searches</span>
              <button
                onClick={clearHistory}
                className="text-primary-600 hover:text-primary-700 text-xs normal-case"
              >
                Clear
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSearch(item.query)}
                >
                  <FiClock className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="flex-1 text-gray-700">{item.query}</span>
                  <span className="text-xs text-gray-500">
                    {item.resultCount} results
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasQuery && hasTrending && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
              Trending Searches
            </div>
            <div className="max-h-32 overflow-y-auto">
              {trendingSearches.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSearch(item.query)}
                >
                  <FiTrendingUp className="w-4 h-4 text-orange-500 mr-3" />
                  <span className="flex-1 text-gray-700">{item.query}</span>
                  {item.category && (
                    <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded">
                      {item.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [query, recommendations, history, trendingSearches, isLoading, handleSearch, handleProductSelect, clearHistory]);

  return (
    <header className="w-full bg-white px-4 py-3 shadow-sm border-b sticky top-0 z-20">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 min-w-[180px] flex-shrink-0">
          <img src={logo} alt="MulyaBazzar Logo" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-xl lg:text-2xl text-orange-600 whitespace-nowrap">
            MulyaBazzar
          </span>
        </Link>

        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className={`relative transition-all duration-300 ${isListening ? 'ring-4 ring-red-100 rounded-xl scale-[1.02]' : ''}`}>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                className={`w-full pl-12 pr-16 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white ${isListening ? 'border-red-400' : ''}`}
                placeholder={isListening ? "Listening..." : "Search for products, brands, categories..."}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
              />
              
              <FiSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isListening ? 'text-red-500 animate-bounce' : 'text-neutral-400'}`} />
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={startVoiceSearch}
                  className={`p-1.5 hover:bg-neutral-100 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`}
                  title="Search by voice"
                >
                  <FiMic className="w-4 h-4" />
                </button>
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setShowSuggestions(false);
                      searchInputRef.current?.focus();
                    }}
                    className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
                  >
                    <FiX className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
              </div>
            </div>

            {showSuggestions && (
              <div ref={suggestionContainerRef}>
                {suggestionContent}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <FiSearch className="w-5 h-5 text-gray-600" />
          </button>
          <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FiShoppingCart className="w-5 h-5 text-gray-600" />
            {distinctItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {distinctItemCount > 9 ? '9+' : distinctItemCount}
              </span>
            )}
          </Link>

          <div className="hidden lg:block relative" ref={userDropdownRef}>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <FiUser className="w-5 h-5 text-gray-600" />
              {isAuthenticated && user?.name && (
                <span className="text-sm text-gray-700 max-w-20 truncate">
                  {user.name}
                </span>
              )}
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-lg shadow-lg z-40">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b bg-gray-50">
                      <div className="font-medium text-gray-900 truncate">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <FiUser className="w-4 h-4" />
                        My Profile
                      </Link>
                      
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        My Orders
                      </Link>
                      
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <FiHeart className="w-4 h-4" />
                        Wishlist
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <FiFilter className="w-4 h-4" />
                        Settings
                      </Link>
                    </div>
                    
                    <div className="border-t py-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-2">
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-4 py-3 text-black transition-colors font-medium"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m0 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login
                    </Link>
                    
                    <Link
                      to="/register"
                      className="flex items-center gap-3 px-4 py-3 text-black transition-colors font-medium"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Register
                    </Link>
                    
                    <div className="px-4 py-2 text-xs text-gray-500 border-t mt-2">
                      New to MulyaBazzar? Create an account to get personalized recommendations and track your orders.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <FiMenu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="md:hidden mt-3">
        <div className="relative">
          <input
            type="text"
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 pl-10 pr-10 bg-gray-50 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <button
            onClick={startVoiceSearch}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}
          >
            <FiMic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="lg:hidden absolute left-0 right-0 top-full bg-white border-b shadow-lg z-30">
          <div className="px-4 py-2 space-y-2">
            <Link to="/profile" className="flex items-center gap-3 py-2 text-gray-700">
              <FiUser className="w-5 h-5" />
              Profile
            </Link>
            <Link to="/wishlist" className="flex items-center gap-3 py-2 text-gray-700">
              <FiHeart className="w-5 h-5" />
              Wishlist
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default ProductSearchBar;
