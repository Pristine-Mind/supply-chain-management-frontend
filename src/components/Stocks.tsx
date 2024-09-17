import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: string;
  cost_price: string;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  producer: number;
}

interface StockListItem {
  product: number;
  moved_date: string;
  product_details: ProductDetails;
}

const Stocks: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pushedProducts, setPushedProducts] = useState<number[]>([]);
  const itemsPerPage = 20;

  const fetchStockItems = async (page: number) => {
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stocklist/`, {
        params: {
          limit: itemsPerPage,
          offset: offset
        }
      });

      setStockItems(response.data.results);
      setTotalPages(Math.ceil(response.data.count / itemsPerPage));
    } catch (error) {
      console.error('Error fetching stock items', error);
    }
  };

  useEffect(() => {
    fetchStockItems(currentPage);
  }, [currentPage]);

  const handlePushToMarketplace = async (productId: number) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stocklist/${productId}/push-to-marketplace/`);
      if (response.status === 200 || response.status === 201) {
        alert(`Product ${productId} pushed to marketplace successfully.`);
        setPushedProducts((prevState) => [...prevState, productId]);
      }
    } catch (error) {
      console.error(`Error pushing product ${productId} to marketplace:`, error);
      alert(`Failed to push product ${productId} to marketplace.`);
    }
  };

  // Handlers for pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Stock List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto bg-white border border-gray-300 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Product Name</th>
              <th className="py-3 px-6 text-left">Moved Date</th>
              <th className="py-3 px-6 text-left">Stock Quantity</th>
              <th className="py-3 px-6 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {stockItems.map((item) => (
              <tr key={item.product} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{item.product_details.name}</td>
                <td className="py-3 px-6 text-left">{new Date(item.moved_date).toLocaleDateString()}</td>
                <td className="py-3 px-6 text-left">{item.product_details.stock}</td>
                <td className="py-3 px-6 text-left">
                  <button
                    onClick={() => handlePushToMarketplace(item.product_details.id)}
                    disabled={pushedProducts.includes(item.product_details.id)}
                    className={`bg-blue-500 text-white px-4 py-2 rounded-lg ${pushedProducts.includes(item.product_details.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                  >
                    {pushedProducts.includes(item.product_details.id) ? 'Pushed to Marketplace' : 'Push to Marketplace'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`bg-gray-500 text-white px-4 py-2 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}`}
        >
          Previous
        </button>

        <span className="text-gray-700">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`bg-gray-500 text-white px-4 py-2 rounded-lg ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Stocks;
