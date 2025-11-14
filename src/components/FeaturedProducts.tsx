import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

const PLACEHOLDER = 'https://via.placeholder.com/300';

const FeaturedProducts: React.FC<{ products?: any[] }> = ({ products: initialProducts }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[] | null>(initialProducts ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProducts) return; // parent supplied
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/featured/`;
        const { data } = await axios.get(url);
        setProducts(data.results || data || []);
      } catch (err) {
        setError('Failed to load featured products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [initialProducts]);

  if (loading) return (
    <div className="py-8 flex justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  );

  if (error) return <div className="text-center py-6 text-status-error">{error}</div>;
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full px-4 py-8">
      <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold">Featured Products</h2>
        <button
          onClick={() => navigate('/marketplace/all-products')}
          className="text-sm text-primary-600 hover:underline"
        >
          View all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {products.slice(0, 8).map((item: any) => (
          <article
            key={item.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/marketplace/${item.id}`)}
          >
            <div className="relative w-full h-56 sm:h-64 overflow-hidden">
              <img
                src={item.product_details?.images?.[0]?.image ?? PLACEHOLDER}
                alt={item.product_details?.name ?? 'Product'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">{item.product_details?.category_details}</span>
                <div className="flex items-center gap-1 text-sm text-neutral-600">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{(item.average_rating || 0).toFixed(1)}</span>
                </div>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="bg-primary-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
