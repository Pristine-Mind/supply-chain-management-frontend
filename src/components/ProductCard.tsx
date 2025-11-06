import React from 'react';
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  is_active: boolean;
  category: string;
  images: ProductImage[];
  category_details: string;
  average_rating?: number;
  total_reviews?: number;
  view_count?: number;
  discounted_price?: number;
  percent_off?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onViewProduct?: () => void;
  onToggleWishlist?: () => void;
  isInWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart,
  onViewProduct,
  onToggleWishlist,
  isInWishlist = false
}) => {
  const hasDiscount = product.discounted_price && product.discounted_price < product.price;
  const displayPrice = hasDiscount ? product.discounted_price : product.price;
  const rating = product.average_rating || 0;
  const reviewCount = product.total_reviews || 0;

  const buildStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={`w-3.5 h-3.5 ${
            i < Math.floor(rating) 
              ? 'fill-accent-warning-400 text-accent-warning-400' 
              : i < rating 
                ? 'fill-accent-warning-200 text-accent-warning-400' 
                : 'fill-neutral-200 text-neutral-200'
          }`} 
        />
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden group hover:shadow-lg hover:border-neutral-300 transition-all duration-300 hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].image}
            alt={product.images[0].alt_text || product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
            onClick={onViewProduct}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <span className="text-neutral-400 text-sm">No Image</span>
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && product.percent_off && (
          <div className="absolute top-3 left-3 bg-accent-error-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
            {product.percent_off}% OFF
          </div>
        )}
        
        {/* Stock Status Overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-semibold bg-black/80 px-4 py-2 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={onToggleWishlist}
            className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
              isInWishlist 
                ? 'bg-accent-error-500 text-white hover:bg-accent-error-600' 
                : 'bg-white/90 text-neutral-600 hover:text-accent-error-500 hover:bg-white'
            }`}
          >
            <Heart className="w-4 h-4" fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Stock indicator */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute bottom-3 left-3 bg-accent-warning-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Only {product.stock} left
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Category & Views */}
        <div className="flex items-center justify-between">
          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
            {product.category_details}
          </span>
          {product.view_count && (
            <div className="flex items-center text-xs text-neutral-500">
              <Eye className="w-3 h-3 mr-1" />
              {product.view_count}
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-neutral-900 leading-tight line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors" onClick={onViewProduct}>
          {product.name}
        </h3>

        {/* Rating & Reviews */}
        {rating > 0 && (
          <div className="flex items-center gap-2">
            {buildStars(rating)}
            <span className="text-xs text-neutral-600">
              ({reviewCount})
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="space-y-1">
          {hasDiscount ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-accent-error-600">
                Rs. {displayPrice?.toLocaleString()}
              </span>
              <span className="text-sm text-neutral-500 line-through">
                Rs. {product.price?.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-neutral-900">
              Rs. {product.price?.toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock Info */}
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            product.stock > 10 
              ? 'bg-accent-success-500' 
              : product.stock > 0 
                ? 'bg-accent-warning-500' 
                : 'bg-accent-error-500'
          }`}></div>
          <span className="text-xs text-neutral-600">
            {product.stock > 0 
              ? `${product.stock} in stock` 
              : 'Out of stock'
            }
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onViewProduct}
            className="flex-1 py-2.5 px-4 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 text-neutral-700 font-medium text-sm"
          >
            View Details
          </button>
          <button
            onClick={onAddToCart}
            disabled={product.stock <= 0}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              product.stock === 0
                ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
