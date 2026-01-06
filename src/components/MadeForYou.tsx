import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, Star, Plus, Zap, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';

type Product = any;
const API_URL = 'https://appmulyabazzar.com/api/v1/marketplace/made-for-you/';

const MadeForYou: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.results ?? data?.items ?? [];
        setItems(list.slice(0, 12)); // Fetch a dozen for a good grid
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleAction = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }
    await addToCart(product);
  };

  if (loading) return <MadeForYouGridSkeleton />;

  return (
    <section className="py-10 bg-[#fbfbfd]">
      <div className="container mx-auto px-4">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Made <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-violet-600">For You.</span>
            </h3>
          </motion.div>
          
          <button
            onClick={() => navigate('/marketplace/all-products')}
            className="group w-fit flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-full font-bold text-slate-700 hover:border-orange-600 hover:text-orange-600 transition-all shadow-sm"
          >
            Explore All
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[200px]">
          {items.map((p, index) => {
            // Logic to make specific items "Big" (Featured)
            // Item 0 is large, Item 5 is wide, etc.
            const isLarge = index === 0;
            const isWide = index === 5;
            
            return (
              <ProductCard 
                key={p.id || index} 
                product={p} 
                index={index}
                isLarge={isLarge}
                isWide={isWide}
                onAction={(e) => handleAction(e, p)}
                onNavigate={() => navigate(`/marketplace/${p.id}`)}
              />
            );
          })}
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => { setShowLoginModal(false); setPendingProduct(null); }}
          onSuccess={async () => {
            setShowLoginModal(false);
            if (pendingProduct) {
              await addToCart(pendingProduct);
              setPendingProduct(null);
            }
          }}
        />
      </div>
    </section>
  );
};

const ProductCard = ({ product, index, isLarge, isWide, onAction, onNavigate }: any) => {
  const image = product.product_details?.images?.[0]?.image ?? product.image ?? product.thumbnail ?? '';
  const name = product.product_details?.name ?? product.name ?? 'Premium Product';
  const price = product.discounted_price ?? product.listed_price ?? product.price;

  // Bento Span Classes
  const spanClass = isLarge 
    ? "md:col-span-2 md:row-span-2" 
    : isWide 
    ? "md:col-span-2 md:row-span-1" 
    : "col-span-1 row-span-1 md:row-span-2";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onClick={onNavigate}
      className={`${spanClass} group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 cursor-pointer`}
    >
      {/* Background Decor for Large Cards */}
      {isLarge && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />}

      {/* Product Image */}
      <div className={`relative w-full ${isWide ? 'h-full flex' : 'h-3/5'} items-center justify-center p-8`}>
        <img
          src={image || '/placeholder.png'}
          alt={name}
          className={`${isWide ? 'w-1/3' : 'w-full'} h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700`}
        />
      </div>

      {/* Floating Price Tag for Large Cards */}
      {isLarge && (
        <div className="absolute top-8 left-8 bg-orange-500 text-white px-4 py-2 rounded-2xl font-black text-lg shadow-xl">
           Rs. {Number(price || 0).toLocaleString()}
        </div>
      )}

      {/* Content Overlay/Section */}
      <div className={`${isWide ? 'w-2/3 flex flex-col justify-center' : 'absolute bottom-0 left-0 right-0'} p-8 bg-gradient-to-t from-white via-white/90 to-transparent`}>
        <div className="flex justify-between items-end">
          <div className="flex-1">
            <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-1">New Arrival</p>
            <h4 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors`}>
              {name}
            </h4>
            {!isLarge && (
                <span className="text-slate-900 font-black mt-1 block">
                    Rs. {Number(price || 0).toLocaleString()}
                </span>
            )}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAction}
            className="ml-4 text-white p-4 rounded-2xl hover:bg-orange-600 transition-all shadow-lg bg-orange-400"
          >
            <Plus size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const MadeForYouGridSkeleton = () => (
    <div className="container mx-auto px-4 py-20">
      <div className="h-12 w-64 bg-slate-100 rounded-2xl mb-12 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[200px]">
        <div className="md:col-span-2 md:row-span-2 bg-slate-50 rounded-[2.5rem] animate-pulse" />
        <div className="col-span-1 md:row-span-2 bg-slate-50 rounded-[2.5rem] animate-pulse" />
        <div className="col-span-1 md:row-span-2 bg-slate-50 rounded-[2.5rem] animate-pulse" />
      </div>
    </div>
);

export default MadeForYou;
