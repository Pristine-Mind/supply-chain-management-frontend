import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCartPlus,
  FaShoppingCart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaInfoCircle
} from 'react-icons/fa';

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
}

const ProductInstanceView: React.FC<{ product: MarketplaceProductInstance }> = ({ product }) => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [tab, setTab] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const reviews = product.reviews || [];
  const reviewsLoading = false;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const buildStars = (rating: number) => (
    <div className="flex gap-1 text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < Math.floor(rating)) return <FaStar key={i} />;
        if (i < rating) return <FaStarHalfAlt key={i} />;
        return <FaRegStar key={i} />;
      })}
    </div>
  );

  const images = product.product_details?.images || [];

  const showOffer = product.is_offer_active && product.discounted_price < product.listed_price;
  const priceDisplay = showOffer ? (
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold text-orange-600">Rs. {product.discounted_price}</span>
      <span className="text-lg text-gray-500 line-through">Rs. {product.listed_price}</span>
      <span className="bg-rose-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
        -{product.percent_off}%
      </span>
    </div>
  ) : (
    <span className="text-lg font-bold text-orange-600">Rs. {product.listed_price}</span>
  );

  const shippingDisplay = product.is_free_shipping ? (
    <span className="text-emerald-600 font-medium">Free Shipping</span>
  ) : (
    <span className="text-gray-600">Shipping: Rs. {product.shipping_cost}</span>
  );

  const bulkPricing = product.bulk_price_tiers?.length > 0 ? (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-900">Bulk Pricing</h3>
      <ul className="mt-2 text-sm text-gray-600 space-y-1">
        {product.bulk_price_tiers.map((tier, idx) => (
          <li key={idx}>
            {tier.min_quantity}+ units: Rs. {tier.price_per_unit} ({tier.discount_percent}% off)
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  const ratingsBreakdown = product.ratings_breakdown ? (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-900">Ratings Breakdown</h3>
      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
        {Object.entries(product.ratings_breakdown).map(([star, percent]) => (
          <div key={star} className="flex items-center gap-2">
            <FaStar className="text-yellow-400" /> {star}: {percent}%
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={images[currentImage]?.image || ''}
                  alt={product.product_details?.name}
                  className="w-full h-full max-h-[600px] object-contain transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentImage(i => (i > 0 ? i - 1 : images.length - 1))}
                    className="p-3 rounded-full hover:bg-gray-100 transition"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-20 h-20 rounded-lg border overflow-hidden transition-all ${
                        idx === currentImage ? 'ring-2 ring-rose-500' : 'border-gray-200'
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={img.image} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentImage(i => (i < images.length - 1 ? i + 1 : 0))}
                    className="p-3 rounded-full hover:bg-gray-100 transition"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.product_details?.name}</h1>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium text-orange-600">{product.product_details?.category_details}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">Stock:</span>
                <span className="font-medium">{product.product_details?.stock}</span>
              </div>
              {product.min_order > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">Min Order:</span>
                  <span className="font-medium">{product.min_order}</span>
                </div>
              )}

              <div className="mt-4">
                <span className="text-gray-500 text-lg">Price: {priceDisplay}</span>
              </div>

              <div className="mt-2 text-sm">{shippingDisplay}</div>

              {bulkPricing}
              {ratingsBreakdown}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setCartCount(c => c + 1)}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-all shadow-md text-lg font-medium"
                  aria-label="Add to cart"
                >
                  <FaCartPlus /> Add to Cart
                </button>
                <button
                  onClick={() => alert('Proceed to buy (mock)')}
                  className="flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-all shadow-md text-lg font-medium"
                  aria-label="Buy now"
                >
                  <FaShoppingCart /> Buy Now
                </button>
                <div className="relative flex items-center" onClick={() => navigate('/cart')}>
                  <FaShoppingCart className="text-2xl text-gray-600 hover:text-gray-800 transition cursor-pointer" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full px-2 py-1">
                      {cartCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div role="tablist" className="flex border-b border-gray-200">
              {['Description', 'Reviews'].map((label, idx) => (
                <button
                  key={idx}
                  role="tab"
                  aria-selected={tab === idx}
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                    tab === idx ? 'border-b-2 border-rose-500 text-rose-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setTab(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-6">
              {tab === 0 && (
                <div className="space-y-4 text-gray-700">
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>High quality and best price</li>
                    <li>Fast delivery and easy returns</li>
                    <li>Trusted by thousands of customers</li>
                  </ul>
                  <p
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.product_details?.description }}
                  />
                </div>
              )}
              {tab === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                  {reviewsLoading ? (
                    <p className="text-center text-gray-500">Loading...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-gray-500 text-sm">No reviews yet.</p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {reviews.map((r, idx) => (
                        <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow-sm transition hover:shadow-md">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center font-bold text-rose-600 text-lg">
                              {(r.user?.[0] || 'A').toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{r.user || 'Anonymous'}</span>
                              <span className="block text-xs text-gray-400">{formatDate(r.created_at)}</span>
                            </div>
                          </div>
                          {buildStars(r.rating)}
                          <p className="mt-2 text-sm text-gray-700">{r.review_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInstanceView;