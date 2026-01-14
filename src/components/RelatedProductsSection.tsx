import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Tag, ChevronRight, ShoppingBag } from 'lucide-react';

interface ProductDetails {
  name: string;
  images: { image: string }[];
  category_details?: string;
}

interface MarketplaceProduct {
  id: number;
  product_details?: ProductDetails;
  listed_price: number;
  discounted_price?: number;
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
}

const RelatedProductsSection: React.FC<{ productId: number; category?: string }> = ({ productId }) => {
  const [related, setRelated] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!productId) return;
    
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Token ${token}` } : {};
        
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/${productId}/related/`,
          { headers }
        );
        
        const data = response.data.results || response.data || [];
        setRelated(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [productId]);

  const renderPrice = (product: MarketplaceProduct) => {
    const isB2BUser = user?.b2b_verified === true;
    const isB2BEligible = product.is_b2b_eligible === true;
    
    let currentPrice: number;
    let originalPrice: number | undefined;

    if (isB2BUser && isB2BEligible) {
      currentPrice = product.b2b_discounted_price || product.b2b_price || product.listed_price;
      originalPrice = product.b2b_discounted_price ? (product.b2b_price || product.listed_price) : undefined;
    } else {
      currentPrice = product.discounted_price || product.listed_price;
      originalPrice = product.discounted_price ? product.listed_price : undefined;
    }

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-orange-600">
            Rs. {currentPrice.toLocaleString()}
          </span>
          {originalPrice && originalPrice > currentPrice && (
            <span className="text-sm text-gray-400 line-through font-normal">
              Rs. {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        {isB2BUser && isB2BEligible && (
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight flex items-center mt-1">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1 animate-pulse" />
            B2B Pricing Applied
          </span>
        )}
      </div>
    );
  };

  if (!loading && related.length === 0) return null;

  return (
    <div className="w-full mt-16 border-t border-gray-100 pt-12 mb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">You May Also Like</h2>
        </div>
        <button 
          onClick={() => navigate('/marketplace')}
          className="hidden sm:flex items-center text-sm font-semibold text-orange-600 hover:text-orange-800 transition-colors group"
        >
          View All Marketplace <ChevronRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {loading 
          ? [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
          : related.map(rel => (
          <div
            key={rel.id}
            className="group relative bg-white rounded-2xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] cursor-pointer"
            onClick={() => navigate(`/marketplace/${rel.id}`)}
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 relative">
              <img
                src={rel.product_details?.images?.[0]?.image || 'https://via.placeholder.com/400x500?text=No+Image'}
                alt={rel.product_details?.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-md text-gray-800 shadow-sm border border-gray-100 uppercase tracking-wider">
                  <Tag className="w-3 h-3 mr-1 text-orange-500" />
                  {rel.product_details?.category_details || 'Marketplace'}
                </span>
              </div>

              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white p-3 rounded-full shadow-xl">
                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                 </div>
              </div>
            </div>

            <div className="pt-5 px-1 pb-2">
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-orange-600 transition-colors leading-relaxed">
                {rel.product_details?.name}
              </h3>
              
              <div className="mt-4 flex items-end justify-between">
                {renderPrice(rel)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-[4/5] bg-gray-200 rounded-2xl mb-4" />
    <div className="space-y-3 px-1">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="pt-2">
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  </div>
);

export default RelatedProductsSection;
