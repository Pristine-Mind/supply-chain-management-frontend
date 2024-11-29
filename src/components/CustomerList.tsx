import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaPlus, FaDownload } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

ChartJS.register(ArcElement, Tooltip, Legend);

const CustomerList: React.FC = () => {
  const { t } = useTranslation();

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
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
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
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customers/`, {
        params: {
          limit: limit,
          offset: offset,
          search: searchQuery,
        },
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      setCustomers(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error(t('error_fetching_customers'), error);
    }
  };

  const fetchTopSalesCustomers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customer/top-sales/`,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }

    );
      setTopSalesCustomers(response.data);
    } catch (error) {
      console.error(t('error_fetching_top_sales_customers'), error);
    }
  };

  const fetchTopOrdersCustomers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customer/top-orders/`,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        }
      );
      setTopOrdersCustomers(response.data);
    } catch (error) {
      console.error(t('error_fetching_top_orders_customers'), error);
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
    setErrorMessages({ ...errorMessages, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomerId) {
        await axios.patch(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customers/${editingCustomerId}/`, 
          formData,
          {
            headers: {
              Authorization: `Token ${localStorage.getItem('token')}`,
            },
          }
        );
        setSuccess(t('customer_updated_successfully'));
        setEditingCustomerId(null);
      } else {
        await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customers/`,
          formData,
          {
            headers: {
              Authorization: `Token ${localStorage.getItem('token')}`,
            },
          }
        );
        setSuccess(t('customer_added_successfully'));
      }
      setErrorMessages({});
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
    } catch (error: any) {
      setErrorMessages({
        general: [t('failed_to_save_customer')],
      });
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleEditClick = (customer: Customer) => {
    setFormVisible(true);
    setFormData({
      name: customer.name,
      email: customer.email,
      contact: customer.contact,
      billing_address: customer.billing_address,
      shipping_address: customer.shipping_address,
      customer_type: customer.customer_type,
      credit_limit: customer.credit_limit,
      current_balance: customer.current_balance,
    });
    setEditingCustomerId(customer.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/export/customers/`, {
        responseType: 'blob',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      link.setAttribute('download', 'customers.xlsx');

      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Export error:', error.response?.data);
        setErrorMessages({ general: [t('error_exporting_data')] });
      } else {
        console.error('Unexpected error:', error);
        setErrorMessages({ general: [t('error_exporting_data')] });
      }
    }
  };

  const salesChartData = {
    labels: topSalesCustomers.map((customer) => customer.name),
    datasets: [
      {
        label: t('top_sales'),
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
        label: t('top_orders'),
        data: topOrdersCustomers.map((customer) => customer.total_orders),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Top Sales and Orders Section */}
      <div className="flex flex-wrap mb-8">
        <div className="w-full md:w-1/2 p-4">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{t('top_customers_by_sales')}</h3>
            <div className="w-full h-80">
              <Pie data={salesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-4">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{t('top_customers_by_orders')}</h3>
            <div className="w-full h-80">
              <Pie data={ordersChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Customer List and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">{t('customer_list')}</h2>
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={t('search_by_name')}
            className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-72"
          />
          <div className="flex space-x-2">
          <button
            onClick={() => {
              setFormVisible(true);
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
              setEditingCustomerId(null);
            }}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg w-full sm:w-auto hover:bg-blue-600 transition duration-300"
          >
            <FaPlus className="mr-2" />
            {t('add_customer')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
          >
            <FaDownload className="mr-2" /> Export
          </button>
          </div>
          
        </div>
      </div>

            {/* Customer Table */}
            <div className="overflow-x-auto bg-white shadow-md rounded-lg mb-8">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="text-xs uppercase bg-blue-500 text-white">
            <tr>
              <th className="py-3 px-6 text-left">{t('customer_name')}</th>
              <th className="py-3 px-6 text-left">{t('email')}</th>
              <th className="py-3 px-6 text-left">{t('contact')}</th>
              <th className="py-3 px-6 text-left">{t('billing_address')}</th>
              <th className="py-3 px-6 text-left">{t('shipping_address')}</th>
              <th className="py-3 px-6 text-left">{t('customer_type')}</th>
              <th className="py-3 px-6 text-left">{t('credit_limit')}</th>
              <th className="py-3 px-6 text-left">{t('current_balance')}</th>
              <th className="py-3 px-6 text-left">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-100 cursor-pointer transition duration-200"
                >
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    {customer.name}
                  </td>
                  <td className="py-4 px-6">{customer.email}</td>
                  <td className="py-4 px-6">{customer.contact}</td>
                  <td className="py-4 px-6">{customer.billing_address}</td>
                  <td className="py-4 px-6">{customer.shipping_address}</td>
                  <td className="py-4 px-6">{customer.customer_type}</td>
                  <td className="py-4 px-6">{customer.credit_limit}</td>
                  <td className="py-4 px-6">{customer.current_balance}</td>
                  <td className="py-4 px-6 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(customer)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleCustomerClick(customer)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                    >
                      {t('view')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  {t('no_customers_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousPage}
          disabled={offset === 0}
          className={`px-4 py-2 rounded-lg ${offset === 0
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 transition duration-300'
            }`}
        >
          {t('previous')}
        </button>

        <p className="text-gray-700">
          {t('showing')} {offset + 1} {t('to')} {Math.min(offset + limit, totalCount)} {t('of')} {totalCount} {t('customers')}
        </p>

        <button
          onClick={handleNextPage}
          disabled={offset + limit >= totalCount}
          className={`px-4 py-2 rounded-lg ${offset + limit >= totalCount
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 transition duration-300'
            }`}
        >
          {t('next')}
        </button>
      </div>

      {/* Customer Detail Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed z-10 inset-0 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-gray-800 opacity-50" onClick={closeModal}></div>
          <div className="bg-white rounded-lg shadow-lg p-8 relative z-20 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{selectedCustomer.name}</h3>
            <div className="space-y-4">
              <div className="flex">
                <span className="font-semibold text-gray-600 w-1/3">{t('email')}:</span>
                <span className="text-gray-800">{selectedCustomer.email}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-1/3">{t('contact')}:</span>
                <span className="text-gray-800">{selectedCustomer.contact}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-1/3">{t('billing_address')}:</span>
                <span className="text-gray-800">{selectedCustomer.billing_address}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-1/3">{t('shipping_address')}:</span>
                <span className="text-gray-800">{selectedCustomer.shipping_address}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-1/3">{t('customer_type')}:</span>
                <span className="text-gray-800">{selectedCustomer.customer_type}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-1/3">{t('credit_limit')}:</span>
                <span className="text-gray-800">{selectedCustomer.credit_limit}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-1/3">{t('current_balance')}:</span>
                <span className="text-gray-800">{selectedCustomer.current_balance}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-gray-800 opacity-50" onClick={() => setFormVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-lg p-8 relative z-20 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 bg-gray-200 px-4 py-2 rounded-lg">
              {editingCustomerId ? t('edit_customer') : t('add_new_customer')}
            </h3>

            <form onSubmit={handleSubmit}>
              {errorMessages.general && (
                <p className="text-red-500 mb-4">{errorMessages.general[0]}</p>
              )}
              {success && <p className="text-green-500 mb-4">{success}</p>}

              {/* Customer Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700">
                  {t('customer_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                />
                {errorMessages.name && (
                  <p className="text-red-500 text-sm">{errorMessages.name[0]}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700">
                  {t('email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                />
                {errorMessages.email && (
                  <p className="text-red-500 text-sm">{errorMessages.email[0                  ]}</p>
                )}
              </div>

              {/* Contact */}
              <div className="mb-4">
                <label htmlFor="contact" className="block text-gray-700">
                  {t('contact')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.contact ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                />
                {errorMessages.contact && (
                  <p className="text-red-500 text-sm">{errorMessages.contact[0]}</p>
                )}
              </div>

              {/* Billing Address */}
              <div className="mb-4">
                <label htmlFor="billing_address" className="block text-gray-700">
                  {t('billing_address')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="billing_address"
                  name="billing_address"
                  value={formData.billing_address}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.billing_address ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                ></textarea>
                {errorMessages.billing_address && (
                  <p className="text-red-500 text-sm">{errorMessages.billing_address[0]}</p>
                )}
              </div>

              {/* Shipping Address */}
              <div className="mb-4">
                <label htmlFor="shipping_address" className="block text-gray-700">
                  {t('shipping_address')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="shipping_address"
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.shipping_address ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                ></textarea>
                {errorMessages.shipping_address && (
                  <p className="text-red-500 text-sm">{errorMessages.shipping_address[0]}</p>
                )}
              </div>

              {/* Customer Type */}
              <div className="mb-4">
                <label htmlFor="customer_type" className="block text-gray-700">
                  {t('customer_type')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="customer_type"
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.customer_type ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                >
                  <option value="Retailer">{t('retailer')}</option>
                  <option value="Wholesaler">{t('wholesaler')}</option>
                  <option value="Distributor">{t('distributor')}</option>
                </select>
                {errorMessages.customer_type && (
                  <p className="text-red-500 text-sm">{errorMessages.customer_type[0]}</p>
                )}
              </div>

              {/* Credit Limit */}
              <div className="mb-4">
                <label htmlFor="credit_limit" className="block text-gray-700">
                  {t('credit_limit')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="credit_limit"
                  name="credit_limit"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.credit_limit ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                  min="0"
                  step="0.01"
                />
                {errorMessages.credit_limit && (
                  <p className="text-red-500 text-sm">{errorMessages.credit_limit[0]}</p>
                )}
              </div>

              {/* Current Balance */}
              <div className="mb-4">
                <label htmlFor="current_balance" className="block text-gray-700">
                  {t('current_balance')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="current_balance"
                  name="current_balance"
                  value={formData.current_balance}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errorMessages.current_balance ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg`}
                  required
                  min="0"
                  step="0.01"
                />
                {errorMessages.current_balance && (
                  <p className="text-red-500 text-sm">{errorMessages.current_balance[0]}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
                  onClick={() => setFormVisible(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  {editingCustomerId ? t('update_customer') : t('add_customer')}
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

