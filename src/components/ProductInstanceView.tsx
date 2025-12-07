import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  ShoppingCart,
  Package,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Send,
  Edit3,
  Trash2,
  X,
  TrendingUp,
  Expand,
  RotateCcw,
  MessageCircle,
  Check,
  AlertCircle,
  Minus,
  Plus
} from 'lucide-react';
import ChatTab from './ChatTab';
import { PopularityScore } from '../components/ui/PopularityScore';
import LoginModal from './auth/LoginModal';
import { 
  createReview, 
  updateReview, 
  deleteReview, 
  getUserReviewForProduct,
  type ReviewData,
  type CreateReviewData 
} from '../api/reviewsApi';

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
  size?: string | null;
  color?: string | null;
  additional_information?: string | null;
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
  id?: number;
  product?: number;
  user: string | null | undefined;
  user_id?: number;
  username?: string;
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
  b2b_price?: number;
  b2b_min_quantity?: number;
  is_b2b_eligible?: boolean;
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
  
  const { addToCart, distinctItemCount, refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  // Initialize quantity based on B2B or regular minimum order
  const getInitialQuantity = () => {
    const isB2BVerified = user?.b2b_verified || false;
    const isB2BEligible = product.is_b2b_eligible || false;
    const hasB2BPrice = typeof product.b2b_price === 'number';
    
    if (isB2BVerified && isB2BEligible && hasB2BPrice) {
      return product.b2b_min_quantity || product.min_order || 1;
    }
    return product.min_order || 1;
  };
  
  const [quantity, setQuantity] = useState(() => getInitialQuantity());
  
  // Update quantity when user authentication changes or B2B status changes
  useEffect(() => {
    const newMinQuantity = getInitialQuantity();
    if (quantity < newMinQuantity) {
      setQuantity(newMinQuantity);
    }
  }, [user?.b2b_verified, product.is_b2b_eligible, product.b2b_min_quantity]);
  
  const [tab, setTab] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Review-related state
  const [reviews, setReviews] = useState<Review[]>(product.reviews || []);
  const [userReview, setUserReview] = useState<ReviewData | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewData | null>(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    review_text: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string>('');


  // Helper function to determine the correct price to display
  const getDisplayPrice = () => {
    const isB2BVerified = user?.b2b_verified || false;
    const isB2BEligible = product.is_b2b_eligible || false;
    const hasB2BPrice = typeof product.b2b_price === 'number';
    
    if (isB2BVerified && isB2BEligible && hasB2BPrice) {
      return {
        price: product.b2b_price,
        isB2BPrice: true,
        minQuantity: product.b2b_min_quantity || 1
      };
    }
    
    // Regular pricing logic
    if (product.is_offer_active && product.discounted_price < product.listed_price) {
      return {
        price: product.discounted_price,
        isB2BPrice: false,
        minQuantity: 1
      };
    }
    
    return {
      price: product.listed_price,
      isB2BPrice: false,
      minQuantity: 1
    };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    try {
      await refreshCart();
    } catch (e) {
      console.error('Failed to refresh cart after login', e);
    }
  };

  const buildStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };
    
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`${sizeClasses[size]} ${
              i < Math.floor(rating) 
                ? 'fill-amber-400 text-amber-400' 
                : i < rating 
                  ? 'fill-amber-200 text-amber-400' 
                  : 'fill-gray-200 text-gray-200'
            }`} 
          />
        ))}
      </div>
    );
  };

  // Load user's existing review for this product
  useEffect(() => {
    const loadUserReview = async () => {
      if (isAuthenticated) {
        try {
          const existingReview = await getUserReviewForProduct(product.id);
          setUserReview(existingReview);
          if (existingReview) {
            setReviewFormData({
              rating: existingReview.rating,
              review_text: existingReview.review_text || ''
            });
          }
        } catch (error) {
          console.error('Failed to load user review:', error);
        }
      }
    };

    loadUserReview();
  }, [isAuthenticated, product.id]);

  // Handle review form submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');

    try {
      const reviewData: CreateReviewData = {
        product: product.id,
        rating: reviewFormData.rating,
        review_text: reviewFormData.review_text
      };

      let updatedReview: ReviewData;

      if (editingReview) {
        // Update existing review
        updatedReview = await updateReview(editingReview.id!, {
          rating: reviewFormData.rating,
          review_text: reviewFormData.review_text
        });
      } else {
        // Create new review
        updatedReview = await createReview(reviewData);
      }

      // Update local state
      setUserReview(updatedReview);
      
      // Convert ReviewData to Review format for consistency
      const convertedReview: Review = {
        id: updatedReview.id,
        product: updatedReview.product,
        user: updatedReview.user || updatedReview.username || null,
        user_id: updatedReview.user_id,
        username: updatedReview.username,
        rating: updatedReview.rating,
        review_text: updatedReview.review_text || '',
        created_at: updatedReview.created_at || new Date().toISOString()
      };
      
      // Update reviews list
      const updatedReviews = editingReview 
        ? reviews.map(r => r.id === editingReview.id ? convertedReview : r)
        : [...reviews, convertedReview];
      
      setReviews(updatedReviews);

      // Reset form
      setShowReviewForm(false);
      setEditingReview(null);
      setReviewFormData({ rating: 5, review_text: '' });

    } catch (error: any) {
      console.error('Failed to submit review:', error);
      if (error.response?.data?.non_field_errors?.[0]) {
        setReviewError(error.response.data.non_field_errors[0]);
      } else {
        setReviewError('Failed to submit review. Please try again.');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle review deletion
  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      await deleteReview(reviewId);
      setUserReview(null);
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Failed to delete review:', error);
      setReviewError('Failed to delete review. Please try again.');
    }
  };

  // Handle edit review
  const handleEditReview = (review: ReviewData) => {
    setEditingReview(review);
    setReviewFormData({
      rating: review.rating,
      review_text: review.review_text || ''
    });
    setShowReviewForm(true);
  };

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

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    try {
      const { price: currentPrice, isB2BPrice } = getDisplayPrice();
      const cartProduct = {
        id: product.id,
        product: product.product,
        product_details: {
          ...product.product_details,
          projected_stockout_date_field: null,
        },
        // Use the current displayed price (B2B or regular)
        discounted_price: isB2BPrice ? (currentPrice || null) : (product.discounted_price || null),
        listed_price: isB2BPrice ? (currentPrice || 0) : product.listed_price,
        percent_off: product.percent_off,
        savings_amount: isB2BPrice 
          ? (product.listed_price - (currentPrice || 0)) * quantity
          : (product.listed_price - (product.discounted_price || product.listed_price)) * quantity,
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
        b2b_price: product.b2b_price,
        b2b_min_quantity: product.b2b_min_quantity,
        is_b2b_eligible: product.is_b2b_eligible,
        variants: product.variants,
        reviews: product.reviews,
        average_rating: product.average_rating,
        ratings_breakdown: product.ratings_breakdown,
        total_reviews: product.total_reviews,
        view_count: product.view_count,
        rank_score: product.rank_score,
      };
      await addToCart(cartProduct, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.product_details?.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    const { minQuantity } = getDisplayPrice();
    const minAllowed = Math.max(minQuantity, product.min_order || 1);
    if (quantity > minAllowed) {
      setQuantity(q => q - 1);
    }
  };

  const { price: currentPrice = product.listed_price, isB2BPrice, minQuantity } = getDisplayPrice();
  const showOffer = !isB2BPrice && product.is_offer_active && product.discounted_price < product.listed_price;
  const stockLevel = product.product_details?.stock || 0;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Breadcrumb */}
              {/* <div className="flex items-center text-sm text-neutral-600 overflow-x-auto">
                <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors whitespace-nowrap">
                  Home
                </button>
                <ChevronRight className="w-4 h-4 mx-1 text-neutral-400" />
                <button onClick={() => navigate('/marketplace')} className="hover:text-primary-600 transition-colors whitespace-nowrap">
                  Marketplace
                </button>
                <ChevronRight className="w-4 h-4 mx-1 text-neutral-400" />
                <span className="text-gray-900 font-medium truncate max-w-xs">
                  {product.product_details?.name}
                </span>
              </div> */}

              {/* Quick Actions */}
              {/* <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-2 rounded-full transition-all ${
                    isWishlisted 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                    aria-label="Share product"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Copy Link</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Share on Facebook</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Share on Twitter</button>
                    </div>
                  )}
                </div>
              </div> */}
            </div>
          </div>
        </div>

  <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-7">
              <div className="sticky top-24 space-y-4">
                <div className="relative bg-white rounded-2xl overflow-hidden group shadow-sm border border-gray-200">
                  <div className="relative w-full h-80 sm:h-96 lg:h-[640px]">
                    <img
                      src={images[currentImage]?.image || ''}
                      alt={product.product_details?.name}
                      className="w-full h-full object-contain p-6 cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                      onClick={() => openFullScreen(currentImage)}
                    />
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {isB2BPrice && (
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                          B2B
                        </div>
                      )}
                      {showOffer && (
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                          {product.percent_off}% OFF
                        </div>
                      )}
                      {product.recent_purchases_count > 10 && (
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Trending
                        </div>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Expand className="w-5 h-5" />
                    </div>

                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImage(i => (i > 0 ? i - 1 : images.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImage(i => (i < images.length - 1 ? i + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        onDoubleClick={() => openFullScreen(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                          idx === currentImage 
                            ? 'border-primary-500 ring-2 ring-primary-100' 
                            : 'border-gray-200 hover:border-gray-300'
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
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="space-y-6 pb-20 md:pb-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      {product.product_details?.category_details}
                    </span>
                    <PopularityScore score={product.rank_score} size="sm" showLabel={false} />
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    {product.product_details?.name}
                  </h1>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      {buildStars(product.average_rating, 'lg')}
                      <span className="text-lg font-bold text-gray-900">
                        {product.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    {product.total_reviews > 0 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => setTab(1)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
                        >
                          {product.total_reviews} {product.total_reviews === 1 ? 'Review' : 'Reviews'}
                        </button>
                      </>
                    )}
                    {product.recent_purchases_count > 0 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm text-neutral-600 flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {product.recent_purchases_count} sold recently
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200"></div>

                <div className="space-y-3">
                  <div className="flex items-end gap-4 flex-wrap">
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                      Rs. {currentPrice.toLocaleString()}
                      {isB2BPrice && (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 align-middle">
                          B2B Price
                        </span>
                      )}
                    </div>
                    {(showOffer || isB2BPrice) && (
                      <>
                        <div className="text-2xl text-gray-400 line-through">
                          Rs. {product.listed_price.toLocaleString()}
                        </div>
                        <div className="bg-red-50 text-red-700 px-3 py-1 rounded-lg text-sm font-bold border border-red-200">
                          Save Rs. {(product.listed_price - currentPrice).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <p className="text-sm text-neutral-600">Inclusive of all taxes</p>
                </div>

                <div className="border-t border-gray-200"></div>

                <div className="space-y-3">

                  {/* Trust Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-neutral-50 rounded-lg p-3 text-center border border-neutral-200">
                      <Shield className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-neutral-700">Secure Payment</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3 text-center border border-neutral-200">
                      <RotateCcw className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-neutral-700">Easy Returns</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3 text-center border border-neutral-200">
                      <MessageCircle className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-neutral-700">24/7 Support</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Stock Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Availability</span>
                    <div className="flex items-center gap-2">
                      {stockLevel > 10 ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">In Stock ({stockLevel} available)</span>
                        </>
                      ) : stockLevel > 0 ? (
                        <>
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-700">Only {stockLevel} left!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">Out of Stock</span>
                        </>
                      )}
                    </div>
                  </div>

                  {(minQuantity > 1 || product.min_order > 1) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Minimum order:</span> {Math.max(minQuantity, product.min_order || 1)} units
                        {isB2BPrice && minQuantity > 1 && (
                          <span className="block mt-1 text-xs text-blue-600">B2B minimum quantity requirement</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    {isB2BPrice && minQuantity > 1 && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Min: {minQuantity} units
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= Math.max(minQuantity, product.min_order || 1)}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || Math.max(minQuantity, product.min_order || 1);
                          if (val >= Math.max(minQuantity, product.min_order || 1) && val <= stockLevel) {
                            setQuantity(val);
                          }
                        }}
                        className="w-16 text-center font-semibold text-gray-900 border-none focus:outline-none"
                        min={Math.max(minQuantity, product.min_order || 1)}
                        max={stockLevel}
                      />
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= stockLevel}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-neutral-600">
                      Total: <span className="font-bold text-gray-900">Rs. {(currentPrice * quantity).toLocaleString()}</span>
                      {isB2BPrice && minQuantity > 1 && (
                        <span className="block text-xs text-blue-600 mt-1">
                          B2B pricing • {quantity} units @ Rs. {currentPrice.toLocaleString()} each
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white p-4 border-t border-gray-200 shadow-lg space-y-3 md:static md:shadow-none md:p-0 md:space-y-3 md:sticky md:bottom-0 md:bg-white md:pt-4 md:border-t md:border-gray-200">
                  <button
                    onClick={handleAddToCart}
                    disabled={stockLevel === 0}
                    className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                      stockLevel === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : addedToCart
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-6 h-6" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-6 h-6" />
                        Add to Cart
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => navigate('/cart')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-white border-2 border-neutral-300 rounded-xl hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 text-neutral-700 font-semibold relative"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    View Cart
                    {distinctItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                        {distinctItemCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Bulk Pricing */}
                {product.bulk_price_tiers?.length > 0 && (
                  <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary-600" />
                      Bulk Pricing Available
                    </h3>
                    <div className="space-y-2">
                      {product.bulk_price_tiers.map((tier, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-sm font-medium text-gray-700">Buy {tier.min_quantity}+ units</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">Rs. {tier.price_per_unit}</span>
                            <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {tier.discount_percent}% off
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Information Tabs */}
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tab Headers */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex">
                  {['Description', 'Reviews', 'Chat'].map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTab(idx)}
                      className={`flex-1 py-3 px-2 sm:px-6 text-sm sm:text-base text-center font-semibold transition-all duration-300 relative ${
                        tab === idx 
                          ? 'bg-white text-primary-600' 
                          : 'text-neutral-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                      {tab === idx && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 to-primary-700"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="p-6 lg:p-8">
                {tab === 0 && (
                  <div className="space-y-8">
                    {/* Product Description */}
                    <div className="prose prose-lg max-w-none">
                      <div
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: product.product_details?.description || 'No description available.' }}
                      />
                    </div>

                    {/* Product Specifications */}
                    {product.product_details?.sku && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Product Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">SKU</span>
                            <span className="text-gray-900 font-semibold">{product.product_details.sku}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Category</span>
                            <span className="text-gray-900 font-semibold">{product.product_details.category_details}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Stock</span>
                            <span className="text-gray-900 font-semibold">{product.product_details.stock} units</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Lead Time</span>
                            <span className="text-gray-900 font-semibold">{product.product_details.lead_time_days} days</span>
                          </div>
                          {product.product_details.size && (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-gray-600 font-medium">Size</span>
                              <span className="text-gray-900 font-semibold">{product.product_details.size}</span>
                            </div>
                          )}
                          {product.product_details.color && (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-gray-600 font-medium">Color</span>
                              <span className="text-gray-900 font-semibold">{product.product_details.color}</span>
                            </div>
                          )}
                        </div>
                        {product.product_details.additional_information && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h4>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200">
                              {product.product_details.additional_information}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Ratings Breakdown */}
                    {product.ratings_breakdown && Object.keys(product.ratings_breakdown).length > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                          Customer Ratings Breakdown
                        </h3>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const percent = product.ratings_breakdown[star.toString()] || 0;
                            return (
                              <div key={star} className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-700 w-12">{star} star</span>
                                <div className="flex-1 bg-white rounded-full h-3 overflow-hidden shadow-inner">
                                  <div 
                                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold text-gray-900 w-12 text-right">{percent}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {tab === 1 && (
                  <div className="space-y-6">
                    {/* Reviews Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                        {reviews.length > 0 && (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-2">
                              {buildStars(product.average_rating, 'lg')}
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {product.average_rating?.toFixed(1)}
                            </span>
                            <span className="text-gray-600">
                              based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Write Review Button */}
                      {isAuthenticated && !userReview && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                        >
                          Write a Review
                        </button>
                      )}
                      
                      {!isAuthenticated && (
                        <button
                          onClick={() => setShowLoginModal(true)}
                          className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                        >
                          Login to Review
                        </button>
                      )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {editingReview ? 'Edit Review' : 'Write a Review'}
                          </h3>
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              setEditingReview(null);
                              setReviewFormData({ rating: 5, review_text: '' });
                              setReviewError('');
                            }}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {reviewError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-red-700 text-sm">{reviewError}</p>
                          </div>
                        )}

                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                          {/* Rating */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rating *
                            </label>
                            <div className="flex items-center gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setReviewFormData(prev => ({ ...prev, rating: i + 1 }))}
                                  className="hover:scale-110 transition-transform"
                                >
                                  <Star 
                                    className={`w-8 h-8 ${
                                      i < reviewFormData.rating 
                                        ? 'fill-amber-400 text-amber-400' 
                                        : 'fill-gray-200 text-gray-200'
                                    }`} 
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-sm text-gray-600">
                                ({reviewFormData.rating} star{reviewFormData.rating !== 1 ? 's' : ''})
                              </span>
                            </div>
                          </div>

                          {/* Review Text */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Review (optional)
                            </label>
                            <textarea
                              value={reviewFormData.review_text}
                              onChange={(e) => setReviewFormData(prev => ({ ...prev, review_text: e.target.value }))}
                              placeholder="Share your experience with this product..."
                              rows={4}
                              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                            />
                          </div>

                          {/* Submit Button */}
                          <div className="flex gap-3 pt-2">
                            <button
                              type="submit"
                              disabled={reviewSubmitting}
                              className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {reviewSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  {editingReview ? 'Update Review' : 'Submit Review'}
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowReviewForm(false);
                                setEditingReview(null);
                                setReviewFormData({ rating: 5, review_text: '' });
                                setReviewError('');
                              }}
                              className="bg-neutral-200 text-neutral-700 px-6 py-3 rounded-xl font-semibold hover:bg-neutral-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* User's Existing Review */}
                    {userReview && !showReviewForm && (
                      <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Your Review</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditReview(userReview)}
                              className="bg-primary-100 text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-200 transition-colors flex items-center gap-2 text-sm"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReview(userReview.id!)}
                              className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          {buildStars(userReview.rating, 'sm')}
                          <span className="text-sm font-medium text-gray-700">
                            ({userReview.rating} star{userReview.rating !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {userReview.review_text && (
                          <p className="text-gray-700 leading-relaxed">{userReview.review_text}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-3">
                          Posted on {formatDate(userReview.created_at || '')}
                        </p>
                      </div>
                    )}
                    
                    {/* Reviews List */}
                    {reviews.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="text-6xl mb-4">⭐</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No reviews yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to share your experience!</p>
                        {isAuthenticated ? (
                          <button 
                            onClick={() => setShowReviewForm(true)}
                            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                          >
                            Write a Review
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShowLoginModal(true)}
                            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                          >
                            Login to Review
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews
                          .filter(review => review.id !== userReview?.id) // Don't show user's review in the general list
                          .map((review, idx) => (
                          <div key={review.id || idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0">
                                {(review.user?.[0] || review.username?.[0] || 'A').toUpperCase()}
                              </div>
                              
                              {/* Review Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <div>
                                    <span className="font-bold text-gray-900 text-lg">
                                      {review.user || review.username || 'Anonymous'}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      {buildStars(review.rating, 'sm')}
                                    </div>
                                  </div>
                                  <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                                </div>
                                {review.review_text && (
                                  <p className="text-neutral-700 leading-relaxed mt-3">{review.review_text}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {tab === 2 && (
                  <div className="min-h-[400px]">
                    <ChatTab 
                      productId={product.id}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>
                )}
              </div>
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

      {/* Full Screen Image Viewer */}
      {isFullScreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm">
          {/* Close Button */}
          <button
            onClick={closeFullScreen}
            className="absolute top-6 right-6 z-10 bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-all"
            aria-label="Close full screen"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-6 left-6 z-10 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold">
            {fullScreenImageIndex + 1} / {images.length}
          </div>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevFullScreenImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-md text-white p-4 rounded-full hover:bg-white/20 transition-all"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextFullScreenImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-md text-white p-4 rounded-full hover:bg-white/20 transition-all"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={images[fullScreenImageIndex]?.image || ''}
              alt={`${product.product_details?.name} - Image ${fullScreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl max-w-2xl overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFullScreenImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                      idx === fullScreenImageIndex 
                        ? 'ring-4 ring-white scale-110' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  >
                    <img src={img.image} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Instructions */}
          <div className="absolute bottom-6 right-6 z-10 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium">
            Press ESC to close • Use arrow keys
          </div>

          {/* Click Background to Close */}
          <div
            className="absolute inset-0"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeFullScreen();
            }}
            aria-label="Click to close"
          />
        </div>
      )}
    </>
  );
};

export default ProductInstanceView;
