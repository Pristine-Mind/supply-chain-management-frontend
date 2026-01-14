import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Flame, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDER = 'https://via.placeholder.com/150';

interface BestDealsSectionProps {
  user?: any;
}

const BestDealsSection = ({ user }: BestDealsSectionProps) => {
  const navigate = useNavigate();
  const [todaysPickProducts, setTodaysPickProducts] = useState<any[]>([]);
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

  const getDisplayPrice = (product: any, user: any) => {
    const isB2BUser = user?.b2b_verified === true;
    const isB2BEligible = product.is_b2b_eligible === true;
    
    if (isB2BUser && isB2BEligible) {
      return {
        currentPrice: product.b2b_discounted_price || product.b2b_price || product.listed_price,
        originalPrice: product.listed_price,
        isB2BPrice: true,
        minQuantity: product.b2b_min_quantity || 1,
        savings: Math.max(0, product.listed_price - (product.b2b_discounted_price || product.b2b_price || product.listed_price))
      };
    } else {
      return {
        currentPrice: product.discounted_price || product.listed_price,
        originalPrice: product.discounted_price ? product.listed_price : null,
        isB2BPrice: false,
        minQuantity: 1,
        savings: product.discounted_price ? (product.listed_price - product.discounted_price) : 0
      };
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-12 animate-pulse">
      <div className="lg:col-span-4 h-[500px] bg-gray-200 rounded-[2.5rem]" />
      <div className="lg:col-span-8 h-[500px] bg-gray-100 rounded-[2.5rem]" />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-12">
      
      <div className="lg:col-span-4 relative group overflow-hidden rounded-[2.5rem] bg-slate-900 p-1">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-400 to-rose-500 opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500/30 rounded-full blur-[100px] animate-pulse" />
        
        <div className="relative h-full bg-white/5 backdrop-blur-2xl rounded-[2.3rem] border border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-xl shadow-orange-500/20">
            <Flame size={14} className="animate-bounce" /> Hot Deals
          </div>
          
          <h3 className="text-5xl font-black text-white mb-4 leading-tight tracking-tighter">
            Limited <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
              Time Deals
            </span>
          </h3>
          
          <p className="text-slate-400 mb-12 max-w-[220px] text-sm leading-relaxed font-medium">
            Handpicked premium selections at prices that won't last.
          </p>
          
          <button 
            onClick={() => navigate('/deals')} 
            className="group/btn relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-orange-600 rounded-2xl hover:bg-orange-500 shadow-2xl shadow-orange-900/20"
          >
            Explore All Deals
            <ArrowRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </button>

          <div className="absolute bottom-10 flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === 2 ? 'w-8 bg-orange-500' : 'w-2 bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 bg-gray-50/50 rounded-[2.5rem] p-4 md:p-8 border border-gray-200/60 shadow-inner flex flex-col">
        <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Top picks today</h3>
              <div className="h-1 w-12 bg-orange-500 rounded-full mt-1" />
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-grow">
            {todaysPickProducts && todaysPickProducts.length > 0 ? (
              todaysPickProducts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/marketplace/${p.id}`)}
                  className="group relative bg-white rounded-3xl p-5 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 flex flex-col h-full"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gray-50 rounded-2xl mb-6 relative flex items-center justify-center p-6 border border-gray-50 group-hover:border-orange-100 transition-colors">
                     <img 
                       src={p.product_details?.images?.[0]?.image ?? PLACEHOLDER} 
                       alt={p.product_details?.name} 
                       className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out" 
                     />
                     
                     <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="p-2 bg-white rounded-xl shadow-lg text-orange-600">
                          <ShoppingBag size={18} />
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col flex-grow">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className="fill-orange-400 text-orange-400" />
                        ))}
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-3 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                          {p.product_details?.name}
                      </h4>
                      <div className="mt-auto flex items-center justify-between">
                          <span className="text-lg font-black text-gray-900">
                              Rs. {getDisplayPrice(p, user).currentPrice?.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            In Stock
                          </span>
                      </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="col-span-full h-full flex items-center justify-center text-gray-400 font-medium italic">
                    Fresh selections arriving soon...
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BestDealsSection;

