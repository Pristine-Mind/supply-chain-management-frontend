import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from './Navbar';
import Footer from './Footer';

const PLACEHOLDER = 'https://via.placeholder.com/400';

const Deals: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const base = import.meta.env.VITE_REACT_APP_API_URL || 'https://appmulyabazzar.com';
        const { data } = await axios.get(`${base}/api/v1/marketplace-trending/deals/`);
        setProducts(data.results || data || []);
      } catch (err) {
        setError('Failed to load deals products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  if (error) return <div className="text-center py-8 text-status-error">{error}</div>;
  

  // Empty state animation component
  const EmptyState: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6 animate-pulse">
        <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a4 4 0 118 0v2" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-neutral-500 mb-4">{subtitle}</p>}
      <div className="space-x-2">
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Browse Marketplace</button>
        <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded-lg">Retry</button>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Trending Deals & Discounts</h2>
          <div className="text-sm text-neutral-500">{products.length} items</div>
        </div>

        {(!products || products.length === 0) ? (
          <EmptyState title="No deals found" subtitle="We couldn't find any deals right now. Try browsing the marketplace." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((item: any) => (
              <article key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/marketplace/${item.id}`)}>
                <div className="relative aspect-square w-full overflow-hidden">
                  <img src={item.product_details?.images?.[0]?.image ?? PLACEHOLDER} alt={item.product_details?.name ?? 'Product'} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">{item.product_details?.category_details}</span>
                  </div>

                  <h3 className="font-semibold text-neutral-900 line-clamp-2">{item.product_details?.name}</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      {item.discounted_price && item.discounted_price < item.listed_price ? (
                        <div className="text-accent-success-600 font-bold">Rs.{item.discounted_price}</div>
                      ) : (
                        <div className="text-accent-success-600 font-bold">Rs.{item.listed_price}</div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="bg-primary-600 text-white px-3 py-1 rounded-md text-sm">Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Deals;
