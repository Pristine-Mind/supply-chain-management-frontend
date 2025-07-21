import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  MagnifyingGlassIcon,
  Cross2Icon,
  ChevronDownIcon,
  CheckIcon,
  PersonIcon,
  EnterIcon,
  PlusCircledIcon,
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
  recent_purchases_count: number;
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
          // headers: { Authorization: `Token ${localStorage.getItem('token')}` },
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
  }, [query, selectedCategory, selectedLocation, selectedProfileType]);

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm overflow-visible">
        <div className="container mx-auto flex items-center space-x-6 px-4 py-3">
          <div className="flex items-center flex-shrink-0">
            <img src={logo} alt="Logo" className="w-10 h-10 mr-2" />
            <span className="font-extrabold text-2xl text-orange-600 whitespace-nowrap">
              MulyaBazzar
            </span>
          </div>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <div className="flex-1 max-w-xl">
                <button
                  onClick={() => setShowSuggestions(true)}
                  className="w-full flex items-center gap-3 px-4 py-2 border-2 rounded-lg hover:border-orange-500 transition-colors text-gray-600"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  <span className="truncate">Search products...</span>
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
                          src={p.product.images?.[0]?.image ?? PLACEHOLDER}
                          alt={p.product.name}
                          className="w-8 h-8 rounded mr-2 object-cover"
                        />
                        <div>
                          <div className="font-medium text-sm">{p.product.name}</div>
                          <div className="text-xs text-gray-500">Rs.{p.listed_price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <div className="hidden md:flex items-center space-x-3 overflow-visible">
           <Select.Root 
              value={selectedCategory} 
              onValueChange={(value: string) => {
                setSelectedCategory(value);
              }}
            >
              <Select.Trigger
                aria-label="Category filter"
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:border-orange-500 transition-colors bg-white text-sm min-w-[120px]"
              >
                <Select.Value placeholder="Category" />
                <Select.Icon>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <Select.Viewport className="p-2">
                    <Select.Group>
                      <Select.Label className="px-2 py-1 text-xs text-gray-500">
                        Category
                      </Select.Label>
                      {CATEGORY_OPTIONS.map((option) => (
                        <Select.Item 
                          key={option.code} 
                          value={option.code}
                          className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
                        >
                          <Select.ItemText>{option.label}</Select.ItemText>
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

            <Select.Root 
              value={selectedLocation} 
              onValueChange={(value: string) => {
                setSelectedLocation(value);
              }}
            >
              <Select.Trigger
                aria-label="Location filter"
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:border-orange-500 transition-colors bg-white text-sm min-w-[120px]"
              >
                <Select.Value placeholder="Location" />
                <Select.Icon>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <Select.Viewport className="p-2">
                    <Select.Group>
                      <Select.Label className="px-2 py-1 text-xs text-gray-500">
                        Location
                      </Select.Label>
                      {LOCATION_OPTIONS.map((location) => (
                        <Select.Item 
                          key={location} 
                          value={location}
                          className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
                        >
                          <Select.ItemText>{location}</Select.ItemText>
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

            <Select.Root 
              value={selectedProfileType} 
              onValueChange={(value: string) => {
                setSelectedProfileType(value);
              }}
            >
              <Select.Trigger
                aria-label="Seller type filter"
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:border-orange-500 transition-colors bg-white text-sm min-w-[120px]"
              >
                <Select.Value placeholder="Seller" />
                <Select.Icon>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <Select.Viewport className="p-2">
                    <Select.Group>
                      <Select.Label className="px-2 py-1 text-xs text-gray-500">
                        Seller Type
                      </Select.Label>
                      {PROFILE_TYPE_OPTIONS.map((type) => (
                        <Select.Item 
                          key={type} 
                          value={type}
                          className="relative flex items-center px-8 py-2 text-sm text-gray-700 rounded-md hover:bg-orange-50 cursor-pointer outline-none"
                        >
                          <Select.ItemText>{type}</Select.ItemText>
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
          </div>
          <div style={{ position: 'relative', zIndex: 1000 }}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    color: '#374151',
                    backgroundColor: 'transparent',
                    border: '2px solid #e5e7eb',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <PersonIcon style={{ width: '16px', height: '16px' }} />
                  <span style={{ display: 'none' }} className="sm:inline">
                    Account
                  </span>
                  <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content 
                  sideOffset={5}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '4px',
                    minWidth: '180px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e5e7eb',
                    zIndex: 1000
                  }}
                >
                  <DropdownMenu.Item
                    onSelect={() => {
                      navigate('/login');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#374151',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <EnterIcon style={{ width: '16px', height: '16px', marginRight: '8px', color: '#6b7280' }} />
                    <span>Login</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
                  <DropdownMenu.Item
                    onSelect={() => {
                      navigate('/register');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      fontSize: '14px', 
                      color: '#374151',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <PlusCircledIcon style={{ width: '16px', height: '16px', marginRight: '8px', color: '#6b7280' }} />
                    <span>Register</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>

      <div className="relative border-b py-3 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        <div className="flex gap-4 px-4 overflow-x-auto pb-2 no-scrollbar" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(CATEGORY_OPTIONS.find(c => c.label === cat.key)?.code || 'All')}
              className={`flex-shrink-0 w-24 flex flex-col items-center p-1 rounded-lg transition-all ${
                selectedCategory === cat.key ? 'bg-orange-50 ring-2 ring-orange-400' : 'hover:bg-gray-50'
              }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="w-24 h-24 overflow-hidden rounded-lg mb-1">
                <img src={cat.value} alt={cat.key} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{cat.key}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        <img
          src="https://img.lazcdn.com/us/lazgcp/3fc84778-c749-4ead-96f2-42a1093144d0_NP-1188-340.gif"
          alt="Promo"
          className="w-full h-64 object-cover rounded-lg"
        />

       {newArrivals.length > 0 && (
          <>
            <h2 className="font-bold text-2xl">Trending Deals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {newArrivals.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/marketplace/${deal.id}`)}
                  className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-lg border-2 border-orange-400"
                >
                  <img
                    src={deal.product_details.images?.[0]?.image ?? PLACEHOLDER}
                    alt={deal.product_details.name}
                    className="w-full h-28 object-cover rounded mb-2"
                  />
                  <div className="font-medium truncate">{deal.product_details.name}</div>
                  <div className="text-green-700 font-bold">Rs.{deal.listed_price}</div>
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between"><span>Views:</span><span>{deal.view_count}</span></div>
                    <div className="flex justify-between"><span>Purchases:</span><span>{deal.recent_purchases_count}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="font-bold text-2xl">Recommended for you</h2>
        {products.length === 0 ? (
          <div className="text-center text-gray-500">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {products.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/marketplace/${item.id}`)}
                className="bg-white rounded-xl shadow p-4 text-center cursor-pointer hover:shadow-lg border-2 border-orange-400"
              >
                <img
                  src={item.product_details.images?.[0]?.image ?? PLACEHOLDER}
                  alt={item.product_details.name}
                  className="w-full h-28 object-cover rounded mb-2"
                />
                <div className="font-medium truncate">{item.product_details.name}</div>
                <div className="text-green-700 font-bold">Rs.{item.listed_price}</div>
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between"><span>Views:</span><span>{item.view_count}</span></div>
                  <div className="flex justify-between"><span>Purchases:</span><span>{item.recent_purchases_count}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => navigate('/marketplace/all-products')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold"
          >
            View More
          </button>
        </div>

        {isChatOpen ? (
          <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-orange-500 text-white p-3 flex justify-between items-center">
              <span>Marketplace Assistant</span>
              <button onClick={() => setIsChatOpen(false)} className="p-1">
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              <Message type="bot" message="Hello! How can I help?" timestamp={new Date().toLocaleTimeString()} />
            </div>
            <div className="border-t border-gray-200 p-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Send</button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-4 right-4 bg-orange-500 text-white p-3 rounded-full shadow-lg"
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Marketplace;
