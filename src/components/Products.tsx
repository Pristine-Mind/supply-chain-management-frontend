import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios, { isAxiosError } from 'axios';
import ProductCard from './ProductCard';
import { FaEdit, FaPlus, FaDownload } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');

  const [producerSearchTerm, setProducerSearchTerm] = useState('');
  const [showProducerList, setShowProducerList] = useState(false);
  const producerSearchRef = useRef<HTMLDivElement>(null);

  const categoryOptions: Category[] = [
    { value: 'FR', label: t('fruits') },
    { value: 'VG', label: t('vegetables') },
    { value: 'GR', label: t('grains_cereals') },
    { value: 'PL', label: t('pulses_legumes') },
    { value: 'SP', label: t('spices_herbs') },
    { value: 'NT', label: t('nuts_seeds') },
    { value: 'DF', label: t('dairy_animal_products') },
    { value: 'FM', label: t('fodder_forage') },
    { value: 'FL', label: t('flowers_ornamental_plants') },
    { value: 'HR', label: t('herbs_medicinal_plants') },
    { value: 'OT', label: t('other') },
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
      const response = await axios.get(
        url,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        },
      );
      setProducts(response.data.results);
    } catch (error) {
      console.error(t('error_fetching_products'), error);
    }
  };

  const fetchProducers = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        },
      );
      setProducers(response.data.results);
    } catch (error) {
      console.error(t('error_fetching_producers'), error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImages(e.target.files);
  };

  const handleDeleteExistingImage = (imageId: number) => {
    setDeletedImages([...deletedImages, imageId]);
    setExistingImages(existingImages.filter((image) => image.id !== imageId));
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/export/products/`, {
        responseType: 'blob',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      link.setAttribute('download', 'products.xlsx');

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
              'Authorization': `Token ${localStorage.getItem('token')}`,
            },
          }
        );
        setSuccess(t('product_updated_successfully'));
      } else {
        await axios.post(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Token ${localStorage.getItem('token')}`,
            },
          }
        );
        setSuccess(t('product_added_successfully'));
      }
      resetForm();
      setFormVisible(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setErrorMessages(error.response?.data ?? { general: [t('error_occurred_try_again')] });
      } else {
        setErrorMessages({ general: [t('failed_add_update_product')] });
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
        <h2 className="text-xl sm:text-2xl font-bold">{t('products_list')}</h2>
        <input
          type="text"
          placeholder={t('search_products')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2 sm:mt-0 px-4 py-2 border rounded-lg w-full sm:w-auto"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-auto"
        >
          <option value="">{t('all_categories')}</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <div className="flex space-x-2">
        <button
          onClick={() => {
            resetForm();
            setFormVisible(true);
          }}
          className="flex items-center justify-center mt-2 sm:mt-0 bg-blue-500 text-white px-4 py-2 rounded-lg w-full sm:w-auto hover:bg-blue-600 transition duration-300"
        >
          <FaPlus className="mr-2" />
          {t('add_new_product')}
        </button>
        <button
            onClick={handleExport}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
          >
            <FaDownload className="mr-2" /> Export
          </button>
        </div>
        
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
                {t('view')}
              </button>
              <button
                onClick={() => handleEdit(product)}
                className="flex items-center bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-full"
              >
                <FaEdit className="mr-2" />
                {t('edit')}
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
                  <p>
                    <strong>{t('producer')}:</strong> {viewingProductId.producer}
                  </p>
                  <p>
                    <strong>{t('category')}:</strong> {viewingProductId.category_details}
                  </p>
                  <p>
                      <strong>{t('description')}:</strong>{' '}
                      <span dangerouslySetInnerHTML={{ __html: viewingProductId.description }} />
                    </p>
                  <p>
                    <strong>{t('sku')}:</strong> {viewingProductId.sku}
                  </p>
                  <p>
                    <strong>{t('price')}:</strong>{' '}
                    <span className="text-green-600 font-semibold">
                      NPR {viewingProductId.price.toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <strong>{t('cost_price')}:</strong>{' '}
                    <span className="text-red-500">
                      NPR {viewingProductId.cost_price.toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <strong>{t('stock_quantity')}:</strong> {viewingProductId.stock}
                  </p>
                  <p>
                    <strong>{t('reorder_level')}:</strong> {viewingProductId.reorder_level}
                  </p>
                  <p>
                    <strong>{t('active_status')}:</strong>
                    <span
                      className={`ml-2 px-2 py-1 rounded-md text-sm ${viewingProductId.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {viewingProductId.is_active ? t('active') : t('inactive')}
                    </span>
                  </p>
                </div>

                {viewingProductId.images && viewingProductId.images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-bold mb-2">{t('product_images')}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {viewingProductId.images.map((image) => (
                        <div
                          key={image.id}
                          className="overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out"
                        >
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
                  {t('close')}
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
              <div className="bg-gray-100 px-4 py-5 sm:px-6 rounded-lg shadow-md">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingProductId ? t('edit_product') : t('add_new_product')}
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
                      {t('producer')} <span className="text-red-500">*</span>
                    </label>                    <input
                      type="text"
                      id="producer"
                      name="producer"
                      value={producerSearchTerm}
                      onChange={(e) => {
                        setProducerSearchTerm(e.target.value);
                        setShowProducerList(true);
                      }}
                      onFocus={() => setShowProducerList(true)}
                      className={`w-full px-4 py-2 border rounded-lg ${errorMessages.producer ? 'border-red-500' : ''
                        }`}
                      placeholder={t('search_farmer')}
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
                          <li className="px-4 py-2">{t('no_producers_found')}</li>
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
                  <label htmlFor="name" className="block text-gray-700">
                    {t('product_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.name ? 'border-red-500' : ''
                      }`}
                    required
                  />
                  {errorMessages.name && (
                    <p className="text-red-500 text-sm">{errorMessages.name[0]}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="category" className="block text-gray-700">
                    {t('category')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.category ? 'border-red-500' : ''
                      }`}
                    required
                  >
                    <option value="">{t('select_category')}</option>
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
                  <label htmlFor="description" className="block text-gray-700">
                    {t('description')} <span className="text-red-500">*</span>
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={value => setFormData({ ...formData, description: value })}
                    className="mb-2 bg-white"
                  />
                  {errorMessages.description && (
                    <p className="text-red-500 text-sm">{errorMessages.description[0]}</p>
                  )}
                </div>

                

                <div className="mb-4">
                  <label htmlFor="sku" className="block text-gray-700">
                    {t('sku')}
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.sku ? 'border-red-500' : ''
                      }`}
                  />
                  {errorMessages.sku && (
                    <p className="text-red-500 text-sm">{errorMessages.sku[0]}</p>
                  )}
                </div>

                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-gray-700">
                      {t('price')} <span className="text-red-500">*</span>
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
                      className={`w-full px-4 py-2 border rounded-lg ${errorMessages.price ? 'border-red-500' : ''
                        }`}
                      required
                    />
                    {errorMessages.price && (
                      <p className="text-red-500 text-sm">{errorMessages.price[0]}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="cost_price" className="block text-gray-700">
                      {t('cost_price')} <span className="text-red-500">*</span>
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
                      className={`w-full px-4 py-2 border rounded-lg ${errorMessages.cost_price ? 'border-red-500' : ''
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
                      {t('stock_quantity')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${errorMessages.stock ? 'border-red-500' : ''
                        }`}
                      required
                    />
                    {errorMessages.stock && (
                      <p className="text-red-500 text-sm">{errorMessages.stock[0]}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reorder_level" className="block text-gray-700">
                      {t('reorder_level')}
                    </label>
                    <input
                      type="number"
                      id="reorder_level"
                      name="reorder_level"
                      value={formData.reorder_level}
                      onChange={(e) =>
                        setFormData({ ...formData, reorder_level: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg ${errorMessages.reorder_level ? 'border-red-500' : ''
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
                    {t('active_status')}
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
                    <span className="text-gray-700">{t('is_active')}</span>
                  </div>
                </div>

                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-gray-700">{t('existing_images')}</label>
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
                    {t('upload_new_images')}
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
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                    {editingProductId ? t('update_product') : t('add_product')}
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