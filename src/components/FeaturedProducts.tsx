import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [products, setProducts] = useState<FeaturedProduct[] | null>(initialProducts ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <section className="w-full px-4 py-8">
      <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold">Featured Products</h2>
        <button
          onClick={() => navigate('/marketplace/all-products')}
          className="text-sm text-primary-600 hover:underline"
        >
          View all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {products.slice(0, 8).map((item: FeaturedProduct) => {
          const { price, isB2BPrice, minQuantity } = getDisplayPrice(item);
          
          return (
          <article
            key={item.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/marketplace/${item.id}`)}
          >
            <div className="relative w-full h-56 sm:h-64 overflow-hidden">
              <img
                src={item.product_details?.images?.[0]?.image ?? PLACEHOLDER}
                alt={item.product_details?.name ?? 'Product'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {isB2BPrice && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
                  B2B
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">{item.product_details?.category_details}</span>
                {/* <div className="flex items-center gap-1 text-sm text-neutral-600">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{(item.average_rating || 0).toFixed(1)}</span>
                </div> */}
              </div>

              <h3 className="font-semibold text-neutral-900 line-clamp-2">{item.product_details?.name}</h3>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-accent-success-600 font-bold">Rs.{price}</div>
                  {isB2BPrice && minQuantity > 1 && (
                    <div className="text-xs text-neutral-600 mt-1">
                      Min. order: {minQuantity} units
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(item as any); }}
                    className="bg-primary-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </article>
        );})}
      </div>
    </section>
  );
};

export default FeaturedProducts;
