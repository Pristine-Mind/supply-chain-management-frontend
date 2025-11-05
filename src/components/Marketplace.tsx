import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { X, ChevronDown, Check, User, LogIn, PlusCircle, ShoppingCart, Heart, Star, Menu } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';

import logo from '../assets/logo.png';
import Footer from './Footer';

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
] as const;

const LOCATION_OPTIONS = [
  'All',
  'Kathmandu',
  'Pokhara',
  'Lalitpur',
  'Bhaktapur',
  'Chitwan',
  'Biratnagar',
  'Butwal',
  'Dharan',
  'Hetauda',
  'Nepalgunj',
  'Other',
] as const;

const PROFILE_TYPE_OPTIONS = ['All', 'Retailer', 'Distributor'] as const;
const PLACEHOLDER = 'https://via.placeholder.com/150';

const Marketplace: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [recommendations, setRecommendations] = useState<MarketplaceProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<MarketplaceProduct[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_OPTIONS[0].code);
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_OPTIONS[0]);
  const [selectedProfileType, setSelectedProfileType] = useState(PROFILE_TYPE_OPTIONS[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Initialize currentView based on URL parameters
  const getViewFromParams = (): 'marketplace' | 'flash-sale' | 'deals' => {
    const view = searchParams.get('view');
    if (view === 'flash-sale' || view === 'deals') {
      return view;
    }
    return 'marketplace';
  };
  
  const [currentView, setCurrentView] = useState<'marketplace' | 'flash-sale' | 'deals'>(getViewFromParams());
  const [flashSaleProducts, setFlashSaleProducts] = useState<MarketplaceProduct[]>([]);
  const [dealsProducts, setDealsProducts] = useState<MarketplaceProduct[]>([]);
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const { cart, addToCart, distinctItemCount } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<MarketplaceProduct | null>(null);
  const itemsPerPage = 10;

  const fetchMarketplaceProducts = async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
      };
      if (query) params.search = query;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLocation !== 'All') params.city = selectedLocation;
      if (selectedProfileType !== 'All') params.profile_type = selectedProfileType;
      const { data } = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
        {
          params,
        }
      );
      setProducts(data.results);
      setRecommendations(data.results);
      setNewArrivals(data.results.slice(0, 5));
      setTotalCount(data.count || 0);
    } catch {
      setError('Error fetching marketplace products');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSaleProducts = async () => {
    setFlashSaleLoading(true);
    setError('');
    try {
      const { data } = await axios.get('https://appmulyabazzar.com/api/v1/marketplace-trending/fastest_selling/');
      setFlashSaleProducts(data.results);
    } catch {
      setError('Error fetching flash sale products');
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const fetchDealsProducts = async () => {
    setDealsLoading(true);
    setError('');
    try {
      const { data } = await axios.get('https://appmulyabazzar.com/api/v1/marketplace-trending/deals/');
      setDealsProducts(data.results);
    } catch {
      setError('Error fetching deals products');
    } finally {
      setDealsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchMarketplaceProducts(1);
  }, [query, selectedCategory, selectedLocation, selectedProfileType]);

  useEffect(() => {
    fetchMarketplaceProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    // Fetch deals products on component mount for the trending deals section
    fetchDealsProducts();
  }, []);

  // Effect to handle URL parameter changes
  useEffect(() => {
    const view = getViewFromParams();
    setCurrentView(view);
    
    // Fetch appropriate data based on view
    if (view === 'flash-sale') {
      fetchFlashSaleProducts();
    } else if (view === 'deals') {
      fetchDealsProducts();
    }
  }, [searchParams]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const wishlistProducts = products.filter(product => wishlist.includes(product.id));
  const cartProducts = products.filter(product => 
    cart.some(item => item.product.id === product.id)
  );
  
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

  if (error) {
    return <div className="text-center text-status-error py-8">{error}</div>;
  }

  return (
    <>
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
      
      {/* Header Banner */}
      <div className="bg-primary-500 text-white py-2 px-4">
        <div className="container mx-auto text-center text-caption">
          Welcome to MulyaBazzar - Your Premium Marketplace
        </div>
      </div>

      {/* Navigation Header */}
      <div className="bg-white shadow-elevation-sm">
        <div className="container mx-auto container-padding">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="lg:hidden mr-3 p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <img src={logo} alt="Logo" className="w-8 h-8 sm:w-12 sm:h-12 mr-2 sm:mr-3" />
              <span className="font-bold text-h2 sm:text-h1 text-primary-500">MulyaBazzar</span>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="input-field w-full pl-12 pr-20 focus:border-primary-500 focus:ring-primary-200"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onClick={() => setShowSuggestions(true)}
                    />
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-primary px-4 sm:px-6 py-2 text-caption font-medium">
                      Search
                    </button>
                  </div>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                  <Dialog.Content className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[95vw] max-w-lg bg-white p-6 rounded-lg shadow-elevation-lg z-[1001]">
                    <div className="relative">
                      <input
                        autoFocus
                        value={query}
                        onChange={e => {
                          setQuery(e.target.value);
                          setShowSuggestions(e.target.value.length >= 3);
                        }}
                        className="input-field w-full h-14 pl-12 pr-12 focus:ring-primary-200 text-body"
                        placeholder="Search products..."
                      />
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
                      <Dialog.Close asChild>
                        <button className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Cross2Icon className="w-6 h-6 text-neutral-400 hover:text-neutral-600" />
                        </button>
                      </Dialog.Close>
                    </div>
                    {showSuggestions && recommendations.length > 0 && (
                      <div className="mt-4 max-h-60 overflow-auto border-t pt-2">
                        {recommendations.map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setShowSuggestions(false); navigate(`/marketplace/${p.id}`); }}
                            className="flex items-center p-2 hover:bg-neutral-100 rounded cursor-pointer"
                          >
                            <img
                              src={p.product_details.images?.[0]?.image ?? PLACEHOLDER}
                              alt={p.product_details.name}
                              className="w-8 h-8 rounded mr-2 object-cover"
                            />
                            <div>
                              <div className="font-medium text-body">{p.product_details.name}</div>
                              <div className="text-caption text-neutral-500">Rs.{p.listed_price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            {/* Actions & Account */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Search */}
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button className="md:hidden p-2 text-neutral-600 hover:text-primary-500">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                  <Dialog.Content className="fixed top-0 left-0 right-0 bg-white p-4 z-[1001]">
                    <div className="relative">
                      <input
                        autoFocus
                        value={query}
                        onChange={e => {
                          setQuery(e.target.value);
                          setShowSuggestions(e.target.value.length >= 3);
                        }}
                        className="input-field w-full h-12 pl-12 pr-12 focus:ring-primary-200"
                        placeholder="Search products..."
                      />
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <Dialog.Close asChild>
                        <button className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Cross2Icon className="w-5 h-5 text-neutral-400 hover:text-neutral-600" />
                        </button>
                      </Dialog.Close>
                    </div>
                    {showSuggestions && recommendations.length > 0 && (
                      <div className="mt-4 max-h-60 overflow-auto border-t pt-2">
                        {recommendations.map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setShowSuggestions(false); navigate(`/marketplace/${p.id}`); }}
                            className="flex items-center p-2 hover:bg-neutral-100 rounded cursor-pointer"
                          >
                            <img
                              src={p.product_details.images?.[0]?.image ?? PLACEHOLDER}
                              alt={p.product_details.name}
                              className="w-8 h-8 rounded mr-2 object-cover"
                            />
                            <div>
                              <div className="font-medium text-body">{p.product_details.name}</div>
                              <div className="text-caption text-neutral-500">Rs.{p.listed_price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

                <div className="relative">
                {/* <button 
                  onClick={() => setIsWishlistOpen(!isWishlistOpen)}
                  className="relative p-2 sm:p-3 text-neutral-600 hover:text-primary-500 transition-colors"
                >
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-error-500 text-white text-caption rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium">
                      {wishlist.length}
                    </span>
                  )}
                </button> */}
                
                {isWishlistOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-elevation-lg border border-neutral-200 z-50">
                    <div className="p-4 border-b border-neutral-200">
                      <h3 className="font-semibold text-neutral-800 text-body">Wishlist ({wishlist.length})</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {wishlistProducts.length > 0 ? (
                        wishlistProducts.map(product => (
                          <div key={product.id} className="p-3 border-b border-neutral-100 hover:bg-neutral-50">
                            <div className="flex items-center space-x-3">
                              <img
                                src={product.product_details.images?.[0]?.image ?? PLACEHOLDER}
                                alt={product.product_details.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="text-body font-medium text-neutral-800 truncate">
                                  {product.product_details.name}
                                </h4>
                                <p className="text-primary-500 font-semibold">Rs.{product.listed_price}</p>
                              </div>
                              <button
                                onClick={() => setWishlist(prev => prev.filter(id => id !== product.id))}
                                className="text-accent-error-500 hover:text-accent-error-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-neutral-500">
                          Your wishlist is empty
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Button */}
              <div className="relative">
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

              <div className="hidden sm:block">
                {isAuthenticated ? (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:text-primary-500 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-caption">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="hidden lg:inline">{user?.name || user?.email || 'Account'}</span>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        sideOffset={5}
                        className="bg-white rounded-lg shadow-elevation-lg border border-neutral-200 p-2 min-w-[180px] z-50"
                      >
                        <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                          <p className="text-body font-medium text-gray-900">{user?.name || 'User'}</p>
                          <p className="text-caption text-neutral-500">{user?.email}</p>
                        </div>
                        <DropdownMenu.Item
                          onSelect={() => navigate('/user-profile')}
                          className="flex items-center px-3 py-2 text-body text-neutral-700 hover:bg-primary-50 rounded-md cursor-pointer outline-none"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => navigate('/my-orders')}
                          className="flex items-center px-3 py-2 text-body text-neutral-700 hover:bg-primary-50 rounded-md cursor-pointer outline-none"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          My Orders
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="h-px bg-neutral-200 my-1" />
                        <DropdownMenu.Item
                          onSelect={async () => {
                            await logout();
                            navigate('/');
                          }}
                          className="flex items-center px-3 py-2 text-body text-accent-error-600 hover:bg-accent-error-50 rounded-md cursor-pointer outline-none"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign out
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                ) : (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:text-primary-500 transition-colors">
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden lg:inline">Account</span>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        sideOffset={5}
                        className="bg-white rounded-lg shadow-elevation-lg border border-neutral-200 p-2 min-w-[180px] z-50"
                      >
                        <DropdownMenu.Item
                          onSelect={() => navigate('/login')}
                          className="flex items-center px-3 py-2 text-body text-neutral-700 hover:bg-primary-50 rounded-md cursor-pointer outline-none"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="h-px bg-neutral-200 my-1" />
                        <DropdownMenu.Item
                          onSelect={(e) => {
                            e.preventDefault();
                            navigate('/register');
                          }}
                          className="flex items-center px-3 py-2 text-body text-neutral-700 hover:bg-primary-50 rounded-md cursor-pointer outline-none"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Register
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>
            </div>
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
              <a href="/" className="block py-2 text-neutral-700 hover:text-primary-600">Home</a>
              <a href="/blog" className="block py-2 text-neutral-700 hover:text-primary-600">Blog</a>
              <a href="/about" className="block py-2 text-neutral-700 hover:text-primary-600">About</a>
              <a href="/contact" className="block py-2 text-neutral-700 hover:text-primary-600">Contact</a>
              
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
                      onClick={() => navigate('/profile')}
                      className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={() => navigate('/my-orders')}
                      className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                    >
                      My Orders
                    </button>
                    <button 
                      onClick={async () => {
                        await logout();
                        navigate('/');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-status-error hover:text-red-700"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => navigate('/register')}
                      className="w-full text-left py-2 text-neutral-700 hover:text-primary-600"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-neutral-200">
                <div className="text-caption text-neutral-600 mb-2">Support</div>
                <div className="text-primary-600 font-medium">977 - 9767474645</div>
                <div className="text-caption text-neutral-500">24/7 Support</div>
              </div>
            </nav>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto container-padding">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4 lg:space-x-8">
              <Select.Root 
                value={selectedCategory} 
                onValueChange={(value: string) => setSelectedCategory(value)}
              >
                <Select.Trigger className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-caption">
                  <Select.Value placeholder="Categories" />
                  <ChevronDown className="w-4 h-4" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-white card shadow-elevation-lg border border-neutral-200 overflow-hidden">
                    <Select.Viewport className="p-2">
                      {CATEGORY_OPTIONS.map((option) => (
                        <Select.Item 
                          key={option.code} 
                          value={option.code}
                          className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
                        >
                          <Select.ItemText>{option.label}</Select.ItemText>
                          <Select.ItemIndicator className="absolute left-2">
                            <Check className="w-4 h-4" /> 
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

              <nav className="hidden lg:flex items-center space-x-6">
                <a href="/" className="text-neutral-700 hover:text-primary-600 font-medium">Home</a>
                <a href="/blog" className="text-neutral-700 hover:text-primary-600 font-medium">Blog</a>
                <a href="/about" className="text-neutral-700 hover:text-primary-600 font-medium">About</a>
                <a href="/contact" className="text-neutral-700 hover:text-primary-600 font-medium">Contact</a>
              </nav>

              {/* Flash Sale and Deals Buttons */}
              <div className="hidden lg:flex items-center space-x-3">
                <button
                  onClick={() => {
                    window.open('/flash-sale', '_blank');
                  }}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                    currentView === 'flash-sale'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gradient-to-r from-red-400 to-pink-400 text-white hover:from-red-500 hover:to-pink-500 shadow-md'
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span>Flash Sale</span>
                  </span>
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    🔥
                  </div>
                </button>

                <button
                  onClick={() => {
                    window.open('/deals', '_blank');
                  }}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                    currentView === 'deals'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white hover:from-green-500 hover:to-emerald-500 shadow-md'
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>Deals</span>
                  </span>
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-green-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    %
                  </div>
                </button>

                <button
                  onClick={() => {
                    setCurrentView('marketplace');
                    setCurrentPage(1);
                    fetchMarketplaceProducts(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-caption transition-all duration-300 ${
                    currentView === 'marketplace'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  All Products
                </button>
              </div>

              {/* Mobile Flash Sale and Deals Buttons */}
              <div className="lg:hidden flex items-center space-x-2">
                <button
                  onClick={() => {
                    window.open('/flash-sale', '_blank');
                  }}
                  className={`relative px-3 py-1.5 rounded-md font-medium text-xs transition-all duration-300 ${
                    currentView === 'flash-sale'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                      : 'bg-gradient-to-r from-red-400 to-pink-400 text-white'
                  }`}
                >
                  🔥 Flash
                </button>

                <button
                  onClick={() => {
                    window.open('/deals', '_blank');
                  }}
                  className={`relative px-3 py-1.5 rounded-md font-medium text-xs transition-all duration-300 ${
                    currentView === 'deals'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                  }`}
                >
                  % Deals
                </button>

                <button
                  onClick={() => {
                    setCurrentView('marketplace');
                    setCurrentPage(1);
                    fetchMarketplaceProducts(1);
                  }}
                  className={`px-3 py-1.5 rounded-md font-medium text-caption transition-all duration-300 ${
                    currentView === 'marketplace'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-3 border-l border-neutral-200 pl-4 ml-2">
                <Select.Root 
                  value={selectedLocation} 
                  onValueChange={(value: string) => setSelectedLocation(value)}
                >
                  <Select.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 border border-neutral-200 rounded-md hover:border-primary-300 transition-colors bg-white text-caption text-neutral-700">
                    <Select.Value placeholder="Location" />
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 bg-white card shadow-elevation-lg border border-neutral-200 overflow-hidden">
                      <Select.Viewport className="p-2">
                        {LOCATION_OPTIONS.map((location) => (
                          <Select.Item 
                            key={location} 
                            value={location}
                            className="relative flex items-center px-8 py-2 text-caption text-neutral-700 rounded-md hover:bg-primary-50 cursor-pointer outline-none"
                          >
                            <Select.ItemText>{location}</Select.ItemText>
                            <Select.ItemIndicator className="absolute left-2">
                              <Check className="w-4 h-4" /> 
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>

                <Select.Root 
                  value={selectedProfileType} 
                  onValueChange={(value: string) => setSelectedProfileType(value)}
                >
                  <Select.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 border border-neutral-200 rounded-md hover:border-primary-300 transition-colors bg-white text-caption text-neutral-700">
                    <Select.Value placeholder="Seller Type" />
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 bg-white card shadow-elevation-lg border border-neutral-200 overflow-hidden">
                      <Select.Viewport className="p-2">
                        {PROFILE_TYPE_OPTIONS.map((type) => (
                          <Select.Item 
                            key={type} 
                            value={type}
                            className="relative flex items-center px-8 py-2 text-caption text-neutral-700 rounded-md hover:bg-primary-50 cursor-pointer outline-none"
                          >
                            <Select.ItemText>{type}</Select.ItemText>
                            <Select.ItemIndicator className="absolute left-2">
                              <Check className="w-4 h-4" /> 
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="text-right">
                <div className="text-gray-600 text-sm">977 - 9767474645</div>
                <div className="text-primary-600 font-medium text-sm">24/7 Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-green-700 py-8 sm:py-12 lg:py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div className="text-white space-y-4 lg:space-y-6 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Premium Home Essentials
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 leading-relaxed">
                Elevate your everyday with quality products you'll love
              </p>
              <button className="bg-white text-primary-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-blue-50 transition-colors shadow-lg">
                Shop Collection
              </button>
            </div>
            <div className="relative">
              <div className="w-full h-64 sm:h-80 lg:h-96 relative">
                <img 
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop" 
                  alt="Modern home goods and decor" 
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/5 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-96 sm:h-96 bg-white/5 rounded-full translate-y-24 sm:translate-y-48 -translate-x-24 sm:-translate-x-48"></div>
      </div>

      <div className="container mx-auto container-padding section-spacing">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 card-elevated p-6 sm:p-8 relative overflow-hidden group card-hover transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-h2 font-bold text-neutral-800 mb-2">Home Decor</h3>
              <p className="text-neutral-600 mb-4 text-body">Stylish home accessories</p>
              <button 
                onClick={() => navigate('/marketplace/all-products')}
                className="bg-primary-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop" 
                alt="Home decor" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Kitchenware</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Premium kitchen essentials</p>
              <button 
                onClick={() => navigate('/marketplace/all-products')}
                className="bg-primary-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=150&h=150&fit=crop" 
                alt="Kitchenware" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Bath & Body</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Luxury self-care products</p>
              <button 
                onClick={() => navigate('/marketplace/all-products')}
                className="bg-primary-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1514066359479-47a54d1a48d4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1632" 
                alt="Bath products" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Clothing</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Trendy fashion apparel</p>
              <button 
                onClick={() => navigate('/marketplace/all-products')}
                className="bg-primary-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=150&h=150&fit=crop" 
                alt="Clothing fashion" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>
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
                          : 'bg-accent-success-600 text-white hover:bg-accent-success-700 hover:shadow-md'
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

      {/* Category Pills Section */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-4">
          <div 
            className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category.code}
                onClick={() => setSelectedCategory(category.code)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border ${
                  selectedCategory === category.code
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {currentView === 'marketplace' && (
              <>
                {/* <div className="bg-white rounded-lg shadow-sm p-4 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <span className="text-sm text-gray-600">Showing {startItem}-{endItem} of {totalCount} results</span>
                      <div className="flex items-center flex-wrap gap-2">
                        {selectedCategory !== 'All' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {CATEGORY_OPTIONS.find(c => c.code === selectedCategory)?.label}
                            <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCategory('All')} />
                          </span>
                        )}
                        {selectedLocation !== 'All' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {selectedLocation}
                            <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedLocation('All')} />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Sort by:</span>
                      <select className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option>Default Sorting</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Newest First</option>
                      </select>
                    </div>
                  </div>
                </div> */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {products.map(item => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/marketplace/${item.id}`)}
                      className="bg-white rounded-xl shadow-elevation-sm hover:shadow-elevation-md transition-all duration-300 cursor-pointer overflow-hidden group border border-neutral-200"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {item.percent_off > 0 && (
                          <div className="absolute top-3 left-3 bg-accent-error-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10 shadow-sm">
                            {Math.round(item.percent_off)}% OFF
                          </div>
                        )}
                        
                        {/* Wishlist Button */}
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add wishlist functionality here
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-sm z-10"
                        >
                          <Heart className="w-4 h-4 text-neutral-400 hover:text-accent-error-500 transition-colors" />
                        </button> */}
                        
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
                        <h3 className="font-semibold text-neutral-900 line-clamp-2 text-body group-hover:text-primary-600 transition-colors leading-tight">
                          {item.product_details.name}
                        </h3>
                        
                        {/* Price Section */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {item.discounted_price && item.discounted_price < item.listed_price ? (
                              <>
                                <span className="text-h3 font-bold text-primary-600">
                                  Rs.{item.discounted_price}
                                </span>
                                <span className="text-body text-neutral-500 line-through">
                                  Rs.{item.listed_price}
                                </span>
                              </>
                            ) : (
                              <span className="text-h3 font-bold text-primary-600">
                                Rs.{item.listed_price}
                              </span>
                            )}
                          </div>
                          {item.discounted_price && item.discounted_price < item.listed_price && (
                            <div className="text-xs text-accent-success-600 font-medium">
                              You save Rs.{(item.listed_price - item.discounted_price).toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        {/* Stock and Views Info */}
                        <div className="flex items-center justify-between text-xs text-neutral-600">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${item.product_details.stock > 10 ? 'bg-accent-success-500' : item.product_details.stock > 0 ? 'bg-accent-warning-500' : 'bg-accent-error-500'}`}></div>
                            <span className="font-medium">
                              {item.product_details.stock > 0 ? `${item.product_details.stock} in stock` : 'Out of stock'}
                            </span>
                          </div>
                          <span>Views: {item.view_count}</span>
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
                              : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{item.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 0 && (
                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-2 sm:px-3 py-2 border rounded-md text-sm sm:text-base ${currentPage === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        ←
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum > 0 && pageNum <= totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 sm:px-3 py-2 border rounded-md text-sm sm:text-base ${currentPage === pageNum ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-300 hover:bg-gray-50'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <span className="px-2 text-sm sm:text-base">...</span>
                      )}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-2 sm:px-3 py-2 border rounded-md text-sm sm:text-base ${currentPage === totalPages ? 'bg-orange-600 text-white border-orange-600' : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                          {totalPages}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-2 sm:px-3 py-2 border rounded-md text-sm sm:text-base ${currentPage === totalPages ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        →
                      </button>
                    </div>
                    
                    {/* View All Products Link */}
                    <button
                      onClick={() => navigate('/marketplace/all-products')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm sm:text-base font-medium"
                    >
                      View All Products
                    </button>
                  </div>
                )}
              </>
            )}

            {currentView === 'flash-sale' && (
              <div>
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center space-x-2">
                        <span>🔥</span>
                        <span>Flash Sale - Fastest Selling Products</span>
                      </h2>
                      <p className="text-red-100 mt-2">Limited time offers on trending products!</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{flashSaleProducts.length}</div>
                      <div className="text-sm text-red-100">Hot Deals</div>
                    </div>
                  </div>
                </div>

                {flashSaleLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {flashSaleProducts.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/marketplace/${item.id}`)}
                        className="bg-white rounded-xl shadow-elevation-sm hover:shadow-elevation-md transition-all duration-300 cursor-pointer overflow-hidden group border border-neutral-200 relative"
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <div className="absolute top-3 left-3 bg-accent-error-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10 flex items-center gap-1 shadow-sm">
                            <span>#{index + 1}</span>
                            <span>🔥</span>
                          </div>
                          
                          {/* Wishlist Button */}
                          {/* <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add wishlist functionality here
                            }}
                            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-sm z-10"
                          >
                            <Heart className="w-4 h-4 text-neutral-400 hover:text-accent-error-500 transition-colors" />
                          </button> */}
                          
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
                          {/* Category and Trending Score */}
                          <div className="flex items-center justify-between">
                            <span className="inline-block bg-neutral-100 text-neutral-600 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
                              {item.product_details.category_details}
                            </span>
                            {/* <div className="flex items-center gap-1">
                              <div className="text-xs bg-accent-error-100 text-accent-error-600 px-2 py-1 rounded-full font-medium">
                                {(item as any).trending_score?.toFixed(1)} Score
                              </div>
                            </div> */}
                          </div>
                          
                          {/* Product Title */}
                          <h3 className="font-semibold text-neutral-900 line-clamp-2 text-body group-hover:text-accent-error-600 transition-colors leading-tight">
                            {item.product_details.name}
                          </h3>
                          
                          {/* Sales Badge */}
                          <div className="flex items-center gap-2">
                            <div className="text-xs bg-accent-success-100 text-accent-success-600 px-2 py-1 rounded-full font-medium">
                              {(item as any).total_sales} Sales
                            </div>
                          </div>
                          
                          {/* Price Section */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {item.discounted_price && item.discounted_price < item.listed_price ? (
                                <>
                                  <span className="text-h3 font-bold text-accent-error-600">
                                    Rs.{item.discounted_price}
                                  </span>
                                  <span className="text-body text-neutral-500 line-through">
                                    Rs.{item.listed_price}
                                  </span>
                                </>
                              ) : (
                                <span className="text-h3 font-bold text-accent-error-600">
                                  Rs.{item.listed_price}
                                </span>
                              )}
                            </div>
                            {item.discounted_price && item.discounted_price < item.listed_price && (
                              <div className="text-xs text-accent-success-600 font-medium">
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
                                : 'bg-accent-error-600 text-white hover:bg-accent-error-700 hover:shadow-md'
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
              </div>
            )}

            {currentView === 'deals' && (
              <div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center space-x-2">
                        <span>🏷️</span>
                        <span>Amazing Deals & Discounts</span>
                      </h2>
                      <p className="text-green-100 mt-2">Save big on selected products!</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{dealsProducts.length}</div>
                      <div className="text-sm text-green-100">Deals Available</div>
                    </div>
                  </div>
                </div>

                {dealsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>
                ) : dealsProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {dealsProducts.map(item => (
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
                                : 'bg-accent-success-600 text-white hover:bg-accent-success-700 hover:shadow-md'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>{item.product_details.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Deals Available</h3>
                    <p className="text-gray-500">Check back soon for amazing deals and discounts!</p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Marketplace;
