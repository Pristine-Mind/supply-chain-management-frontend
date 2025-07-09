import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ProductInstanceView from './ProductInstanceView';
import RelatedProductsSection from './RelatedProductsSection';

interface ProductDetails {
  name: string;
  images: { image: string }[];
  category_details?: string;
  category?: string;
}
interface MarketplaceProduct {
  id: number;
  product_details?: ProductDetails;
  listed_price: number;
}

const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/${productId}/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` }
    })
      .then(res => setProduct(res.data))
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <div className="text-center text-gray-500 py-16">Loading product details...</div>;
  }
  if (error || !product) {
    return <div className="text-center text-red-500 py-16">{error || 'Product not found'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <ProductInstanceView product={product} />
      </div>
      {product.product_details?.category && (
        <RelatedProductsSection
          productId={product.id}
          category={product.product_details?.category}
        />
      )}
    </div>
  );
};

export default ProductPage;
