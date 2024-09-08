import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface CustomerDetails {
    name: string,
    contact: string;
}

interface Sale {
  id: number;
  customer: Customer;
  product: Product;
  quantity: number;
  sale_price: number;
  sale_date: string;
  customer_name: string;
  customer_contact: string;
  customer_details: CustomerDetails;
  product_details: Product;
}

const SaleList: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<number | 'all'>('all');
  const [filterProduct, setFilterProduct] = useState<number | 'all'>('all');
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    customer: '',
    product: '',
    quantity: 1,
    sale_price: 0,
    customer_name: '',
    customer_contact: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch sales with filters and pagination
  const fetchSales = async () => {
    try {
      const params: any = {
        limit,
        offset,
      };
      if (searchQuery) params.search = searchQuery;
      if (filterCustomer !== 'all') params.customer = filterCustomer;
      if (filterProduct !== 'all') params.product = filterProduct;
      console.log(params)
      const response = await axios.get('http://localhost:8000/api/v1/sales/', { params: params,});
      setSales(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching sales', error);
    }
  };

  // Fetch customers for filters and add sale form
  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/customers/');
      setCustomers(response.data.results);
    } catch (error) {
      console.error('Error fetching customers', error);
    }
  };

  // Fetch products for filters and add sale form
  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/products/');
      setProducts(response.data.results);
    } catch (error) {
      console.error('Error fetching products', error);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, [offset, searchQuery, filterCustomer, filterProduct]);

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
      await axios.post('http://localhost:8000/api/v1/sales/', formData);
      setSuccess('Sale added successfully!');
      setError('');
      setFormData({
        customer: '',
        product: '',
        quantity: 1,
        sale_price: 0,
        customer_name: '',
        customer_contact: '',
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by product or end-user name..."
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
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mb-8">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="py-3 px-6">Customer</th>
              <th className="py-3 px-6">Product</th>
              <th className="py-3 px-6">Quantity</th>
              <th className="py-3 px-6">Sale Price</th>
              <th className="py-3 px-6">Sale Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">{sale.customer_details.name}</td>
                  <td className="py-4 px-6">{sale.product_details.name}</td>
                  <td className="py-4 px-6">{sale.quantity}</td>
                  <td className="py-4 px-6">${sale.sale_price}</td>
                  <td className="py-4 px-6">{new Date(sale.sale_date).toLocaleDateString()}</td>
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
          onClick={handlePreviousPage}
          disabled={offset === 0}
          className={`px-4 py-2 rounded-lg ${offset === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
        >
          Previous
        </button>

        <p>
          Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} sales
        </p>

        <button
          onClick={handleNextPage}
          disabled={offset + limit >= totalCount}
          className={`px-4 py-2 rounded-lg          ${offset + limit >= totalCount ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
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
                  <label htmlFor="customer" className="block text-gray-700">Customer</label>
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
                  <label htmlFor="product" className="block text-gray-700">Product</label>
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
                  <label htmlFor="quantity" className="block text-gray-700">Quantity</label>
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
                  <label htmlFor="sale_price" className="block text-gray-700">Sale Price</label>
                  <input
                    type="number"
                    id="sale_price"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="customer_name" className="block text-gray-700">End-User Name (Optional)</label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="customer_contact" className="block text-gray-700">End-User Contact (Optional)</label>
                  <input
                    type="text"
                    id="customer_contact"
                    name="customer_contact"
                    value={formData.customer_contact}
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

