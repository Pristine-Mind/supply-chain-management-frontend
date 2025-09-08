import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { X, ChevronDown, Check, User, LogIn, PlusCircle, ShoppingCart, Heart, Star, Menu, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';

import logo from '../assets/logo.png';
import Footer from './Footer';
import Message from './Message';
import { AccountDialog } from './AccountDialog';

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
  { code: 'FR', label: 'Fruits' },
  { code: 'VG', label: 'Vegetables' },
  { code: 'GR', label: 'Grains & Cereals' },
  { code: 'PL', label: 'Pulses & Legumes' },
  { code: 'SP', label: 'Spices & Herbs' },
  { code: 'NT', label: 'Nuts & Seeds' },
  { code: 'DF', label: 'Animal Products' },
  { code: 'FM', label: 'Fodder & Forage' },
  { code: 'FL', label: 'Ornamental Plants' },
  { code: 'HR', label: 'Medicinal Plants' },
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
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [recommendations, setRecommendations] = useState<MarketplaceProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<{ key: string; value: string }[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_OPTIONS[0].code);
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_OPTIONS[0]);
  const [selectedProfileType, setSelectedProfileType] = useState(PROFILE_TYPE_OPTIONS[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { cart, addToCart, distinctItemCount } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<MarketplaceProduct | null>(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();

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
      console.log('API Response:', {
        count: data.count,
        resultsLength: data.results.length,
        itemsPerPage,
        calculatedPages: Math.ceil(data.count / itemsPerPage)
      });
      setProducts(data.results);
      setRecommendations(data.results);
      setNewArrivals(data.results.slice(0, 5));
      setTotalCount(data.count || 0);
      setCategories([
        { key: 'Fruits', value: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80' },
        { key: 'Vegetables', value: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80' },
        { key: 'Grains & Cereals', value: 'https://t4.ftcdn.net/jpg/02/44/16/79/360_F_244167973_E7aRgY9NHX9qW0QWOaZNwmG8NBJaa1rf.jpg' },
        { key: 'Pulses & Legumes', value: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
        { key: 'Spices & Herbs', value: 'https://media.istockphoto.com/id/1412875469/photo/herbs-and-spices.webp?s=2048x2048&w=is&k=20&c=YRunD3et5VG3SbJrXJJ9r-eo78BnY6OAl4eJdNkDM3Y=' },
        { key: 'Nuts & Seeds', value: 'https://media.istockphoto.com/id/2032503128/photo/nuts-mixed-in-wooden-bowl-with-spoon-on-blue-background-top-view.webp?s=2048x2048&w=is&k=20&c=i8sranJcrZOEK9yZsYXYRNyEhgqBbkT5-VR_97ObZnE=' },
        { key: 'Animal Products', value: 'https://images.unsplash.com/photo-1683314573422-649a3c6ad784?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2hlZXNlfGVufDB8fDB8fHww' },
        { key: 'Fodder & Forage', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
        { key: 'Ornamental Plants', value: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { key: 'Medicinal Plants', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
        { key: 'Other', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
      ]);
    } catch {
      setError('Error fetching marketplace products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchMarketplaceProducts(1);
  }, [query, selectedCategory, selectedLocation, selectedProfileType]);

  useEffect(() => {
    fetchMarketplaceProducts(currentPage);
  }, [currentPage]);

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
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="bg-orange-600 text-white py-2 px-4">
        <div className="container mx-auto text-center text-xs sm:text-sm">
          Welcome to MulyaBazzar - Your Premium Marketplace
        </div>
      </div>

      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="lg:hidden mr-3 p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <img src={logo} alt="Logo" className="w-8 h-8 sm:w-12 sm:h-12 mr-2 sm:mr-3" />
              <span className="font-bold text-lg sm:text-2xl text-orange-600">MulyaBazzar</span>
            </div>

            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-gray-700"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onClick={() => setShowSuggestions(true)}
                    />
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-md text-sm font-medium hover:bg-orange-700">
                      Search
                    </button>
                  </div>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                  <Dialog.Content className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[95vw] max-w-lg bg-white p-6 rounded-lg shadow-lg z-[1001]">
                    <div className="relative">
                      <input
                        autoFocus
                        value={query}
                        onChange={e => {
                          setQuery(e.target.value);
                          setShowSuggestions(e.target.value.length >= 3);
                        }}
                        className="w-full h-14 pl-12 pr-12 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                        placeholder="Search products..."
                      />
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                      <Dialog.Close asChild>
                        <button className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Cross2Icon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                        </button>
                      </Dialog.Close>
                    </div>
                    {showSuggestions && recommendations.length > 0 && (
                      <div className="mt-4 max-h-60 overflow-auto border-t pt-2">
                        {recommendations.map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setShowSuggestions(false); navigate(`/marketplace/${p.id}`); }}
                            className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <img
                              src={p.product_details.images?.[0]?.image ?? PLACEHOLDER}
                              alt={p.product_details.name}
                              className="w-8 h-8 rounded mr-2 object-cover"
                            />
                            <div>
                              <div className="font-medium text-sm">{p.product_details.name}</div>
                              <div className="text-xs text-gray-500">Rs.{p.listed_price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button className="md:hidden p-2 text-gray-600 hover:text-orange-600">
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
                        className="w-full h-12 pl-12 pr-12 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Search products..."
                      />
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Dialog.Close asChild>
                        <button className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Cross2Icon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      </Dialog.Close>
                    </div>
                    {showSuggestions && recommendations.length > 0 && (
                      <div className="mt-4 max-h-60 overflow-auto border-t pt-2">
                        {recommendations.map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setShowSuggestions(false); navigate(`/marketplace/${p.id}`); }}
                            className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <img
                              src={p.product_details.images?.[0]?.image ?? PLACEHOLDER}
                              alt={p.product_details.name}
                              className="w-8 h-8 rounded mr-2 object-cover"
                            />
                            <div>
                              <div className="font-medium text-sm">{p.product_details.name}</div>
                              <div className="text-xs text-gray-500">Rs.{p.listed_price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>

                <div className="relative">
                <button 
                  onClick={() => setIsWishlistOpen(!isWishlistOpen)}
                  className="relative p-2 sm:p-3 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                
                {isWishlistOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">Wishlist ({wishlist.length})</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {wishlistProducts.length > 0 ? (
                        wishlistProducts.map(product => (
                          <div key={product.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <img
                                src={product.product_details.images?.[0]?.image ?? PLACEHOLDER}
                                alt={product.product_details.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-800 truncate">
                                  {product.product_details.name}
                                </h4>
                                <p className="text-orange-600 font-semibold">Rs.{product.listed_price}</p>
                              </div>
                              <button
                                onClick={() => setWishlist(prev => prev.filter(id => id !== product.id))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Your wishlist is empty
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => navigate('/cart')}
                  className="relative p-2 sm:p-3 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {distinctItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                      {distinctItemCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="hidden sm:block">
                {isAuthenticated ? (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="hidden lg:inline">{user?.name || user?.email || 'Account'}</span>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        sideOffset={5}
                        className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[180px] z-50"
                      >
                        <div className="px-3 py-2 border-b border-gray-100 mb-1">
                          <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <DropdownMenu.Item
                          onSelect={() => navigate('/profile')}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-md cursor-pointer outline-none"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => navigate('/orders')}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-md cursor-pointer outline-none"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          My Orders
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                        <DropdownMenu.Item
                          onSelect={async () => {
                            await logout();
                            navigate('/');
                          }}
                          className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer outline-none"
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
                      <button className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors">
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden lg:inline">Account</span>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content 
                        sideOffset={5}
                        className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[180px] z-50"
                      >
                        <DropdownMenu.Item
                          onSelect={() => navigate('/login')}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-md cursor-pointer outline-none"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                        <DropdownMenu.Item
                          onSelect={(e) => {
                            e.preventDefault();
                            setIsAccountDialogOpen(true);
                          }}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-md cursor-pointer outline-none"
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
              <a href="/" className="block py-2 text-gray-700 hover:text-orange-600">Home</a>
              <a href="/blog" className="block py-2 text-gray-700 hover:text-orange-600">Blog</a>
              <a href="/about" className="block py-2 text-gray-700 hover:text-orange-600">About</a>
              <a href="/contact" className="block py-2 text-gray-700 hover:text-orange-600">Contact</a>
              
              <div className="pt-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/profile')}
                      className="w-full text-left py-2 text-gray-700 hover:text-orange-600"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={() => navigate('/orders')}
                      className="w-full text-left py-2 text-gray-700 hover:text-orange-600"
                    >
                      My Orders
                    </button>
                    <button 
                      onClick={async () => {
                        await logout();
                        navigate('/');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-red-600 hover:text-red-700"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full text-left py-2 text-gray-700 hover:text-orange-600"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => setIsAccountDialogOpen(true)}
                      className="w-full text-left py-2 text-gray-700 hover:text-orange-600"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Support</div>
                <div className="text-orange-600 font-medium">977 - 9767474645</div>
                <div className="text-sm text-gray-500">24/7 Support</div>
              </div>
            </nav>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4 lg:space-x-8">
              <Select.Root 
                value={selectedCategory} 
                onValueChange={(value: string) => setSelectedCategory(value)}
              >
                <Select.Trigger className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm">
                  <Select.Value placeholder="Categories" />
                  <ChevronDown className="w-4 h-4" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
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
                <a href="/" className="text-gray-700 hover:text-orange-600 font-medium">Home</a>
                <a href="/blog" className="text-gray-700 hover:text-orange-600 font-medium">Blog</a>
                <a href="/about" className="text-gray-700 hover:text-orange-600 font-medium">About</a>
                <a href="/contact" className="text-gray-700 hover:text-orange-600 font-medium">Contact</a>
              </nav>

              <button 
                onClick={() => setIsFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md hover:border-orange-300 transition-colors bg-white text-sm text-gray-700"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-4 ml-2">
                <Select.Root 
                  value={selectedLocation} 
                  onValueChange={(value: string) => setSelectedLocation(value)}
                >
                  <Select.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-md hover:border-orange-300 transition-colors bg-white text-sm text-gray-700">
                    <Select.Value placeholder="Location" />
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      <Select.Viewport className="p-2">
                        {LOCATION_OPTIONS.map((location) => (
                          <Select.Item 
                            key={location} 
                            value={location}
                            className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
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
                  <Select.Trigger className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-md hover:border-orange-300 transition-colors bg-white text-sm text-gray-700">
                    <Select.Value placeholder="Seller Type" />
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      <Select.Viewport className="p-2">
                        {PROFILE_TYPE_OPTIONS.map((type) => (
                          <Select.Item 
                            key={type} 
                            value={type}
                            className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
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
                <div className="text-orange-600 font-medium text-sm">24/7 Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white w-80 h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setIsFiltersOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <Select.Root 
                  value={selectedLocation} 
                  onValueChange={(value: string) => setSelectedLocation(value)}
                >
                  <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md bg-white text-sm">
                    <Select.Value placeholder="Select Location" />
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      <Select.Viewport className="p-2">
                        {LOCATION_OPTIONS.map((location) => (
                          <Select.Item 
                            key={location} 
                            value={location}
                            className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seller Type</label>
                <Select.Root 
                  value={selectedProfileType} 
                  onValueChange={(value: string) => setSelectedProfileType(value)}
                >
                  <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md bg-white text-sm">
                    <Select.Value placeholder="Select Seller Type" />
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                      <Select.Viewport className="p-2">
                        {PROFILE_TYPE_OPTIONS.map((type) => (
                          <Select.Item 
                            key={type} 
                            value={type}
                            className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
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

              <button 
                onClick={() => setIsFiltersOpen(false)}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-green-600 to-green-700 py-8 sm:py-12 lg:py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div className="text-white space-y-4 lg:space-y-6 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Feel Good Food
              </h1>
              <p className="text-lg sm:text-xl text-green-100 leading-relaxed">
                We only sell the best ingredients
              </p>
              <button className="bg-white text-orange-500 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-orange-50 transition-colors shadow-lg">
                Shop Now
              </button>
            </div>
            <div className="relative">
              <div className="w-full h-64 sm:h-80 lg:h-96 relative">
                <img 
                  src="https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=600&h=400&fit=crop" 
                  alt="Fresh avocado splash" 
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/5 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-96 sm:h-96 bg-white/5 rounded-full translate-y-24 sm:translate-y-48 -translate-x-24 sm:-translate-x-48"></div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Super Healthy</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Premium organic products</p>
              <button className="bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-orange-600 transition-colors text-sm sm:text-base">
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=150&h=150&fit=crop" 
                alt="Healthy food" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-100 to-orange-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Fresh Fruits</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Seasonal & organic fruits</p>
              <button className="bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-orange-600 transition-colors text-sm sm:text-base">
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=150&h=150&fit=crop" 
                alt="Fresh fruits" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Fresh Vegetables</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Farm-fresh vegetables</p>
              <button className="bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-orange-600 transition-colors text-sm sm:text-base">
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150&h=150&fit=crop" 
                alt="Fresh vegetables" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">100% Organic</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Certified organic products</p>
              <button className="bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-orange-600 transition-colors text-sm sm:text-base">
                Shop Now
              </button>
            </div>
            <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24">
              <img 
                src="https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?w=150&h=150&fit=crop" 
                alt="Organic products" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="hidden lg:block w-64 bg-white rounded-lg shadow-sm p-6 h-fit">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">Category</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(CATEGORY_OPTIONS.find(c => c.label === cat.key)?.code || 'All')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === CATEGORY_OPTIONS.find(c => c.label === cat.key)?.code 
                      ? 'bg-orange-50 text-orange-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.key}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 sm:mb-6">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map(item => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/marketplace/${item.id}`)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                >
                  <div className="relative">
                    {item.percent_off > 0 && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
                        {Math.round(item.percent_off)}% off
                      </div>
                    )}
                    
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.product_details.images?.[0]?.image ?? PLACEHOLDER}
                        alt={item.product_details.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4">
                    <div className="text-xs text-gray-500 mb-1">{item.product_details.category_details}</div>
                    <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 text-sm sm:text-base">{item.product_details.name}</h3>
                    
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i} 
                          className={`w-3 h-3 ${
                            i < Math.floor(item.average_rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="text-xs text-gray-500">
                        {item.average_rating > 0 ? item.average_rating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-xs text-gray-400">({item.total_reviews})</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.discounted_price && item.discounted_price < item.listed_price ? (
                        <>
                          <span className="text-sm text-gray-400 line-through">Rs.{item.listed_price}</span>
                          <span className="font-bold text-orange-600 text-sm sm:text-base">Rs.{item.discounted_price}</span>
                        </>
                      ) : (
                        <span className="font-bold text-orange-600 text-sm sm:text-base">Rs.{item.listed_price}</span>
                      )}
                    </div>
                    
                    {item.is_free_shipping && (
                      <div className="text-xs text-orange-600 mt-1">Free Shipping</div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {item.product_details.stock > 0 ? `${item.product_details.stock} in stock` : 'Out of stock'}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex space-x-4 text-xs text-gray-500">
                        <span>Views: {item.view_count}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item, e);
                      }}
                      className="mt-3 w-full bg-orange-600 text-white py-2 px-3 sm:px-4 rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 0 && (
              <div className="mt-6 sm:mt-8 flex justify-center">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {(isWishlistOpen || isCartOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsWishlistOpen(false);
            setIsCartOpen(false);
          }}
        />
      )}

      {isChatOpen ? (
        <div className="fixed bottom-4 right-4 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="bg-orange-600 text-white p-3 flex justify-between items-center">
            <span className="text-sm sm:text-base">Marketplace Assistant</span>
            <button onClick={() => setIsChatOpen(false)} className="p-1">
              <Cross2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="h-64 sm:h-80 overflow-y-auto p-4 space-y-4">
            <Message type="bot" message="Hello! How can I help?" timestamp={new Date().toLocaleTimeString()} />
          </div>
          <div className="border-t border-gray-200 p-3">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              <button className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 text-sm">Send</button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 z-50"
        >
          <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {isAccountDialogOpen && (
        <AccountDialog 
          defaultOpen={true}
          onSelect={(accountType) => {
            setIsAccountDialogOpen(false);
            if (accountType === 'buyer') {
              navigate('/register');
            } else if (accountType === 'seller') {
              navigate('/business-register');
            }
          }}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsAccountDialogOpen(false);
            }
          }}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Marketplace;
