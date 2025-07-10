import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebarFilters from './MarketplaceSidebarFilters';
import logo from '../assets/logo.png';
import Footer from './Footer';

const CATEGORY_OPTIONS = [
  { label: 'All', code: 'All' },
  { label: 'Fruits', code: 'Fruits' },
  { label: 'Vegetables', code: 'Vegetables' },
  { label: 'Grains & Cereals', code: 'Grains & Cereals' },
  { label: 'Pulses & Legumes', code: 'Pulses & Legumes' },
  { label: 'Spices & Herbs', code: 'Spices & Herbs' },
  { label: 'Nuts & Seeds', code: 'Nuts & Seeds' },
  { label: 'Dairy & Animal Products', code: 'Dairy & Animal Products' },
  { label: 'Fodder & Forage', code: 'Fodder & Forage' },
  { label: 'Flowers & Ornamental Plants', code: 'Flowers & Ornamental Plants' },
  { label: 'Herbs & Medicinal Plants', code: 'Herbs & Medicinal Plants' },
  { label: 'Other', code: 'Other' },
];
const LOCATION_OPTIONS = [
  'All',
  'Kathmandu',
  'Pokhara',
  'Biratnagar',
  'Birgunj',
  'Butwal',
  'Dhangadhi',
  'Nepalgunj',
  'Other',
];

const PROFILE_TYPE_OPTIONS = ['All', 'Retailer', 'Distributor'];

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
  const PAGE_SIZE = 5;
  const navigate = useNavigate();

  const fetchAllProducts = async (
    search = '',
    category = 'All',
    location = 'All',
    business_type = 'All',
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
      if (location && location !== 'All') params.location = location;
      if (business_type && business_type !== 'All') params.business_type = business_type;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full bg-white shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between w-full px-0 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Mulyabazzar Logo" className="h-10 w-10 rounded-full shadow border" />
            <span className="text-2xl font-extrabold text-orange-600 tracking-tight">Mulyabazzar</span>
          </div>
          <div className="flex-1 flex justify-center">
            <input
              type="text"
              className="w-full max-w-lg rounded-lg border px-6 py-2 bg-gray-100 focus:outline-none text-lg shadow-sm"
              placeholder="Search products, categories, business..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="flex flex-col md:flex-row w-full px-0 md:px-6 py-8 gap-8">
        <aside className="hidden md:block md:w-64 md:min-h-[calc(100vh-120px)] md:sticky md:top-24 self-start ml-0">
          <MarketplaceSidebarFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            minOrder={minOrder}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onMinOrderChange={setMinOrder}
          />
        </aside>

        <main className="flex-1 w-full min-w-0">
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <select
              className="rounded-lg border px-3 py-2 bg-gray-100"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.slice(1).map((c) => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 bg-gray-100"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              <option value="All">All Locations</option>
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 bg-gray-100"
              value={selectedProfileType}
              onChange={e => setSelectedProfileType(e.target.value)}
            >
              <option value="All">All Business Types</option>
              {PROFILE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="w-full bg-white border-b border-gray-100 py-3 mb-6 rounded-xl shadow-sm">
            <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 pb-2 px-2">
              {[
                { key: 'Fruits', value: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80' },
                { key: 'Vegetables', value: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80' },
                { key: 'Grains & Cereals', value: 'https://t4.ftcdn.net/jpg/02/44/16/79/360_F_244167973_E7aRgY9NHX9qW0QWOaZNwmG8NBJaa1rf.jpg' },
                { key: 'Pulses & Legumes', value: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
                { key: 'Spices & Herbs', value: 'https://media.istockphoto.com/id/1412875469/photo/herbs-and-spices.webp?s=2048x2048&w=is&k=20&c=YRunD3et5VG3SbJrXJJ9r-eo78BnY6OAl4eJdNkDM3Y=' },
                { key: 'Nuts & Seeds', value: 'https://media.istockphoto.com/id/2032503128/photo/nuts-mixed-in-wooden-bowl-with-spoon-on-blue-background-top-view.webp?s=2048x2048&w=is&k=20&c=i8sranJcrZOEK9yZsYXYRNyEhgqBbkT5-VR_97ObZnE=' },
                { key: 'Dairy & Animal Products', value: 'https://images.unsplash.com/photo-1683314573422-649a3c6ad784?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2hlZXNlfGVufDB8fDB8fHww' },
                { key: 'Fodder & Forage', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
                { key: 'Flowers & Ornamental Plants', value: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
                { key: 'Herbs & Medicinal Plants', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
                { key: 'Other', value: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  className={`flex flex-col items-center min-w-[90px] max-w-[110px] focus:outline-none transition-transform hover:-translate-y-1 group ${selectedCategory === cat.key ? 'ring-2 ring-orange-400' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                  tabIndex={0}
                  aria-label={cat.key}
                >
                  <div className="w-24 h-16 bg-gray-100 rounded-xl mb-1 flex items-center justify-center overflow-hidden">
                    <img src={cat.value} alt={cat.key} className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center truncate w-full group-hover:text-orange-600">{cat.key}</span>
                </button>
              ))}
            </div>
          </div>

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
      </div>
      <Footer />
    </div>
  );
};

export default MarketplaceAllProducts;
