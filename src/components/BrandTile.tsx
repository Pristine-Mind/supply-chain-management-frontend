import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Star, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Brand = {
  id?: number | string;
  name?: string;
  image?: string;
  logo?: string;
  thumbnail?: string;
  is_featured?: boolean;
  is_trending?: boolean;
  products_count?: number;
  [key: string]: any;
};

interface BrandTileProps {
  brand: Brand;
  img?: string;
  variant?: 'default' | 'premium' | 'compact';
  onBrandClick?: (brandId: string | number) => void;
}

function BrandTile({ brand, img, variant = 'premium', onBrandClick }: BrandTileProps) {
  const placeholder = 'https://via.placeholder.com/150?text=No+Logo';
  const [src, setSrc] = useState<string>(img || placeholder);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setSrc(img || placeholder);
    setIsImageLoaded(false);
  }, [img]);

  const handleClick = () => {
    navigate(`/brand-products/${brand.id}`);

    if (onBrandClick && brand.id) {
      onBrandClick(brand.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  if (variant === 'premium') {
    return (
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex flex-col group cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown }
        aria-label={`View ${brand.name} products`}
      >
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl p-4 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
          
          <div className="absolute top-2 right-2 z-10 flex gap-1 items-center">
            {brand.is_featured && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5 shadow-sm">
                <Star className="w-2.5 h-2.5 fill-current" />
                Featured
              </div>
            )}
            {brand.is_trending && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5 shadow-sm">
                <TrendingUp className="w-2.5 h-2.5" />
                Hot
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/brands/${brand.id}`, '_blank'); }}
              className="p-1 rounded-md bg-white/80 hover:bg-white text-gray-600 shadow-sm"
              title="Open brand page"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center mb-3 group-hover:border-orange-300 transition-colors">
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
            )}
            <img
              src={src}
              alt={brand.name || 'brand logo'}
              className={`max-w-[80%] max-h-[80%] object-contain transition-all duration-300 ${
                isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              } ${isHovered ? 'scale-110' : 'scale-100'}`}
              onLoad={() => setIsImageLoaded(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholder;
                setIsImageLoaded(true);
              }}
            />
            
            {isHovered && (
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-2 right-2 w-4 h-4 text-orange-400 animate-pulse" />
                <Sparkles className="absolute bottom-2 left-2 w-3 h-3 text-orange-400 animate-pulse" style={{ animationDelay: '75ms' }} />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-gray-900 truncate group-hover:text-orange-600 transition-colors">
              {brand.name}
            </h3>
            {brand.products_count && (
              <p className="text-[11px] text-gray-500">
                {brand.products_count} products
              </p>
            )}
          </div>

          <div className={`absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent rounded-2xl transition-opacity duration-300 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`View ${brand.name} products`}
      >
        <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-orange-300 transition-colors">
          <img
            src={src}
            alt={brand.name || 'brand logo'}
            className="max-w-[80%] max-h-[80%] object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = placeholder; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
              {brand.name}
            </h4>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/brands/${brand.id}`, '_blank'); }}
              className="p-1 rounded-md bg-white/90 hover:bg-white text-gray-600 shadow-sm flex-shrink-0"
              title="Open brand page"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          {brand.products_count && (
            <p className="text-xs text-gray-500">{brand.products_count} items</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex flex-col group cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`View ${brand.name} products`}
    >
      <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden border-2 border-gray-100 flex items-center justify-center transition-all duration-300 group-hover:border-orange-400 group-hover:shadow-lg group-hover:-translate-y-1">
        
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
        )}

        <img
          src={src}
          alt={brand.name || 'brand logo'}
          className={`max-w-[75%] max-h-[75%] object-contain transition-all duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-110' : 'scale-100'}`}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholder;
            setIsImageLoaded(true);
          }}
        />

        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-white text-xs font-medium px-3 py-1 bg-orange-500 rounded-full inline-block">
              View Products
            </span>
          </div>
        </div>

        {(brand.is_featured || brand.is_trending) && (
          <div className="absolute top-2 right-2 flex gap-1 items-center">
            {brand.is_featured && (
              <div className="bg-yellow-400 text-yellow-900 p-1 rounded-full shadow-sm">
                <Star className="w-3 h-3 fill-current" />
              </div>
            )}
            {brand.is_trending && (
              <div className="bg-pink-500 text-white p-1 rounded-full shadow-sm">
                <TrendingUp className="w-3 h-3" />
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`${window.location.origin}/brands/${brand.id}`, '_blank'); }}
              className="p-1 rounded-md bg-white/90 hover:bg-white text-gray-600 shadow-sm"
              title="Open brand page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 text-center">
        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
          {brand.name}
        </h3>
        {brand.products_count && (
          <p className="text-xs text-gray-500 mt-0.5">
            {brand.products_count} products
          </p>
        )}
      </div>
    </div>
  );
}

export default BrandTile;