import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaDownload, FaTimes, FaPrint, FaTruck, FaMapMarkerAlt } from 'react-icons/fa';
import LocationPicker from './LocationPicker';
import { DeliveryInfoRequest, CreateDeliveryFromSaleRequest, createDeliveryFromSale, checkSaleDelivery, DeliveryTrackingResponse } from '../api/orderApi';

// Define payment status and method options
const paymentStatusOptions = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "approved", label: "Approved", color: "blue" },
  { value: "shipped", label: "Shipped", color: "indigo" },
  { value: "delivered", label: "Delivered", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

// Commented out unused payment method options
// const paymentMethodOptions = [
//   { value: "cash", label: "Cash", icon: "💵" },
//   { value: "qr", label: "QR Code Payment", icon: "📱" },
//   { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
//   { value: "card", label: "Debit/Credit Card", icon: "💳" },
//   { value: "digital_wallet", label: "Digital Wallet", icon: "📲" },
//   { value: "cheque", label: "Cheque", icon: "📝" },
//   { value: "credit", label: "Credit/Due Payment", icon: "💰" },
// ];

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
}

interface OrderDetails {
  id: number;
  order_number: string;
  customer_details: Customer;
  product_details: Product;
  quantity: number;
  total_price: number;
  status: string;
  order_date: string;
}

interface Sale {
  id: number;
  quantity: number | null;
  sale_price: number | null;
  payment_status: string | null;
  payment_status_display: string | null;
  payment_due_date: string | null;
  order: number | null;
  order_details?: OrderDetails;
  has_delivery?: boolean;
  delivery_status?: string;
}

const SaleList: React.FC = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  // const [loading, setLoading] = useState(false);
  
  // Filter states - commented out as they're not currently used
  // const [searchQuery, setSearchQuery] = useState('');
  // const [statusFilter, setStatusFilter] = useState('all');
  // const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  // const [dateFrom, setDateFrom] = useState('');
  // const [dateTo, setDateTo] = useState('');
  
  // Sales analytics state - commented out as it's not currently used
  // const [salesAnalytics, setSalesAnalytics] = useState({
  //   totalSales: 0,
  //   totalRevenue: 0,
  //   pendingPayments: 0,
  //   completedSales: 0,
  //   averageOrderValue: 0,
  // });
  
  const [formData, setFormData] = useState({
    quantity: null,
    sale_price: null,
    payment_status: "pending",
    payment_method: "cash",
    payment_due_date: '',
    order: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Delivery form states
  const [deliveryFormVisible, setDeliveryFormVisible] = useState(false);
  const [selectedSaleForDelivery, setSelectedSaleForDelivery] = useState<Sale | null>(null);
  const [deliveryFormData, setDeliveryFormData] = useState<DeliveryInfoRequest>({
    customer_name: '',
    customer_email: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: 27.7172,
    longitude: 85.3240,
    delivery_instructions: '',
  });
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  
  // Delivery tracking states
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingData, setTrackingData] = useState<DeliveryTrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [salesWithDelivery, setSalesWithDelivery] = useState<Set<number>>(new Set());
  
  // Status update states - commented out for future implementation
  // const [updateStatusLoading, setUpdateStatusLoading] = useState(false);
  // const [selectedStatus, setSelectedStatus] = useState('');
  // const [showStatusUpdateForm, setShowStatusUpdateForm] = useState(false);

  const fetchSales = async () => {
    // setLoading(true);
    try {
      const params = { limit, offset };
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/sales/`, {
        params: params,
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      setSales(response.data.results);
      setTotalCount(response.data.count);
      
      // Check delivery status for each sale
      checkDeliveryStatusForSales(response.data.results);
    } catch (error) {
      console.error(t('error_fetching_sales'), error);
    } finally {
      // setLoading(false);
    }
  };

  const checkDeliveryStatusForSales = async (salesList: Sale[]) => {
    const deliveryChecks = salesList.map(async (sale) => {
      try {
        const deliveryInfo = await checkSaleDelivery(sale.id);
        if (deliveryInfo) {
          return sale.id;
        }
      } catch (error) {
        // Silently ignore errors for individual sales
      }
      return null;
    });
    
    const results = await Promise.all(deliveryChecks);
    const salesWithDeliverySet = new Set(results.filter(id => id !== null) as number[]);
    setSalesWithDelivery(salesWithDeliverySet);
  };

  const handleTrackDelivery = async (sale: Sale) => {
    setTrackingLoading(true);
    setTrackingError('');
    
    try {
      const deliveryInfo = await checkSaleDelivery(sale.id);
      if (deliveryInfo) {
        setTrackingData(deliveryInfo);
        setTrackingModalVisible(true);
      } else {
        setTrackingError(t('no_delivery_found_for_sale') || 'No delivery found for this sale');
      }
    } catch (err) {
      console.error('Delivery tracking error:', err);
      if (err instanceof Error) {
        setTrackingError(err.message);
      } else {
        setTrackingError(t('failed_to_track_delivery') || 'Failed to track delivery');
      }
    } finally {
      setTrackingLoading(false);
    }
  };

  const closeTrackingModal = () => {
    setTrackingModalVisible(false);
    setTrackingData(null);
    setTrackingError('');
    // setShowStatusUpdateForm(false);
    // setSelectedStatus('');
  };

  // Status update function - commented out for future implementation
  /*
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingData || !selectedStatus) return;

    setUpdateStatusLoading(true);
    try {
      const updatedDelivery = await updateDeliveryStatus(trackingData.id, selectedStatus);
      setTrackingData(updatedDelivery);
      setShowStatusUpdateForm(false);
      setSelectedStatus('');
      // Show success message
      setDeliverySuccess(t('delivery_status_updated_successfully') || 'Delivery status updated successfully');
      setTimeout(() => setDeliverySuccess(''), 3000);
    } catch (err) {
      console.error('Status update error:', err);
      if (err instanceof Error) {
        setTrackingError(err.message);
      } else {
        setTrackingError(t('failed_to_update_delivery_status') || 'Failed to update delivery status');
      }
    } finally {
      setUpdateStatusLoading(false);
    }
  };
  */

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/orders/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setOrders(response.data.results);
    } catch (error) {
      console.error(t('error_fetching_orders'), error);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchOrders();
  }, [offset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDeliveryFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/export/sales/`, {
        responseType: 'blob',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Export error:', error.response?.data);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };
  const handlePrintSale = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('sale_invoice')} #${sale.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0 !important;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .sale-info { margin-bottom: 20px; }
          .sale-items {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: avoid;
          }
          .sale-items th, .sale-items td {
            border: 1px solid #000 !important;
            padding: 8px !important;
          }
          .sale-items th {
            background-color: #f2f2f2 !important;
          }
          .text-right { text-align: right; }
          .mt-20 { margin-top: 20px; }
          @media print {
            body { padding: 10px !important; }
            .sale-items { max-width: 100% !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t('sale_invoice')}</h1>
          <p>${new Date().toLocaleDateString()}</p>
        </div>

        <div class="sale-info">
          <p><strong>${t('sale_id')}:</strong> ${sale.id}</p>
          ${sale.order_details ?
            '<p><strong>' + t('order_number') + ':</strong> ' + sale.order_details.order_number + '</p>' +
            '<p><strong>' + t('customer') + ':</strong> ' + sale.order_details.customer_details.name + '</p>' +
            '<p><strong>' + t('product') + ':</strong> ' + sale.order_details.product_details.name + '</p>' +
            '<p><strong>' + t('order_date') + ':</strong> ' + new Date(sale.order_details.order_date).toLocaleDateString() + '</p>'
            :
            '<p><strong>' + t('order') + ':</strong> ' + sale.order + '</p>'
          }
          <p><strong>${t('payment_status')}:</strong> ${sale.payment_status_display}</p>
          ${sale.payment_due_date ? '<p><strong>' + t('payment_due_date') + ':</strong> ' + new Date(sale.payment_due_date).toLocaleDateString() + '</p>' : ''}
        </div>

        <table class="sale-items">
          <thead>
            <tr>
              <th>${t('description')}</th>
              <th>${t('quantity')}</th>
              <th class="text-right">${t('unit_price')}</th>
              <th class="text-right">${t('total')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${sale.order_details ? sale.order_details.product_details.name : t('sale_item')}</td>
              <td>${sale.quantity || 0}</td>
              <td class="text-right">NPR ${(sale.sale_price || 0).toFixed(2)}</td>
              <td class="text-right">NPR ${((sale.quantity || 0) * (sale.sale_price || 0)).toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-right"><strong>${t('grand_total')}:</strong></td>
              <td class="text-right"><strong>NPR ${((sale.quantity || 0) * (sale.sale_price || 0)).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="mt-20">
          <p>${t('thank_you_message')}</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ${t('print_invoice')}
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

  const handlePlaceForDelivery = (sale: Sale) => {
    setSelectedSaleForDelivery(sale);
    setDeliveryFormVisible(true);
    setDeliveryError('');
    setDeliverySuccess('');
    // Reset form data
    setDeliveryFormData({
      customer_name: '',
      customer_email: '',
      phone_number: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      latitude: 27.7172,
      longitude: 85.3240,
      delivery_instructions: '',
    });
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForDelivery) return;
    
    setDeliveryLoading(true);
    setDeliveryError('');
    
    try {
      // Create delivery order for this sale using the correct API format
      const deliveryData: CreateDeliveryFromSaleRequest = {
        sale_id: selectedSaleForDelivery.id,
        customer_name: deliveryFormData.customer_name,
        phone_number: deliveryFormData.phone_number,
        email: deliveryFormData.customer_email || '',
        address: deliveryFormData.address,
        city: deliveryFormData.city,
        state: deliveryFormData.state,
        zip_code: deliveryFormData.zip_code,
        latitude: deliveryFormData.latitude,
        longitude: deliveryFormData.longitude,
        additional_instructions: deliveryFormData.delivery_instructions || '',
      };
      
      await createDeliveryFromSale(deliveryData);
      
      setDeliverySuccess(t('delivery_order_created_successfully'));
      setDeliveryFormVisible(false);
      setSelectedSaleForDelivery(null);
      // Refresh sales list to show updated status
      fetchSales();
      // Add the sale to delivery set immediately for better UX
      setSalesWithDelivery(prev => new Set([...prev, selectedSaleForDelivery.id]));
    } catch (err) {
      console.error('Delivery creation error:', err);
      if (err instanceof Error) {
        setDeliveryError(err.message);
      } else {
        setDeliveryError(t('failed_to_create_delivery_order'));
      }
    } finally {
      setDeliveryLoading(false);
    }
  };

  const closeDeliveryForm = () => {
    setDeliveryFormVisible(false);
    setSelectedSaleForDelivery(null);
    setDeliveryError('');
    setDeliverySuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/sales/`,
        formData,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setSuccess(t('sale_added_successfully'));
      setError('');
      setFormData({
        quantity: null,
        sale_price: null,
        payment_status: 'pending',
        payment_method: 'cash',
        payment_due_date: '',
        order: null,
      });
      setFormVisible(false);
      fetchSales();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(t('failed_add_sale'));
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('sale_list')}</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setFormVisible(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <FaPlus className="mr-2" /> {t('add_sale')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center bg-accent-success-600 text-white px-4 py-2 rounded-lg hover:bg-accent-success-700 transition-colors font-medium"
          >
            <FaDownload className="mr-2" /> {t('export')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="py-3 px-6">{t('order')}</th>
              <th className="py-3 px-6">{t('quantity')}</th>
              <th className="py-3 px-6">{t('sale_price')}</th>
              <th className="py-3 px-6">{t('payment_status')}</th>
              <th className="py-3 px-6">{t('payment_due_date')}</th>
              <th className="py-3 px-6">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="py-4 px-6">{sale.order}</td>
                  <td className="py-4 px-6">{sale.quantity}</td>
                  <td className="py-4 px-6">NPR {sale.sale_price?.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      sale.payment_status === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : sale.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : sale.payment_status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : sale.payment_status === 'approved'
                        ? 'bg-blue-100 text-blue-700'
                        : sale.payment_status === 'shipped'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sale.payment_status_display}
                    </span>
                  </td>
                  <td className="py-4 px-6">{sale.payment_due_date}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handlePrintSale(sale)}
                        className="px-2 py-1 text-xs rounded bg-gray-500 hover:bg-gray-600 text-white flex items-center"
                        aria-label={t('print')}
                      >
                        <FaPrint className="mr-1" size={12} />
                        {t('print')}
                      </button>
                      {salesWithDelivery.has(sale.id) ? (
                        <button
                          onClick={() => handleTrackDelivery(sale)}
                          disabled={trackingLoading}
                          className="px-2 py-1 text-xs rounded bg-green-500 hover:bg-green-600 text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={t('track_delivery')}
                        >
                          <FaMapMarkerAlt className="mr-1" size={12} />
                          {trackingLoading ? t('loading') || 'Loading...' : t('track_delivery') || 'Track Delivery'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePlaceForDelivery(sale)}
                          className="px-2 py-1 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center"
                          aria-label={t('place_for_delivery')}
                        >
                          <FaTruck className="mr-1" size={12} />
                          {t('place_for_delivery') || 'Place for Delivery'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  {t('no_sales_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setOffset(offset - limit)}
          disabled={offset === 0}
          className={`px-4 py-2 rounded-lg ${offset === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 transition duration-300'}`}
        >
          {t('previous')}
        </button>
        <p>
          {t('showing')} {offset + 1} {t('to')} {Math.min(offset + limit, totalCount)} {t('of')} {totalCount} {t('sales_no')}
        </p>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= totalCount}
          className={`px-4 py-2 rounded-lg ${offset + limit >= totalCount ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 transition duration-300'}`}
        >
          {t('next')}
        </button>
      </div>

      {formVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{t('add_new_sale')}</h3>
              <button onClick={() => setFormVisible(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {success && <p className="text-green-500 mb-4">{success}</p>}
              <div className="mb-4">
                <label htmlFor="order" className="block text-gray-700">
                  {t('order')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="order"
                  name="order"
                  value={formData.order || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('select_order')}</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.order_number}
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
                  value={formData.quantity || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="sale_price" className="block text-gray-700">
                  {t('sale_price')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="sale_price"
                  name="sale_price"
                  value={formData.sale_price || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="payment_status" className="block text-gray-700">
                  {t('payment_status')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment_status"
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {paymentStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {t(status.label)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="payment_due_date" className="block text-gray-700">
                  {t('payment_due_date')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="payment_due_date"
                  name="payment_due_date"
                  value={formData.payment_due_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
                  onClick={() => setFormVisible(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg bg-primary-600 hover:bg-primary-700 transition duration-300"
                >
                  {t('add_sale')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Form Modal */}
      {deliveryFormVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('create_delivery_order') || 'Create Delivery Order'} 
                {selectedSaleForDelivery && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({t('sale')} #{selectedSaleForDelivery.id})
                  </span>
                )}
              </h3>
              <button onClick={closeDeliveryForm} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleDeliverySubmit} className="space-y-6">
              {deliveryError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                  {deliveryError}
                </div>
              )}
              {deliverySuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
                  {deliverySuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 uppercase tracking-wide">
                    {t('personal_information') || 'Personal Information'}
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('customer_name') || 'Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={deliveryFormData.customer_name}
                      onChange={handleDeliveryChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter customer full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phone_number') || 'Phone Number'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={deliveryFormData.phone_number}
                      onChange={handleDeliveryChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Customer phone number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('email') || 'Email'}
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      value={deliveryFormData.customer_email}
                      onChange={handleDeliveryChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Customer email address"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 uppercase tracking-wide">
                    {t('address_information') || 'Address Information'}
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('street_address') || 'Street Address'} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={deliveryFormData.address}
                      onChange={handleDeliveryChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="Enter delivery address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('city') || 'City'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={deliveryFormData.city}
                        onChange={handleDeliveryChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="City"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('state') || 'State'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={deliveryFormData.state}
                        onChange={handleDeliveryChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="State"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('zip_code') || 'ZIP Code'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      value={deliveryFormData.zip_code}
                      onChange={handleDeliveryChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="ZIP code"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('additional_instructions') || 'Additional Instructions'}
                </label>
                <textarea
                  name="delivery_instructions"
                  value={deliveryFormData.delivery_instructions}
                  onChange={handleDeliveryChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Special delivery instructions (optional)"
                />
              </div>

              {/* Location Picker */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {t('delivery_location') || 'Delivery Location'}
                </h4>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-72 w-full">
                    <LocationPicker
                      initialCenter={{ lat: deliveryFormData.latitude, lng: deliveryFormData.longitude }}
                      zoom={13}
                      onSelect={(lat, lng) => {
                        setDeliveryFormData(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng,
                        }));
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('latitude') || 'Latitude'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={deliveryFormData.latitude}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('longitude') || 'Longitude'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={deliveryFormData.longitude}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={closeDeliveryForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={deliveryLoading}
                  className={`px-6 py-2 rounded-lg text-white transition-colors ${
                    deliveryLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {deliveryLoading ? t('creating') || 'Creating...' : t('create_delivery_order') || 'Create Delivery Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Tracking Modal */}
      {trackingModalVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {t('delivery_tracking') || 'Delivery Tracking'}
                {trackingData && (
                  <span className="text-sm text-gray-500 ml-2">
                    (#{trackingData.tracking_number || trackingData.id})
                  </span>
                )}
              </h3>
              <button onClick={closeTrackingModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>

            {trackingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">
                {trackingError}
              </div>
            )}

            {trackingLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">{t('loading') || 'Loading...'}</span>
              </div>
            )}

            {trackingData && (
              <div className="space-y-6">
                {/* Delivery Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <FaTruck className="text-blue-600 mr-3" size={20} />
                    <h4 className="text-lg font-medium text-gray-900">
                      {t('delivery_status') || 'Delivery Status'}
                    </h4>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      trackingData.delivery_status === 'delivered'
                        ? 'bg-green-100 text-green-700'
                        : trackingData.delivery_status === 'in_transit'
                        ? 'bg-blue-100 text-blue-700'
                        : trackingData.delivery_status === 'picked_up'
                        ? 'bg-yellow-100 text-yellow-700'
                        : trackingData.delivery_status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {trackingData.delivery_status.charAt(0).toUpperCase() + trackingData.delivery_status.slice(1).replace('_', ' ')}
                    </span>
                  </div></div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-gray-600" />
                      {t('customer_information') || 'Customer Information'}
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">{t('customer_name') || 'Name'}:</span>
                        <span className="ml-2 text-gray-900">{trackingData.customer_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('phone_number') || 'Phone'}:</span>
                        <span className="ml-2 text-gray-900">{trackingData.phone_number}</span>
                      </div>
                      {trackingData.email && trackingData.email.trim() !== '' && (
                        <div>
                          <span className="font-medium text-gray-700">{t('email') || 'Email'}:</span>
                          <span className="ml-2 text-gray-900">{trackingData.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {t('delivery_information') || 'Delivery Information'}
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">{t('address') || 'Address'}:</span>
                        <div className="mt-1 text-gray-900">
                          {trackingData.address}<br />
                          {trackingData.city}, {trackingData.state} {trackingData.zip_code}
                        </div>
                      </div>
                      {trackingData.additional_instructions && trackingData.additional_instructions.trim() !== '' && (
                        <div>
                          <span className="font-medium text-gray-700">{t('instructions') || 'Instructions'}:</span>
                          <div className="mt-1 text-gray-900">{trackingData.additional_instructions}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Dates */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    {t('timeline') || 'Timeline'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">{t('order_created') || 'Order Created'}:</span>
                      <div className="text-gray-900">{new Date(trackingData.created_at).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{new Date(trackingData.created_at).toLocaleTimeString()}</div>
                    </div>
                    {trackingData.estimated_delivery_date && (
                      <div>
                        <span className="font-medium text-gray-700">{t('estimated_delivery') || 'Estimated Delivery'}:</span>
                        <div className="text-gray-900">{new Date(trackingData.estimated_delivery_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {trackingData.actual_delivery_date && (
                      <div>
                        <span className="font-medium text-gray-700">{t('delivered_on') || 'Delivered On'}:</span>
                        <div className="text-green-700 font-medium">{new Date(trackingData.actual_delivery_date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{new Date(trackingData.actual_delivery_date).toLocaleTimeString()}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    {t('order_details') || 'Order Details'}
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">{t('delivery_source') || 'Source'}:</span>
                        <div className="text-gray-900 text-sm">{trackingData.delivery_source}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{t('total_items') || 'Total Items'}:</span>
                        <span className="ml-2 text-gray-900">{trackingData.total_items}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{t('total_value') || 'Total Value'}:</span>
                      <span className="ml-2 text-gray-900 font-semibold">NPR {trackingData.total_value.toFixed(2)}</span>
                    </div>
                    {trackingData.product_details && trackingData.product_details.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700 block mb-2">{t('products') || 'Products'}:</span>
                        <div className="bg-white rounded-lg p-3 space-y-1">
                          {trackingData.product_details.map((product, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{product.name}</span>
                              <span className="text-gray-600">Qty: {product.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {trackingData.tracking_number && (
                      <div>
                        <span className="font-medium text-gray-700">{t('tracking_number') || 'Tracking Number'}:</span>
                        <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-sm">{trackingData.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Person Information */}
                {(trackingData.delivery_person_name || trackingData.delivery_person_phone) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {t('delivery_person_information') || 'Delivery Person Information'}
                    </h4>
                    <div className="space-y-2">
                      {trackingData.delivery_person_name && (
                        <div>
                          <span className="font-medium text-gray-700">{t('delivery_person_name') || 'Delivery Person'}:</span>
                          <span className="ml-2 text-gray-900">{trackingData.delivery_person_name}</span>
                        </div>
                      )}
                      {trackingData.delivery_person_phone && (
                        <div>
                          <span className="font-medium text-gray-700">{t('contact_number') || 'Contact'}:</span>
                          <span className="ml-2 text-gray-900">{trackingData.delivery_person_phone}</span>
                        </div>
                      )}
                      {trackingData.delivery_service && (
                        <div>
                          <span className="font-medium text-gray-700">{t('delivery_service') || 'Delivery Service'}:</span>
                          <span className="ml-2 text-gray-900">{trackingData.delivery_service}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Location Map */}
                {trackingData.latitude && trackingData.longitude && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-medium text-gray-900">
                      {t('delivery_location') || 'Delivery Location'}
                    </h4>
                    
                    {/* Location Coordinates Info */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="text-green-600 mr-2" size={16} />
                          <span className="text-sm font-medium text-green-800">
                            {t('exact_delivery_location') || 'Exact Delivery Location'}
                          </span>
                        </div>
                        <div className="text-xs text-green-700 font-mono">
                          {trackingData.latitude.toFixed(6)}, {trackingData.longitude.toFixed(6)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-green-700">
                        {trackingData.address}, {trackingData.city}, {trackingData.state}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="h-64 w-full">
                        <LocationPicker
                          initialCenter={{ 
                            lat: (() => {
                              console.log('🗺️ Rendering LocationPicker with tracking data:', {
                                lat: trackingData.latitude,
                                lng: trackingData.longitude,
                                showMarker: true,
                                trackingData
                              });
                              return trackingData.latitude;
                            })(), 
                            lng: trackingData.longitude 
                          }}
                          zoom={16}
                          onSelect={() => {}} // Read-only
                          showMarker={true}
                        />
                      </div>
                    </div>
                    
                    {/* Coordinates Display */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {t('latitude') || 'Latitude'}
                        </label>
                        <div className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                          {trackingData.latitude.toFixed(8)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {t('longitude') || 'Longitude'}
                        </label>
                        <div className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                          {trackingData.longitude.toFixed(8)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={closeTrackingModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleList;
