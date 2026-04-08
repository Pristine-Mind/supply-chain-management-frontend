import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingCart, Menu, Mic, Filter, X, Grid3X3, List } from 'lucide-react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createSafeRecognitionInstance } from '../utils/voiceSearchBrowserPolyfill';
import { newYearSaleApi } from '../api/newYearSaleApi';

import LoginModal from './auth/LoginModal';
import CommandPalette from './CommandPalette';
import NayaBarshaBanner from './NayaBarshaBanner';
import ProductCard from './ProductCard';
import Footer from './Footer';
import LazySection from './ui/LazySection';

import logo from '../assets/logo.png';

interface NewYearSaleData {
  id: number;
  name: string;
  discount_percentage: number;
}

/* ====================== HELPERS ====================== */
const getProductImages = (product: any): any[] => {
  if (product.images?.length) return product.images;
  if (product.product_details?.product_details?.images) return product.product_details.product_details.images;
  if (product.product_details?.images) return product.product_details.images;
  return [];
};

const flattenProductData = (product: any) => {
  const images = getProductImages(product);
  const details = product.product_details?.product_details || product.product_details || product;

  const hasDiscount = product.discounted_price !== undefined || product.original_price !== undefined;

  const price = hasDiscount 
    ? (product.discounted_price || product.original_price || 0)
    : (product.price || details.price || 0);

  const originalPrice = hasDiscount 
    ? (product.original_price || product.discounted_price || 0)
    : (product.price || details.price || 0);

  return {
    ...product,
    images,
    name: product.name || details.name || '',
    price,
    listed_price: originalPrice,
    discounted_price: product.discounted_price || price,
    original_price: originalPrice,
    discount_percentage: product.discount_percentage || 0,
  };
};

/* ====================== MAIN COMPONENT ====================== */
export default function NewYearSale() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [sales, setSales] = useState<NewYearSaleData[]>([]);
  const [selectedSale, setSelectedSale] = useState<NewYearSaleData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [minDiscount, setMinDiscount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [saleStatus, setSaleStatus] = useState('');

  const recognitionRef = useRef<any>(null);

  /* ====================== DATA FETCHING ====================== */
  useEffect(() => {
    fetchNewYearSales();
  }, [debouncedQuery, minDiscount, maxDiscount, saleStatus]);

  useEffect(() => {
    if (selectedSale) fetchSaleProducts();
  }, [selectedSale, viewMode, debouncedQuery, minDiscount, maxDiscount, saleStatus]);

  const fetchNewYearSales = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedQuery.trim()) params.search = debouncedQuery.trim();
      if (minDiscount) params.discount_min = minDiscount;
      if (maxDiscount) params.discount_max = maxDiscount;
      if (saleStatus) params.status = saleStatus;

      const data = await newYearSaleApi.getSales(params);
      const salesList = Array.isArray(data) ? data : data.results || [];

      setSales(salesList);
      if (salesList.length > 0 && !selectedSale) setSelectedSale(salesList[0]);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleProducts = async () => {
    if (!selectedSale) return;
    setLoading(true);
    try {
      const rawData = await newYearSaleApi.getDiscountedProducts(selectedSale.id);
      let flattened = Array.isArray(rawData) ? rawData.map(flattenProductData) : [];

      if (minDiscount || maxDiscount) {
        const min = minDiscount ? parseFloat(minDiscount) : 0;
        const max = maxDiscount ? parseFloat(maxDiscount) : 100;
        flattened = flattened.filter(product => {
          const discount = product.discount_percentage || 0;
          return discount >= min && discount <= max;
        });
      }

      if (debouncedQuery.trim()) {
        const searchTerm = debouncedQuery.toLowerCase().trim();
        flattened = flattened.filter(product => {
          const name = (product.name || '').toLowerCase();
          const description = (product.description || '').toLowerCase();
          return name.includes(searchTerm) || description.includes(searchTerm);
        });
      }

      setProducts(flattened);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  /* ====================== HANDLERS ====================== */
  const startVoiceSearch = () => {
    const result = createSafeRecognitionInstance();
    if (!result || result.error) {
      alert("Voice search is not supported in your browser.");
      return;
    }
    const recognition = result.recognition || result;
    setIsListening(true);

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setQuery(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const clearFilters = () => {
    setMinDiscount('');
    setMaxDiscount('');
    setSaleStatus('');
    setQuery('');
  };

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }

    const cartProduct = {
      ...product,
      price: product.discounted_price || product.price,
      listed_price: product.original_price || product.listed_price,
    };

    await addToCart(cartProduct);
  };

  /* ====================== RENDER ====================== */
  return (
    <div className="min-h-screen bg-white">
      <CommandPalette />

      {/* Login Modal */}
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
              await addToCart(pendingProduct);
              setPendingProduct(null);
            }
          }}
        />
      )}

      {/* Modern Navbar */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="Logo" className="h-14 w-auto" />
            <div>
              <span className="text-2xl font-bold text-neutral-900 tracking-tight">Naya Barsha</span>
              <p className="text-xs text-amber-600 -mt-1">2083 Sale</p>
            </div>
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-12">
            <div className="relative w-full">
              <div className="flex items-center bg-neutral-100 border border-neutral-300 rounded-3xl px-6 py-3.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all">
                <MagnifyingGlassIcon className="w-5 h-5 text-neutral-500 mr-3" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Naya Barsha deals..."
                  className="bg-transparent flex-1 outline-none text-sm placeholder:text-neutral-500"
                />
                <button
                  onClick={startVoiceSearch}
                  className={`ml-2 p-2.5 rounded-2xl transition-all ${
                    isListening ? 'text-red-500 animate-pulse' : 'hover:bg-neutral-200 text-neutral-500'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <button className="p-3 hover:bg-neutral-100 rounded-2xl transition-colors">
                <User className="w-6 h-6 text-neutral-700" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-neutral-700 hover:text-amber-600 transition-colors"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => navigate('/cart')}
              className="relative p-3 hover:bg-neutral-100 rounded-2xl transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-neutral-700" />
            </button>

            <button className="md:hidden p-3 text-neutral-700">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Festive White Theme */}
      <div className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 py-24 overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-amber-200 px-6 py-2.5 rounded-full mb-6">
            <span className="text-2xl">🎊</span>
            <span className="uppercase tracking-widest text-sm font-semibold text-amber-700">Naya Barsha 2083</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-neutral-900 leading-none tracking-tighter mb-6">
            Grand New Year <span className="text-amber-600">Sale</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-neutral-600 mb-10">
            Celebrate with unbeatable discounts. Up to <span className="font-semibold text-amber-600">40% OFF</span> on selected items.
          </p>

          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-12 py-4 rounded-3xl text-lg transition-all active:scale-95 shadow-lg shadow-amber-200"
          >
            Explore Deals Now
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 text-[120px] opacity-10">🪔</div>
        <div className="absolute bottom-10 left-10 text-[100px] opacity-10 rotate-12">🌸</div>
      </div>

      {/* Main Content */}
      <div id="products" className="container mx-auto px-6 py-16">
        {/* Sale Tabs */}
        {sales.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-10 hide-scrollbar">
            {sales.map((sale) => (
              <button
                key={sale.id}
                onClick={() => setSelectedSale(sale)}
                className={`px-8 py-4 rounded-3xl font-medium whitespace-nowrap transition-all flex-shrink-0 text-lg ${
                  selectedSale?.id === sale.id
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                {sale.name}
                {sale.discount_percentage > 0 && (
                  <span className="ml-2 text-sm">({sale.discount_percentage}% off)</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 sticky top-24 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-semibold text-neutral-900">Filters</h3>
                {(minDiscount || maxDiscount || saleStatus) && (
                  <button
                    onClick={clearFilters}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>

              {/* Discount Range */}
              <div className="mb-10">
                <h4 className="font-semibold text-neutral-700 mb-4">Discount Range (%)</h4>
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(e.target.value)}
                    className="w-full px-5 py-4 border border-neutral-300 rounded-2xl focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full px-5 py-4 border border-neutral-300 rounded-2xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-10">
              <p className="text-neutral-600">
                {products.length} products • {selectedSale?.name || 'All Sales'}
              </p>

              <div className="flex gap-2 bg-neutral-100 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-white/60'}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-white/60'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-28">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-600 border-t-transparent"></div>
                <p className="mt-6 text-neutral-600">Finding the best deals for you...</p>
              </div>
            )}

            {/* Product Grid */}
            <div className={`grid gap-8 ${viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
              : 'grid-cols-1'}`}>
              {products.map((product) => (
                <ProductCard
                  key={product.product_details.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <div className="text-center py-28">
                <div className="text-7xl mb-6">🪔</div>
                <h3 className="text-2xl font-medium text-neutral-700 mb-3">No products found</h3>
                <p className="text-neutral-500 mb-8">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="px-10 py-3.5 bg-amber-600 text-white rounded-3xl hover:bg-amber-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
