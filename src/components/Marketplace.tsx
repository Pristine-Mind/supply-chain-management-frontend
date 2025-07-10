import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import prom from '../assets/promo.png';
import logo from '../assets/logo.png';
import Footer from './Footer';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
}

interface MarketplaceProduct {
  id: number;
  product: Product;
  listed_price: string;
  listed_date: string;
  is_available: boolean;
  bid_end_date: string | null;
  product_details: Product
}

const CATEGORY_OPTIONS = [
  { code: 'All', label: 'All' },
  { code: 'FR', label: 'Fruits' },
  { code: 'VG', label: 'Vegetables' },
  { code: 'GR', label: 'Grains & Cereals' },
  { code: 'PL', label: 'Pulses & Legumes' },
  { code: 'SP', label: 'Spices & Herbs' },
  { code: 'NT', label: 'Nuts & Seeds' },
  { code: 'DF', label: 'Dairy & Animal Products' },
  { code: 'FM', label: 'Fodder & Forage' },
  { code: 'FL', label: 'Flowers & Ornamental Plants' },
  { code: 'HR', label: 'Herbs & Medicinal Plants' },
  { code: 'OT', label: 'Other' },
];

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
];

const PROFILE_TYPE_OPTIONS = ['All', 'Retailer', 'Distributor'];

const Marketplace: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedProfileType, setSelectedProfileType] = useState('All');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const PROFILE_TYPE_OPTIONS = ['All', 'Retailer', 'Distributor'];
  const fetchMarketplaceProducts = async (search = '', category = 'All', location = 'All', business_type = 'All') => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      if (location && location !== 'All') params.location = location;
      if (business_type && business_type !== 'All') params.business_type = business_type;
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          params,
        }
      );
      setProducts(response.data.results);
      setRecommendations(response.data.results);
      setNewArrivals(response.data.results.slice(0, 5));
      setCategories([
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
      ]);
    } catch (err: any) {
      setError('Error fetching marketplace products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceProducts(query, selectedCategory, selectedLocation, selectedProfileType);
    // eslint-disable-next-line
  }, [query, selectedCategory, selectedLocation, selectedProfileType]);

  const filteredRecommendations = recommendations;

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-[220px]">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-extrabold text-2xl text-orange-600 whitespace-nowrap">MulyaBazzar</span>
          </div>
          <div className="flex-1 max-w-xl mx-4 relative">
            <input
              type="text"
              className="w-full rounded-lg border px-4 py-2 bg-gray-100 focus:outline-none"
              placeholder="Search products"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length >= 3);
              }}
            />
            {showSuggestions && filteredRecommendations.length > 0 && (
              <div className="absolute left-0 right-0 bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto mt-1 z-20">
                {filteredRecommendations.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/marketplace/${p.id}`);
                    }}
                  >
                    {p.product_details?.images?.length > 0 ? (
                      <img src={p.product_details.images[0].image} alt="" className="w-9 h-9 rounded mr-2 object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-gray-200 rounded mr-2" />
                    )}
                    <div>
                      <div className="font-semibold text-sm">{p.product_details?.name}</div>
                      <div className="text-xs text-gray-500">Rs.{p.listed_price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 min-w-[450px]">
            <div>
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
            </div>
            <div>
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
            </div>
            <div>
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
          </div>
        </div>
        <div className="w-full bg-white border-b border-gray-100 py-3">
          <div className="container mx-auto px-4">
            <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  className={`flex flex-col items-center min-w-[90px] max-w-[110px] focus:outline-none transition-transform hover:-translate-y-1 group ${selectedCategory === cat.key ? 'ring-2 ring-orange-400' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                  tabIndex={0}
                  aria-label={cat.key}
                >
                  <img
                    src={cat.value}
                    alt={cat.key}
                    className="w-16 h-16 object-cover rounded-xl mb-1 border border-gray-200 shadow group-hover:shadow-lg transition-shadow"
                  />
                  <span className="text-xs font-semibold text-gray-700 text-center truncate w-full group-hover:text-orange-600">{cat.key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <img src={prom} alt="Promo" className="w-full h-64 object-cover rounded-lg" />
        </div>
        {newArrivals.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-3xl mb-2">Trending Deals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {newArrivals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-200 p-4 cursor-pointer flex flex-col items-center group hover:-translate-y-1"
                  onClick={() => navigate(`/marketplace/${deal.id}`)}
                >
                  {deal.product_details?.images?.length > 0 ? (
                    <img src={deal.product_details.images[0].image} alt="" className="w-full h-28 object-cover rounded-xl mb-2 group-hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <div className="w-full h-28 bg-gray-200 rounded-xl mb-2" />
                  )}
                  <div className="font-semibold text-base mt-1 mb-1 text-center truncate w-full">{deal.product_details?.name}</div>
                  <div className="text-xs text-green-700 font-bold mb-1">Rs.{deal.listed_price}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-8">
          <img src="https://media.istockphoto.com/id/2216591236/video/big-sale-40-discount-banner-with-shopping-bags-on-blue-background.jpg?s=640x640&k=20&c=So2NjCiE1b2uw0fqcaMpU7qHxl6nJE4zS_3HLWtXLBc=" alt="Big Sale" className="w-full h-64 object-cover rounded-lg" />
        </div>
        <div className="mb-8">
          <h2 className="font-bold text-3xl mb-2">Recommended for you</h2>
          {filteredRecommendations.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No products found for your search.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredRecommendations.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-200 p-4 cursor-pointer flex flex-col items-center group hover:-translate-y-1"
                  onClick={() => navigate(`/marketplace/${item.id}`)}
                >
                  {item.product_details?.images?.length > 0 ? (
                    <img src={item.product_details.images[0].image} alt="" className="w-full h-28 object-cover rounded-xl mb-2 group-hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <div className="w-full h-28 bg-gray-200 rounded-xl mb-2" />
                  )}
                  <div className="font-semibold text-base mt-1 mb-1 text-center truncate w-full">{item.product_details?.name}</div>
                  <div className="text-xs text-green-700 font-bold mb-1">Rs.{item.listed_price}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold shadow"
            onClick={() => navigate('/marketplace/all-products')}
          >
            View More
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Marketplace;
