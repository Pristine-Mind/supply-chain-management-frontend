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
      <div className="min-h-screen bg-neutral-50">
        <ProductSearchBar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-7xl mx-auto card-elevated bg-white p-8 animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-neutral-200 rounded-xl h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                <div className="h-32 bg-neutral-200 rounded mt-8"></div>
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
      <div className="min-h-screen bg-neutral-50">
        <ProductSearchBar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto card-elevated bg-white p-8 text-center">
            <div className="flex justify-center mb-4">
              <FiAlertCircle className="text-accent-error-500 w-12 h-12" />
            </div>
            <h2 className="text-h2 font-bold text-gray-800 mb-2">Product Not Found</h2>
            <p className="text-body text-neutral-600 mb-6">
              {error || 'The product you are looking for does not exist or has been removed.'}
            </p>
            <Link 
              to="/marketplace" 
              className="btn-primary inline-flex items-center"
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
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-10 bg-white shadow-elevation-sm">
        <ProductSearchBar />
      </div>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-body text-neutral-600">
            <li><Link to="/" className="hover:text-primary-500 transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link to="/marketplace" className="hover:text-primary-500 transition-colors">Marketplace</Link></li>
            <li>/</li>
            <li className="font-medium text-gray-900 truncate max-w-xs" title={product.product_details?.name}>
              {product.product_details?.name}
            </li>
          </ol>
        </nav>

        {/* Main Product Layout - F Pattern */}
        <div className="max-w-7xl mx-auto card-elevated bg-white overflow-hidden">
          <div className="grid md:grid-cols-12 gap-8 p-6">
            {/* Left Sidebar - Trust & Features */}
            <div className="hidden md:block md:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="card-soft bg-accent-info-50 text-center">
                  <FiShoppingBag className="mx-auto w-8 h-8 text-accent-info-600 mb-3" />
                  <p className="text-body font-medium text-accent-info-700">Free Shipping on Orders Over Rs.2500</p>
                </div>
                <div className="card-soft bg-accent-warning-50 text-center">
                  <FiHeart className="mx-auto w-8 h-8 text-accent-warning-600 mb-3" />
                  <p className="text-body font-medium text-accent-warning-700">30-Day Return Policy</p>
                </div>
              </div>
            </div>

            {/* Main Content - Product Details */}
            <div className="md:col-span-8">
              <ProductInstanceView product={product} />
            </div>
            
            {/* Right Sidebar - Social Proof */}
            <div className="hidden md:block md:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="card-soft bg-accent-success-50 text-center">
                  <FiEye className="mx-auto w-8 h-8 text-accent-success-600 mb-3" />
                  <p className="text-h2 font-bold text-gray-800">{product.views_count}</p>
                  <p className="text-body text-neutral-600">Views</p>
                </div>
                <div className="card-soft bg-primary-50 text-center">
                  <FiShoppingBag className="mx-auto w-8 h-8 text-primary-600 mb-3" />
                  <p className="text-h2 font-bold text-gray-800">{product.recent_purchases_count}</p>
                  <p className="text-body text-neutral-600">Recent Purchases</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
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