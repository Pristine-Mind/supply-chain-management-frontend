import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

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
  category: string;
  images: ProductImage[];
}

interface Producer {
  id: number;
  name: string;
}

interface Category {
  value: string;
  label: string;
}

interface ErrorMessages {
  producer?: string[];
  name?: string[];
  description?: string[];
  sku?: string[];
  price?: string[];
  cost_price?: string[];
  stock?: string[];
  reorder_level?: string[];
  category?: string[];
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
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
    category: '',
  });
  const [images, setImages] = useState<FileList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');

  const [producerSearchTerm, setProducerSearchTerm] = useState('');
  const [showProducerList, setShowProducerList] = useState(false);
  const producerSearchRef = useRef<HTMLDivElement>(null);

  const fetchProducts = async (query = '') => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/?search=${query}`
      );
      setProducts(response.data.results);
    } catch (error) {
      console.error('Error fetching products', error);
    }
  };

  const fetchProducers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`
      );
      setProducers(response.data.results);
    } catch (error) {
      console.error('Error fetching producers', error);
    }
  };

  const categoryOptions: Category[] = [
    { value: 'EL', label: 'Electronics' },
    { value: 'FA', label: 'Fashion & Clothing' },
    // Add other categories
  ];

  useEffect(() => {
    fetchProducts(searchQuery);
    fetchProducers();
    setCategories(categoryOptions);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setErrorMessages({ ...errorMessages, [name]: undefined });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages(e.target.files);
  };

  const handleProducerSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProducerSearchTerm(e.target.value);
    setShowProducerList(true);
  };

  const handleProducerSelect = (producer: Producer) => {
    setFormData({
      ...formData,
      producer: producer.id.toString(),
    });
    setProducerSearchTerm(producer.name);
    setShowProducerList(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        producerSearchRef.current &&
        !producerSearchRef.current.contains(event.target as Node)
      ) {
        setShowProducerList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredProducers = producers.filter((producer) =>
    producer.name.toLowerCase().includes(producerSearchTerm.toLowerCase())
  );

  const resetForm = () => {
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
      category: '',
    });
    setImages(null);
    setProducerSearchTerm('');
    setEditingProductId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append('producer', formData.producer);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('sku', formData.sku);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('cost_price', formData.cost_price);
    formDataToSend.append('stock', formData.stock);
    formDataToSend.append('reorder_level', formData.reorder_level);
    formDataToSend.append('is_active', String(formData.is_active));
    formDataToSend.append('category', formData.category);

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formDataToSend.append('uploaded_images', images[i]);
      }
    }

    try {
      if (editingProductId) {
        await axios.patch(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/${editingProductId}/`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setSuccess('Product updated successfully!');
      } else {
        await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setSuccess('Product added successfully!');
      }
      resetForm();
      setFormVisible(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessages(error.response.data);
      } else {
        setErrorMessages({ general: ['Failed to save product. Please try again.'] });
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      producer: product.producer?.toString() || '',
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      stock: product.stock.toString(),
      reorder_level: product.reorder_level.toString(),
      is_active: product.is_active,
      category: product.category,
    });
    setFormVisible(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Product List</h2>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          className="mt-2 sm:mt-0 px-4 py-2 border rounded-lg w-full sm:w-auto"
        />
        <button
          onClick={() => {
            resetForm();
            setFormVisible(true);
          }}
          className="mt-2 sm:mt-0 bg-blue-500 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="relative">
                        <ProductCard product={product} />
            <div className="absolute top-2 right-2">
              <button
                onClick={() => handleEdit(product)}
                className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-full"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {formVisible && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-8">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
            ></div>

            <div className="bg-white rounded-lg shadow-xl overflow-hidden transform transition-all sm:max-w-lg w-full z-20">
              <div className="bg-gray-50 px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingProductId ? 'Edit Product' : 'Add New Product'}
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  {errorMessages.general && (
                    <p className="text-red-500 mb-4">{errorMessages.general[0]}</p>
                  )}
                  {success && <p className="text-green-500 mb-4">{success}</p>}

                  {/* Producer Search Input */}
                  <div className="mb-4 relative" ref={producerSearchRef}>
                    <label htmlFor="producer" className="block text-gray-700">
                      Producer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="producer"
                      name="producer"
                      value={producerSearchTerm}
                      onChange={handleProducerSearchChange}
                      onFocus={() => setShowProducerList(true)}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.producer ? 'border-red-500' : ''
                      }`}
                      placeholder="Search for a producer..."
                      required
                    />
                    {showProducerList && filteredProducers.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded-lg w-full max-h-48 overflow-y-auto mt-1">
                        {filteredProducers.map((producer) => (
                          <li
                            key={producer.id}
                            onClick={() => handleProducerSelect(producer)}
                            className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                          >
                            {producer.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    {showProducerList && filteredProducers.length === 0 && (
                      <p className="absolute z-10 bg-white border rounded-lg w-full px-4 py-2 mt-1">
                        No producers found.
                      </p>
                    )}
                    {errorMessages.producer && (
                      <p className="text-red-500 text-sm">
                        {errorMessages.producer[0]}
                      </p>
                    )}
                  </div>

                  {/* Category Select Input */}
                  <div className="mb-4">
                    <label htmlFor="category" className="block text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.category ? 'border-red-500' : ''
                      }`}
                      required
                    >
                      <option value="">Select a Category</option>
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errorMessages.category && (
                      <p className="text-red-500 text-sm">
                        {errorMessages.category[0]}
                      </p>
                    )}
                  </div>

                  {/* Name Input */}
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.name ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {errorMessages.name && (
                      <p className="text-red-500 text-sm">{errorMessages.name[0]}</p>
                    )}
                  </div>

                  {/* Description Input */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.description ? 'border-red-500' : ''
                      }`}
                      required
                    ></textarea>
                    {errorMessages.description && (
                      <p className="text-red-500 text-sm">
                        {errorMessages.description[0]}
                      </p>
                    )}
                  </div>

                  {/* SKU Input */}
                  <div className="mb-4">
                    <label htmlFor="sku" className="block text-gray-700">
                      SKU
                    </label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.sku ? 'border-red-500' : ''
                      }`}
                    />
                    {errorMessages.sku && (
                      <p className="text-red-500 text-sm">{errorMessages.sku[0]}</p>
                    )}
                  </div>

                  {/* Price and Cost Price Inputs */}
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-gray-700">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${
                          errorMessages.price ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {errorMessages.price && (
                        <p className="text-red-500 text-sm">{errorMessages.price[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="cost_price" className="block text-gray-700">
                        Cost Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        id="cost_price"
                        name="cost_price"
                        value={formData.cost_price}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${
                          errorMessages.cost_price ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {errorMessages.cost_price && (
                        <p className="text-red-500 text-sm">{errorMessages.cost_price[0]}</p>
                      )}
                    </div>
                  </div>

                  {/* Stock and Reorder Level Inputs */}
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stock" className="block text-gray-700">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${
                          errorMessages.stock ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {errorMessages.stock && (
                        <p className="text-red-500 text-sm">{errorMessages.stock[0]}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reorder_level" className="block text-gray-700">
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        id="reorder_level"
                        name="reorder_level"
                        value={formData.reorder_level}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg ${
                          errorMessages.reorder_level ? 'border-red-500' : ''
                        }`}
                      />
                      {errorMessages.reorder_level && (
                        <p className="text-red-500 text-sm">
                          {errorMessages.reorder_level[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active Status Input */}
                  <div className="mb-4">
                  <label htmlFor="is_active" className="block text-gray-700">
                      Active Status
                    </label>
                    <div className="flex items-center">
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
                  </div>

                  {/* Image Upload */}
                  <div className="mb-4">
                    <label htmlFor="images" className="block text-gray-700">
                      Upload Images
                    </label>
                    <input
                      type="file"
                      id="images"
                      name="images"
                      multiple
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormVisible(false);
                        resetForm();
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      {editingProductId ? 'Update Product' : 'Add Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;


