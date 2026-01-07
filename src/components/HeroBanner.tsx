import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import BannerSaleImage from '../assets/banner_sale.png';

interface Category {
  name: string;
  [key: string]: any;
}

interface HeroBannerProps {
  categoryHierarchy?: Category[];
}

const HeroBanner: React.FC<HeroBannerProps> = ({ categoryHierarchy = [] }) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = [
    {
      title: 'Smart Electronics',
      tag: 'Next Gen',
      image: 'https://himstar.com.np/Media/TV/ht-55u4ksdj.png',
      searchTerm: 'electronics',
      categoryName: 'Electronics & Gadgets'
    },
    {
      title: 'Modern Living',
      tag: 'New Home',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
      searchTerm: 'home',
      categoryName: 'Home & Living'
    },
    {
      title: 'Beauty Rituals',
      tag: 'Premium',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop',
      searchTerm: 'beauty',
      categoryName: 'Health & Beauty'
    },
    {
      title: 'Pantry Essentials',
      tag: 'Freshly Picked',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop',
      searchTerm: 'food',
      categoryName: 'Food & Beverages'
    }
  ];

  const handleNavigation = (card: typeof categories[0]) => {
    const tokens = (s?: string) =>
      (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    if (!categoryHierarchy || categoryHierarchy.length === 0) {
      console.debug('HeroBanner: categoryHierarchy is empty or undefined');
    }

    const matchingCategory = categoryHierarchy.find((cat) => {
      const catName = (cat?.name || '').toString();
      const catTokens = tokens(catName);
      const searchTokens = tokens(card.searchTerm);
      const cardCategoryTokens = tokens(card.categoryName);

      if (catTokens.length === 0) return false;

      const intersects = (a: string[], b: string[]) => a.some((t) => b.includes(t));

      if (intersects(catTokens, searchTokens)) return true;
      if (intersects(catTokens, cardCategoryTokens)) return true;
      if (intersects(cardCategoryTokens, catTokens)) return true;

      return false;
    });

    if (matchingCategory) {
      const slug = matchingCategory.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/-+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-|-$/g, '') // Remove leading/trailing dashes
        .trim();
      
      navigate(`/marketplace/categories/${slug}`);
    } else {
        const fallbackName = card.categoryName || card.title || '';
        if (fallbackName) {
          const fallbackSlug = fallbackName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .trim();

          navigate(`/marketplace/categories/${fallbackSlug}`);
        } else {
          navigate(`/marketplace/all-products?search=${encodeURIComponent(card.searchTerm)}`);
        }
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-white">
      <div className="relative w-full h-[450px] md:h-[600px] lg:h-[700px] bg-gray-900">
        <img 
          src={BannerSaleImage} 
          alt="Sale Banner" 
          className="w-full h-full object-cover opacity-70 scale-105 animate-pulse-slow"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />

      </div>

      <div className="relative -mt-32 md:-mt-44 z-20">
        <div className="container mx-auto px-4 md:px-10">
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar md:grid md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 pb-10"
          >
            {categories.map((card, index) => (
              <div
                key={index}
                onClick={() => handleNavigation(card)}
                className="min-w-[85%] sm:min-w-[45%] md:min-w-0 snap-center group cursor-pointer"
              >
                <div className="h-full bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-orange-500/20 transition-all duration-500 group-hover:-translate-y-4">
                  
                  <span className="inline-block text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4">
                    {card.tag}
                  </span>

                  <div className="flex flex-col h-full">
                    <h3 className="text-2xl font-black text-gray-900 leading-[1.1] mb-6">
                      {card.title.split(' ')[0]} <br/>
                      <span className="text-gray-400 font-light">{card.title.split(' ')[1]}</span>
                    </h3>
                    
                    <div className="relative h-44 flex items-center justify-center mb-6">
                        <div className="absolute w-32 h-32 bg-gray-100 rounded-full scale-100 group-hover:scale-125 transition-transform duration-700 ease-in-out" />
                        <img
                            src={card.image}
                            alt={card.title}
                            className="relative z-10 w-full h-full object-contain drop-shadow-2xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-500"
                        />
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="text-[11px] font-black uppercase tracking-wider group-hover:text-orange-600 transition-colors">
                          View Store
                        </span>
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-600 transition-all duration-300">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; transform: scale(1.05); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HeroBanner;
