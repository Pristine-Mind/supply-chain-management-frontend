import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaCartPlus,
  FaShoppingCart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaInfoCircle,
  FaTags
} from 'react-icons/fa';
import Footer from './Footer';

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

const ProductInstanceView: React.FC<{ product: MarketplaceProduct }> = ({ product }) => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [tab, setTab] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    if (tab === 1) {
      setReviewsLoading(true);
      axios
        .get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/feedback/product/${product.id}/`,
          { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
        )
        .then(res => setReviews(res.data || []))
        .catch(() => setReviewsError('Error loading reviews'))
        .finally(() => setReviewsLoading(false));
    }
  }, [tab, product.id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const images = product.product_details?.images || [];

  return (
    <div className="w-full h-screen overflow-auto flex flex-col">
      <div className="flex justify-center items-start flex-1 py-8 px-2 md:px-0">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full h-full max-w-5xl flex flex-col">

          <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
            <div className="md:w-1/2 w-full h-full flex flex-col">
              <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={images[currentImage]?.image || ''}
                  alt={product.product_details?.name}
                  className="object-contain w-full h-full transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </div>
              {images.length > 1 && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button onClick={() => setCurrentImage(i => (i > 0 ? i - 1 : images.length - 1))} className="p-2 rounded-full hover:bg-gray-200">‹</button>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-16 h-16 rounded border overflow-hidden ${idx === currentImage ? 'ring-2 ring-orange-400' : ''}`}
                    >
                      <img src={img.image} alt={`Thumb ${idx + 1}`} className="object-cover w-full h-full" loading="lazy" />
                    </button>
                  ))}
                  <button onClick={() => setCurrentImage(i => (i < images.length - 1 ? i + 1 : 0))} className="p-2 rounded-full hover:bg-gray-200">›</button>
                </div>
              )}
            </div>

            <div className="md:w-1/2 w-full h-full flex flex-col">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-extrabold text-gray-900">{product.product_details?.name}</h1>
                <div className="flex items-center gap-2 text-orange-600">
                  <FaTags />
                  <span className="font-medium text-sm">{product.product_details?.category_details || '—'}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <span className="text-4xl font-bold text-orange-600">Rs.{product.listed_price.toFixed(2)}</span>
                {product.min_order && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Min {product.min_order} pcs</span>}
                <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${product.product_details?.stock! > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}> 
                  {product.product_details?.stock! > 0 ? `In Stock: ${product.product_details?.stock}` : 'Out of Stock'}
                </span>
              </div>

              <section aria-labelledby="product-desc" className="prose max-w-none mt-6 text-gray-700 flex-1 overflow-auto">
                <h2 id="product-desc" className="text-lg font-bold flex items-center gap-2 mb-2"><FaInfoCircle className="text-orange-400"/> Description</h2>
                <p>{product.product_details?.description}</p>
              </section>

              <div className="mt-4 flex gap-4 sticky bottom-0 bg-white py-4">
                <button onClick={() => setCartCount(c => c + 1)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-700 transition text-lg font-semibold">
                  <FaCartPlus /> Add to Cart
                </button>
                <button onClick={() => alert('Proceed to buy (mock)')} className="flex items-center gap-2 bg-orange-600 text-white py-2 px-6 rounded-lg shadow hover:bg-orange-700 transition text-lg font-semibold">
                  <FaShoppingCart /> Buy Now
                </button>
                <div className="relative cursor-pointer" onClick={() => navigate('/cart')}>
                  <FaShoppingCart className="text-2xl text-gray-700" />
                  {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">{cartCount}</span>}
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6 flex flex-col">
            <div role="tablist" className="flex border-b">
              {['Description', 'Reviews'].map((label, idx) => (
                <button
                  key={idx}
                  role="tab"
                  className={`flex-1 py-2 text-center ${tab === idx ? 'border-b-2 border-orange-500 text-orange-600 font-semibold' : 'text-gray-600'}`}
                  onClick={() => setTab(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="pt-6 flex-1 overflow-auto">
              {tab === 0 && (
                <div className="space-y-4 text-gray-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>High quality and best price</li>
                    <li>Fast delivery and easy returns</li>
                    <li>Trusted by thousands of customers</li>
                  </ul>
                  <p>{product.product_details?.description}</p>
                </div>
              )}
              {tab === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">Customer Reviews</h2>
                  {reviewsLoading ? (
                    <p className="text-center text-gray-500">Loading...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-gray-500">No reviews yet.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {reviews.map(r => (
                        <div key={r.id} className="bg-gray-50 p-5 rounded-xl shadow flex flex-col gap-2">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-lg">
                              {(r.user_username || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold block">{r.user_username || 'Anonymous'}</span>
                              <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                            </div>
                          </div>
                          {buildStars(r.rating)}
                          <p className="mt-1 text-gray-700">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductInstanceView;
