import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FiArrowLeft, FiShoppingBag, FiEye, FiHeart, FiAlertCircle } from 'react-icons/fi';

const csrftoken = Cookies.get('csrftoken');
import ProductSearchBar from './ProductSearchBar';
import ProductInstanceView from './ProductInstanceView';
import RelatedProductsSection from './RelatedProductsSection';
import Footer from './Footer';

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
        logProductView(productId);
      })
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <ProductSearchBar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-200 rounded-xl h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded mt-8"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <ProductSearchBar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
              <FiAlertCircle className="text-rose-500 w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The product you are looking for does not exist or has been removed.'}
            </p>
            <Link 
              to="/marketplace" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Marketplace
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <ProductSearchBar />
      </div>
      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link to="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link to="/marketplace" className="hover:text-blue-600 transition-colors">Marketplace</Link></li>
            <li>/</li>
            <li className="font-medium text-gray-900 truncate max-w-xs" title={product.product_details?.name}>
              {product.product_details?.name}
            </li>
          </ol>
        </nav>

        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-12 gap-8 p-6">
            <div className="hidden md:block md:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                  <FiShoppingBag className="mx-auto w-8 h-8 text-blue-600 mb-3" />
                  <p className="text-sm font-medium text-blue-700">Free Shipping on Orders Over $50</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 text-center">
                  <FiHeart className="mx-auto w-8 h-8 text-amber-600 mb-3" />
                  <p className="text-sm font-medium text-amber-700">30-Day Return Policy</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-8">
              <ProductInstanceView product={product} />
            </div>
            <div className="hidden md:block md:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 text-center">
                  <FiEye className="mx-auto w-8 h-8 text-emerald-600 mb-3" />
                  <p className="text-2xl font-bold text-gray-800">{product.views_count}</p>
                  <p className="text-sm text-gray-600">Views</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 text-center">
                  <FiShoppingBag className="mx-auto w-8 h-8 text-purple-600 mb-3" />
                  <p className="text-2xl font-bold text-gray-800">{product.recent_purchases_count}</p>
                  <p className="text-sm text-gray-600">Recent Purchases</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {product.product_details?.category && (
          <div className="mt-12">
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