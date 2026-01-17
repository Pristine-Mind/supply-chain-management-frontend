import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import BrandTile from './BrandTile';
import CosmeticImg from '../assets/costemtic.jpeg';

const BrandsSection: React.FC = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://appmulyabazzar.com/api/v1/brands/?category_id=4')
      .then(res => res.json())
      .then(data => {
        const items = Array.isArray(data) ? data : data.results || [];
        setBrands(items);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center">...</div>;

  return (
    <section className="w-full py-6 bg-[#FAFAFA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-center md:text-left"
          >
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              Beauty <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">Ateliers.</span>
            </h2>
          </motion.div>

          <p className="max-w-xs text-slate-400 text-sm font-medium leading-relaxed">
            Curated selection of the world's most prestigious beauty houses, delivered to your doorstep.
          </p>
        </div>
      </div>

      <div className="relative flex flex-col gap-12">
        <div className="flex overflow-hidden group">
          <motion.div 
            animate={{ x: [0, -1920] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-8 px-4 whitespace-nowrap"
          >
            {[...brands, ...brands].map((b, i) => (
              <BrandTile key={i} brand={b} img={b.logo_url || b.logo} />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-32">
        <motion.div 
          whileHover={{ scale: 0.99 }}
          className="relative bg-orange-900 h-[450px] rounded-[3rem] overflow-hidden flex items-center shadow-2xl"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none">
            <h1 className="text-[20rem] font-black text-white italic">GLAM</h1>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 w-full p-12 items-center">
            <div className="space-y-8">
              <h3 className="text-white text-5xl font-black tracking-tighter leading-tight">
                Beyond <br /> Skincare.
              </h3>
              <p className="text-slate-400 text-lg max-w-sm">
                Unlock exclusive access to limited edition releases and boutique-only collections.
              </p>
              <button className="bg-white text-black px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-500 flex items-center gap-3">
                Discover More <ArrowRight size={16} />
              </button>
            </div>

            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:flex justify-center"
            >
              <div className="w-80 h-96 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-4 rotate-6 group">
                <img 
                   src={CosmeticImg}
                   className="w-full h-full object-cover rounded-xl"
                   alt="Beauty"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandsSection;
