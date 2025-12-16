import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';

type Product = any;

const API_URL = 'https://appmulyabazzar.com/api/v1/marketplace/made-for-you/';

const MadeForYou: React.FC = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        // API shape may vary; try common patterns
        const list = Array.isArray(data) ? data : data?.results ?? data?.items ?? [];
        setItems(list.slice ? list : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h3 className="text-xl font-bold mb-3">Made For You</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[200px] bg-white rounded-lg shadow-sm p-4 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => { setShowLoginModal(false); setPendingProduct(null); }}
          onSuccess={async () => {
            setShowLoginModal(false);
            if (pendingProduct) {
              try { await addToCart(pendingProduct); } catch (_) {}
              finally { setPendingProduct(null); }
            }
          }}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Made For You</h3>
        <button
          className="text-sm text-primary-600 hover:underline"
          onClick={() => navigate('/marketplace/all-products')}
        >
          View all
        </button>
      </div>

      {error ? (
        <div className="text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No recommendations available</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.slice(0, 8).map((p: Product) => {
            const image = p.product_details?.images?.[0]?.image ?? p.image ?? p.thumbnail ?? '';
            const name = p.product_details?.name ?? p.name ?? 'Product';
            const id = p.id ?? p.product_id ?? p.product?.id;
            const price = p.discounted_price ?? p.listed_price ?? p.price ?? p.product_details?.price;

            const handleBuyNow = async (e: React.MouseEvent) => {
              e.stopPropagation();
              if (!isAuthenticated) {
                setPendingProduct(p);
                setShowLoginModal(true);
                return;
              }
              try {
                await addToCart(p);
              } catch (err) {
                console.error('Failed to add to cart', err);
              }
            };

            return (
              <div
                key={id || name}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-transform transform hover:-translate-y-1 h-[360px] flex flex-col"
                onClick={() => { if (id) navigate(`/marketplace/${id}`); }}
              >
                <div className="h-44 bg-neutral-50 flex items-center justify-center overflow-hidden">
                  <img src={image || '/placeholder.png'} alt={name} className="max-h-full max-w-full object-contain" />
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-sm font-semibold line-clamp-2">{name}</div>
                    {price != null && <div className="text-sm text-orange-600 mt-2">Rs. {Number(price).toLocaleString()}</div>}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={handleBuyNow}
                      className="bg-primary-600 text-white text-xs sm:text-sm px-3 py-2 rounded-full shadow-sm hover:bg-primary-700 transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MadeForYou;
