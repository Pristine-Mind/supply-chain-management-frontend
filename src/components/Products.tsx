import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  reorder_level: number;
  is_active: boolean;
}

interface Producer {
  id: number;
  name: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    producer: '',
    name: '',
    description: '',
    sku: '',
    price: '',
    cost_price: '',
    stock: '',
    reorder_level: '10',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/products/');
      setProducts(response.data.results);
    } catch (error) {
      console.error('Error fetching products', error);
    }
  };

  // Fetch producers from the server
  const fetchProducers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/producers/');
      setProducers(response.data.results);
    } catch (error) {
      console.error('Error fetching producers', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchProducers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/v1/products/', formData);
      setSuccess('Product added successfully!');
      setError('');
      setFormData({
        producer: '',
        name: '',
        description: '',
        sku: '',
        price: '',
        cost_price: '',
        stock: '',
        reorder_level: '10',
        is_active: true,
      });
      setFormVisible(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to add product');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Product List</h2>
        <button
          onClick={() => setFormVisible(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg z-20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Add New Product</h3>
              <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                <div className="mb-4">
                  <label htmlFor="producer" className="block text-gray-700">Producer</label>
                  <select
                    id="producer"
                    name="producer"
                    value={formData.producer}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select a Producer</option>
                    {producers.map((producer) => (
                      <option key={producer.id} value={producer.id}>
                        {producer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700">Product Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="block text-gray-700">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="sku" className="block text-gray-700">SKU</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="price" className="block text-gray-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="cost_price" className="block text-gray-700">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    id="cost_price"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="stock" className="block text-gray-700">Stock Quantity</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="reorder_level" className="block text-gray-700">Reorder Level</label>
                  <input
                    type="number"
                    id="reorder_level"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="is_active" className="block text-gray-700">Active</label>
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="mr-2 leading-tight"
                    />
                    <span className="text-gray-700">Is Active</span>
                  </div>
  
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setFormVisible(false)} // Close modal on cancel
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      Add Product
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
  
  export default Products;
  
