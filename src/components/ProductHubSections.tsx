import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShoppingBag, RotateCcw, ChevronRight, Zap } from 'lucide-react';
import Banner from '../assets/background.jpg';

const ProductHubSections: React.FC = () => {
  const navigate = useNavigate();
  const [bulkProducts, setBulkProducts] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://appmulyabazzar.com/api/v1/marketplace/');
        const data = await response.json();
        const items = data.results || data || [];
        setBulkProducts(items.slice(0, 3));
        setPopularProducts(items.slice(3, 6));
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  if (loading) return (
    <div className="w-full py-24 flex items-center justify-center bg-slate-900">
      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="relative py-20 overflow-hidden bg-slate-950">
      <div 
        className="absolute inset-0 bg-cover bg-fixed bg-center opacity-40"
        style={{ backgroundImage: `url(${Banner})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">          
          <HubSection 
            title="Bulk Saver"
            subtitle="Wholesale prices for everyone"
            bgText="BULK"
            icon={<Zap className="text-orange-500" fill="currentColor" />}
            products={bulkProducts}
            accentColor="from-orange-500 to-rose-500"
            onNavigate={(id) => navigate(`/marketplace/${id}`)}
          />

          <HubSection 
            title="Buy Again"
            subtitle="Restock your essentials"
            bgText="FAVES"
            icon={<RotateCcw className="text-blue-400" />}
            products={popularProducts}
            accentColor="from-blue-500 to-indigo-600"
            onNavigate={(id) => navigate(`/marketplace/${id}`)}
          />

        </div>
      </div>
    </div>
  );
};

const HubSection = ({ title, subtitle, bgText, icon, products, accentColor, onNavigate }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="relative group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all duration-500"
  >
    <div className="absolute top-0 right-10 text-8xl font-black text-white/[0.03] select-none pointer-events-none">
      {bgText}
    </div>

    <div className="relative z-10 flex items-center justify-between mb-10">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${accentColor} shadow-lg`}>
          {React.cloneElement(icon, { size: 24, className: "text-white" })}
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{title}</h2>
          <p className="text-slate-400 text-sm font-medium">{subtitle}</p>
        </div>
      </div>
      <button className="p-2 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all">
        <ChevronRight size={20} />
      </button>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {products.map((p: any) => (
        <div 
          key={p.id}
          onClick={() => onNavigate(p.id)}
          className="group/card cursor-pointer"
        >
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 mb-3 border border-white/5 group-hover/card:border-white/20 transition-all">
            <img 
              src={p.product_details?.images?.[0]?.image} 
              className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 right-2 p-1.5 bg-white rounded-lg scale-0 group-hover/card:scale-100 transition-transform">
              <ShoppingBag size={14} className="text-black" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-white line-clamp-1 mb-1">{p.product_details?.name}</p>
          <p className="text-xs font-black text-orange-500">Rs. {p.listed_price}</p>
        </div>
      ))}
    </div>
  </motion.div>
);

export default ProductHubSections;
