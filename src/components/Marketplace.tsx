import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
}

interface MarketplaceProduct {
  id: number;
  product: Product;
  listed_price: string;
  listed_date: string;
  is_available: boolean;
  bid_end_date: string | null;
  product_details: Product
}

const Marketplace: React.FC = () => {
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);

  const fetchMarketplaceProducts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setMarketplaceProducts(response.data.results);
    } catch (error) {
      console.error('Error fetching marketplace products', error);
    }
  };

  useEffect(() => {
    fetchMarketplaceProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Marketplace</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceProducts.map((item) => (
                <Link to={`/marketplace/${item.id}`} key={item.id}>
                    <div className="bg-white border border-gray-300 shadow-md rounded-lg p-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.product_details.name}</h3>
                    <p className="text-gray-600 mb-2">{item.product_details.description}</p>
                    <p className="text-gray-900 font-bold mb-2">Price: ${item.listed_price}</p>
                    <p className="text-gray-600 mb-2">Available: {item.is_available ? 'Yes' : 'No'}</p>
                    <p className="text-gray-600 mb-2">Listed on: {new Date(item.listed_date).toLocaleDateString()}</p>
                    <div className="mt-4">
                        {item.product_details.images.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {item.product_details.images.map((image) => (
                              <img
                                key={image.id}
                                src={image.image}
                                alt={image.alt_text || 'Product Image'}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No images available</p>
                        )}
                    </div>
                    {item.bid_end_date && (
                        <p className="text-gray-600 mb-2">Bidding ends on: {new Date(item.bid_end_date).toLocaleDateString()}</p>
                    )}
                    </div>
                </Link>
                ))}
            </div>
    </div>
  );
};

export default Marketplace;
