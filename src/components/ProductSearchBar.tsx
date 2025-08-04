import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FiSearch, 
  FiX, 
  FiClock, 
  FiTrendingUp, 
  FiFilter,
  FiShoppingCart,
  FiUser,
  FiBell,
  FiHeart,
  FiMenu,
  FiMic,
  FiCamera
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

interface User {
  name?: string;
  email?: string;
  avatar?: string;
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
  const [cartCount, setCartCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const fetchUserProfile = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user/profile/`,
            { headers: { Authorization: `Token ${token}` } }
          );
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      };
      fetchUserProfile();
    }
  }, []);

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
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setUser({});
      setCartCount(0);
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
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setShowSuggestions(true);
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
    const fetchCartCount = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/cart/count/`,
          { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
        );
        setCartCount(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch cart count:', error);
      }
    };

    if (isLoggedIn) {
      fetchCartCount();
    }
  }, [isLoggedIn]);

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
      <div className="absolute left-0 right-0 bg-white border rounded-lg shadow-lg max-h-96 overflow-hidden mt-1 z-30">
        {hasQuery && (
          <div className="border-b">
            {isLoading ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Searching...
                </div>
              </div>
            ) : hasRecommendations ? (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b bg-gray-50">
                  Products ({recommendations.length})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {recommendations.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {product.product_details?.images?.length ? (
                          <img 
                            src={product.product_details.images[0].image} 
                            alt={product.product_details.images[0].alt_text || ''} 
                            className="w-10 h-10 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FiSearch className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {product.product_details?.name}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-lg font-bold text-green-600">
                            Rs.{product.listed_price.toLocaleString()}
                          </span>
                          {product.discount_percentage && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              {product.discount_percentage}% OFF
                            </span>
                          )}
                        </div>
                        {product.product_details?.brand && (
                          <div className="text-xs text-gray-500 mt-1">
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
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <FiSearch className="w-4 h-4 mr-1" />
                    Search for "{query}"
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
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
                className="text-blue-600 hover:text-blue-700 text-xs normal-case"
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
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
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
          <div className="relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 pl-12 pr-24 bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Search for products, brands, categories..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
              />
              
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setShowSuggestions(false);
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <FiX className="w-4 h-4 text-gray-400" />
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

          <Link to="/wishlist" className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg">
            <FiHeart className="w-5 h-5 text-gray-600" />
          </Link>
          <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FiShoppingCart className="w-5 h-5 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          <div className="hidden lg:block relative" ref={userDropdownRef}>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <FiUser className="w-5 h-5 text-gray-600" />
              {isLoggedIn && user?.name && (
                <span className="text-sm text-gray-700 max-w-20 truncate">
                  {user.name}
                </span>
              )}
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-lg shadow-lg z-40">
                {isLoggedIn ? (
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
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 pl-10 bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
