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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="card card-hover group relative overflow-hidden">
      {/* Image Section */}
      <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-neutral-100">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].image}
            alt={product.images[0].alt_text || product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-200">
            <span className="text-neutral-400 text-body-sm">No Image</span>
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && product.percent_off && (
          <div className="absolute top-2 left-2 bg-accent-error-500 text-white px-2 py-1 rounded-md text-caption-bold">
            -{product.percent_off}%
          </div>
        )}
        
        {/* Stock Status */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold bg-neutral-900 px-3 py-1 rounded-md">
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onToggleWishlist}
            className={`p-2 rounded-full shadow-soft transition-colors ${
              isInWishlist 
                ? 'bg-accent-error-500 text-white' 
                : 'bg-white text-neutral-600 hover:text-accent-error-500'
            }`}
          >
            <Heart className="w-4 h-4" fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-3">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-caption text-primary-600 font-medium">
            {product.category_details}
          </span>
          {product.view_count && (
            <div className="flex items-center text-caption text-neutral-500">
              <Eye className="w-3 h-3 mr-1" />
              {product.view_count}
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-body font-semibold text-neutral-900 leading-tight">
          {truncateText(product.name, 50)}
        </h3>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= rating 
                      ? 'text-accent-warning-500 fill-current' 
                      : 'text-neutral-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-caption text-neutral-600">
              ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center space-x-2">
          <span className="text-h3 font-bold text-neutral-900">
            {formatPrice(displayPrice || product.price)}
          </span>
          {hasDiscount && (
            <span className="text-body-sm text-neutral-500 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock Info */}
        <div className="text-caption text-neutral-600">
          {product.stock > 0 ? (
            <span className={product.stock <= 5 ? 'text-accent-warning-600' : ''}>
              {product.stock <= 5 ? 'Only ' : ''}{product.stock} in stock
            </span>
          ) : (
            <span className="text-accent-error-600">Out of stock</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={onViewProduct}
            className="btn-secondary flex-1 text-center"
          >
            View Details
          </button>
          <button
            onClick={onAddToCart}
            disabled={product.stock <= 0}
            className="btn-primary flex-1 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
