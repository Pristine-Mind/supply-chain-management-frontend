import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios, { isAxiosError } from 'axios';
import { FaEdit, FaPlus, FaDownload, FaSearch, FaTimes, FaCheck, FaImage } from 'react-icons/fa';
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
  avg_daily_demand?: number;
  stddev_daily_demand?: number;
  safety_stock?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  lead_time_days?: number;
  projected_stockout_date_field?: string;
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
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [editingStock, setEditingStock] = useState<{ id: number | null, value: string }>({ id: null, value: '' });
  const [stockUpdateError, setStockUpdateError] = useState('');
  const [stockUpdateSuccess, setStockUpdateSuccess] = useState('');
  const [quickUpdateStock, setQuickUpdateStock] = useState<{ id: number | null, value: string }>({ id: null, value: '' });
  const [exportingProductId, setExportingProductId] = useState<number | null>(null);
  const [producerSearchTerm, setProducerSearchTerm] = useState('');
  const [showProducerList, setShowProducerList] = useState(false);
  const producerSearchRef = useRef<HTMLDivElement>(null);

  const categoryOptions: Category[] = [
    { value: 'FA', label: t('fashion_apparel') },
    { value: 'EG', label: t('electronics_gadgets') },
    { value: 'GE', label: t('groceries_essentials') },
    { value: 'HB', label: t('health_beauty') },
    { value: 'HL', label: t('home_living') },
    { value: 'TT', label: t('travel_tourism') },
    { value: 'IS', label: t('industrial_supplies') },
    { value: 'OT', label: t('other') },
  ];

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
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      setProducts(response.data.results);
    } catch (error) {
      console.error(t('error_fetching_products'), error);
    }
  };

  const fetchProducers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/producers/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
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
      const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/export/products/`, {
        responseType: 'blob',
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
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
      fetchProducts(searchQuery, categoryFilter);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setErrorMessages(error.response?.data ?? { general: [t('error_occurred_try_again')] });
      } else {
        setErrorMessages({ general: [t('failed_add_update_product')] });
      }
    }
  };

  const handleQuickUpdateStock = (product: Product) => {
    setQuickUpdateStock({ id: product.id, value: product.stock.toString() });
  };

  const handleUpdateStock = async (productId: number) => {
    const stockValue = quickUpdateStock.id === productId ? quickUpdateStock.value : editingStock.value;

    if (!stockValue || isNaN(Number(stockValue))) {
      setStockUpdateError('Please enter a valid number');
      return;
    }
    try {
      setIsUpdatingStock(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products/${productId}/update-stock/`,
        { stock: Number(stockValue) },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          }
        }
      );

      const updatedProduct = response.data;
      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, stock: updatedProduct.stock }
          : product
      ));

      if (viewingProductId && viewingProductId.id === productId) {
        setViewingProductId({
          ...viewingProductId,
          stock: updatedProduct.stock
        });
      }

      setStockUpdateSuccess('Stock updated successfully!');
      setStockUpdateError('');
      setEditingStock({ id: null, value: '' });

      setTimeout(() => {
        setStockUpdateSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Error updating stock:', error);
      setStockUpdateError('Failed to update stock. Please try again.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      producer: product.producer.toString(),
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

  const handleExportStats = async (productId: number) => {
    try {
      setExportingProductId(productId);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/daily-product-stats/?product=${productId}&export=excel`,
        {
          headers: {
            'Authorization': `Token ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `product_${productId}_stats.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting product stats:', error);
    } finally {
      setExportingProductId(null);
    }
  };

  const handleCloseModal = () => {
    setViewingProductId(null);
    setEditingStock({ id: null, value: '' });
    setStockUpdateError('');
    setStockUpdateSuccess('');
    setQuickUpdateStock({ id: null, value: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 sm:mb-0">{t('products_list')}</h2>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={t('search_products')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
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
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              <FaPlus className="mr-2" /> {t('add_new_product')}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
            >
              <FaDownload className="mr-2" /> {t('export')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-lg p-4 transition-transform transform hover:scale-105">
            <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
            <p className="text-gray-600 mt-2" dangerouslySetInnerHTML={{ __html: product.description }} />
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handleView(product)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                {t('view')}
              </button>
              <button
                onClick={() => handleEdit(product)}
                className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                <FaEdit className="mr-1" /> {t('edit')}
              </button>
            </div>
            <div className="mt-2 flex justify-between">
              {quickUpdateStock.id === product.id ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={quickUpdateStock.value}
                    onChange={(e) => setQuickUpdateStock({ ...quickUpdateStock, value: e.target.value })}
                    className="w-20 px-2 py-1 border rounded"
                    min="0"
                    step="1"
                  />
                  <button
                    onClick={() => {
                      handleUpdateStock(product.id);
                      setQuickUpdateStock({ id: null, value: '' });
                    }}
                    disabled={isUpdatingStock}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs whitespace-nowrap transition duration-300"
                  >
                    {isUpdatingStock ? 'Updating...' : <FaCheck />}
                  </button>
                  <button
                    onClick={() => setQuickUpdateStock({ id: null, value: '' })}
                    className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs transition duration-300"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleQuickUpdateStock(product)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded text-xs whitespace-nowrap transition duration-300"
                >
                  {t('update_stock')}
                </button>
              )}
              <button
                onClick={() => handleExportStats(product.id)}
                disabled={exportingProductId === product.id}
                className="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded text-xs whitespace-nowrap transition duration-300"
              >
                {exportingProductId === product.id ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('exporting')}
                  </>
                ) : (
                  <>
                    <FaDownload className="mr-1" />
                    {t('export_stats')}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewingProductId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{viewingProductId.name}</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p><strong>{t('producer')}:</strong> {viewingProductId.producer}</p>
              <p><strong>{t('category')}:</strong> {viewingProductId.category_details}</p>
              <p><strong>{t('description')}:</strong> <span dangerouslySetInnerHTML={{ __html: viewingProductId.description }} /></p>
              <p><strong>{t('sku')}:</strong> {viewingProductId.sku}</p>
              <p><strong>{t('price')}:</strong> Rs. {viewingProductId.price.toFixed(2)}</p>
              <p><strong>{t('cost_price')}:</strong> NPR {viewingProductId.cost_price.toFixed(2)}</p>
              <div className="flex items-center space-x-2">
                <strong>{t('stock_quantity')}:</strong>
                {editingStock.id === viewingProductId.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editingStock.value}
                      onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                      className="w-20 px-2 py-1 border rounded"
                      min="0"
                      step="1"
                    />
                    <button
                      onClick={() => handleUpdateStock(viewingProductId.id)}
                      disabled={isUpdatingStock}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50 transition duration-300"
                    >
                      {isUpdatingStock ? t('updating') : <FaCheck />}
                    </button>
                    <button
                      onClick={() => setEditingStock({ id: null, value: '' })}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm transition duration-300"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>{viewingProductId.stock}</span>
                    <button
                      onClick={() => setEditingStock({ id: viewingProductId.id, value: viewingProductId.stock.toString() })}
                      className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition duration-300"
                    >
                      {t('update')}
                    </button>
                  </div>
                )}
              </div>
              {stockUpdateError && <p className="text-red-500 text-sm mt-1">{stockUpdateError}</p>}
              {stockUpdateSuccess && <p className="text-green-500 text-sm mt-1">{stockUpdateSuccess}</p>}
              <p><strong>{t('reorder_level')}:</strong> {viewingProductId.reorder_level}</p>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                  <FaImage className="mr-2" />
                  {t('inventory_metrics')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">{t('avg_daily_demand')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewingProductId.avg_daily_demand ? viewingProductId.avg_daily_demand.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">{t('safety_stock')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewingProductId.safety_stock || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">{t('reorder_point')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewingProductId.reorder_point || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">{t('reorder_quantity')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewingProductId.reorder_quantity || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <p>
                <strong>{t('active_status')}:</strong>
                <span className={`ml-2 px-2 py-1 rounded-md text-sm ${viewingProductId.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {viewingProductId.is_active ? t('active') : t('inactive')}
                </span>
              </p>
              {viewingProductId.images && viewingProductId.images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">{t('product_images')}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingProductId.images.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-lg shadow-lg">
                        <img src={image.image} alt={image.alt_text || 'Product Image'} className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {formVisible && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProductId ? t('edit_product') : t('add_new_product')}
              </h3>
              <button onClick={() => { setFormVisible(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {errorMessages.general && <p className="text-red-500 mb-4">{errorMessages.general[0]}</p>}
              {success && <p className="text-green-500 mb-4">{success}</p>}
              <div className="mb-4 relative" ref={producerSearchRef}>
                <label htmlFor="producer" className="block text-gray-700">
                  {t('producer')} <span className="text-red-500">*</span>
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
                  className={`w-full px-4 py-2 border rounded-lg ${errorMessages.producer ? 'border-red-500' : ''}`}
                  placeholder={t('search_farmer')}
                  required
                />
                {showProducerList && (
                  <ul className="absolute z-10 bg-white border rounded-lg w-full max-h-48 overflow-y-auto mt-1">
                    {producers
                      .filter((producer) =>
                        producer.name.toLowerCase().includes(producerSearchTerm.toLowerCase())
                      )
                      .map((producer) => (
                        <li
                          key={producer.id}
                          onClick={() => {
                            setFormData({ ...formData, producer: producer.id.toString() });
                            setProducerSearchTerm(producer.name);
                            setShowProducerList(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-200 cursor-pointer transition duration-300"
                        >
                          {producer.name}
                        </li>
                      ))}
                    {producers.filter((producer) =>
                      producer.name.toLowerCase().includes(producerSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <li className="px-4 py-2">{t('no_producers_found')}</li>
                    )}
                  </ul>
                )}
                {errorMessages.producer && <p className="text-red-500 text-sm">{errorMessages.producer[0]}</p>}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${errorMessages.name ? 'border-red-500' : ''}`}
                  required
                />
                {errorMessages.name && <p className="text-red-500 text-sm">{errorMessages.name[0]}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="category" className="block text-gray-700">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${errorMessages.category ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">{t('select_category')}</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errorMessages.category && <p className="text-red-500 text-sm">{errorMessages.category[0]}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700">
                  {t('description')} <span className="text-red-500">*</span>
                </label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  className="mb-2 bg-white"
                />
                {errorMessages.description && <p className="text-red-500 text-sm">{errorMessages.description[0]}</p>}
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
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${errorMessages.sku ? 'border-red-500' : ''}`}
                />
                {errorMessages.sku && <p className="text-red-500 text-sm">{errorMessages.sku[0]}</p>}
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
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.price ? 'border-red-500' : ''}`}
                    required
                  />
                  {errorMessages.price && <p className="text-red-500 text-sm">{errorMessages.price[0]}</p>}
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
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.cost_price ? 'border-red-500' : ''}`}
                    required
                  />
                  {errorMessages.cost_price && <p className="text-red-500 text-sm">{errorMessages.cost_price[0]}</p>}
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
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.stock ? 'border-red-500' : ''}`}
                    required
                  />
                  {errorMessages.stock && <p className="text-red-500 text-sm">{errorMessages.stock[0]}</p>}
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
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg ${errorMessages.reorder_level ? 'border-red-500' : ''}`}
                  />
                  {errorMessages.reorder_level && <p className="text-red-500 text-sm">{errorMessages.reorder_level[0]}</p>}
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
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition duration-300"
                        >
                          <FaTimes />
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
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg transition duration-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg transition duration-300"
                >
                  {editingProductId ? t('update_product') : t('add_product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
