import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Flame, Zap, Percent, Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCard, type ProductCardData } from './product/ProductCard';
import { SectionHeader } from './ui/section-header';
import { EmptyState } from './ui/empty-state';

const PLACEHOLDER = 'https://via.placeholder.com/150';

interface BestDealsProduct {
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
  is_b2b_eligible?: boolean;
  b2b_price?: number | null;
  b2b_discounted_price?: number | null;
  is_available?: boolean;
  average_rating?: number;
  total_reviews?: number;
}

interface BestDealsSectionProps {
  user?: { b2b_verified?: boolean };
}

const BestDealsSection = ({ user }: BestDealsSectionProps) => {
  const navigate = useNavigate();
  const [todaysPickProducts, setTodaysPickProducts] = useState<BestDealsProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysPick = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Token ${token}` } : {};
        const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/new_trending/`;
        const { data } = await axios.get(url, { timeout: 8000, headers });
        setTodaysPickProducts(data.results || []);
      } catch (err) {
        console.error('Error fetching todays pick products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodaysPick();
  }, []);

  const getDisplayPrice = (product: BestDealsProduct) => {
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

  const toProductCardData = (product: BestDealsProduct): ProductCardData => {
    const pricing = getDisplayPrice(product);
    const hasDiscount = pricing.originalPrice != null && pricing.originalPrice > pricing.currentPrice;

    return {
      id: product.id,
      name: product.product_details?.name || 'Product',
      image: product.product_details?.images?.[0]?.image || PLACEHOLDER,
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

  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-12 animate-pulse">
      <div className="lg:col-span-4 h-[500px] bg-neutral-200 rounded-[2.5rem]" />
      <div className="lg:col-span-8 h-[500px] bg-neutral-100 rounded-[2.5rem]" />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-12">
      
      <div className="lg:col-span-4 relative group perspective-1000">
        <div className="relative h-full w-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(-5deg)_rotateX(2deg)]">
          
          <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-secondary-900 p-1 border border-white/5 shadow-2xl">
            
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-rose-500/10 to-transparent group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] group-hover:bg-primary-500/40 transition-colors duration-500" />
            
            <div className="relative h-full z-10 p-8 flex flex-col items-center justify-center text-center">
              
              <div className="flex items-center gap-2 bg-primary-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Flame size={14} className="animate-pulse" /> Hot Deals
              </div>
              
              <h3 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tighter">
                Limited <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
                  Time Deals
                </span>
              </h3>
              
              <p className="text-secondary-400 mb-8 max-w-[220px] text-sm font-medium opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                Handpicked premium selections at prices that won't last.
              </p>

              <button 
                onClick={() => navigate('/deals')} 
                className="group/btn relative inline-flex items-center justify-center px-8 py-3.5 font-bold text-white transition-all duration-300 bg-primary-600 rounded-2xl hover:bg-primary-500 shadow-xl group-hover:translate-y-[-20px]"
              >
                Explore All
                <ArrowRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <div className="absolute bottom-8 left-0 right-0 px-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => navigate('/flash-sales')}
                      className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-3 rounded-xl text-white text-xs font-bold transition-all"
                    >
                      <Zap size={14} className="text-accent-warning-400" /> Flash Sales
                    </button>
                    <button 
                      onClick={() => navigate('/bulk-discounts')}
                      className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-3 rounded-xl text-white text-xs font-bold transition-all"
                    >
                      <Package size={14} className="text-secondary-400" /> Bulk Deals
                    </button>
                    <button 
                      onClick={() => navigate('/clearance')}
                      className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-3 rounded-xl text-white text-xs font-bold transition-all col-span-2"
                    >
                      <Percent size={14} className="text-accent-success-400" /> Clearance Outlet <ChevronRight size={14} />
                    </button>
                </div>
              </div>

              <div className="absolute bottom-6 flex gap-3 group-hover:opacity-0 transition-opacity">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === 2 ? 'w-8 bg-primary-500' : 'w-2 bg-white/20'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 bg-neutral-50/50 rounded-[2.5rem] p-4 md:p-8 border border-neutral-200/60 shadow-inner flex flex-col">
        <SectionHeader
          title="Top picks today"
          className="mb-8 px-2"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-grow">
            {todaysPickProducts && todaysPickProducts.length > 0 ? (
              todaysPickProducts.slice(0, 3).map((p) => (
                <ProductCard
                  key={p.id}
                  product={toProductCardData(p)}
                  size="lg"
                />
              ))
            ) : (
              <div className="col-span-full h-full flex items-center justify-center">
                <EmptyState
                  icon={ShoppingBag}
                  title="Fresh selections arriving soon"
                  description="Check back later for today's top picks."
                  className="py-8"
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BestDealsSection;
