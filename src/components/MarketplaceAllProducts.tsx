import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import MarketplaceSidebarFilters from './MarketplaceSidebarFilters';
import logo from '../assets/logo.png';
import banner from '../assets/banner_new.png';
import Footer from './Footer';

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

const PAGE_SIZE = 20;

const MarketplaceAllProducts: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORY_OPTIONS[number]['code']>('All');
  const [selectedLocation, setSelectedLocation] = useState<typeof LOCATION_OPTIONS[number]>('All');
  const [selectedProfileType, setSelectedProfileType] = useState<typeof PROFILE_TYPE_OPTIONS[number]>('All');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minOrder, setMinOrder] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAllProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      };
      if (query) params.search = query;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedLocation !== 'All') params.city = selectedLocation;
      if (selectedProfileType !== 'All') params.profile_type = selectedProfileType;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minOrder) params.min_order = minOrder;

      const resp = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          params,
        }
      );

      setProducts(resp.data.results);
      setTotalPages(Math.ceil(resp.data.count / PAGE_SIZE));
    } catch {
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query,
    selectedCategory,
    selectedLocation,
    selectedProfileType,
    minPrice,
    maxPrice,
    minOrder,
    page,
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationMenu.Root className="sticky top-0 bg-white shadow z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <span className="text-2xl font-bold text-orange-600">MulyaBazzar</span>
          </div>
          <Dialog.Root open={showSearch} onOpenChange={setShowSearch}>
            <Dialog.Trigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-500">Search</span>
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />

              <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4 z-50">
                <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-xl">
                  <div className="relative">
                    <input
                      autoFocus
                      placeholder="Search products..."
                      className="w-full h-16 border rounded-lg py-2 pl-12 pr-10 text-xl focus:outline-none focus:ring-4 focus:ring-orange-400"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setQuery(searchQuery);
                          setShowSearch(false);
                        }
                      }}
                    />
                    <MagnifyingGlassIcon className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <Dialog.Close asChild>
                      <button className="absolute top-1/2 right-4 -translate-y-1/2">
                        <Cross2Icon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>

          </Dialog.Root>
        </div>

        <ScrollArea.Root className="overflow-hidden">
          <ScrollArea.Viewport className="flex space-x-4 py-2 px-4">
            {CATEGORY_OPTIONS.map(cat => (
              <NavigationMenu.Link
                key={cat.code}
                className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedCategory === cat.code
                    ? 'bg-orange-100 text-orange-600'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => {
                  setSelectedCategory(cat.code);
                  setPage(1);
                }}
              >
                {cat.label}
              </NavigationMenu.Link>
            ))}
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      </NavigationMenu.Root>

      <div className="flex flex-1 gap-8 px-4 pt-6">
        <aside className="hidden md:block w-64">
          <MarketplaceSidebarFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            minOrder={minOrder}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onMinOrderChange={setMinOrder}
          />
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(item => (
                <div
                  key={item.id}
                  className="bg-white border rounded-xl shadow hover:shadow-lg transition p-4 cursor-pointer"
                  onClick={() => navigate(`/marketplace/${item.id}`)}
                >
                  {item.product_details?.images?.[0] ? (
                    <img
                      src={item.product_details.images[0].image}
                      alt={item.product_details.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 rounded-lg mb-4" />
                  )}
                  <h3 className="font-semibold text-lg truncate mb-1">
                    {item.product_details?.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">
                    Category: {item.product_details?.category_details}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Stock: {item.product_details?.stock}
                  </p>
                  <div className="text-xl text-orange-600 font-bold">
                    Rs. {item.listed_price}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center space-x-2 mt-6 mb-6">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded border bg-gray-200 shadow disabled:opacity-50 text-black"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded border shadow ${
                  page === i + 1 ? 'bg-orange-500 text-white' : 'bg-white'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border bg-gray-200 shadow disabled:opacity-50 text-black"
            >
              Next
            </button>
          </div>
        </main>

        {/* Right Promo */}
        <aside className="hidden lg:block w-72 space-y-6">
          <img
            src={banner}
            alt="Special Offers"
            className="rounded-lg shadow h-128 w-full"
          />
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Sell Your Products</h3>
            <button
              onClick={() => navigate('/marketplace/user-product')}
              className="w-full py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              List Your Product
            </button>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
);
};
export default MarketplaceAllProducts;

