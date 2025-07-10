import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface ProductDetails {
  name: string;
  images: { image: string }[];
  category_details?: string;
}
interface MarketplaceProduct {
  id: number;
  product_details?: ProductDetails;
  listed_price: number;
}

const RelatedProductsSection: React.FC<{ productId: number; category: string }> = ({ productId, category }) => {
  const [related, setRelated] = useState<MarketplaceProduct[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (category) {
      axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/?category=${encodeURIComponent(category)}`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
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
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {related.slice(0, 4).map(rel => (
          <div
            key={rel.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer flex flex-col"
            onClick={() => navigate(`/marketplace/${rel.id}`)}
          >
            <img
              src={rel.product_details?.images?.[0]?.image || ''}
              alt={rel.product_details?.name}
              className="w-full h-32 object-cover rounded mb-3"
            />
            <div className="font-semibold text-gray-800 truncate mb-1">{rel.product_details?.name}</div>
            <div className="text-orange-600 font-bold mb-2">Rs.{rel.listed_price.toFixed(2)}</div>
            <div className="text-xs text-gray-500 truncate">{rel.product_details?.category_details || ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProductsSection;
