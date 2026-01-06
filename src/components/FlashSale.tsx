import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&q=80';

const FlashSale: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const base = import.meta.env.VITE_REACT_APP_API_URL || 'https://appmulyabazzar.com';
        const { data } = await axios.get(`${base}/api/v1/marketplace-trending/most_viewed/`);
        setProducts(data.results || data || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="bg-[#ffffff] min-h-screen text-white pb-20">
      <section className="relative pt-12 pb-8 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <Zap size={12} fill="currentColor" />
            Limited velocity
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase italic text-slate-900">
            Flash <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-600">Sale</span>
          </h2>
        </div>
      </section>

      <main className="container mx-auto px-4">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {products.map((item, idx) => (
                <FlashCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  onAdd={() => addToCart(item)}
                  onNavigate={() => navigate(`/marketplace/${item.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

const FlashCard = ({ item, idx, onAdd, onNavigate }: any) => {
  const stockPercent = Math.floor(Math.random() * 30) + 5;
  const imageUrl = item.product_details?.images?.[0]?.image || PLACEHOLDER;
  const name = item.product_details?.name || 'Untitled';
  const price = item.discounted_price || item.listed_price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="group relative bg-orange-200 border border-white/5 rounded-2xl p-3 transition-all hover:border-orange-500/30"
    >
      {/* Mini Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-orange-600 text-[8px] font-black text-white px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
          <TrendingUp size={8} /> Hot
        </div>
      </div>

      <div 
        onClick={onNavigate} 
        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black mb-3 cursor-pointer"
      >
        <img src={imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-[8px] font-bold text-orange-500 uppercase tracking-widest block mb-0.5">
            {item.product_details?.category_details || 'Premium'}
          </span>
          <h3 className="text-xs font-bold line-clamp-1 group-hover:text-orange-400 transition-colors">
            {name}
          </h3>
        </div>

        {/* Compressed Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-bold uppercase text-slate-500">
            <span>Stock</span>
            <span className="text-orange-500">{stockPercent}% left</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stockPercent}%` }}
              className="h-full bg-gradient-to-r from-orange-600 to-rose-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {item.discounted_price && (
              <span className="text-[9px] text-slate-500 line-through">Rs. {item.listed_price}</span>
            )}
            <span className="text-sm font-black text-white">Rs. {price.toLocaleString()}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="bg-white text-black p-2 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-md"
          >
            <ShoppingBag size={14} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default FlashSale;
