import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

const csrftoken = Cookies.get('csrftoken');
import ProductInstanceView from './ProductInstanceView';
import RelatedProductsSection from './RelatedProductsSection';
import Footer from './Footer';
import ProductSearchBar from './ProductSearchBar';

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
  views_count: number;
  recent_purchases_count: number;
}



const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const logProductView = async (productId: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/products/${productId}/log-view/`,
        {},
        {
          headers: { 
            // 'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
        withCredentials: true,
        }
      );
    } catch (error) {
      console.error('Error logging product view:', error);
    }
  };

  useEffect(() => {
    if (!productId) {
      setError('Product ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    axios
      .get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/${productId}/`,
      )
      .then(res => {
        setProduct(res.data);
        // Log the product view after successfully fetching product details
        logProductView(productId);
      })
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600 text-lg font-medium">Loading product details...</div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-rose-600 text-lg font-medium">{error || 'Product not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ProductSearchBar />
      <div className="flex-1 w-full mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-80 mt-16">
            <img
              src="https://media.istockphoto.com/id/1979468745/vector/discount-coupon-vector-set-on-white-background.jpg?s=2048x2048&w=is&k=20&c=HD1MCSyYwum6ByCfP0UKBiajQS72pV8sI2cW4DnvF1E="
              alt="Left Banner"
              className="object-cover w-full h-[600px] rounded-xl shadow-md"
              loading="lazy"
            />
          </div>

          <div className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-0">
            <div className="w-full max-w-4xl">
              <ProductInstanceView product={product} />
            </div>
          </div>

          <div className="hidden lg:block w-80 mt-16">
            <img
              src="https://media.istockphoto.com/id/1979468745/vector/discount-coupon-vector-set-on-white-background.jpg?s=2048x2048&w=is&k=20&c=HD1MCSyYwum6ByCfP0UKBiajQS72pV8sI2cW4DnvF1E="
              alt="Right Banner"
              className="object-cover w-full h-[600px] rounded-xl shadow-md"
              loading="lazy"
            />
          </div>
        </div>

        {product.product_details?.category && (
          <div className="mt-4 mb-8 w-full px-2 sm:px-2 lg:px-0">
            <RelatedProductsSection
              productId={product.id}
              category={product.product_details?.category}
            />
          </div>
        )}
      </div>
      <Footer />
    </div>  
  );
};

export default ProductPage;