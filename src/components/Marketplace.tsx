import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  description: string;
}

interface MarketplaceProduct {
  id: number;
  product: Product;
  listed_price: string;
  listed_date: string;
  is_available: boolean;
  bid_end_date: string | null;
}

const Marketplace: React.FC = () => {
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);

  const fetchMarketplaceProducts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/marketplace/');
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
      {/* Page Header */}
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Marketplace</h2>

        {/* Display products in a card view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceProducts.map((item) => (
                <Link to={`/marketplace/${item.id}`} key={item.id}>  {/* Link to the product detail page */}
                    <div className="bg-white border border-gray-300 shadow-md rounded-lg p-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.product.name}</h3>
                    <p className="text-gray-600 mb-2">{item.product.description}</p>
                    <p className="text-gray-900 font-bold mb-2">Price: ${item.listed_price}</p>
                    <p className="text-gray-600 mb-2">Available: {item.is_available ? 'Yes' : 'No'}</p>
                    <p className="text-gray-600 mb-2">Listed on: {new Date(item.listed_date).toLocaleDateString()}</p>
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
