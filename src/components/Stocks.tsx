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
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stocklist/`,
        {
          params: {
            limit: itemsPerPage,
            offset: offset,
          },
        }
      );

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
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stocklist/${productId}/push-to-marketplace/`
      );
      if (response.status === 200 || response.status === 201) {
        alert(`Product ${productId} pushed to marketplace successfully.`);
        setPushedProducts((prevState) => [...prevState, productId]);
      }
    } catch (error) {
      console.error(`Error pushing product ${productId} to marketplace:`, error);
      alert(`Failed to push product ${productId} to marketplace.`);
    }
  };

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
    <div className="min-h-screen bg-gray-50 p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Stock List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-blue-600 text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Product Name</th>
              <th className="py-3 px-6 text-left">Moved Date</th>
              <th className="py-3 px-6 text-left">Stock Quantity</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {stockItems.map((item) => (
              <tr
                key={item.product}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {item.product_details.name.charAt(0)}
                      </div>
                    </div>
                    <span>{item.product_details.name}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-left">
                  {new Date(item.moved_date).toLocaleDateString()}
                </td>
                <td className="py-3 px-6 text-left">
                  {item.product_details.stock}
                </td>
                <td className="py-3 px-6 text-center">
                  <button
                    onClick={() =>
                      handlePushToMarketplace(item.id)
                    }
                    disabled={pushedProducts.includes(
                      item.product_details.id
                    )}
                    className={`${
                      pushedProducts.includes(item.product_details.id)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white px-4 py-2 rounded-full transition-colors duration-300`}
                  >
                    {pushedProducts.includes(item.product_details.id)
                      ? 'Pushed'
                      : 'Push to Marketplace'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`${
            currentPage === 1
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white px-4 py-2 rounded-full transition-colors duration-300`}
        >
          Previous
        </button>

        <span className="text-gray-700 font-semibold">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`${
            currentPage === totalPages
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white px-4 py-2 rounded-full transition-colors duration-300`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Stocks;
