import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid3X3, List, ShoppingCart, ChevronLeft, 
  SlidersHorizontal, Package, Zap, ShoppingBag, X
} from 'lucide-react';
import { fetchBrandById, fetchBrandProducts, type Brand, type BrandProduct } from '../api/brandsApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import Footer from './Footer';

const PLACEHOLDER = 'https://via.placeholder.com/600x600?text=Premium+Product';

const BrandProducts: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  // State Management
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Logic
  const fetchData = async () => {
    if (!brandId) return;
    try {
      setLoading(true);
      const [brandData, productData] = await Promise.all([
        fetchBrandById(parseInt(brandId)),
        // Fetching a larger batch (40) to make client-side search effective
        fetchBrandProducts(parseInt(brandId), 1, 40)
      ]);
      setBrand(brandData);
      setProducts(productData.results);
    } catch (err) {
      console.error("Failed to fetch brand data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.scrollTo(0, 0);
  }, [brandId]);

  // Client-Side Search Logic (Memoized for performance)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter((product) => 
      product.name.toLowerCase().includes(query) || 
      product.category_details?.toLowerCase().includes(query) ||
      product.marketplace_id?.toString().includes(query)
    );
  }, [searchQuery, products]);

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    await addToCart({ 
      ...product, 
      image: product.images?.[0]?.image || PLACEHOLDER 
    });
  };

  if (loading && !brand) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-orange-100">
      {/* Dynamic Hero Section */}
      <section className="relative h-[45vh] w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
           <img 
            src={brand?.logo_url} 
            className="w-full h-full object-cover blur-3xl scale-110" 
            alt="" 
           />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-slate-900/60 to-[#FDFDFD]" />
        
        <div className="relative container mx-auto px-6 h-full flex flex-col justify-center">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors group w-fit"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Marketplace</span>
          </motion.button>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 md:w-44 md:h-44 bg-white p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-white/20"
            >
              <img src={brand?.logo_url} alt={brand?.name} className="max-w-full max-h-full object-contain" />
            </motion.div>
            <div className="text-center md:text-left">
               <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2"
               >
                 {brand?.name}
               </motion.h1>
               <p className="text-white/60 max-w-xl text-lg font-medium leading-relaxed">
                 {brand?.description || "Curated excellence and exclusive brand releases."}
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY SEARCH BAR */}
      <nav className="sticky top-4 z-[100] container mx-auto px-6 mt-[-2rem]">
        <div className="bg-white/90 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2.5rem] p-3 md:p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${brand?.name}...`}
                className="w-full bg-slate-50 border-none rounded-full py-4 pl-14 pr-12 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium text-slate-700"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              )}
            </div>
            <button className="hidden md:flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/10">
              <SlidersHorizontal size={16} />
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-full transition-all ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-50 text-slate-400'}`}
            >
              <Grid3X3 size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-full transition-all ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-50 text-slate-400'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Product Feed */}
      <main className="container mx-auto px-6 py-20 min-h-[60vh]">
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10' 
                  : 'flex flex-col gap-6'
              }`}
            >
              {filteredProducts.map((product, idx) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  idx={idx} 
                  user={user}
                  viewMode={viewMode}
                  onAdd={(e: React.MouseEvent) => handleAddToCart(product, e)}
                  onNavigate={() => navigate(`/marketplace/${product.marketplace_id}`)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">No matches found</h3>
              <p className="text-slate-500 max-w-xs">
                We couldn't find anything matching "{searchQuery}" in this collection.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 text-orange-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Footer />
    </div>
  );
};

interface ProductCardProps {
  product: BrandProduct;
  idx: number;
  user: any;
  viewMode: 'grid' | 'list';
  onAdd: (e: React.MouseEvent) => void;
  onNavigate: () => void;
}

const ProductCard = ({ product, idx, user, viewMode, onAdd, onNavigate }: ProductCardProps) => {
  const isB2B = user?.b2b_verified && product.is_b2b_eligible;
  const currentPrice = isB2B ? (product.b2b_discounted_price || product.b2b_price) : product.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.05, 0.3) }}
      whileHover={{ y: -8 }}
      onClick={onNavigate}
      className={`group relative bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer ${
        viewMode === 'list' ? 'flex flex-col md:flex-row md:h-72' : ''
      }`}
    >
      {/* Image Container */}
      <div className={`${viewMode === 'list' ? 'md:w-80 h-64 md:h-full' : 'h-72'} bg-slate-50 overflow-hidden relative flex-shrink-0`}>
        <img 
          src={product.images?.[0]?.image || PLACEHOLDER} 
          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
          alt={product.name} 
        />
        {isB2B && (
          <div className="absolute top-6 left-6 bg-slate-900 text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-xl z-10">
             <Zap size={10} fill="currentColor" /> B2B Special
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-8 flex flex-col justify-between flex-1">
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              {product.category_details || "Exclusive"}
            </span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-rose-500 text-[10px] font-bold flex items-center gap-1">
                <Package size={12} /> {product.stock} left
              </span>
            )}
            {product.stock === 0 && (
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Out of Stock</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-8 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900">
              Rs. {Number(currentPrice).toLocaleString()}
            </span>
            {isB2B && (
              <span className="text-[10px] font-bold text-slate-400 line-through">
                Regular: Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAdd}
            disabled={product.stock === 0}
            className={`p-4 rounded-2xl transition-all shadow-lg active:shadow-inner ${
              product.stock === 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-orange-600 shadow-orange-900/10'
            }`}
          >
            <ShoppingCart size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <ShoppingBag size={24} className="text-orange-500 animate-pulse" />
      </div>
    </div>
    <p className="mt-6 font-black text-slate-800 uppercase tracking-[0.3em] text-xs">Loading Experience</p>
  </div>
);

export default BrandProducts;