import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaDownload, FaTimes, FaPrint } from 'react-icons/fa';

// Define payment status options
const paymentStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

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
}

const SaleList: React.FC = () => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    quantity: null,
    sale_price: null,
    payment_status: "pending",
    payment_due_date: '',
    order: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSales = async () => {
    try {
      const params = { limit, offset };
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/sales/`, {
        params: params,
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      setSales(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error(t('error_fetching_sales'), error);
    }
  };

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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.payment_status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : sale.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : sale.payment_status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : sale.payment_status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : sale.payment_status === 'shipped'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-gray-100 text-gray-800'
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
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
                >
                  {t('add_sale')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleList;
