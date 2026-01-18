import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';


const createSlug = (text: string) => 
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CATEGORIES = [
  { 
    id: 1,
    name: 'Ethnic Wear',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop',
    color: 'ring-emerald-500/20', 
    ids: { categoryId: 1, subcategoryId: 1, subSubcategoryId: 18 }
  },
  { 
    id: 3,
    name: 'Menswear',
    image: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=400&h=400&fit=crop',
    color: 'ring-blue-500/20',
    ids: { categoryId: 1, subcategoryId: 1, subSubcategoryId: 1 }
  },
  { 
    id: 5,
    name: 'Home Decor',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=400&fit=crop',
    color: 'ring-amber-500/20',
    ids: { categoryId: 5, subcategoryId: 17, subSubcategoryId: 10 }
  },
  { 
    id: 8,
    name: 'Laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    color: 'ring-violet-500/20',
    ids: { categoryId: 2, subcategoryId: 3, subSubcategoryId: 7 }
  },
];

const CategoryCard = ({ category, index }: { category: typeof CATEGORIES[0], index: number }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCategoryClick = async () => {
    const categorySlug = createSlug(category.name);
    setLoading(true);
    
    try {
      const { categoryId, subcategoryId, subSubcategoryId } = category.ids;
      const apiUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`;
      
      const response = await axios.get(apiUrl, {
        params: {
          category_id: categoryId,
          subcategory_id: subcategoryId,
          sub_subcategory_id: subSubcategoryId
        }
      });
      
      navigate(`/marketplace/categories/${categorySlug}`, {
        state: { 
          products: response.data.results || response.data,
          ...category.ids
        }
      });
    } catch (error) {
      console.error("Navigation error:", error);
      navigate(`/marketplace/categories/${categorySlug}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      onClick={handleCategoryClick}
      className="group flex flex-col items-center gap-5 min-w-[140px] cursor-pointer snap-center relative"
    >
      <div className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full p-1.5 transition-all duration-500 
        ring-4 ${category.color} group-hover:ring-orange-500 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] group-active:scale-95`}>
        
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center z-20 border border-white/50"
            >
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-full rounded-full overflow-hidden shadow-2xl bg-slate-100">
          <motion.img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      </div>

      <div className="flex flex-col items-center text-center space-y-1">
        <span className="text-[10px] font-black text-orange-500/0 group-hover:text-orange-500 transition-all uppercase tracking-[0.3em] transform translate-y-2 group-hover:translate-y-0 duration-300">
          Explore
        </span>
        <h3 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
          {category.name}
        </h3>
        <div className="w-0 h-0.5 bg-orange-500 group-hover:w-12 transition-all duration-300 rounded-full" />
      </div>
    </motion.div>
  );
};

const CategoryCarousel = () => {
  return (
    <section className="w-full py-2 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-6">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-orange-600 tracking-tight md:text-5xl">
              Shop by Category
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-lg leading-relaxed">
              Discover curated collections across fashion, tech, and lifestyle.
            </p>
          </div>
        </div>

        <div className="relative group/carousel">
          <div className="flex gap-5 md:gap-10 overflow-x-auto py-4 px-2 scrollbar-hide snap-x no-scrollbar">
            {CATEGORIES.map((category, index) => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                index={index} 
              />
            ))}
          </div>
          
          <div className="absolute top-0 left-[-10px] h-full w-24 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-[-10px] h-full w-24 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default CategoryCarousel;
