import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, Zap, Sparkles, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';

const PLACEHOLDER = 'https://via.placeholder.com/600';

const FeaturedProducts: React.FC<{ products?: any[] }> = ({ products: initialProducts }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<any[] | null>(initialProducts ?? null);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any | null>(null);

  useEffect(() => {
    if (initialProducts) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/featured/`;
        const { data } = await axios.get(url);
        setProducts(data.results || data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [initialProducts]);

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }
    await addToCart(product);
  };

  if (loading) return <FeaturedSkeleton />;
  if (!products || products.length === 0) return null;

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-orange-50 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[-5%] w-[30%] h-[30%] rounded-full bg-orange-50/50 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1px] w-12 bg-orange-600" />
              <span className="text-orange-600 font-bold text-xs tracking-[0.3em] uppercase">The Collection</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold text-orange-900 tracking-tighter">
              Featured <br /> <span className="text-orange-400">Essentials.</span>
            </h2>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/marketplace/all-products')}
            className="group flex items-center gap-4 bg-orange-900 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-orange-600 transition-all duration-500"
          >
            View All Series
            <div className="bg-white/20 p-1 rounded-full group-hover:rotate-45 transition-transform duration-500">
              <ArrowUpRight size={18} />
            </div>
          </motion.button>
        </div>

        {/* Editorial Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.slice(0, 8).map((item, index) => (
            <ProductItem 
              key={item.id} 
              item={item} 
              index={index} 
              user={user}
              onAdd={handleAddToCart}
              onNavigate={() => navigate(`/marketplace/${item.id}`)}
            />
          ))}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={async () => {
          setShowLoginModal(false);
          if (pendingProduct) await addToCart(pendingProduct);
        }}
      />
    </section>
  );
};

const ProductItem = ({ item, index, user, onAdd, onNavigate }: any) => {
  const isB2BVerified = user?.b2b_verified && item.is_b2b_eligible;
  const displayPrice = isB2BVerified ? item.b2b_price : (item.discounted_price || item.listed_price);
  const image = item.product_details?.images?.[0]?.image ?? PLACEHOLDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group cursor-pointer"
      onClick={onNavigate}
    >
      {/* Editorial Image Container */}
      <div className="relative mb-6">
        <div className="aspect-[3/4] rounded-[2.5rem] bg-orange-100 overflow-hidden relative">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            src={image}
            alt={item.product_details?.name}
            className="w-full h-full object-cover mix-blend-multiply transition-all duration-700"
          />
          
          {/* Subtle Tags */}
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            {isB2BVerified && (
              <span className="bg-orange-900 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full tracking-widest border border-amber-900/20 uppercase shadow-lg">
                Pro Member
              </span>
            )}
            {item.percent_off > 0 && (
               <span className="bg-white text-rose-600 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase shadow-sm">
                -{Math.round(item.percent_off)}%
              </span>
            )}
          </div>

          {/* Minimalist Action Bar */}
          <div className="absolute bottom-6 left-1/2 -tranorange-x-1/2 flex items-center gap-2 opacity-0 tranorange-y-4 group-hover:opacity-100 group-hover:tranorange-y-0 transition-all duration-500 delay-100">
             <button 
                onClick={(e) => onAdd(item, e)}
                className="bg-white/90 backdrop-blur-xl text-orange-900 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:bg-orange-600 hover:text-white transition-colors"
             >
               <ShoppingBag size={16} />
               Collect
             </button>
          </div>
        </div>

        {/* The "Shadow Layer" - Visual Flair */}
        <div className="absolute -z-10 inset-0 tranorange-x-3 tranorange-y-3 rounded-[2.5rem] bg-orange-50 border border-orange-100 group-hover:tranorange-x-0 group-hover:tranorange-y-0 transition-transform duration-500" />
      </div>

      {/* Modern Typography Section */}
      <div className="px-2">
        <div className="flex justify-between items-start gap-4 mb-2">
            <div>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] mb-1">
                    {item.product_details?.category_details || "Uncategorized"}
                </p>
                <h3 className="text-xl font-bold text-orange-800 leading-tight line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {item.product_details?.name}
                </h3>
            </div>
            <div className="text-right">
                <span className="text-xl font-black text-orange-900">
                    Rs.{Number(displayPrice).toLocaleString()}
                </span>
                {item.listed_price > displayPrice && (
                    <span className="block text-[10px] text-orange-400 line-through">
                         Rs.{item.listed_price.toLocaleString()}
                    </span>
                )}
            </div>
        </div>
        
        {/* Availability / Pulse */}
        <div className="flex items-center gap-2">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
           </span>
           <span className="text-[11px] font-medium text-orange-500 uppercase tracking-wider">In Stock & Ready</span>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedSkeleton = () => (
    <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="h-16 w-1/3 bg-orange-50 rounded-2xl mb-16 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => (
                <div key={i} className="space-y-4">
                    <div className="aspect-[3/4] bg-orange-50 rounded-[2.5rem] animate-pulse" />
                    <div className="h-4 w-1/2 bg-orange-50 rounded animate-pulse" />
                    <div className="h-6 w-3/4 bg-orange-50 rounded animate-pulse" />
                </div>
            ))}
        </div>
    </div>
);

export default FeaturedProducts;
