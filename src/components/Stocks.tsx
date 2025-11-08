import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [stockItems, setStockItems] = useState<StockListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pushedProducts, setPushedProducts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 20;

  const fetchStockItems = async (page: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stocklist/`,
        {
          params: {
            limit: itemsPerPage,
            offset: offset,
          },
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }
      );
      setStockItems(response.data.results);
      setTotalPages(Math.ceil(response.data.count / itemsPerPage));
    } catch (error) {
      console.error(t('error_fetching_stock_items'), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockItems(currentPage);
  }, [currentPage]);

  const handlePushToMarketplace = async (productId: number) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stocklist/${productId}/push-to-marketplace/`,
        {},
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response.status === 200 || response.status === 201) {
        alert(t('product_pushed_successfully', { productId }));
        setPushedProducts((prevState) => [...prevState, productId]);
        fetchStockItems(currentPage);
      }
    } catch (error) {
      console.error(t('error_pushing_product_to_marketplace', { productId }), error);
      alert(t('failed_to_push_product', { productId }));
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="p-8 bg-white rounded-xl shadow-sm mb-8">
        <h1 className="text-2xl font-bold text-primary-700 mb-6">{t('stock_management')}</h1>
        {/* Loading indicator */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-4"></div>
            <span className="text-base text-gray-500">{t('loading_stocks')}...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('product_name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('moved_date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('stock_quantity')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockItems.map((item) => (
                    <tr key={item.product} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {item.product_details.name.charAt(0)}
                            </div>
                          </div>
                          <span className="text-gray-900">{item.product_details.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(item.moved_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {item.product_details.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handlePushToMarketplace(item.product)}
                          disabled={pushedProducts.includes(item.product)}
                          className={`px-4 py-2 rounded-lg text-white transition-colors font-medium ${
                            pushedProducts.includes(item.product)
                              ? 'bg-neutral-400 cursor-not-allowed'
                              : 'bg-accent-success-600 hover:bg-accent-success-700'
                          }`}
                        >
                          {pushedProducts.includes(item.product) ? t('pushed') : t('push_to_marketplace')}
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
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  currentPage === 1
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {t('previous')}
              </button>
              <span className="text-neutral-700 font-medium">
                {t('page')} {currentPage} {t('of')} {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  currentPage === totalPages
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {t('next')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Stocks;
