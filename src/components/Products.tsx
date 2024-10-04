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
  producer: string;
  images: ProductImage[];
  category_details: string;
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
  general?: string[];
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [viewingProductId, setViewingProductId] = useState<Product | null>(null);
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
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]); // State for existing images
  const [deletedImages, setDeletedImages] = useState<number[]>([]); // Track deleted images
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');

  const [producerSearchTerm, setProducerSearchTerm] = useState('');
  const [showProducerList, setShowProducerList] = useState(false);
  const producerSearchRef = useRef<HTMLDivElement>(null);

  const categoryOptions: Category[] = [
    { value: 'FR', label: 'Fruits' },
    { value: 'VG', label: 'Vegetables' },
    { value: 'GR', label: 'Grains & Cereals' },
    { value: 'PL', label: 'Pulses & Legumes' },
    { value: 'SP', label: 'Spices & Herbs' },
    { value: 'NT', label: 'Nuts & Seeds' },
    { value: 'DF', label: 'Dairy & Animal Products' },
    { value: 'FM', label: 'Fodder & Forage' },
    { value: 'FL', label: 'Flowers & Ornamental Plants' },
    { value: 'HR', label: 'Herbs & Medicinal Plants' },
    { value: 'OT', label: 'Other' },
  ];

  // Fetch Products and Producers
  useEffect(() => {
    fetchProducts(searchQuery, categoryFilter);
    fetchProducers();
    setCategories(categoryOptions);
  }, [searchQuery, categoryFilter]);

  const fetchProducts = async (query = '', category = '') => {
    try {
      let url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/?search=${query}`;
      if (category) {
        url += `&category=${category}`;
      }
      const response = await axios.get(url);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages(e.target.files);
  };

  const handleDeleteExistingImage = (imageId: number) => {
    setDeletedImages([...deletedImages, imageId]);
    setExistingImages(existingImages.filter((image) => image.id !== imageId));
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

    if (deletedImages.length > 0) {
      deletedImages.forEach((id) => formDataToSend.append('deleted_images', id.toString()));
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
    setExistingImages(product.images);
    setDeletedImages([]);
    setFormVisible(true);
  };

  const handleView = (product: Product) => {
    setViewingProductId(product);
  };

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
    setExistingImages([]);
    setDeletedImages([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Products List</h2>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2 sm:mt-0 px-4 py-2 border rounded-lg w-full sm:w-auto"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-auto"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
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
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => handleView(product)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
              >
                View
              </button>
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

      {/* View Product Details Modal */}
      {viewingProductId && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4 sm:p-8">
            <div
              className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity duration-500 ease-in-out opacity-0 animate-fade-in-overlay"
              aria-hidden="true"
            ></div>
            
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all sm:max-w-lg w-full z-30 scale-90 opacity-0 animate-fade-and-scale">
              <div className="bg-gray-50 px-6 py-5 sm:px-8 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-semibold text-gray-900">
                  {viewingProductId.name}
                </h3>
                <button
                  onClick={() => setViewingProductId(null)}
                  className="text-gray-500 hover:text-gray-800 transition duration-300 ease-in-out"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 py-5 sm:p-8">
                <div className="space-y-4">
                  <p><strong>Producer:</strong> {viewingProductId.producer}</p>
                  <p><strong>Category:</strong> {viewingProductId.category_details}</p>
                  <p><strong>Description:</strong> {viewingProductId.description}</p>
                  <p><strong>SKU:</strong> {viewingProductId.sku}</p>
                  <p><strong>Price:</strong> <span className="text-green-600 font-semibold">NPR {viewingProductId.price.toFixed(2)}</span></p>
                  <p><strong>Cost Price:</strong> <span className="text-red-500">NPR {viewingProductId.cost_price.toFixed(2)}</span></p>
                  <p><strong>Stock Quantity:</strong> {viewingProductId.stock}</p>
                  <p><strong>Reorder Level:</strong> {viewingProductId.reorder_level}</p>
                  <p><strong>Active Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-md text-sm ${viewingProductId.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {viewingProductId.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                
                {viewingProductId.images && viewingProductId.images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-bold mb-2">Product Images</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {viewingProductId.images.map((image) => (
                        <div key={image.id} className="overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out">
                          <img
                            src={image.image}
                            alt={image.alt_text || 'Product Image'}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end px-6 py-4 bg-gray-50 sm:px-8">
                <button
                  type="button"
                  onClick={() => setViewingProductId(null)}
                  className="bg-blue-600 hover:bg-blue-800 text-white px-5 py-2 rounded-lg shadow-md transition-all duration-300 ease-in-out"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

                  <div className="mb-4 relative" ref={producerSearchRef}>
                    <label htmlFor="producer" className="block text-gray-700">
                      Farmer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="producer"
                      name="producer"
                      value={producerSearchTerm}
                      onChange={(e) => {
                        setProducerSearchTerm(e.target.value);
                        setShowProducerList(true);
                      }}
                      onFocus={() => setShowProducerList(true)}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.producer ? 'border-red-500' : ''
                      }`}
                      placeholder="Search for a farmer..."
                      required
                    />
                    {showProducerList && (
                      <ul className="absolute z-10 bg-white border rounded-lg w-full max-h-48 overflow-y-auto mt-1">
                        {producers
                          .filter((producer) =>
                            producer.name
                              .toLowerCase()
                              .includes(producerSearchTerm.toLowerCase())
                          )
                          .map((producer) => (
                            <li
                              key={producer.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  producer: producer.id.toString(),
                                });
                                setProducerSearchTerm(producer.name);
                                setShowProducerList(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                            >
                              {producer.name}
                            </li>
                          ))}
                        {producers.filter((producer) =>
                          producer.name
                            .toLowerCase()
                            .includes(producerSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <li className="px-4 py-2">No producers found.</li>
                        )}
                      </ul>
                    )}
                    {errorMessages.producer && (
                      <p className="text-red-500 text-sm">
                        {errorMessages.producer[0]}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="category" className="block text-gray-700">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
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

                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.name ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {errorMessages.name && (
                      <p className="text-red-500 text-sm">{errorMessages.name[0]}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
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

                  <div className="mb-4">
                    <label htmlFor="sku" className="block text-gray-700">
                      SKU
                    </label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${
                        errorMessages.sku ? 'border-red-500' : ''
                      }`}
                    />
                    {errorMessages.sku && (
                      <p className="text-red-500 text-sm">{errorMessages.sku[0]}</p>
                    )}
                  </div>

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
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, cost_price: e.target.value })
                        }
                        className={`w-full px-4 py-2 border rounded-lg ${
                          errorMessages.cost_price ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      {errorMessages.cost_price && (
                        <p className="text-red-500 text-sm">
                          {errorMessages.cost_price[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stock" className="block text-gray-700">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="                        stock"
                        name="stock"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, reorder_level: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.checked })
                        }
                        className="mr-2 leading-tight"
                      />
                      <span className="text-gray-700">Is Active</span>
                    </div>
                  </div>

                  {existingImages.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-gray-700">Existing Images:</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {existingImages.map((image) => (
                          <div key={image.id} className="relative">
                            <img
                              src={image.image}
                              alt={image.alt_text || 'Product Image'}
                              className="w-full h-20 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingImage(image.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="images" className="block text-gray-700">
                      Upload New Images
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

