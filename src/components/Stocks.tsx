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
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const itemsPerPage = 5; // Define how many items per page

  // Fetch stock items from the server
  const fetchStockItems = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/stocklist/');
      setStockItems(response.data.results);
    } catch (error) {
      console.error('Error fetching stock items', error);
    }
  };

  useEffect(() => {
    fetchStockItems(); // Fetch stock items on load
  }, []);

  // Calculate the displayed items based on the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = stockItems.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate the total number of pages
  const totalPages = Math.ceil(stockItems.length / itemsPerPage);

  // Handler for "Push to Marketplace" button
  const handlePushToMarketplace = (productId: number) => {
    console.log(`Product ${productId} pushed to marketplace.`);
    // Add logic to push product to marketplace (e.g., API call)
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
      {/* Stock List Table */}
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
            {currentItems.map((item) => (
              <tr key={item.product} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{item.product_details.name}</td>
                <td className="py-3 px-6 text-left">{new Date(item.moved_date).toLocaleDateString()}</td>
                <td className="py-3 px-6 text-left">{item.product_details.stock}</td>
                <td className="py-3 px-6 text-left">
                  <button
                    onClick={() => handlePushToMarketplace(item.product_details.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Push to Marketplace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
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
