import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ArrowLeft, ShoppingBag, Eye, Heart, AlertCircle, Shield, Truck, RotateCcw } from 'lucide-react';

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
  discounted_price?: number;
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
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
    
    // Get authentication token for API request
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Token ${token}` } : {};
    
    axios
      .get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/${productId}/`, {
        headers
      })
      .then(res => {
        setProduct(res.data);
        // Check deliverability after product is loaded
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
          <div className="max-w-7xl mx-auto bg-white rounded-xl border border-neutral-200 p-8 animate-pulse">
            <div className="h-8 bg-neutral-200 rounded-lg w-1/4 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-neutral-200 rounded-xl h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-neutral-200 rounded-lg w-3/4"></div>
                <div className="h-6 bg-neutral-200 rounded-lg w-1/2"></div>
                <div className="h-4 bg-neutral-200 rounded-lg w-1/3"></div>
                <div className="h-32 bg-neutral-200 rounded-lg mt-8"></div>
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
          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="text-accent-error-500 w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
            <p className="text-neutral-600 mb-6">
              {error || 'The product you are looking for does not exist or has been removed.'}
            </p>
            <Link 
              to="/marketplace" 
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
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
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-neutral-200">
        <ProductSearchBar />
      </div>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-neutral-600">
            <li><Link to="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
            <li>›</li>
            <li><Link to="/marketplace" className="hover:text-primary-600 transition-colors">Marketplace</Link></li>
            <li>›</li>
            <li className="font-medium text-neutral-900 truncate max-w-xs" title={product.product_details?.name}>
              {product.product_details?.name}
            </li>
          </ol>
        </nav>

        {/* Main Product Layout */}
        <div className="max-w-7xl mx-auto bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="grid md:grid-cols-12 gap-8 p-6">
            {/* Left Sidebar - Trust & Features */}
            <div className="hidden md:block md:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Truck className="mx-auto w-8 h-8 text-blue-600 mb-3" />
                  <p className="text-sm font-medium text-blue-700">Free Shipping</p>
                  <p className="text-xs text-blue-600">on orders over Rs.2500</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <RotateCcw className="mx-auto w-8 h-8 text-green-600 mb-3" />
                  <p className="text-sm font-medium text-green-700">30-Day Returns</p>
                  <p className="text-xs text-green-600">Easy return policy</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <Shield className="mx-auto w-8 h-8 text-purple-600 mb-3" />
                  <p className="text-sm font-medium text-purple-700">Secure Payment</p>
                  <p className="text-xs text-purple-600">100% secure checkout</p>
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
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
                  <Eye className="mx-auto w-8 h-8 text-neutral-600 mb-3" />
                  <p className="text-2xl font-bold text-neutral-900">{product.views_count}</p>
                  <p className="text-sm text-neutral-600">Views</p>
                </div>
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center">
                  <ShoppingBag className="mx-auto w-8 h-8 text-primary-600 mb-3" />
                  <p className="text-2xl font-bold text-neutral-900">{product.recent_purchases_count}</p>
                  <p className="text-sm text-neutral-600">Recent Purchases</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <Heart className="mx-auto w-8 h-8 text-orange-600 mb-3" />
                  <p className="text-sm font-medium text-orange-700">Wishlist Item</p>
                  <p className="text-xs text-orange-600">Save for later</p>
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