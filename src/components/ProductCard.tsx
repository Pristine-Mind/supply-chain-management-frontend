import React from 'react';
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface Product {
  id: number;
  marketplace_id?: number;
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
  original_price?: number;
  listed_price?: number;
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
  isInWishlist = false,
}) => {
  const originalPrice = product.product_details?.listed_price || product.listed_price;
  const mainPrice = product.product_details?.discounted_price || product.price;
  const hasDiscount = originalPrice && mainPrice && mainPrice < originalPrice;
  const displayPrice = hasDiscount ? mainPrice : (product.price || 0);
  const rating = product.average_rating || 0;
  const reviewCount = product.total_reviews || 0;

  const handleImageContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.();
  };

  const handleViewDetailsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onViewProduct?.();
  };

  const buildStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 transition-colors ${
            i < Math.floor(rating)
              ? 'fill-amber-500 text-amber-500'
              : i < rating
              ? 'fill-amber-200 text-amber-400'
              : 'fill-neutral-200 text-neutral-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <a
      href={`/marketplace/${product.marketplace_id || product.id}`}
      className="group block bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all duration-300 hover:-translate-y-2 no-underline"
      aria-label={`View ${product.name}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].image}
            alt={product.images[0].alt_text || product.name}
            draggable={false}
            onContextMenu={handleImageContextMenu}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22%3E%3Crect width=%22200%22 height=%22150%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%22100%22 y=%2280%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <span className="text-neutral-400 text-sm">No Image Available</span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && product.percent_off && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-2xl shadow-md">
            {product.percent_off}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist();
            }}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm hover:bg-white transition-all hover:scale-110 active:scale-95"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isInWishlist ? 'fill-red-500 text-red-500' : 'text-neutral-600 hover:text-red-500'
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Category & Views */}
        <div className="flex items-center justify-between">
          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-2xl uppercase tracking-wider">
            {product.category_details}
          </span>

          {product.view_count && (
            <div className="flex items-center text-xs text-neutral-500 gap-1">
              <Eye className="w-3.5 h-3.5" />
              {product.view_count}
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3
          className="font-semibold text-lg leading-tight text-neutral-900 line-clamp-2 group-hover:text-amber-700 transition-colors cursor-pointer min-h-[3.2rem]"
          onClick={onViewProduct}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2">
            {buildStars(rating)}
            <span className="text-sm text-neutral-500">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-neutral-900">
            Rs. {displayPrice?.toLocaleString()}
          </span>
          {hasDiscount && originalPrice && (
            <span className="text-sm text-neutral-400 line-through">
              Rs. {originalPrice?.toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              product.stock > 10
                ? 'bg-green-500'
                : product.stock > 0
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-neutral-600">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            onClick={handleViewDetailsClick}
            className="flex-1 py-3.5 border border-neutral-300 hover:border-neutral-400 text-neutral-700 font-medium rounded-2xl text-sm transition-all active:bg-neutral-50"
          >
            View Details
          </button>

          <button
            onClick={handleAddToCartClick}
            disabled={product.stock <= 0}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
              product.stock <= 0
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm active:scale-[0.985]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </a>
  );
};

export default ProductCard;
