import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaCartPlus,
  FaShoppingCart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaInfoCircle,
  FaTags,
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  images: { image: string }[];
  stock?: number;
  category_details?: string;
  category?: string;
}

interface MarketplaceProduct {
  id: number;
  product_details?: ProductDetails;
  listed_price: number;
  min_order?: number;
}

interface Review {
  id: number;
  user_username: string;
  rating: number;
  comment: string;
  created_at: string;
}

const ProductInstanceView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [tab, setTab] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [related, setRelated] = useState<MarketplaceProduct[]>([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/${productId}/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      })
      .then(res => setProduct(res.data))
      .catch(() => setProduct(null));
  }, [productId]);

  useEffect(() => {
    if (tab === 1) {
      setReviewsLoading(true);
      axios
        .get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/feedback/product/${productId}/`,
          { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
        )
        .then(res => setReviews(res.data || []))
        .catch(() => setReviewsError('Error loading reviews'))
        .finally(() => setReviewsLoading(false));
    }
    if (tab === 2 && product?.product_details?.category) {
      axios
        .get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
          {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            params: { category: product.product_details.category }
          }
        )
        .then(res => setRelated(res.data.results.filter((p: any) => p.id !== product.id)))
        .catch(() => setRelated([]));
    }
  }, [tab, productId, product]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const buildStars = (rating: number) => (
    <div className="flex gap-1 text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < Math.floor(rating)) return <FaStar key={i} />;
        if (i < rating) return <FaStarHalfAlt key={i} />;
        return <FaRegStar key={i} />;
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-0 flex justify-center">
      {product ? (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative">
            <img
              src={product.product_details?.images?.[0]?.image || ''}
              alt={product.product_details?.name}
              className="w-full h-64 object-cover"
            />
            <button
              className="absolute top-4 left-4 bg-white p-2 rounded-full shadow hover:bg-gray-100"
              onClick={() => navigate(-1)}
            >
              <FaChevronLeft className="text-lg text-gray-700" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <h1 className="text-3xl font-bold text-gray-800">{product.product_details?.name}</h1>
            <div className="flex items-center gap-3">
              <span className="text-2xl text-orange-600 font-extrabold">
                Rs.{product.listed_price.toFixed(2)}
              </span>
              {product.min_order && (
                <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  Min {product.min_order} pcs
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
              <div className="flex items-center gap-1">
                <FaTags /> {product.product_details?.category_details || '—'}
              </div>
              <div className="flex items-center gap-1">
                <FaBoxOpen /> Stock: {product.product_details?.stock ?? '—'}
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                onClick={() => setCartCount(prev => prev + 1)}
              >
                <FaCartPlus /> Add to Cart
              </button>
              <button
                className="flex items-center gap-2 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition"
                onClick={() => alert('Proceed to buy (mock)')}
              >
                <FaShoppingCart /> Buy Now
              </button>
              <div className="relative">
                <FaShoppingCart
                  className="text-2xl text-gray-700 cursor-pointer"
                  onClick={() => navigate('/cart')}
                />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-b flex">
              {['Description', 'Reviews', 'Related'].map((label, idx) => (
                <button
                  key={idx}
                  className={`flex-1 py-2 text-center ${
                    tab === idx
                      ? 'border-b-2 border-orange-500 text-orange-600 font-semibold'
                      : 'text-gray-600'
                  } transition`}
                  onClick={() => setTab(idx)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="pt-6">
              {tab === 0 && (
                <div className="space-y-4 text-gray-700">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FaInfoCircle /> Description
                  </h2>
                  <p>{product.product_details?.description}</p>
                </div>
              )}

              {tab === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800">Reviews</h2>
                  {reviewsLoading ? (
                    <p className="text-center text-gray-500">Loading...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-gray-500">No reviews yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div
                          key={review.id}
                          className="bg-gray-50 p-4 rounded-lg shadow-sm"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">
                              {review.user_username || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          {buildStars(review.rating)}
                          <p className="mt-2 text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800">Related Products</h2>
                  {related.length === 0 ? (
                    <p className="text-gray-500">No related products found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {related.map(rel => (
                        <div
                          key={rel.id}
                          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
                          onClick={() => navigate(`/marketplace/${rel.id}`)}
                        >
                          <img
                            src={rel.product_details?.images?.[0]?.image || ''}
                            alt={rel.product_details?.name}
                            className="w-full h-32 object-cover rounded-md mb-2"
                          />
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800 truncate">
                              {rel.product_details?.name}
                            </span>
                            <span className="text-orange-600 font-bold">
                              Rs.{rel.listed_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-16">Loading product details...</div>
      )}
    </div>
  );
};

export default ProductInstanceView;
