import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

const RelatedProductsSection: React.FC<{ productId: number; category: string }> = ({ productId, category }) => {
  const [related, setRelated] = useState<MarketplaceProduct[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper function to get the appropriate price based on user's B2B status
  const getDisplayPrice = (product: MarketplaceProduct) => {
    const isB2BUser = user?.b2b_verified === true;
    const isB2BEligible = product.is_b2b_eligible === true;
    
    if (isB2BUser && isB2BEligible) {
      return product.b2b_discounted_price || product.b2b_price || product.listed_price;
    } else {
      return product.discounted_price || product.listed_price;
    }
  };

  useEffect(() => {
    if (category) {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Token ${token}` } : {};
      
      axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/?category=${encodeURIComponent(category)}`, {
        headers
      })
      .then(res => {
        const relatedProducts = (res.data.results || res.data || []).filter((p: any) => p.id !== productId);
        setRelated(relatedProducts);
      })
      .catch(() => setRelated([]));
    }
  }, [category, productId]);

  if (related.length === 0) return null;
  return (
    <div className="w-full mt-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">You May Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {related.slice(0, 4).map(rel => (
          <div
            key={rel.id}
            className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            onClick={() => navigate(`/marketplace/${rel.id}`)}
          >
            <div className="aspect-square overflow-hidden bg-neutral-100">
              <img
                src={rel.product_details?.images?.[0]?.image || ''}
                alt={rel.product_details?.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                {rel.product_details?.name}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-primary-600">
                    Rs. {getDisplayPrice(rel).toLocaleString()}
                  </span>
                  {user?.b2b_verified && rel.is_b2b_eligible && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                      B2B
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-500 px-2 py-1 bg-neutral-100 rounded-full">
                  {rel.product_details?.category_details || 'Uncategorized'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProductsSection;
