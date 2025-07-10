import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string | null;
}

interface ProductDetails {
  id: number;
  name: string;
  images: ProductImage[];
  category_details?: string;
  category?: string;
}

interface MarketplaceProduct {
  id: number;
  product_details?: ProductDetails;
  listed_price: number;
}

const ProductSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<MarketplaceProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 3) {
      setRecommendations([]);
      return;
    }
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
          {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            params: { search: query }
          }
        );
        setRecommendations(response.data.results || []);
      } catch (err) {
        setRecommendations([]);
      }
    };
    fetchRecommendations();
  }, [query]);

  return (
    <div className="w-full bg-white px-4 py-4 shadow-sm border-b sticky top-0 z-20">
      <div className="flex items-center w-full">
        {/* Logo and Brand Name - leftmost */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          <span className="font-extrabold text-2xl text-orange-600 whitespace-nowrap">MulyaBazzar</span>
        </div>
        {/* Centered Search Bar */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              className="w-full rounded-lg border px-4 py-2 bg-gray-100 focus:outline-none"
              placeholder="Search products"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length >= 3);
              }}
            />
            {showSuggestions && recommendations.length > 0 && (
              <div className="absolute left-0 right-0 bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto mt-1 z-30">
                {recommendations.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setShowSuggestions(false);
                      setQuery('');
                      navigate(`/marketplace/${p.id}`);
                    }}
                  >
                    {p.product_details?.images?.length ? (
                      <img src={p.product_details.images[0].image} alt="" className="w-9 h-9 rounded mr-2 object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-gray-200 rounded mr-2" />
                    )}
                    <div className="truncate">{p.product_details?.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchBar;
