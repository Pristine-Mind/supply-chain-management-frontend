import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ProductCard, type ProductCardData } from './product/ProductCard';
import { SectionHeader } from './ui/section-header';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  created_at: string;
}

interface ProductDetails {
  id: number;
  name: string;
  images: ProductImage[];
  category_details: string;
  description?: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock?: number;
  is_active?: boolean;
}

interface SimilarProductItem {
  product: {
    id: number;
    product: number;
    product_details: ProductDetails;
    listed_price: number;
    discounted_price?: number | null;
    percent_off?: number;
    is_available?: boolean;
    is_b2b_eligible?: boolean;
    b2b_price?: number | null;
    b2b_discounted_price?: number | null;
    b2b_min_quantity?: number | null;
    average_rating?: number;
    total_reviews?: number;
  };
}

interface SimilarProductsResponse {
  product_id: number;
  similar_products: SimilarProductItem[];
}

interface MarketplaceProduct {
  id: number;
  product_details?: ProductDetails;
  listed_price: number;
  discounted_price?: number | null;
  percent_off?: number;
  is_b2b_eligible?: boolean;
  b2b_price?: number | null;
  b2b_discounted_price?: number | null;
  b2b_min_quantity?: number | null;
  is_available?: boolean;
  average_rating?: number;
  total_reviews?: number;
}

const RelatedProductsSection: React.FC<{ productId: number; category?: string }> = ({ productId }) => {
  const [related, setRelated] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!productId) return;
    
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Token ${token}` } : {};
        
        const response = await axios.get<SimilarProductsResponse>(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/products/${productId}/similar/`,
          { headers }
        );
        
        const similarProducts = response.data?.similar_products || [];
        const transformedProducts: MarketplaceProduct[] = similarProducts
          .map((item: SimilarProductItem) => ({
            id: item.product.id,
            product_details: item.product.product_details,
            listed_price: item.product.listed_price,
            discounted_price: item.product.discounted_price,
            percent_off: item.product.percent_off,
            is_available: item.product.is_available,
            is_b2b_eligible: item.product.is_b2b_eligible,
            b2b_price: item.product.b2b_price,
            b2b_discounted_price: item.product.b2b_discounted_price,
            b2b_min_quantity: item.product.b2b_min_quantity,
            average_rating: item.product.average_rating,
            total_reviews: item.product.total_reviews,
          }))
          .slice(0, 4);
        
        setRelated(transformedProducts);
      } catch (error) {
        console.error("Error fetching similar products:", error);
        setRelated([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [productId]);

  const getDisplayPrice = (product: MarketplaceProduct) => {
    const isB2BUser = user?.b2b_verified === true;
    const isB2BEligible = product.is_b2b_eligible === true;
    
    if (isB2BUser && isB2BEligible) {
      return {
        currentPrice: product.b2b_discounted_price || product.b2b_price || product.listed_price,
        originalPrice: product.listed_price,
        isB2BPrice: true,
      };
    } else {
      return {
        currentPrice: product.discounted_price || product.listed_price,
        originalPrice: product.discounted_price ? product.listed_price : null,
        isB2BPrice: false,
      };
    }
  };

  const toProductCardData = (product: MarketplaceProduct): ProductCardData => {
    const pricing = getDisplayPrice(product);
    const hasDiscount = pricing.originalPrice != null && pricing.originalPrice > pricing.currentPrice;

    return {
      id: product.id,
      name: product.product_details?.name || 'Product',
      image: product.product_details?.images?.[0]?.image || 'https://via.placeholder.com/400x500?text=No+Image',
      href: `/marketplace/${product.id}`,
      price: pricing.currentPrice,
      originalPrice: pricing.originalPrice,
      percentOff: product.percent_off,
      savings: hasDiscount ? pricing.originalPrice! - pricing.currentPrice : 0,
      stock: product.product_details?.stock ?? 0,
      category: product.product_details?.category_details,
      rating: product.average_rating,
      reviewCount: product.total_reviews,
      isB2B: pricing.isB2BPrice,
      isAvailable: product.is_available ?? true,
    };
  };

  if (!loading && related.length === 0) return null;

  return (
    <div className="w-full mt-16 border-t border-gray-100 pt-12 mb-20">
      <SectionHeader
        title="You May Also Like"
        action={{ label: 'View All Marketplace', to: '/marketplace' }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {loading 
          ? [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
          : related.map(rel => (
            <ProductCard
              key={rel.id}
              product={toProductCardData(rel)}
              size="md"
            />
          ))
        }
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
