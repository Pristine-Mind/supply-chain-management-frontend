import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';

const PLACEHOLDER = 'https://via.placeholder.com/300';

interface ProductImage {
  id?: number;
  image?: string;
  alt_text?: string | null;
  created_at?: string;
}

interface ProductDetails {
  id?: number;
  name?: string;
  description?: string;
  images?: ProductImage[];
  category_details?: string;
  category?: string;
  sku?: string;
  price?: number;
  cost_price?: number;
  stock?: number;
  reorder_level?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  is_marketplace_created?: boolean;
  avg_daily_demand?: number;
  stddev_daily_demand?: number;
  safety_stock?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  lead_time_days?: number;
  projected_stockout_date_field?: string | null;
  producer?: any;
  user?: number;
  location?: number;
}

interface FeaturedProduct {
  id: number;
  product: number;
  product_details: ProductDetails;
  listed_price: number;
  discounted_price?: number | null;
  percent_off?: number;
  savings_amount?: number;
  offer_start?: string | null;
  offer_end?: string | null;
  is_offer_active?: boolean | null;
  offer_countdown?: string | null;
  estimated_delivery_days?: number | null;
  shipping_cost?: string;
  is_free_shipping?: boolean;
  recent_purchases_count?: number;
  listed_date?: string;
  is_available?: boolean;
  min_order?: number | null;
  latitude?: number;
  longitude?: number;
  bulk_price_tiers?: any[];
  variants?: any[];
  reviews?: any[];
  average_rating?: number;
  ratings_breakdown?: {
    [key: string]: number;
  };
  total_reviews?: number;
  view_count?: number;
  rank_score?: number;
  b2b_price?: number;
  b2b_min_quantity?: number;
  is_b2b_eligible?: boolean;
}

const FeaturedProducts: React.FC<{ products?: any[] }> = ({ products: initialProducts }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<FeaturedProduct[] | null>(initialProducts ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<FeaturedProduct | null>(null);

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!isAuthenticated) {
        setPendingProduct(product);
        setShowLoginModal(true);
        return;
      }
      await addToCart(product);
    } catch (error) {
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Helper function to determine the correct price to display
  const getDisplayPrice = (product: FeaturedProduct) => {
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
    if (product.discounted_price && product.discounted_price < product.listed_price) {
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

  useEffect(() => {
    if (initialProducts) return; // parent supplied
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/featured/`;
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Token ${token}` } : {};
        
        const { data } = await axios.get(url, { headers });
        setProducts(data.results || data || []);
      } catch (err) {
        setError('Failed to load featured products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [initialProducts]);

  if (loading) return (
    <div className="py-8 flex justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  if (error) return <div className="text-center py-6 text-status-error">{error}</div>;
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-12 bg-gradient-to-b from-white to-neutral-50">
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setPendingProduct(null);
          }}
          onSuccess={async () => {
            setShowLoginModal(false);
            if (pendingProduct) {
              try {
                await addToCart(pendingProduct as any);
              } catch (e) {
                // ignore
              } finally {
                setPendingProduct(null);
              }
            }
          }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Featured Collection</h2>
            <p className="mt-2 text-sm text-gray-500">Handpicked items just for you</p>
          </div>
          <button
            onClick={() => navigate('/marketplace/all-products')}
            className="group flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((item: FeaturedProduct) => {
            const { price, isB2BPrice, minQuantity } = getDisplayPrice(item);
            
            return (
            <article
              key={item.id}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-primary-100 transition-all duration-300 cursor-pointer flex flex-col h-full"
              onClick={() => navigate(`/marketplace/${item.id}`)}
            >
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
                <img
                  src={item.product_details?.images?.[0]?.image ?? PLACEHOLDER}
                  alt={item.product_details?.name ?? 'Product'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {isB2BPrice && (
                    <div className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      B2B
                    </div>
                  )}
                  {item.percent_off && item.percent_off > 0 && (
                    <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      {Math.round(item.percent_off)}% OFF
                    </div>
                  )}
                </div>

                {/* Quick Add Button (Visible on Hover) */}
                <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => handleAddToCart(item, e)}
                    className="w-full bg-white/90 backdrop-blur-md text-gray-900 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <div className="mb-2">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                    {item.product_details?.category_details}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors text-lg">
                  {item.product_details?.name}
                </h3>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">Rs. {(price ?? 0).toLocaleString()}</span>
                      {item.listed_price > (price ?? 0) && (
                        <span className="text-sm text-gray-400 line-through">Rs. {item.listed_price.toLocaleString()}</span>
                      )}
                    </div>
                    {isB2BPrice && minQuantity > 1 && (
                      <div className="text-xs font-medium text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded inline-block">
                        Min: {minQuantity} units
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );})}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
