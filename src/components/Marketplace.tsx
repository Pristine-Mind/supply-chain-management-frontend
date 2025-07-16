import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import {
  MagnifyingGlassIcon,
  Cross2Icon,
  ChevronDownIcon,
  CheckIcon,
} from '@radix-ui/react-icons';
import logo from '../assets/logo.png';
import Footer from './Footer';
import Message from './Message';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string;
  images?: ProductImage[];
}

interface MarketplaceProduct {
  id: number;
  product: Product;
  listed_price: string;
  listed_date: string;
  is_available: boolean;
  bid_end_date: string | null;
  view_count: number;
}

const CATEGORY_OPTIONS = [
  { code: 'All', label: 'All' },
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
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [recommendations, setRecommendations] = useState<MarketplaceProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<{ key: string; value: string }[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_OPTIONS[0].code);
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_OPTIONS[0]);
  const [selectedProfileType, setSelectedProfileType] = useState(PROFILE_TYPE_OPTIONS[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  const fetchMarketplaceProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (query) params.search = query;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLocation !== 'All') params.city = selectedLocation;
      if (selectedProfileType !== 'All') params.profile_type = selectedProfileType;

      const { data } = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          params,
        }
      );

      setProducts(data.results);
      setRecommendations(data.results);
      setNewArrivals(data.results.slice(0, 5));
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
    fetchMarketplaceProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCategory, selectedLocation, selectedProfileType]);

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white shadow-sm border-b z-10">
        <div className="container mx-auto flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 ml-0 mr-16">
            <img src={logo} alt="Logo" className="w-10 h-10 ml-0 mr-0" />
            <span className="font-extrabold text-2xl text-orange-600 ml-0 mr-0">MulyaBazzar</span>
          </div>

          {/* Search */}
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                className="flex items-center gap-4 px-8 py-4 border-2 rounded-xl text-xl w-full max-w-2xl"
                onClick={() => setShowSuggestions(true)}
              >
                <MagnifyingGlassIcon className="w-7 h-7 text-gray-500" />
                <span className="text-gray-500 text-xl">Search products...</span>
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
              <Dialog.Content className="fixed top-1/4 left-1/2 max-w-lg w-[95vw] -translate-x-1/2 bg-white p-6 rounded-lg shadow-lg z-[1001]">
                <div className="relative w-full max-w-3xl">
                  <input
                    autoFocus
                    className="w-full h-16 pl-16 pr-16 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xl"
                    placeholder="Search products..."
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value);
                      setShowSuggestions(e.target.value.length >= 3);
                    }}
                  />
                  <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                  <Dialog.Close asChild>
                    <button className="absolute right-6 top-1/2 -translate-y-1/2">
                      <Cross2Icon className="w-7 h-7 text-gray-400 hover:text-gray-600 transition-colors" />
                    </button>
                  </Dialog.Close>
                </div>

                {showSuggestions && recommendations.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-auto border-t pt-2">
                    {recommendations.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/marketplace/${p.id}`);
                        }}
                      >
                        <img
                          src={p.product_details?.images?.[0]?.image ?? PLACEHOLDER}
                          // alt={p.product_details?.name}
                          className="w-8 h-8 rounded mr-2 object-cover"
                        />
                        <div>
                          <div className="font-medium text-sm">{p.product_details?.name}</div>
                          <div className="text-xs text-gray-500">Rs.{p.listed_price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <div className="flex gap-2 relative">
            {[
              {
                placeholder: 'Category',
                options: CATEGORY_OPTIONS.map(c => ({ code: c.code, label: c.label })),
                value: selectedCategory,
                onChange: setSelectedCategory,
              },
              {
                placeholder: 'City',
                options: LOCATION_OPTIONS.map(l => ({ code: l, label: l })),
                value: selectedLocation,
                onChange: setSelectedLocation,
              },
              {
                placeholder: 'Seller type',
                options: PROFILE_TYPE_OPTIONS.map(p => ({ code: p, label: p })),
                value: selectedProfileType,
                onChange: setSelectedProfileType,
              },
            ].map(({ placeholder, options, value, onChange }, idx) => (
              <Select.Root key={idx} value={value} onValueChange={onChange}>
                <Select.Trigger 
                  className="inline-flex items-center justify-between px-6 py-4 border-2 rounded-xl bg-white text-lg min-w-[120px] hover:bg-gray-50 transition-colors"
                  aria-label={placeholder}
                >
                  <span className="truncate">
                    {options.find(opt => opt.code === value)?.label || placeholder}
                  </span>
                  <Select.Icon className="text-gray-700 ml-2">
                    <ChevronDownIcon className="w-6 h-6" />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Content 
                    className="z-[100] bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px]"
                    position="popper"
                    sideOffset={5}
                  >
                    <Select.Viewport className="p-2">
                      <Select.Group>
                        <Select.Label className="px-4 py-2 text-sm font-medium text-gray-500">
                          {placeholder}
                        </Select.Label>
                        {options.map(opt => (
                          <Select.Item
                            key={opt.code}
                            value={opt.code}
                            className="relative flex items-center px-4 py-2 text-sm rounded-md hover:bg-orange-50 hover:text-orange-900 cursor-pointer outline-none"
                          >
                            <Select.ItemText>{opt.label}</Select.ItemText>
                            <Select.ItemIndicator className="absolute left-2">
                              <CheckIcon className="w-4 h-4 text-orange-600" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            ))}
          </div>
        </div>

        <div className="relative border-b py-3" style={{ zIndex: 10 }}>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent" style={{ zIndex: 5, pointerEvents: 'none' }}></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent" style={{ zIndex: 5, pointerEvents: 'none' }}></div>
          
          <div 
            className="flex gap-4 px-4 overflow-x-auto pb-2 scrollbar-hide"
            style={{
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE and Edge
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            }}
          >
            {categories.map(cat => (
              <div 
                key={cat.key}
                className="flex-shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <button
                  onClick={() =>
                    setSelectedCategory(
                      CATEGORY_OPTIONS.find(c => c.label === cat.key)?.code || 'All'
                    )
                  }
                  className={`flex flex-col items-center p-2 rounded-lg focus:outline-none transition-all ${
                    selectedCategory === cat.key 
                      ? 'bg-orange-50 ring-2 ring-orange-400' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-20 h-16 overflow-hidden rounded-lg mb-1">
                    <img
                      src={cat.value}
                      alt={cat.key}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-700">{cat.key}</div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <img
          src="https://img.lazcdn.com/us/lazgcp/3fc84778-c749-4ead-96f2-42a1093144d0_NP-1188-340.gif"
          alt="Promo"
          className="w-full h-64 object-cover rounded-lg mb-8"
        />

        {newArrivals.length > 0 && (
          <>
            <h2 className="font-bold text-2xl mb-4">Trending Deals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
              {newArrivals.map(deal => (
                <div
                  key={deal.id}
                  className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-lg border-2 border-orange-400"
                  onClick={() => navigate(`/marketplace/${deal.id}`)}
                >
                  <img
                    src={deal.product_details.images?.[0]?.image ?? PLACEHOLDER}
                    alt={deal.product_details.name}
                    className="w-full h-28 object-cover rounded mb-2"
                  />
                  <div className="font-medium truncate">{deal.product_details.name}</div>
                  <div className="text-green-700 font-bold">
                    Rs.{deal.listed_price}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Views:</span>
                      <span className="font-medium">{deal.view_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        <img
          src="https://img.lazcdn.com/us/lazgcp/3fc84778-c749-4ead-96f2-42a1093144d0_NP-1188-340.gif"
          alt="Promo"
          className="w-full h-72 object-cover rounded-lg mb-8"
        />
        <h2 className="font-bold text-2xl mb-4">Recommended for you</h2>
        {products.length === 0 ? (
          <div className="text-center text-gray-500">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {products.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-lg border-2 border-orange-400"
                onClick={() => navigate(`/marketplace/${item.id}`)}
              >
                <img
                  src={item.product_details.images?.[0]?.image ?? PLACEHOLDER}
                  alt={item.product_details.name}
                  className="w-full h-28 object-cover rounded mb-2"
                />
                <div className="font-medium truncate">{item.product_details.name}</div>
                <div className="text-green-700 font-bold">
                  Rs.{item.listed_price}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Views:</span>
                    <span className="font-medium">{item.view_count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold"
            onClick={() => navigate('/marketplace/all-products')}
          >
            View More
          </button>
        </div>

        {/* Chat Interface */}
        {isChatOpen && (
          <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-orange-500 text-white p-3 font-medium flex justify-between items-center">
              <span>Marketplace Assistant</span>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:bg-blue-600 rounded-full p-1 transition-colors"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            <Message 
              type="bot"
              message="Hello! I'm your marketplace assistant. How can I help you today?"
              timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
          </div>
          
          <div className="border-t border-gray-200 p-3">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => {
                  // Handle send message
                }}
              >
                Send
              </button>
            </div>
          </div>
          </div>
        )}
        
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-4 right-4 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            aria-label="Open chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Marketplace;
