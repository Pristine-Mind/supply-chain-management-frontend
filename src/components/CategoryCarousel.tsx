import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createSlug } from '../utils/slugUtils';
import axios from 'axios';

const CATEGORIES = [
  { 
    id: 1,
    name: 'Ethnic Wear',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&h=300&fit=crop',
    color: 'bg-emerald-50', 
    categoryId: 1,
    subcategoryId: 1,
    subSubcategoryId: 18
  },
  { 
    id: 3,
    name: 'Menswear',
    image: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=300&h=300&fit=crop',
    color: 'bg-blue-50',
    categoryId: 1,
    subcategoryId: 1,
    subSubcategoryId: 1
  },
  { 
    id: 5,
    name: 'Home Decor',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&h=300&fit=crop',
    color: 'bg-amber-50',
    categoryId: 5,
    subcategoryId: 17,
    subSubcategoryId: 10
  },
  { 
    id: 8,
    name: 'Laptop',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop',
    color: 'bg-violet-50',
    categoryId: 2,
    subcategoryId: 3,
    subSubcategoryId: 7
  },
];

const CategoryCard = ({ category, index }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCategoryClick = async () => {
    const categorySlug = createSlug(category.name);
    setLoading(true);
    
    try {
      const apiUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/?category_id=${category.categoryId}&subcategory_id=${category.subcategoryId}&sub_subcategory_id=${category.subSubcategoryId}`;
      const response = await axios.get(apiUrl);
      
      console.log(`📦 [CategoryCarousel] Fetched ${category.name} products:`, response.data);
      
      navigate(`/marketplace/categories/${categorySlug}`, {
        state: { 
          products: response.data.results || response.data,
          categoryId: category.categoryId,
          subcategoryId: category.subcategoryId,
          subSubcategoryId: category.subSubcategoryId
        }
      });
    } catch (error) {
      navigate(`/marketplace/categories/${categorySlug}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group flex flex-col items-center gap-4 min-w-[120px] cursor-pointer mt-5 mb-2 relative"
      onClick={handleCategoryClick}
    >
      {loading && (
        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center z-10">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full p-1 border-2 border-transparent group-hover:border-orange-500 transition-all duration-500 ease-in-out`}>
      <div className={`w-full h-full rounded-full overflow-hidden shadow-sm ${category.color}`}>
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
          loading="lazy"
        />
      </div>
      
      <div className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
    </div>

    <span className="text-xs md:text-sm font-semibold text-slate-600 group-hover:text-orange-600 transition-colors duration-300 uppercase tracking-wider">
      {category.name}
    </span>
  </motion.div>
  );
};

const CategoryCarousel = () => {
  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
            <p className="text-slate-500 text-sm mt-1">Inspired by your recent searches</p>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-8 md:gap-12 overflow-x-auto pb-6 scrollbar-hide snap-x">
            {CATEGORIES.map((category, index) => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                index={index} 
              />
            ))}
          </div>
          
          <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block" />
        </div>
      </div>
    </section>
  );
};

export default CategoryCarousel;
