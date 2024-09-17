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

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
    category: '',
  });
  const [images, setImages] = useState<FileList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
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

  // TODO: Fetch from server
  const categoryOptions: Category[] = [
    { value: 'EL', label: 'Electronics' },
    { value: 'FA', label: 'Fashion & Clothing' },
    { value: 'HB', label: 'Health & Beauty' },
    { value: 'HK', label: 'Home & Kitchen' },
    { value: 'GR', label: 'Groceries & Gourmet Food' },
    { value: 'SO', label: 'Sports & Outdoors' },
    { value: 'TK', label: 'Toys, Kids & Baby Products' },
    { value: 'BM', label: 'Books, Music & Movies' },
    { value: 'AI', label: 'Automotive & Industrial' },
    { value: 'PS', label: 'Pet Supplies' },
    { value: 'OS', label: 'Office & Stationery' },
    { value: 'HF', label: 'Health & Fitness' },
    { value: 'JA', label: 'Jewelry & Accessories' },
    { value: 'GF', label: 'Gifts & Flowers' },
  ];

  useEffect(() => {
    fetchProducts(searchQuery);
    fetchProducers();
    setCategories(categoryOptions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        category: '',
      });
      setImages(null);
      setProducerSearchTerm('');
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
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          className="px-4 py-2 border rounded-lg"
        />
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
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg z-20">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Add New Product
              </h3>
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {success && <p className="text-green-500 mb-4">{success}</p>}

                <div className="mb-4 relative" ref={producerSearchRef}>
                  <label htmlFor="producer" className="block text-gray-700">
                    Producer
                  </label>
                  <input
                    type="text"
                    id="producer"
                    name="producer"
                    value={producerSearchTerm}
                    onChange={handleProducerSearchChange}
                    onFocus={() => setShowProducerList(true)}
                    className="w-full px-4 py-2 border rounded-lg"
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
                </div>

                <div className="mb-4">
                  <label htmlFor="category" className="block text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select a Category</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700">
                    Product Name
                  </label>
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
                  <label htmlFor="description" className="block text-gray-700">
                    Description
                  </label>
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
                  <label htmlFor="sku" className="block text-gray-700">
                    SKU
                  </label>
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
                  <label htmlFor="price" className="block text-gray-700">
                    Price
                  </label>
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
                  <label htmlFor="cost_price" className="block text-gray-700">
                    Cost Price
                  </label>
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
                  <label htmlFor="stock" className="block text-gray-700">
                    Stock Quantity
                  </label>
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
                  <label htmlFor="reorder_level" className="block text-gray-700">
                    Reorder Level
                  </label>
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
                  <label htmlFor="is_active" className="block text-gray-700">
                    Active Status
                  </label>
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

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormVisible(false)}
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
