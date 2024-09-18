import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Customer {
  id: number;
  name: string;
  email: string;
  contact: string;
  billing_address: string;
  shipping_address: string;
  customer_type: string;
  credit_limit: number;
  current_balance: number;
}

interface CustomerSales {
  id: number;
  name: string;
  total_sales: number;
}

interface CustomerOrders {
  id: number;
  name: string;
  total_orders: number;
}

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [topSalesCustomers, setTopSalesCustomers] = useState<CustomerSales[]>([]);
  const [topOrdersCustomers, setTopOrdersCustomers] = useState<CustomerOrders[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    billing_address: '',
    shipping_address: '',
    customer_type: 'Retailer',
    credit_limit: 0.0,
    current_balance: 0.0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customers/`, {
        params: {
          limit: limit,
          offset: offset,
          search: searchQuery,
        },
      });
      setCustomers(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching customers', error);
    }
  };

  const fetchTopSalesCustomers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customer/top-sales/`);
      setTopSalesCustomers(response.data);
    } catch (error) {
      console.error('Error fetching top sales customers', error);
    }
  };

  const fetchTopOrdersCustomers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customer/top-orders/`);
      setTopOrdersCustomers(response.data);
    } catch (error) {
      console.error('Error fetching top orders customers', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchTopSalesCustomers();
    fetchTopOrdersCustomers();
  }, [offset, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customers/`, formData);
      setSuccess('Customer added successfully!');
      setError('');
      setFormData({
        name: '',
        email: '',
        contact: '',
        billing_address: '',
        shipping_address: '',
        customer_type: 'Retailer',
        credit_limit: 0.0,
        current_balance: 0.0,
      });
      setFormVisible(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to add customer');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const salesChartData = {
    labels: topSalesCustomers.map((customer) => customer.name),
    datasets: [
      {
        label: 'Top Sales',
        data: topSalesCustomers.map((customer) => customer.total_sales),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  const ordersChartData = {
    labels: topOrdersCustomers.map((customer) => customer.name),
    datasets: [
      {
        label: 'Top Orders',
        data: topOrdersCustomers.map((customer) => customer.total_orders),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex flex-wrap mb-8">
        <div className="w-full md:w-1/2 p-4">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Top Customers by Sales</h3>
            <div className="w-full h-80">
              <Pie data={salesChartData} />
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-4">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Top Customers by Orders</h3>
            <div className="w-full h-80">
              <Pie data={ordersChartData} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Customer List</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search by name..."
            className="px-4 py-2 border border-gray-300 rounded-lg w-72"
          />
          <button
            onClick={() => setFormVisible(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Add Customer
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg mb-8">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="text-xs uppercase bg-blue-500 text-white">
            <tr>
              <th className="py-3 px-6 text-left">Customer Name</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Contact</th>
              <th className="py-3 px-6 text-left">Billing Address</th>
              <th className="py-3 px-6 text-left">Shipping Address</th>
              <th className="py-3 px-6 text-left">Customer Type</th>
              <th className="py-3 px-6 text-left">Credit Limit</th>
              <th className="py-3 px-6 text-left">Current Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  className="hover:bg-gray-100 cursor-pointer transition duration-200"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{customer.name}</td>
                    <td className="py-4 px-6">{customer.email}</td>
                    <td className="py-4 px-6">{customer.contact}</td>
                    <td className="py-4 px-6">{customer.billing_address}</td>
                    <td className="py-4 px-6">{customer.shipping_address}</td>
                    <td className="py-4 px-6">{customer.customer_type}</td>
                    <td className="py-4 px-6">{customer.credit_limit}</td>
                    <td className="py-4 px-6">{customer.current_balance}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No customers found.
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
            className={`px-4 py-2 rounded-lg ${
              offset === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 transition duration-300'
            }`}
          >
            Previous
          </button>
  
          <p className="text-gray-700">
            Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} customers
          </p>
  
          <button
            onClick={handleNextPage}
            disabled={offset + limit >= totalCount}
            className={`px-4 py-2 rounded-lg ${
              offset + limit >= totalCount ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 transition duration-300'
            }`}
          >
            Next
          </button>
        </div>
  
        {isModalOpen && selectedCustomer && (
          <div className="fixed z-10 inset-0 overflow-y-auto flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-800 opacity-50" onClick={closeModal}></div>
            <div className="bg-white rounded-lg shadow-lg p-8 relative z-20 w-full max-w-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{selectedCustomer.name}</h3>
              <div className="space-y-4">
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-1/3">Email:</span>
                  <span className="text-gray-800">{selectedCustomer.email}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-1/3">Contact:</span>
                  <span className="text-gray-800">{selectedCustomer.contact}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-1/3">Billing Address:</span>
                  <span className="text-gray-800">{selectedCustomer.billing_address}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-1/3">Shipping Address:</span>
                  <span className="text-gray-800">{selectedCustomer.shipping_address}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-1/3">Customer Type:</span>
                  <span className="text-gray-800">{selectedCustomer.customer_type}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-1/3">Credit Limit:</span>
                  <span className="text-gray-800">{selectedCustomer.credit_limit}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-1/3">Current Balance:</span>
                  <span className="text-gray-800">{selectedCustomer.current_balance}</span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
  
        {formVisible && (
          <div className="fixed z-10 inset-0 overflow-y-auto flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-800 opacity-50" onClick={() => setFormVisible(false)}></div>
            <div className="bg-white rounded-lg shadow-lg p-8 relative z-20 w-full max-w-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Customer</h3>
              <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}
  
                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
  
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
  
                <div className="mb-4">
                  <label htmlFor="contact" className="block text-gray-700">Contact</label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
  
                <div className="mb-4">
                  <label htmlFor="billing_address" className="block text-gray-700">Billing Address</label>
                  <textarea
                    id="billing_address"
                    name="billing_address"
                    value={formData.billing_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
  
                <div className="mb-4">
                  <label htmlFor="shipping_address" className="block text-gray-700">Shipping Address</label>
                  <textarea
                    id="shipping_address"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
  
                <div className="mb-4">
                  <label htmlFor="customer_type" className="block text-gray-700">Customer Type</label>
                  <select
                    id="customer_type"
                    name="customer_type"
                    value={formData.customer_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="Retailer">Retailer</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
  
                <div className="mb-4">
                  <label htmlFor="credit_limit" className="block text-gray-700">Credit Limit</label>
                  <input
                    type="number"
                    id="credit_limit"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
  
                <div className="mb-4">
                  <label htmlFor="current_balance" className="block text-gray-700">Current Balance</label>
                  <input
                    type="number"
                    id="current_balance"
                    name="current_balance"
                    value={formData.current_balance}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
  
                <div className="flex justify-end">
                  <button type="button"
                  className="mr-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
                  onClick={() => setFormVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;  
