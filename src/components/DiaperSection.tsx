import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, ShieldCheck, Star, 
  ArrowRight, Zap 
} from 'lucide-react';

import BabyProductImg from '../assets/baby-diaper.png';

interface Product {
  id: number;
  name: string;
  image: string;
  price: string;
  rating: number;
  reviews: number;
}

const DiaperSection: React.FC = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNavigate = () => navigate('/marketplace/categories/pet-baby-care');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#fcfcfd] py-16 space-y-24 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group cursor-pointer"
          onClick={handleNavigate}
        >
          <div className="relative z-10 bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl shadow-blue-900/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              
              <div className="lg:col-span-7 p-10 md:p-20 space-y-8">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-orange-600 rounded-full w-fit">
                  <Star size={16} fill="currentColor" />
                  <span className="text-xs font-orange uppercase tracking-[0.2em]">Premium Baby Care</span>
                </div>
                
                <h2 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
                  Cloud-Like <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-900 to-orange-500">
                    Comfort.
                  </span>
                </h2>
                
                <p className="text-xl text-slate-500 max-w-md leading-relaxed font-medium">
                  Ultra-absorbent protection designed for your baby's delicate skin. Happy baby, peaceful sleep.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-5 py-2.5 rounded-2xl">
                    <ShieldCheck className="text-green-500" size={20} /> Safety Tested
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-5 py-2.5 rounded-2xl">
                    <Heart className="text-pink-500" size={20} /> Soft Cotton
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="flex items-center gap-4 bg-orange-600 text-white px-10 py-5 rounded-3xl font-orange-600 text-lg shadow-xl shadow-slate-900/20"
                >
                  Shop Now <ArrowRight size={22} />
                </motion.button>
              </div>

              <div className="lg:col-span-5 relative h-full min-h-[450px] flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-orange-50/50 lg:rounded-l-[5rem]">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 w-4/5 flex justify-center"
                >
                  <img 
                    src={BabyProductImg} 
                    alt="Premium Diapers" 
                    className="w-full max-w-md drop-shadow-[0_45px_45px_rgba(59,130,246,0.25)]" 
                  />
                  <div className="absolute -top-6 -right-6 bg-orange-500 text-white p-5 rounded-[2rem] shadow-2xl rotate-12 flex flex-col items-center">
                    <Zap size={20} fill="currentColor" />
                    <span className="text-2xl font-black leading-none">20%</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Off</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-[3.2rem] blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700" />
        </motion.div>
      </div>
    </div>
  );
};

export default DiaperSection;
