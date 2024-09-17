import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define payment status options
const paymentStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

interface Order {
  id: number;
  order_number: string;
}

interface Sale {
  id: number;
  quantity: number | null;
  sale_price: number | null;
  payment_status: string | null;
  payment_status_display: string | null;
  payment_due_date: string | null;
  order: number | null;
}

const SaleList: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    quantity: null,
    sale_price: null,
    payment_status: "pending", // Default to pending
    payment_due_date: '',
    order: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch sales with filters and pagination
  const fetchSales = async () => {
    try {
      const params = {
        limit,
        offset,
      };
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/sales/`, {
        params: params,
      });
      setSales(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching sales', error);
    }
  };

  // Fetch orders for the dropdown
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/orders/`);
      setOrders(response.data.results);
    } catch (error) {
      console.error('Error fetching orders', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/sales/`, formData);
      setSuccess('Sale added successfully!');
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
    } catch (error) {
      setError('Failed to add sale');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sale List</h2>
        <button
          onClick={() => setFormVisible(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Add Sale
        </button>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="py-3 px-6">Order</th>
              <th className="py-3 px-6">Quantity</th>
              <th className="py-3 px-6">Sale Price</th>
              <th className="py-3 px-6">Payment Status</th>
              <th className="py-3 px-6">Payment Due Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="py-4 px-6">{sale.order}</td>
                  <td className="py-4 px-6">{sale.quantity}</td>
                  <td className="py-4 px-6">${sale.sale_price}</td>
                  <td className="py-4 px-6">{sale.payment_status_display}</td>
                  <td className="py-4 px-6">{sale.payment_due_date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No sales found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setOffset(offset - limit)}
          disabled={offset === 0}
          className={`px-4 py-2 rounded-lg ${offset === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
        >
          Previous
        </button>

        <p>
          Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} sales
        </p>

        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= totalCount}
          className={`px-4 py-2 rounded-lg ${offset + limit >= totalCount ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
        >
          Next
        </button>
      </div>

      {/* Add Sale Modal */}
      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg z-20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Add New Sale</h3>
              <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                <div className="mb-4">
                  <label htmlFor="order" className="block text-gray-700">Order</label>
                  <select
                    id="order"
                    name="order"
                    value={formData.order || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Order</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.order_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="quantity" className="block text-gray-700">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="sale_price" className="block text-gray-700">Sale Price</label>
                  <input
                    type="number"
                    id="sale_price"
                    name="sale_price"
                    value={formData.sale_price || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="payment_status" className="block text-gray-700">Payment Status</label>
                  <select
                    id="payment_status"
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded                   -lg"
                    required
                  >
                    {paymentStatusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="payment_due_date" className="block text-gray-700">Payment Due Date</label>
                  <input
                    type="date"
                    id="payment_due_date"
                    name="payment_due_date"
                    value={formData.payment_due_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                    onClick={() => setFormVisible(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg"
                  >
                    Add Sale
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

export default SaleList;

