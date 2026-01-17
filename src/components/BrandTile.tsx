import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Star, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrandTile = ({ brand, img }: any) => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/brand-products/${brand.id}`)}
      className="relative group w-48 h-64 cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative h-full w-full bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group-hover:shadow-[0_20px_50px_rgba(251,146,60,0.15)] transition-all duration-500">
        
        <div className="absolute top-4 left-4 z-20">
          {brand.is_trending && (
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-black text-[9px] text-white font-black px-2 py-1 rounded-full uppercase tracking-tighter"
            >
              Trending
            </motion.div>
          )}
        </div>

        <div className="h-2/3 w-full flex items-center justify-center p-8 transition-transform duration-500 group-hover:scale-110" style={{ transform: "translateZ(50px)" }}>
           <img
              src={img || 'https://via.placeholder.com/150'}
              alt={brand.name}
              onLoad={() => setIsLoaded(true)}
              className={`max-w-full max-h-full object-contain filter drop-shadow-lg transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
           />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent">
          <h3 className="text-sm font-black text-slate-800 tracking-tight text-center truncate uppercase">
            {brand.name}
          </h3>
          <div className="flex justify-center items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="text-[10px] font-bold text-orange-500">View Atelier</span>
            <ArrowUpRight size={10} className="text-orange-500" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BrandTile;