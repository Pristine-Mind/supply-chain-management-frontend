import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  MagnifyingGlassIcon,
  Cross2Icon,
} from '@radix-ui/react-icons';
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

const MarketplaceAllProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedProfileType, setSelectedProfileType] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;
  const navigate = useNavigate();

  const fetchAllProducts = async (
    search = '',
    category = 'All',
    city = 'All',
    profile_type = 'All',
    min_price = '',
    max_price = '',
    min_order = '',
    pageNum = 1
  ) => {
    setLoading(true);
    setError('');
    try {
      const params: any = { limit: PAGE_SIZE, offset: (pageNum - 1) * PAGE_SIZE };
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      if (city && city !== 'All') params.city = city;
      if (profile_type && profile_type !== 'All') params.profile_type = profile_type;
      if (min_price) params.min_price = min_price;
      if (max_price) params.max_price = max_price;
      if (min_order) params.min_order = min_order;
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          params,
        }
      );
      setProducts(response.data.results);
      setTotalPages(Math.ceil(response.data.count / PAGE_SIZE));
    } catch (err: any) {
      setError('Error fetching products');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAllProducts(
      query,
      selectedCategory,
      selectedLocation,
      selectedProfileType,
      minPrice,
      maxPrice,
      minOrder,
      page
    );
    // eslint-disable-next-line
  }, [query, selectedCategory, selectedLocation, selectedProfileType, minPrice, maxPrice, minOrder, page]);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white shadow-sm border-b z-10 pb-2 w-screen left-0 right-0">
        <div className="w-full px-4">
          <div className="flex items-center py-2 relative">
            <div className="flex items-center gap-2 absolute left-4 top-1/2 -translate-y-1/2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-extrabold text-xl text-orange-600">MulyaBazzar</span>
            </div>

            <div className="w-full max-w-2xl mx-auto">
              <Dialog.Root open={showSearch} onOpenChange={setShowSearch}>
                <Dialog.Trigger asChild>
                  <button
                    className="flex items-center gap-3 px-4 py-2 border-2 rounded-xl text-base w-full"
                    onClick={() => setShowSearch(true)}
                  >
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500 text-base truncate">Search products...</span>
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
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setQuery(searchQuery);
                          setShowSearch(false);
                        }
                      }}
                    />
                    <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                    <Dialog.Close asChild>
                      <button 
                        className="absolute right-6 top-1/2 -translate-y-1/2"
                        onClick={() => setShowSearch(false)}
                      >
                        <Cross2Icon className="w-7 h-7 text-gray-400 hover:text-gray-600 transition-colors" />
                      </button>
                    </Dialog.Close>
                  </div>
                </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
          </div>

          <div className="w-full px-4 mt-2">
            <div className="mb-2">
              <h2 className="text-base font-bold mb-1">Categories</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                {[
                  { key: 'All', value: 'https://media.istockphoto.com/id/2219018540/vector/green-check-mark-emoji-icon-isolated-vector-10-eps.webp?s=2048x2048&w=is&k=20&c=MTSmrZhqRSMXFDqnQXa4kW_c6y_PcRkKeDu_kQDbjK8=' },
                  { key: 'Fruits', value: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80' },
                  { key: 'Vegetables', value: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80' },
                  { key: 'Grains & Cereals', value: 'https://t4.ftcdn.net/jpg/02/44/16/79/360_F_244167973_E7aRgY9NHX9qW0QWOaZNwmG8NBJaa1rf.jpg' },
                  { key: 'Pulses & Legumes', value: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
                  { key: 'Spices & Herbs', value: 'https://media.istockphoto.com/id/1412875469/photo/herbs-and-spices.webp?s=2048x2048&w=is&k=20&c=YRunD3et5VG3SbJrXJJ9r-eo78BnY6OAl4eJdNkDM3Y=' },
                  { key: 'Nuts & Seeds', value: 'https://media.istockphoto.com/id/637627694/photo/dried-fruit-and-nuts-trail-mix.webp?s=2048x2048&w=is&k=20&c=SgxJkeWR2ho-tZYTKJv-86tznmU5yxNYsIBq0s7B2_g=' },
                  { key: 'Fodder & Forage', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
                  { key: 'Ornamental Plants', value: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
                  { key: 'Medicinal Plants', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key === 'All' ? 'All' : CATEGORY_OPTIONS.find(c => c.label === cat.key)?.code || 'All')}
                    className={`flex flex-col items-center p-2 rounded-lg flex-shrink-0 ${
                      selectedCategory === (cat.key === 'All' ? 'All' : CATEGORY_OPTIONS.find(c => c.label === cat.key)?.code || 'All')
                        ? 'bg-orange-50 ring-2 ring-orange-400' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-26 h-16 overflow-hidden rounded-lg mb-1">
                      <img
                        src={cat.value}
                        alt={cat.key}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-700 text-center">{cat.key}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-8">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  className="w-full h-8 rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                >
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  className="w-full h-8 rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm"
                  value={selectedProfileType}
                  onChange={e => setSelectedProfileType(e.target.value as any)}
                >
                  {PROFILE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full px-0 md:px-6 py-8 gap-8">
        <aside className="hidden md:block md:w-64 lg:w-56 xl:w-64 md:min-h-[calc(100vh-120px)] md:sticky md:top-24 self-start ml-0">
          <MarketplaceSidebarFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            minOrder={minOrder}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onMinOrderChange={setMinOrder}
          />
        </aside>

        <main className="flex-1 w-full min-w-0 max-w-5xl mx-auto">
          <div className="">
            {loading ? (
              <div className="text-center py-10">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-10">{error}</div>
            ) : products.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No products found.</div>
            ) : (
              <div className="flex flex-col gap-6">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-200 p-4 cursor-pointer flex flex-row items-center group hover:-translate-y-1"
                    onClick={() => navigate(`/marketplace/${item.id}`)}
                  >
                    {item.product_details?.images?.length > 0 ? (
                      <img src={item.product_details.images[0].image} alt="" className="w-32 h-32 object-cover rounded-xl mr-6 group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-200 rounded-xl mr-6" />
                    )}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="font-semibold text-xl mb-1 truncate">{item.product_details?.name}</div>
                      <div className="text-xs text-gray-500 mb-1">Category: {item.product_details?.category_details}</div>
                      <div className="text-xs text-gray-500 mb-1">Stock: {item.product_details?.stock}</div>
                      <div className="text-lg text-orange-600 font-bold">Rs.{item.listed_price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              className="px-3 py-1 rounded border bg-white shadow disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-3 py-1 rounded border shadow ${page === i + 1 ? 'bg-orange-500 text-white' : 'bg-white'}`}
                onClick={() => setPage(i + 1)}
                disabled={page === i + 1}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-white shadow disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </main>

        <aside className="hidden lg:block w-72 xl:w-80 2xl:w-96 min-h-[calc(100vh-120px)] sticky top-24 self-start space-y-6">
          <div className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <img 
              src={banner} 
              alt="Special Offers" 
              className="w-full h-auto object-cover"
            />
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">Sell Your Products</h3>
            <p className="text-sm text-gray-600 mb-4">Join thousands of sellers and reach more customers</p>
            <button 
              onClick={() => navigate('/marketplace/user-product')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
