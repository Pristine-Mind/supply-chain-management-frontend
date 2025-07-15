import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaDownload } from 'react-icons/fa';

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_details: Customer;
  product_details: Product;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
  delivery_date?: string;
  payment_due_date?: string;
  notes?: string;
}

const OrderList: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<number | 'all'>('all');
  const [filterProduct, setFilterProduct] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    customer: '',
    product: '',
    quantity: 1,
    status: 'pending',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize status to lowercase to avoid case sensitivity issues
  const normalizeStatus = (status: string) => status?.toLowerCase().trim();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { limit, offset };
      if (searchQuery) params.search = searchQuery;
      if (filterCustomer !== 'all') params.customer = filterCustomer;
      if (filterProduct !== 'all') params.product = filterProduct;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/orders/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          params,
        }
      );
      // Normalize status in fetched orders
      const normalizedOrders = response.data.results.map((order: Order) => ({
        ...order,
        status: normalizeStatus(order.status),
      }));
      setOrders(normalizedOrders);
      setTotalCount(response.data.count);
    } catch (error) {
      setError(t('error_fetching_orders'));
      console.error(t('error_fetching_orders'), error);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customers/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setCustomers(response.data.results);
    } catch (error) {
      setError(t('error_fetching_customers'));
      console.error(t('error_fetching_customers'), error);
      setTimeout(() => setError(''), 3000);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setProducts(response.data.results);
    } catch (error) {
      setError(t('error_fetching_products'));
      console.error(t('error_fetching_products'), error);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/export/orders/`,
        {
          responseType: 'blob',
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(t('error_exporting_orders'));
      if (isAxiosError(error)) {
        console.error('Export error:', error.response?.data);
      } else {
        console.error('Unexpected error:', error);
      }
      setTimeout(() => setError(''), 3000);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [offset, searchQuery, filterCustomer, filterProduct, filterStatus]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setOffset(0);
  };

  const handleFilterCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCustomer(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
    setOffset(0);
  };

  const handleFilterProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterProduct(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
    setOffset(0);
  };

  const handleFilterStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setOffset(0);
  };

  const handleNextPage = () => {
    if (offset + limit < totalCount) {
      setOffset(offset + limit);
    }
  };

  const handlePreviousPage = () => {
    if (offset > 0) {
      setOffset(offset - limit);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.product) {
      setError(t('customer_and_product_required'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/orders/`,
        {
          ...formData,
          customer: parseInt(formData.customer),
          product: parseInt(formData.product),
          status: normalizeStatus(formData.status),
        },
        {
          headers: { Authorization: `Token ${localStorage.getItem('season')}` },
        }
      );
      setSuccess(t('order_added_successfully'));
      setError('');
      setFormData({
        customer: '',
        product: '',
        quantity: 1,
        status: 'pending',
        notes: '',
      });
      setFormVisible(false);
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(t('failed_add_order'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/orders/${orderId}/update_status/`,
        { status: normalizeStatus(newStatus) },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }
      );
      setSuccess(t('status_updated_successfully'));
      await fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(t('failed_to_update_status'));
      console.error('Error updating status:', error);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Define possible status transitions
  const getNextStatusOptions = (currentStatus: string) => {
    const normalizedStatus = normalizeStatus(currentStatus);
    switch (normalizedStatus) {
      case 'pending':
        return [
          { value: 'approved', label: t('approve') },
          { value: 'cancelled', label: t('cancel') },
        ];
      case 'approved':
        return [
          { value: 'shipped', label: t('mark_as_shipped') },
          { value: 'cancelled', label: t('cancel') },
        ];
      case 'shipped':
        return [
          { value: 'delivered', label: t('mark_as_delivered') },
          { value: 'cancelled', label: t('cancel') },
        ];
      case 'delivered':
      case 'cancelled':
        return [];
      default:
        console.warn(`Unexpected status: ${currentStatus}`);
        return [];
    }
  };

  // Log all possible status values from orders for debugging
  useEffect(() => {
    if (orders.length > 0) {
      console.log(
        'All order statuses:',
        orders.map((o) => ({
          id: o.id,
          status: o.status,
          statusType: typeof o.status,
          options: getNextStatusOptions(o.status),
        }))
      );
    }
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 sm:mb-0">{t('order_list')}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFormVisible(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg w-full sm:w-auto hover:bg-blue-600 transition duration-300"
            aria-label={t('add_order')}
          >
            <FaPlus className="inline mr-2" /> {t('add_order')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
            aria-label={t('export_orders')}
          >
            <FaDownload className="mr-2" /> {t('export')}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && <p className="text-green-500 mb-4 text-center">{success}</p>}

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder={t('search_by_order_number')}
          className="px-4 py-2 border rounded-lg w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('search_by_order_number')}
        />
        <select
          value={filterCustomer}
          onChange={handleFilterCustomer}
          className="px-4 py-2 border rounded-lg w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('filter_by_customer')}
        >
          <option value="all">{t('all_customers')}</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        <select
          value={filterProduct}
          onChange={handleFilterProduct}
          className="px-4 py-2 border rounded-lg w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('filter_by_product')}
        >
          <option value="all">{t('all_products')}</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={handleFilterStatus}
          className="px-4 py-2 border rounded-lg w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('filter_by_status')}
        >
          <option value="all">{t('all_statuses')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="approved">{t('approved')}</option>
          <option value="shipped">{t('shipped')}</option>
          <option value="delivered">{t('delivered')}</option>
          <option value="cancelled">{t('cancelled')}</option>
        </select>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
        {isLoading ? (
          <div className="text-center py-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-500 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p>{t('loading')}</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="py-3 px-6">{t('order_number')}</th>
                <th className="py-3 px-6">{t('customer')}</th>
                <th className="py-3 px-6">{t('product')}</th>
                <th className="py-3 px-6">{t('quantity')}</th>
                <th className="py-3 px-6">{t('total_price')}</th>
                <th className="py-3 px-6">{t('status')}</th>
                <th className="py-3 px-6">{t('order_date')}</th>
                <th className="py-3 px-6">{t('delivery_date')}</th>
                <th className="py-3 px-6">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                      {order.order_number}
                    </td>
                    <td className="py-4 px-6">{order.customer_details.name}</td>
                    <td className="py-4 px-6">{order.product_details.name}</td>
                    <td className="py-4 px-6">{order.quantity}</td>
                    <td className="py-4 px-6">NPR {order.total_price.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : order.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'shipped'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      {order.delivery_date
                        ? new Date(order.delivery_date).toLocaleDateString()
                        : t('not_applicable')}
                    </td>
                    <td className="py-4 px-6">
                      {getNextStatusOptions(order.status).length > 0 ? (
                        <div className="flex space-x-2">
                          {getNextStatusOptions(order.status).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusUpdate(order.id, option.value)}
                              disabled={updatingStatus === order.id}
                              className={`px-2 py-1 text-xs rounded ${
                                option.value === 'cancelled'
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              } ${updatingStatus === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              aria-label={option.label}
                            >
                              {updatingStatus === order.id ? (
                                <span className="flex items-center">
                                  <svg
                                    className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  {t('updating')}
                                </span>
                              ) : (
                                option.label
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {t('no_actions_available')} ({order.status})
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    {t('no_orders_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousPage}
          disabled={offset === 0 || isLoading}
          className={`px-4 py-2 rounded-lg ${
            offset === 0 || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          aria-label={t('previous')}
        >
          {t('previous')}
        </button>
        <p>
          {t('showing')} {offset + 1} {t('to')} {Math.min(offset + limit, totalCount)} {t('of')}{' '}
          {totalCount} {t('orders_no')}
        </p>
        <button
          onClick={handleNextPage}
          disabled={offset + limit >= totalCount || isLoading}
          className={`px-4 py-2 rounded-lg ${
            offset + limit >= totalCount || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          aria-label={t('next')}
        >
          {t('next')}
        </button>
      </div>

      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg z-20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                {t('add_new_order')}
              </h3>
              <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                <div className="mb-4">
                  <label htmlFor="customer" className="block text-gray-700">
                    {t('customer')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-required="true"
                  >
                    <option value="">{t('select_customer')}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="product" className="block text-gray-700">
                    {t('product')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-required="true"
                  >
                    <option value="">{t('select_product')}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="quantity" className="block text-gray-700">
                    {t('quantity')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="1"
                    aria-required="true"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="status" className="block text-gray-700">
                    {t('status')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-required="true"
                  >
                    <option value="pending">{t('pending')}</option>
                    <option value="approved">{t('approved')}</option>
                    <option value="shipped">{t('shipped')}</option>
                    <option value="delivered">{t('delivered')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="notes" className="block text-gray-700">
                    {t('notes')}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={t('notes')}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
                    onClick={() => setFormVisible(false)}
                    aria-label={t('cancel')}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
                    aria-label={t('add_order')}
                  >
                    {t('add_order')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;