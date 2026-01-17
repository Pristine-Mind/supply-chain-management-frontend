import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid3X3, List, ShoppingCart, ChevronLeft, 
  ArrowRight, SlidersHorizontal, Package, Info, Zap
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  const fetchData = async () => {
    if (!brandId) return;
    try {
      setLoading(true);
      const [brandData, productData] = await Promise.all([
        fetchBrandById(parseInt(brandId)),
        fetchBrandProducts(parseInt(brandId), 1, 40)
      ]);
      setBrand(brandData);
      setProducts(productData.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [brandId]);

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }
    await addToCart({ ...product, image: product.images?.[0]?.image });
  };

  if (loading && !brand) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-orange-100">
      <section className="relative h-[45vh] w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
           <img src={brand?.logo_url} className="w-full h-full object-cover blur-3xl scale-110" alt="" />
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
            <span className="text-sm font-bold uppercase tracking-widest">Return to Market</span>
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
                 {brand?.description || "Experience the pinnacle of curated craftsmanship and exclusive releases."}
               </p>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-6 z-50 container mx-auto px-6 mt-[-2rem]">
        <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search collection..."
                className="w-full bg-slate-50 border-none rounded-full py-3 pl-12 pr-6 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
              />
            </div>
            <button className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/10">
              <SlidersHorizontal size={16} />
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
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

      <main className="container mx-auto px-6 py-16">
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10' : 'flex flex-col gap-6'}`}>
          <AnimatePresence>
            {products.map((product, idx) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                idx={idx} 
                user={user}
                viewMode={viewMode}
                onAdd={(e) => handleAddToCart(product, e)}
                onNavigate={() => navigate(`/marketplace/${product.marketplace_id}`)}
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Footer />
    </div>
  );
};

const ProductCard = ({ product, idx, user, viewMode, onAdd, onNavigate }: any) => {
  const isB2B = user?.b2b_verified && product.is_b2b_eligible;
  const currentPrice = isB2B ? (product.b2b_discounted_price || product.b2b_price) : product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -10 }}
      onClick={onNavigate}
      className={`group relative bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer ${viewMode === 'list' ? 'flex h-64' : ''}`}
    >
      <div className={`${viewMode === 'list' ? 'w-80' : 'h-72'} bg-slate-50 overflow-hidden relative`}>
        <img 
          src={product.images?.[0]?.image || PLACEHOLDER} 
          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
          alt="" 
        />
        {isB2B && (
          <div className="absolute top-6 left-6 bg-slate-900 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
             <Zap size={10} fill="currentColor" /> B2B Verified
          </div>
        )}
      </div>

      <div className="p-8 flex flex-col justify-between flex-1">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              {product.category_details}
            </span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-rose-500 text-[10px] font-bold flex items-center gap-1">
                <Package size={12} /> Only {product.stock} Left
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900">
              Rs. {Number(currentPrice).toLocaleString()}
            </span>
            {isB2B && (
              <span className="text-[10px] font-bold text-slate-400 line-through">
                Reg. Rs. {product.price.toLocaleString()}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAdd}
            disabled={product.stock === 0}
            className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-orange-600 transition-all shadow-lg active:shadow-inner"
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
    <div className="w-20 h-20 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
    <p className="mt-6 font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Launching Collection</p>
  </div>
);

export default BrandProducts;