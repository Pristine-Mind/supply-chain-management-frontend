import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
type CartProduct = Parameters<ReturnType<typeof useCart>['addToCart']>[0];
import { ProductCard, type ProductCardData } from './product/ProductCard';
import { EmptyState } from './ui/empty-state';
import { Spinner } from './ui/spinner';
import { PageContainer } from './ui/page-container';
import { SectionHeader } from './ui/section-header';
import Navbar from './Navbar';
import Footer from './Footer';

const PLACEHOLDER = 'https://via.placeholder.com/400';

interface DealItem {
  id: number;
  product_details?: {
    name?: string;
    images?: { image?: string }[];
    category_details?: string;
    stock?: number;
  };
  listed_price: number;
  discounted_price?: number | null;
  percent_off?: number;
  is_delivery_free?: boolean;
  is_available?: boolean;
  average_rating?: number;
  total_reviews?: number;
}

const toProductCardData = (item: DealItem): ProductCardData => {
  const hasDiscount =
    item.discounted_price != null &&
    item.discounted_price > 0 &&
    item.discounted_price < item.listed_price;

  return {
    id: item.id,
    name: item.product_details?.name || 'Deal Product',
    image: item.product_details?.images?.[0]?.image || PLACEHOLDER,
    href: `/marketplace/${item.id}`,
    price: hasDiscount ? item.discounted_price! : item.listed_price,
    originalPrice: hasDiscount ? item.listed_price : null,
    percentOff: item.percent_off,
    savings: hasDiscount ? item.listed_price - item.discounted_price! : 0,
    stock: item.product_details?.stock ?? 0,
    isDeliveryFree: item.is_delivery_free,
    category: item.product_details?.category_details,
    rating: item.average_rating,
    reviewCount: item.total_reviews,
    isAvailable: item.is_available ?? true,
  };
};

const Deals: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const base = import.meta.env.VITE_REACT_APP_API_URL || 'https://appmulyabazzar.com';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Token ${token}` } : {};
        
        const { data } = await axios.get(`${base}/api/v1/marketplace-trending/deals/`, {
          headers
        });
        setProducts(data.results || data || []);
      } catch {
        setError('Failed to load deals products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <PageContainer className="py-12">
          <div className="flex justify-center">
            <Spinner size="lg" />
          </div>
        </PageContainer>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <PageContainer className="py-12">
          <EmptyState
            icon={Search}
            title="Unable to load deals"
            description={error}
            action={
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Retry
              </button>
            }
          />
        </PageContainer>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageContainer className="py-8">
        <SectionHeader
          title="Trending Deals & Discounts"
          subtitle={`${products.length} items`}
        />

        {(!products || products.length === 0) ? (
          <EmptyState
            icon={ShoppingBag}
            title="No deals found"
            description="We couldn't find any deals right now. Try browsing the marketplace."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/marketplace/all-products')}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Marketplace
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Retry
                </button>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                product={toProductCardData(item)}
                size="md"
                showAddToCart
                onAddToCart={() => addToCart(item as unknown as CartProduct)}
              />
            ))}
          </div>
        )}
      </PageContainer>
      <Footer />
    </>
  );
};

export default Deals;
