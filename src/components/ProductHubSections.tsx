import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Banner from '../assets/background.jpg';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  created_at: string;
}

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
  category_details: string;
  category: string;
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
  projected_stockout_date_field: string | null;
  producer: any;
  user: number;
  location: number;
}

interface MarketplaceProduct {
  id: number;
  product: number;
  product_details: ProductDetails;
  discounted_price: number | null;
  listed_price: number;
  percent_off: number;
  savings_amount: number;
  offer_start: string | null;
  offer_end: string | null;
  is_offer_active: boolean | null;
  offer_countdown: string | null;
  estimated_delivery_days: number | null;
  shipping_cost: string;
  is_free_shipping: boolean;
  recent_purchases_count: number;
  listed_date: string;
  is_available: boolean;
  min_order: number | null;
  latitude: number;
  longitude: number;
  bulk_price_tiers: any[];
  variants: any[];
  reviews: any[];
  average_rating: number;
  ratings_breakdown: {
    [key: string]: number;
  };
  total_reviews: number;
  view_count: number;
  rank_score: number;
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
}

const ProductCard: React.FC<{ product: MarketplaceProduct; onClick: () => void }> = ({ product, onClick }) => {
  const price = product.discounted_price || product.listed_price || product.product_details.price || 0;
  const originalPrice = product.listed_price > price ? product.listed_price : null;
  const image = product.product_details.images.length > 0 ? product.product_details.images[0].image : '';
  const name = product.product_details.name || 'Product';
  const hasOffer = product.is_offer_active && product.offer_countdown;

  return (
    <div
      onClick={onClick}
      className="group rounded-xl overflow-hidden cursor-pointer 
      border border-white/40 backdrop-blur-md bg-white/50 
      shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300"
    >
      <div className="relative bg-gray-50/40 p-4">

        {product.is_free_shipping && (
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-md shadow-md z-10">
            Free Shipping
          </div>
        )}

        {hasOffer && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
            Fresh Masala
          </div>
        )}

        <img
          src={image}
          alt={name}
          className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Product';
          }}
        />
      </div>

      <div className="p-3">
        <h3 className="text-xs text-gray-900 mb-2 line-clamp-2 min-h-[40px] font-semibold">
          {name}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-gray-900">
            Rs. {price.toFixed(2)}
          </span>
        </div>

        {originalPrice && (
          <div className="mt-1 text-xs text-gray-500 line-through">
            Rs. {originalPrice.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductHubSections: React.FC = () => {
  const navigate = useNavigate();
  const [bulkProducts, setBulkProducts] = useState<MarketplaceProduct[]>([]);
  const [popularProducts, setPopularProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://appmulyabazzar.com/api/v1/marketplace/');
        const data = await response.json();
        const items = Array.isArray(data) ? data : data.results || data.data || [];

        setBulkProducts(items.slice(0, 3));
        setPopularProducts(items.slice(3, 6));
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = (productId: number | string) => {
    navigate(`/marketplace/${productId}`);
  };

  if (loading) {
    return (
      <div className="w-full py-16 flex items-center justify-center bg-black/80 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="w-full py-16 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${Banner})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>

      <div className="relative max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="rounded-2xl p-6 shadow-xl bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-white drop-shadow-xl">Bulk Saver Hub</h2>
                <p className="text-gray-200 mt-1">Save more when you buy in bulk</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                Special Deals
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {bulkProducts.length > 0 ? (
                bulkProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product.id)}
                  />
                ))
              ) : (
                <p className="text-gray-200 col-span-3 text-center py-8">No bulk products available</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-6 shadow-xl bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-white drop-shadow-xl">Buy Again</h2>
                <p className="text-gray-200 mt-1">Your favorites are waiting</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                Trending
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {popularProducts.length > 0 ? (
                popularProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product.id)}
                  />
                ))
              ) : (
                <p className="text-gray-200 col-span-3 text-center py-8">No products available</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductHubSections;
