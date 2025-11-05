import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Expand,
  Truck,
  Shield,
  RotateCcw,
  MessageCircle
} from 'lucide-react';
import ChatTab from './ChatTab';
import { PopularityScore } from '../components/ui/PopularityScore';
import LoginModal from './auth/LoginModal';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  created_at: string;
}

interface ProductDetails {
  id: number;
  images: ProductImage[];
  category_details: string;
  name: string;
  category: string;
  description: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_marketplace_created: boolean;
  avg_daily_demand: number;
  stddev_daily_demand: number;
  safety_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  lead_time_days: number;
  producer: number;
  user: number;
  location: number;
}

interface BulkPriceTier {
  min_quantity: number;
  discount_percent: number;
  price_per_unit: number;
}

interface Review {
  user: string | null;
  rating: number;
  review_text: string;
  created_at: string;
}

interface RatingsBreakdown {
  [key: string]: number;
}

interface MarketplaceProductInstance {
  id: number;
  product: number;
  product_details: ProductDetails;
  discounted_price: number;
  listed_price: number;
  percent_off: number;
  offer_start: string;
  offer_end: string;
  is_offer_active: boolean;
  offer_countdown: number;
  estimated_delivery_days: number;
  shipping_cost: string;
  is_free_shipping: boolean;
  recent_purchases_count: number;
  listed_date: string;
  is_available: boolean;
  min_order: number;
  latitude: number | null;
  longitude: number | null;
  bulk_price_tiers: BulkPriceTier[];
  variants: any[];
  reviews: Review[];
  average_rating: number;
  ratings_breakdown: RatingsBreakdown;
  total_reviews: number;
  view_count: number;
  rank_score: number;
}

const ProductInstanceView: React.FC<{ product: MarketplaceProductInstance }> = ({ product }): JSX.Element => {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity] = useState(1);
  const [tab, setTab] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const { addToCart, distinctItemCount, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const reviews = product.reviews || [];
  const reviewsLoading = false;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    // Hydrate cart from backend after login
    try {
      await refreshCart();
    } catch (e) {
      // non-blocking
      console.error('Failed to refresh cart after login', e);
    }
  };

  const buildStars = (rating: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${
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

  const images = product.product_details?.images || [];

  const openFullScreen = (imageIndex: number) => {
    setFullScreenImageIndex(imageIndex);
    setIsFullScreenOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeFullScreen = () => {
    setIsFullScreenOpen(false);
    document.body.style.overflow = 'unset';
  };

  const nextFullScreenImage = () => {
    setFullScreenImageIndex((prev) => 
      prev < images.length - 1 ? prev + 1 : 0
    );
  };

  const prevFullScreenImage = () => {
    setFullScreenImageIndex((prev) => 
      prev > 0 ? prev - 1 : images.length - 1
    );
  };

  // Handle keyboard navigation in full screen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullScreenOpen) return;
      
      if (e.key === 'Escape') {
        closeFullScreen();
      } else if (e.key === 'ArrowLeft') {
        prevFullScreenImage();
      } else if (e.key === 'ArrowRight') {
        nextFullScreenImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullScreenOpen, images.length]);

  const showOffer = product.is_offer_active && product.discounted_price < product.listed_price;

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center text-sm text-neutral-600">
              <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors">
                Home
              </button>
            <span className="mx-2">›</span>
            <button onClick={() => navigate('/marketplace')} className="hover:text-primary-600 transition-colors">
              Marketplace
            </button>
            <span className="mx-2">›</span>
            <span className="text-neutral-900 font-medium">
              {product.product_details?.category_details}
            </span>
            <span className="mx-2">›</span>
            <span className="text-neutral-500 truncate">
              {product.product_details?.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-xl border border-neutral-200 overflow-hidden group">
              <div className="aspect-square p-4">
                <img
                  src={images[currentImage]?.image || ''}
                  alt={product.product_details?.name}
                  className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 hover:scale-105"
                  onClick={() => openFullScreen(currentImage)}
                />
                {/* Zoom indicator */}
                <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Expand className="w-4 h-4" />
                </div>
                {/* Discount badge */}
                {showOffer && (
                  <div className="absolute top-4 left-4 bg-accent-error-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    {product.percent_off}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentImage(i => (i > 0 ? i - 1 : images.length - 1))}
                  className="p-2 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-2 pb-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        onDoubleClick={() => openFullScreen(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                          idx === currentImage 
                            ? 'border-primary-500 ring-2 ring-primary-100' 
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <img 
                          src={img.image} 
                          alt={`View ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentImage(i => (i < images.length - 1 ? i + 1 : 0))}
                  className="p-2 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            {/* Product Title & Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
                  {product.product_details?.category_details}
                </span>
                <PopularityScore score={product.rank_score} size="sm" showLabel={false} />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 leading-tight">
                {product.product_details?.name}
              </h1>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {buildStars(product.average_rating)}
                <span className="text-sm font-medium text-neutral-700">
                  {product.average_rating?.toFixed(1) || '0.0'}
                </span>
              </div>
              {product.total_reviews > 0 && (
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  ({product.total_reviews} {product.total_reviews === 1 ? 'review' : 'reviews'})
                </button>
              )}
            </div>

            {/* Price Section */}
            <div className="space-y-2">
              {showOffer ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-accent-error-600">
                    Rs. {product.discounted_price?.toLocaleString()}
                  </span>
                  <span className="text-xl text-neutral-500 line-through">
                    Rs. {product.listed_price?.toLocaleString()}
                  </span>
                  <span className="bg-accent-error-100 text-accent-error-700 px-3 py-1 rounded-full text-sm font-bold">
                    Save Rs. {((product.listed_price - product.discounted_price) || 0).toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-neutral-900">
                  Rs. {product.listed_price?.toLocaleString()}
                </span>
              )}
              
              {/* Shipping Info */}
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-accent-success-600" />
                {product.is_free_shipping ? (
                  <span className="text-accent-success-600 font-medium">Free Shipping</span>
                ) : (
                  <span className="text-neutral-600">Shipping: Rs. {product.shipping_cost}</span>
                )}
              </div>
            </div>

            {/* Stock & Availability */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  product.product_details?.stock > 10 
                    ? 'bg-accent-success-500' 
                    : product.product_details?.stock > 0 
                      ? 'bg-accent-warning-500' 
                      : 'bg-accent-error-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {product.product_details?.stock > 0 
                    ? `${product.product_details.stock} in stock` 
                    : 'Out of stock'
                  }
                </span>
              </div>
              
              {product.min_order > 1 && (
                <div className="text-sm text-neutral-600">
                  Minimum order quantity: {product.min_order}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!isAuthenticated) {
                      setShowLoginModal(true);
                      return;
                    }
                    try {
                      const cartProduct = {
                        id: product.id,
                        product: product.product,
                        product_details: {
                          ...product.product_details,
                          projected_stockout_date_field: null,
                        },
                        discounted_price: product.discounted_price,
                        listed_price: product.listed_price,
                        percent_off: product.percent_off,
                        savings_amount: (product.listed_price - product.discounted_price) * quantity,
                        offer_start: product.offer_start,
                        offer_end: product.offer_end,
                        is_offer_active: product.is_offer_active,
                        offer_countdown: product.offer_countdown ? product.offer_countdown.toString() : null,
                        estimated_delivery_days: product.estimated_delivery_days,
                        shipping_cost: product.shipping_cost,
                        is_free_shipping: product.is_free_shipping,
                        recent_purchases_count: product.recent_purchases_count,
                        listed_date: product.listed_date,
                        is_available: product.is_available,
                        min_order: product.min_order,
                        latitude: product.latitude || 0,
                        longitude: product.longitude || 0,
                        bulk_price_tiers: product.bulk_price_tiers,
                        variants: product.variants,
                        reviews: product.reviews,
                        average_rating: product.average_rating,
                        ratings_breakdown: product.ratings_breakdown,
                        total_reviews: product.total_reviews,
                        view_count: product.view_count,
                        rank_score: product.rank_score,
                      };
                      await addToCart(cartProduct, quantity);
                    } catch (error) {
                      console.error('Failed to add to cart:', error);
                      alert('Failed to add item to cart. Please try again.');
                    }
                  }}
                  disabled={product.product_details?.stock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                    product.product_details?.stock === 0
                      ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>
              
              <button 
                onClick={() => navigate('/cart')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 text-neutral-700 font-medium relative"
              >
                <ShoppingCart className="w-4 h-4" />
                View Cart
                {distinctItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-error-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                    {distinctItemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Product Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-t border-neutral-200">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Shield className="w-4 h-4 text-accent-success-600" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <RotateCcw className="w-4 h-4 text-accent-success-600" />
                <span>Easy Returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <MessageCircle className="w-4 h-4 text-accent-success-600" />
                <span>24/7 Support</span>
              </div>
            </div>

            {/* Bulk Pricing */}
            {product.bulk_price_tiers?.length > 0 && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <h3 className="font-semibold text-neutral-900 mb-3">Bulk Pricing</h3>
                <div className="space-y-2">
                  {product.bulk_price_tiers.map((tier, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-neutral-600">{tier.min_quantity}+ units:</span>
                      <span className="font-medium text-neutral-900">
                        Rs. {tier.price_per_unit} ({tier.discount_percent}% off)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Information Tabs */}
        <div className="mt-12 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="border-b border-neutral-200">
            <div className="flex">
              {['Description', 'Reviews', 'Chat'].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setTab(idx)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                    tab === idx 
                      ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {tab === 0 && (
              <div className="prose prose-neutral max-w-none">
                <div
                  className="text-neutral-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.product_details?.description || 'No description available.' }}
                />
                
                {/* Ratings Breakdown */}
                {product.ratings_breakdown && Object.keys(product.ratings_breakdown).length > 0 && (
                  <div className="mt-8 pt-8 border-t border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ratings Breakdown</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {Object.entries(product.ratings_breakdown).map(([star, percent]) => (
                        <div key={star} className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-accent-warning-400 text-accent-warning-400" />
                            <span className="text-sm font-medium">{star}</span>
                          </div>
                          <div className="text-2xl font-bold text-neutral-900">{percent}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {tab === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-900">Customer Reviews</h2>
                  {product.total_reviews > 0 && (
                    <div className="flex items-center gap-2">
                      {buildStars(product.average_rating)}
                      <span className="text-sm text-neutral-600">
                        {product.average_rating?.toFixed(1)} out of 5 ({product.total_reviews} {product.total_reviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>
                
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⭐</div>
                    <h3 className="text-lg font-semibold text-neutral-700 mb-2">No reviews yet</h3>
                    <p className="text-neutral-500">Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review, idx) => (
                      <div key={idx} className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700">
                            {(review.user?.[0] || 'A').toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-neutral-900">{review.user || 'Anonymous'}</span>
                              <span className="text-xs text-neutral-500">{formatDate(review.created_at)}</span>
                            </div>
                            {buildStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-neutral-700 leading-relaxed">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {tab === 2 && (
              <ChatTab 
                productId={product.id}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Login Modal */}
    <LoginModal 
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      onSuccess={handleLoginSuccess}
    />

    {/* Full Screen Image Modal */}
    {isFullScreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeFullScreen}
            className="absolute top-4 right-4 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"
            aria-label="Close full screen"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {fullScreenImageIndex + 1} / {images.length}
          </div>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevFullScreenImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextFullScreenImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main image */}
          <div className="max-w-7xl max-h-full mx-4 flex items-center justify-center">
            <img
              src={images[fullScreenImageIndex]?.image || ''}
              alt={`${product.product_details?.name} - Image ${fullScreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: '90vh' }}
            />
          </div>

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 bg-black/50 p-2 rounded-full max-w-md overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFullScreenImageIndex(idx)}
                    className={`w-12 h-12 rounded-lg border overflow-hidden transition-all flex-shrink-0 ${
                      idx === fullScreenImageIndex ? 'ring-2 ring-white' : 'border-neutral-400 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  >
                    <img src={img.image} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 z-10 bg-black/50 text-white px-3 py-2 rounded-full text-sm">
            Press ESC to close • Use arrow keys to navigate
          </div>

          {/* Click to close overlay */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={closeFullScreen}
            aria-label="Click to close"
          />
        </div>
      )}
    </>
  );
};

export default ProductInstanceView;