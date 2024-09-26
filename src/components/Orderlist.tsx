import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  const fetchOrders = async () => {
    try {
      const params: Record<string, string | number> = {
        limit,
        offset,
      };
      if (searchQuery) params.search = searchQuery;
      if (filterCustomer !== 'all') params.customer = filterCustomer;
      if (filterProduct !== 'all') params.product = filterProduct;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/orders/`, { params });
      setOrders(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching orders', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customers/`);
      setCustomers(response.data.results);
    } catch (error) {
      console.error('Error fetching customers', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/`);
      setProducts(response.data.results);
    } catch (error) {
      console.error('Error fetching products', error);
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
    try {
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/orders/`, formData);
      setSuccess('Order added successfully!');
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
      setError('Failed to add order');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Order List</h2>
        <button
          onClick={() => setFormVisible(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by order number..."
          className="px-4 py-2 border rounded-lg w-1/4"
        />

        <select
          value={filterCustomer}
          onChange={handleFilterCustomer}
          className="px-4 py-2 border rounded-lg w-1/4"
        >
          <option value="all">All Customers</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>

        <select
          value={filterProduct}
          onChange={handleFilterProduct}
          className="px-4 py-2 border rounded-lg w-1/4"
        >
          <option value="all">All Products</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={handleFilterStatus}
          className="px-4 py-2 border rounded-lg w-1/4"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="py-3 px-6">Order Number</th>
              <th className="py-3 px-6">Customer</th>
              <th className="py-3 px-6">Product</th>
              <th className="py-3 px-6">Quantity</th>
              <th className="py-3 px-6">Total Price</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Order Date</th>
              <th className="py-3 px-6">Delivery Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{order.order_number}</td>
                  <td className="py-4 px-6">{order.customer_details.name}</td>
                  <td className="py-4 px-6">{order.product_details.name}</td>
                  <td className="py-4 px-6">{order.quantity}</td>
                  <td className="py-4 px-6">${order.total_price}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="py-4 px-6">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousPage}
          disabled={offset === 0}
          className={`px-4 py-2 rounded-lg ${offset === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
        >
          Previous
        </button>

        <p>
          Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} orders
        </p>

        <button
          onClick={handleNextPage}
          disabled={offset + limit >= totalCount}
          className={`px-4 py-2 rounded-lg ${offset + limit >= totalCount ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
        >
          Next
        </button>
      </div>

      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg z-20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Add New Order</h3>
              <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                <div className="mb-4">
                  <label htmlFor="customer" className="block text-gray-700">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="product" className="block text-gray-700">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="quantity" className="block text-gray-700">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                    min="1"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="status" className="block text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="notes" className="block text-gray-700">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
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
                    Add Order
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
