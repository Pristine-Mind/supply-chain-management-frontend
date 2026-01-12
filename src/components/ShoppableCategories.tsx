import React from 'react';
import { ShoppableCategory } from '../types/shoppableVideo';
import { motion } from 'framer-motion';

interface ShoppableCategoriesProps {
  categories: ShoppableCategory[];
  onSelect: (category: ShoppableCategory) => void;
  selectedCategoryId?: number;
}

const ShoppableCategories: React.FC<ShoppableCategoriesProps> = ({ categories, onSelect, selectedCategoryId }) => {
  const displayCategories = [
    { id: 0, name: 'All', slug: 'all', icon: null },
    ...categories.filter(c => c.id !== 0)
  ];

  // Helper to get a safe image URL
  const getCategoryImage = (category: any) => {
    if (category.icon) return category.icon;
    if (category.image) return category.image;
    
    // Fallback images based on category name keywords
    const name = category.name.toLowerCase();
    if (name.includes('fashion') || name.includes('style')) return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200';
    if (name.includes('electronic') || name.includes('gadget')) return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200';
    if (name.includes('home') || name.includes('decor')) return 'https://images.unsplash.com/photo-1484101403033-5710672509bb?w=200';
    if (name.includes('beauty') || name.includes('health')) return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200';
    if (name.includes('grocer')) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
    if (name.includes('nepal')) return 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200';
    
    return 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200'; // Default gradient-ish
  };

  return (
    <div className="w-full py-4 overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex flex-col mb-4 px-1">
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Shop by Style</h2>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-1 px-1">
        {displayCategories.map((category) => (
          <motion.div
            key={category.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Ensure we pass a slug even if API doesn't have one
              const categoryWithSlug = {
                ...category,
                slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
              };
              onSelect(categoryWithSlug as any);
            }}
            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer w-20"
          >
            <div className={`w-16 h-16 rounded-full p-0.5 transition-all duration-300 ${
              (selectedCategoryId === category.id || (category.id === 0 && !selectedCategoryId))
                ? 'ring-2 ring-primary-500 ring-offset-2' 
                : 'ring-1 ring-neutral-200 group-hover:ring-primary-300'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                <img 
                  src={getCategoryImage(category)} 
                  alt={category.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=200';
                  }}
                />
              </div>
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold text-center truncate w-full ${
              (selectedCategoryId === category.id || (category.id === 0 && !selectedCategoryId))
                ? 'text-primary-600' : 'text-neutral-600'
            }`}>
              {category.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ShoppableCategories;
