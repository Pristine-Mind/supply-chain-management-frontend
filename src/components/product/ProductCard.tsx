import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Truck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export interface ProductCardData {
  id: number | string;
  name: string;
  image?: string | null;
  href?: string;
  price: number;
  originalPrice?: number | null;
  percentOff?: number;
  savings?: number;
  stock?: number;
  isDeliveryFree?: boolean;
  category?: string | null;
  rating?: number;
  reviewCount?: number;
  isB2B?: boolean;
  isAvailable?: boolean;
  estimatedDeliveryDays?: number;
}

export interface ProductCardProps {
  product: ProductCardData;
  size?: 'sm' | 'md' | 'lg';
  showAddToCart?: boolean;
  added?: boolean;
  onAddToCart?: (e: React.MouseEvent) => void;
  onNavigate?: () => void;
  className?: string;
}

const PLACEHOLDER = '/api/placeholder/300/300';

const sizeClasses = {
  sm: {
    card: 'rounded-lg',
    image: 'h-44',
    content: 'p-3',
    title: 'text-sm',
    price: 'text-sm',
    originalPrice: 'text-[10px]',
    badge: 'text-[10px]',
  },
  md: {
    card: 'rounded-xl',
    image: 'h-56 sm:h-64',
    content: 'p-4',
    title: 'text-sm',
    price: 'text-base',
    originalPrice: 'text-xs',
    badge: 'text-xs',
  },
  lg: {
    card: 'rounded-2xl',
    image: 'h-64 sm:h-72',
    content: 'p-5',
    title: 'text-base',
    price: 'text-lg',
    originalPrice: 'text-sm',
    badge: 'text-xs',
  },
};

function buildStars(rating: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={cn(
        'w-3.5 h-3.5',
        i < Math.floor(rating)
          ? 'fill-accent-warning-400 text-accent-warning-400'
          : i < rating
          ? 'fill-accent-warning-200 text-accent-warning-400'
          : 'fill-neutral-200 text-neutral-200'
      )}
    />
  ));
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product, size = 'md', showAddToCart = false, added = false, onAddToCart, onNavigate, className }, ref) => {
    const navigate = useNavigate();
    const s = sizeClasses[size];

    const {
      id,
      name,
      image,
      href,
      price,
      originalPrice,
      percentOff,
      savings,
      stock = 0,
      isDeliveryFree,
      category,
      rating,
      reviewCount,
      isB2B,
      isAvailable = true,
      estimatedDeliveryDays,
    } = product;

    const hasDiscount = !!originalPrice && originalPrice > price;
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 5;

    const handleNavigate = (e: React.MouseEvent) => {
      if (onNavigate) {
        e.preventDefault();
        onNavigate();
      } else if (href) {
        e.preventDefault();
        navigate(href);
      }
    };

    const handleAdd = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAddToCart?.(e);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group bg-white border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full',
          s.card,
          className
        )}
      >
        {/* Image */}
        <a
          href={href || `/marketplace/${id}`}
          onClick={handleNavigate}
          className={cn('relative block bg-neutral-50 overflow-hidden flex-shrink-0', s.image)}
        >
          <img
            src={image || PLACEHOLDER}
            alt={name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
            draggable={false}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {percentOff ? (
              <Badge variant="discount" size="sm" className="shadow-sm">
                {Math.round(percentOff)}% OFF
              </Badge>
            ) : null}
            {isLowStock ? (
              <Badge variant="warning" size="sm" className="shadow-sm">
                {stock} left
              </Badge>
            ) : null}
            {isDeliveryFree ? (
              <Badge variant="success" size="sm" className="shadow-sm">
                🚚 Free Delivery
              </Badge>
            ) : null}
            {estimatedDeliveryDays ? (
              <Badge variant="primary" size="sm" className="shadow-sm gap-1">
                <Truck className="w-3 h-3" />
                {estimatedDeliveryDays} days
              </Badge>
            ) : null}
          </div>

          {/* Unavailable overlay */}
          {!isAvailable || isOutOfStock ? (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">
                {isOutOfStock ? 'Out of Stock' : 'Unavailable'}
              </span>
            </div>
          ) : null}

          {/* Quick View */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={handleNavigate}
              className="bg-white text-neutral-900 px-6 py-2 rounded-lg font-medium hover:bg-neutral-50 transition-colors shadow-sm"
            >
              Quick View
            </button>
          </div>
        </a>

        {/* Content */}
        <div className={cn('flex-1 flex flex-col', s.content)}>
          {category ? (
            <div className="mb-2">
              <Badge variant="default" size="sm" className="uppercase tracking-wide">
                {category}
              </Badge>
            </div>
          ) : null}

          <a
            href={href || `/marketplace/${id}`}
            onClick={handleNavigate}
            className={cn(
              'font-semibold text-neutral-900 leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors',
              s.title
            )}
          >
            {name}
          </a>

          {rating ? (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex gap-0.5">{buildStars(rating)}</div>
              {reviewCount ? <span className="text-xs text-neutral-500">({reviewCount})</span> : null}
            </div>
          ) : null}

          <div className="mt-auto pt-3 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('font-bold text-primary-600', s.price)}>
                Rs. {price.toLocaleString()}
              </span>
              {hasDiscount && originalPrice ? (
                <span className={cn('text-neutral-500 line-through', s.originalPrice)}>
                  Rs. {originalPrice.toLocaleString()}
                </span>
              ) : null}
              {isB2B ? (
                <Badge variant="secondary" size="sm">
                  B2B
                </Badge>
              ) : null}
            </div>

            {savings ? (
              <div className="text-xs text-accent-success-600 font-medium">
                Save Rs. {savings.toLocaleString()}
              </div>
            ) : null}

            <div className="flex items-center gap-1 text-[10px] text-neutral-600">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  stock > 10
                    ? 'bg-accent-success-500'
                    : stock > 0
                    ? 'bg-accent-warning-500'
                    : 'bg-accent-error-500'
                )}
              />
              <span>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span>
            </div>

            {showAddToCart ? (
              <button
                onClick={handleAdd}
                disabled={!isAvailable || isOutOfStock}
                className={cn(
                  'w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium rounded transition-colors mt-2',
                  !isAvailable || isOutOfStock
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : added
                    ? 'bg-accent-success-600 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                )}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {added ? 'Added!' : !isAvailable || isOutOfStock ? 'Unavailable' : 'Add to Cart'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = 'ProductCard';
