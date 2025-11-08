import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaDownload, FaPrint, FaEdit, FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';

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
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');
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
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/export/orders/`,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
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

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('order')} #${order.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .order-info { margin-bottom: 20px; }
          .order-items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .order-items th, .order-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .order-items th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .mt-20 { margin-top: 20px; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('order_receipt')}</h1>
          <p>${new Date().toLocaleDateString()}</p>
        </div>

        <div class="order-info">
          <p><strong>${t('order_number')}:</strong> ${order.order_number}</p>
          <p><strong>${t('customer')}:</strong> ${order.customer_details.name}</p>
          <p><strong>${t('order_date')}:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
        </div>

        <table class="order-items">
          <thead>
            <tr>
              <th>${t('product')}</th>
              <th>${t('quantity')}</th>
              <th class="text-right">${t('price')}</th>
              <th class="text-right">${t('total')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${order.product_details.name}</td>
              <td>${order.quantity}</td>
              <td class="text-right">NPR ${(order.total_price / order.quantity).toFixed(2)}</td>
              <td class="text-right">NPR ${order.total_price.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-right"><strong>${t('grand_total')}:</strong></td>
              <td class="text-right"><strong>NPR ${order.total_price.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="mt-20">
          <p>${t('thank_you_message')}</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ${t('print_receipt')}
          </button>
          <button onclick="window.close()" style="margin-left: 10px; padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ${t('close')}
          </button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary-700 mb-6">Orders</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setFormVisible(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg w-full sm:w-auto hover:bg-primary-700 transition-colors flex items-center font-medium"
            aria-label={t('add_order')}
          >
            <FaPlus className="mr-2" /> {t('add_order')}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-accent-success-600 text-white rounded-lg hover:bg-accent-success-700 transition-colors flex items-center font-medium"
            aria-label={t('export_orders')}
          >
            <FaDownload className="mr-2" /> {t('export')}
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', label: 'All Orders', status: null },
              { id: 'pending', label: 'Pending', status: 'pending' },
              { id: 'shipped', label: 'Shipped', status: 'shipped' },
              { id: 'delivered', label: 'Delivered', status: 'delivered' },
              { id: 'cancelled', label: 'Cancelled', status: 'cancelled' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveStatusTab(tab.id as any);
                  setFilterStatus(tab.status || 'all');
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeStatusTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeStatusTab === tab.id
                    ? tab.id === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      tab.id === 'shipped' ? 'bg-blue-100 text-blue-600' :
                      tab.id === 'delivered' ? 'bg-green-100 text-green-600' :
                      tab.id === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {orders.filter(order => tab.status ? normalizeStatus(order.status) === tab.status : true).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {success && <p className="text-green-500 mb-4 text-center">{success}</p>}

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder={t('search_by_order_number')}
          className="px-4 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          aria-label={t('search_by_order_number')}
        />
        <select
          value={filterCustomer}
          onChange={handleFilterCustomer}
          className="px-4 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
          className="px-4 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
          className="px-4 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-4"></div>
            <span className="text-base text-gray-500">Loading orders...</span>
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 font-semibold">{t('order_number')}</th>
                <th className="py-4 px-6 font-semibold">{t('customer')}</th>
                <th className="py-4 px-6 font-semibold">{t('product')}</th>
                <th className="py-4 px-6 font-semibold">{t('quantity')}</th>
                <th className="py-4 px-6 font-semibold">{t('total_price')}</th>
                <th className="py-4 px-6 font-semibold">{t('status')}</th>
                <th className="py-4 px-6 font-semibold">{t('order_date')}</th>
                <th className="py-4 px-6 font-semibold">{t('delivery_date')}</th>
                <th className="py-4 px-6 font-semibold">{t('actions')}</th>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : order.status === 'approved'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'shipped'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
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
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePrintOrder(order)}
                            className="px-2 py-1 text-xs rounded bg-gray-500 hover:bg-gray-600 text-white flex items-center"
                            aria-label={t('print')}
                          >
                            <FaPrint className="mr-1" size={12} />
                            {t('print')}
                          </button>
                        </div>
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
                                    <FaSpinner className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" />
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
                            {t('no_actions_available')}
                          </span>
                        )}
                      </div>
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
          {t('showing')} {offset + 1} {t('to')} {Math.min(offset + limit, totalCount)} {t('of')} {totalCount} {t('orders_no')}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t('add_new_order')}
              </h3>
              <button onClick={() => setFormVisible(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
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
                  className="px-4 py-2 bg-green-500 text-white rounded-lg bg-primary-600 hover:bg-primary-700  transition duration-300"
                  aria-label={t('add_order')}
                >
                  {t('add_order')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
