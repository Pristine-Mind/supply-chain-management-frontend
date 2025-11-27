import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios, { isAxiosError } from 'axios';
import { FaEdit, FaPlus, FaDownload, FaSearch, FaTimes, FaCheck, FaImage } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { CategorySelector } from './CategoryHierarchy';
import { createMarketplaceProductFromProduct } from '../api/marketplaceApi';

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
  size?: string | null;
  color?: string | null;
  additional_information?: string | null;
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

// Size and Color choices
const SIZE_CHOICES = [
  { value: 'XS', label: 'Extra Small' },
  { value: 'S', label: 'Small' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Large' },
  { value: 'XL', label: 'Extra Large' },
  { value: 'XXL', label: 'Double Extra Large' },
  { value: 'XXXL', label: 'Triple Extra Large' },
  { value: 'ONE_SIZE', label: 'One Size' },
  { value: 'CUSTOM', label: 'Custom Size' },
];

const COLOR_CHOICES = [
  { value: 'RED', label: 'Red' },
  { value: 'BLUE', label: 'Blue' },
  { value: 'GREEN', label: 'Green' },
  { value: 'YELLOW', label: 'Yellow' },
  { value: 'BLACK', label: 'Black' },
  { value: 'WHITE', label: 'White' },
  { value: 'GRAY', label: 'Gray' },
  { value: 'BROWN', label: 'Brown' },
  { value: 'ORANGE', label: 'Orange' },
  { value: 'PURPLE', label: 'Purple' },
  { value: 'PINK', label: 'Pink' },
  { value: 'NAVY', label: 'Navy' },
  { value: 'BEIGE', label: 'Beige' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'MULTICOLOR', label: 'Multicolor' },
  { value: 'TRANSPARENT', label: 'Transparent' },
  { value: 'CUSTOM', label: 'Custom Color' },
];

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
    category: '', // Legacy category field for backward compatibility
    size: '',
    color: '',
    additional_information: '',
  });
  
  // New category hierarchy state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedSubSubcategoryId, setSelectedSubSubcategoryId] = useState<number | null>(null);
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
  const [creatingMarketplaceProduct, setCreatingMarketplaceProduct] = useState<number | null>(null);
  const [marketplaceSuccess, setMarketplaceSuccess] = useState('');
  const [marketplaceError, setMarketplaceError] = useState('');

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

  // Map producer when producers are loaded and we have an editing product
  useEffect(() => {
    const editingProductStr = sessionStorage.getItem('editingProduct');
    if (editingProductStr && producers.length > 0) {
      const editingProduct = JSON.parse(editingProductStr);
      
      let selectedProducer = null;
      let producerId = '';
      
      
      if (editingProduct.producer) {
        if (typeof editingProduct.producer === 'string') {
          // Producer is a name string - find by name
          selectedProducer = producers.find(p => p.name === editingProduct.producer);
          
          if (!selectedProducer) {
            selectedProducer = producers.find(p => 
              p.name.toLowerCase() === editingProduct.producer.toLowerCase()
            );
          }
          
          if (!selectedProducer) {
            selectedProducer = producers.find(p => 
              p.name.trim().toLowerCase() === editingProduct.producer.trim().toLowerCase()
            );
          }
          
          if (selectedProducer) {
            producerId = selectedProducer.id.toString();
          } else {
          }
        } else if (typeof editingProduct.producer === 'number') {
          // Producer is an ID number - find by ID
          selectedProducer = producers.find(p => p.id === editingProduct.producer);
          
          if (selectedProducer) {
            producerId = selectedProducer.id.toString();
          } else {
          }
        } else {
        }
        
        // Update form data with the producer ID if found
        if (selectedProducer) {
          setFormData(prev => {
            const newFormData = {
              ...prev,
              producer: producerId
            };
            return newFormData;
          });
          
          // Also verify after a short delay
          setTimeout(() => {
          }, 100);
        }
      } else {
      }
      
      // Clear the stored product since we've processed it
      sessionStorage.removeItem('editingProduct');
    }
  }, [producers]);

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
      console.log('Producers API response:', response.data);
      setProducers(response.data.results || response.data || []);
    } catch (error) {
      console.error(t('error_fetching_producers'), error);
      setProducers([]); // Set empty array on error
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
    
    // Legacy category field for backward compatibility
    formDataToSend.append('category', formData.category);
    
    // New category hierarchy fields
    if (selectedCategoryId) {
      formDataToSend.append('category_id', selectedCategoryId.toString());
    }
    if (selectedSubcategoryId) {
      formDataToSend.append('subcategory_id', selectedSubcategoryId.toString());
    }
    if (selectedSubSubcategoryId) {
      formDataToSend.append('sub_subcategory_id', selectedSubSubcategoryId.toString());
    }
    
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
    
    // Ensure producers are loaded before trying to map
    if (producers.length === 0) {
      fetchProducers();
    }
    
    setFormData({
      producer: '', // Will be set by useEffect after producers load
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      stock: product.stock.toString(),
      reorder_level: product.reorder_level.toString(),
      is_active: product.is_active,
      category: product.category || '',
      size: product.size || '',
      color: product.color || '',
      additional_information: product.additional_information || '',
    });
    
    // Store the product for producer mapping
    sessionStorage.setItem('editingProduct', JSON.stringify(product));
    
    // Reset category hierarchy state to null for consistency
    // TODO: If product has category/subcategory/sub_subcategory IDs in the future, set them here
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedSubSubcategoryId(null);
    
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
      size: '',
      color: '',
      additional_information: '',
    });
    
    // Reset category hierarchy state
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedSubSubcategoryId(null);
    
    setImages(null);
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

  const createMarketplaceProduct = async (productId: number) => {
    setCreatingMarketplaceProduct(productId);
    setMarketplaceError('');
    setMarketplaceSuccess('');
    
    try {
      const response = await createMarketplaceProductFromProduct({ product_id: productId });
      setMarketplaceSuccess(response.message);
      setTimeout(() => setMarketplaceSuccess(''), 5000);
    } catch (error) {
      setMarketplaceError(error instanceof Error ? error.message : 'Failed to create marketplace product');
      setTimeout(() => setMarketplaceError(''), 5000);
    } finally {
      setCreatingMarketplaceProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{t('products_list')}</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                resetForm();
                if (producers.length === 0) {
                  fetchProducers();
                }
                setFormVisible(true);
              }}
              className="flex items-center bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
            >
              <FaPlus className="mr-2" size={14} /> {t('add_new_product')}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
            >
              <FaDownload className="mr-2" size={14} /> {t('export')}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={t('search_products')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 border border-neutral-300 rounded-xl w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white"
            />
            <FaSearch className="absolute left-4 top-3.5 text-neutral-400" size={14} />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white min-w-[180px]"
          >
            <option value="">{t('all_categories')}</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="group bg-white rounded-xl border border-neutral-200 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 pr-2">{product.name}</h3>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {product.is_active ? t('active') : t('inactive')}
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="text-sm text-neutral-600 line-clamp-3" dangerouslySetInnerHTML={{ __html: product.description }} />
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-500">{t('price')}:</span>
                  <span className="ml-2 font-semibold text-gray-900">Rs. {product.price.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-neutral-500">{t('stock')}:</span>
                  <span className={`ml-2 font-semibold ${product.stock <= product.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                    {product.stock}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">{t('sku')}:</span>
                  <span className="ml-2 font-medium text-gray-700">{product.sku}</span>
                </div>
                <div>
                  <span className="text-neutral-500">{t('category')}:</span>
                  <span className="ml-2 font-medium text-gray-700">{product.category}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleView(product)}
                  className="flex-1 bg-blue-50 text-blue-700 font-medium py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  {t('view')}
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center"
                >
                  <FaEdit className="mr-1" size={12} /> {t('edit')}
                </button>
              </div>
              
              <div className="flex space-x-2">
                {quickUpdateStock.id === product.id ? (
                  <div className="flex items-center space-x-2 w-full">
                    <input
                      type="number"
                      value={quickUpdateStock.value}
                      onChange={(e) => setQuickUpdateStock({ ...quickUpdateStock, value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={t('new_stock')}
                    />
                    <button
                      onClick={() => {
                        handleUpdateStock(product.id);
                        setQuickUpdateStock({ id: null, value: '' });
                      }}
                      disabled={isUpdatingStock}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      {isUpdatingStock ? '...' : <FaCheck size={12} />}
                    </button>
                    <button
                      onClick={() => setQuickUpdateStock({ id: null, value: '' })}
                      className="p-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 text-sm transition-colors"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleQuickUpdateStock(product)}
                      className="flex-1 bg-orange-50 text-orange-700 font-medium py-2 px-3 rounded-lg hover:bg-orange-100 transition-colors text-sm"
                    >
                      {t('update_stock')}
                    </button>
                    <button
                      onClick={() => handleExportStats(product.id)}
                      disabled={exportingProductId === product.id}
                      className="flex-1 bg-green-50 text-green-700 font-medium py-2 px-3 rounded-lg hover:bg-green-100 transition-colors text-sm flex items-center justify-center"
                    >
                      {exportingProductId === product.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <FaDownload className="mr-1" size={12} />
                          {t('export_stats')}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => createMarketplaceProduct(product.id)}
                  disabled={creatingMarketplaceProduct === product.id || !product.is_active}
                  className={`flex-1 font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center ${
                    !product.is_active 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {creatingMarketplaceProduct === product.id ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <FaPlus className="mr-1" size={12} />
                      Push To Marketplace
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-16">
          <div className="relative mx-auto p-6 border-0 w-full max-w-2xl shadow-elevation-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-h2 font-semibold text-neutral-900">{viewingProductId.name}</h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-caption font-medium text-neutral-500">{t('producer')}</span>
                  <p className="text-body text-neutral-900 mt-1">{viewingProductId.producer}</p>
                </div>
                <div>
                  <span className="text-caption font-medium text-neutral-500">{t('category')}</span>
                  <p className="text-body text-neutral-900 mt-1">{viewingProductId.category_details}</p>
                </div>
                <div>
                  <span className="text-caption font-medium text-neutral-500">{t('sku')}</span>
                  <p className="text-body text-neutral-900 mt-1">{viewingProductId.sku}</p>
                </div>
                <div>
                  <span className="text-caption font-medium text-neutral-500">{t('price')}</span>
                  <p className="text-body text-neutral-900 mt-1">Rs. {viewingProductId.price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-caption font-medium text-neutral-500">{t('cost_price')}</span>
                  <p className="text-body text-neutral-900 mt-1">NPR {viewingProductId.cost_price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-caption font-medium text-neutral-500">{t('reorder_level')}</span>
                  <p className="text-body text-neutral-900 mt-1">{viewingProductId.reorder_level}</p>
                </div>
                {viewingProductId.size && (
                  <div>
                    <span className="text-caption font-medium text-neutral-500">Size</span>
                    <p className="text-body text-neutral-900 mt-1">{SIZE_CHOICES.find(choice => choice.value === viewingProductId.size)?.label || viewingProductId.size}</p>
                  </div>
                )}
                {viewingProductId.color && (
                  <div>
                    <span className="text-caption font-medium text-neutral-500">Color</span>
                    <p className="text-body text-neutral-900 mt-1">{COLOR_CHOICES.find(choice => choice.value === viewingProductId.color)?.label || viewingProductId.color}</p>
                  </div>
                )}
              </div>
              
              {viewingProductId.additional_information && (
                <div>
                  <span className="text-caption font-medium text-neutral-500">Additional Information</span>
                  <div className="text-body text-neutral-900 mt-1 whitespace-pre-wrap">{viewingProductId.additional_information}</div>
                </div>
              )}
              
              <div>
                <span className="text-caption font-medium text-neutral-500">{t('description')}</span>
                <div className="text-body text-neutral-900 mt-1" dangerouslySetInnerHTML={{ __html: viewingProductId.description }} />
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-caption font-medium text-neutral-500">{t('stock_quantity')}:</span>
                {editingStock.id === viewingProductId.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editingStock.value}
                      onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                      className="w-24 px-3 py-2 border border-neutral-300 rounded-md text-body focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      step="1"
                    />
                    <button
                      onClick={() => handleUpdateStock(viewingProductId.id)}
                      disabled={isUpdatingStock}
                      className="px-3 py-2 bg-accent-success-600 text-white rounded-md hover:bg-accent-success-700 text-caption disabled:opacity-50 transition-colors flex items-center"
                    >
                      {isUpdatingStock ? t('updating') : <FaCheck />}
                    </button>
                    <button
                      onClick={() => setEditingStock({ id: null, value: '' })}
                      className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-300 text-caption transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="text-body text-neutral-900">{viewingProductId.stock}</span>
                    <button
                      onClick={() => setEditingStock({ id: viewingProductId.id, value: viewingProductId.stock.toString() })}
                      className="px-3 py-1 text-caption bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-700 transition-colors"
                    >
                      {t('update')}
                    </button>
                  </div>
                )}
              </div>
              {stockUpdateError && <p className="text-accent-error-600 text-caption mt-2">{stockUpdateError}</p>}
              {stockUpdateSuccess && <p className="text-accent-success-600 text-caption mt-2">{stockUpdateSuccess}</p>}
              
              <div className="pt-6 border-t border-neutral-200">
                <h4 className="text-h3 font-medium text-neutral-900 mb-4 flex items-center">
                  <FaImage className="mr-2 text-primary-600" />
                  {t('inventory_metrics')}
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-caption font-medium text-neutral-500">{t('avg_daily_demand')}</p>
                    <p className="text-body font-medium text-neutral-900">
                      {viewingProductId.avg_daily_demand ? viewingProductId.avg_daily_demand.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-caption font-medium text-neutral-500">{t('safety_stock')}</p>
                    <p className="text-body font-medium text-neutral-900">
                      {viewingProductId.safety_stock || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-caption font-medium text-neutral-500">{t('reorder_point')}</p>
                    <p className="text-body font-medium text-neutral-900">
                      {viewingProductId.reorder_point || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-caption font-medium text-neutral-500">{t('reorder_quantity')}</p>
                    <p className="text-body font-medium text-neutral-900">
                      {viewingProductId.reorder_quantity || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-caption font-medium text-neutral-500">{t('active_status')}</span>
                <span className={`ml-3 px-3 py-1 rounded-full text-caption font-medium ${viewingProductId.is_active ? 'bg-accent-success-100 text-accent-success-800' : 'bg-accent-error-100 text-accent-error-800'}`}>
                  {viewingProductId.is_active ? t('active') : t('inactive')}
                </span>
              </div>
              {viewingProductId.images && viewingProductId.images.length > 0 && (
                <div className="pt-6 border-t border-neutral-200">
                  <h4 className="text-h3 font-medium text-neutral-900 mb-4">{t('product_images')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {viewingProductId.images.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-lg shadow-elevation-md">
                        <img src={image.image} alt={image.alt_text || 'Product Image'} className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-6 border-t border-neutral-200">
                <button
                  onClick={() => {
                    createMarketplaceProduct(viewingProductId.id);
                    handleCloseModal();
                  }}
                  disabled={creatingMarketplaceProduct === viewingProductId.id || !viewingProductId.is_active}
                  className={`w-full font-medium py-3 px-4 rounded-lg transition-colors text-sm flex items-center justify-center ${
                    !viewingProductId.is_active 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {creatingMarketplaceProduct === viewingProductId.id ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <FaPlus className="mr-2" size={16} />
                      Create Marketplace Product
                    </>
                  )}
                </button>
                {!viewingProductId.is_active && (
                  <p className="text-sm text-gray-500 mt-2 text-center">Product must be active to create marketplace listing</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {formVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-8">
          <div className="relative mx-auto p-6 border-0 w-full max-w-2xl shadow-elevation-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-h2 font-semibold text-neutral-900">
                {editingProductId ? t('edit_product') : t('add_new_product')}
              </h3>
              <button onClick={() => { setFormVisible(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
              {errorMessages.general && <div className="p-4 bg-accent-error-50 border border-accent-error-200 rounded-lg">
                <p className="text-accent-error-700 text-body">{errorMessages.general[0]}</p>
              </div>}
              {success && <div className="p-4 bg-accent-success-50 border border-accent-success-200 rounded-lg">
                <p className="text-accent-success-700 text-body">{success}</p>
              </div>}
              {marketplaceSuccess && <div className="p-4 bg-accent-success-50 border border-accent-success-200 rounded-lg">
                <p className="text-accent-success-700 text-body">{marketplaceSuccess}</p>
              </div>}
              {marketplaceError && <div className="p-4 bg-accent-error-50 border border-accent-error-200 rounded-lg">
                <p className="text-accent-error-700 text-body">{marketplaceError}</p>
              </div>}
              <div>
                <label htmlFor="producer" className="block text-body font-medium text-neutral-700 mb-2">
                  {t('producer')} <span className="text-accent-error-500">*</span>
                </label>
                <select
                  id="producer"
                  name="producer"
                  value={formData.producer}
                  onChange={(e) => {
                    console.log('Producer dropdown changed to:', e.target.value);
                    setFormData({ ...formData, producer: e.target.value });
                  }}
                  className={`w-full px-4 py-3 border rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errorMessages.producer ? 'border-accent-error-300 focus:ring-accent-error-500 focus:border-accent-error-500' : 'border-neutral-300'}`}
                  required
                >
                  <option value="">Select Producer ({producers.length} available)</option>
                  {producers.length === 0 && (
                    <option value="" disabled>Loading producers...</option>
                  )}
                  {producers.map((producer) => (
                    <option key={producer.id} value={producer.id.toString()}>
                      {producer.name} (ID: {producer.id})
                    </option>
                  ))}
                </select>
                {errorMessages.producer && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.producer[0]}</p>}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-body font-medium text-neutral-700 mb-2">
                  {t('product_name')} <span className="text-accent-error-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errorMessages.name ? 'border-accent-error-300 focus:ring-accent-error-500 focus:border-accent-error-500' : 'border-neutral-300'}`}
                  required
                />
                {errorMessages.name && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.name[0]}</p>}
              </div>
              <div>
                <label className="block text-body font-medium text-neutral-700 mb-2">
                  {t('category')} <span className="text-accent-error-500">*</span>
                </label>
                
                {/* New Category Hierarchy Selector */}
                <CategorySelector
                  selectedCategory={selectedCategoryId}
                  selectedSubcategory={selectedSubcategoryId}
                  selectedSubSubcategory={selectedSubSubcategoryId}
                  onCategoryChange={setSelectedCategoryId}
                  onSubcategoryChange={setSelectedSubcategoryId}
                  onSubSubcategoryChange={setSelectedSubSubcategoryId}
                  required={true}
                  showHierarchy={true}
                  mode="dropdown"
                />
                
                {/* Legacy Category Selector (for backward compatibility) */}
                <div className="mt-4">
                  <label htmlFor="legacy-category" className="block text-sm font-medium text-gray-600 mb-1">
                    Legacy Category (optional)
                  </label>
                  <select
                    id="legacy-category"
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">{t('select_category')}</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {errorMessages.category && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.category[0]}</p>}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-body font-medium text-neutral-700 mb-2">
                  {t('description')} <span className="text-accent-error-500">*</span>
                </label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  className="mb-2 bg-white rounded-lg border border-neutral-300"
                />
                {errorMessages.description && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.description[0]}</p>}
              </div>
              
              <div>
                <label htmlFor="sku" className="block text-body font-medium text-neutral-700 mb-2">
                  {t('sku')}
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errorMessages.sku ? 'border-accent-error-300 focus:ring-accent-error-500 focus:border-accent-error-500' : 'border-neutral-300'}`}
                />
                {errorMessages.sku && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.sku[0]}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-body font-medium text-neutral-700 mb-2">
                    {t('price')} <span className="text-accent-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errorMessages.price ? 'border-accent-error-300 focus:ring-accent-error-500 focus:border-accent-error-500' : 'border-neutral-300'}`}
                    required
                  />
                  {errorMessages.price && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.price[0]}</p>}
                </div>
                <div>
                  <label htmlFor="cost_price" className="block text-body font-medium text-neutral-700 mb-2">
                    {t('cost_price')} <span className="text-accent-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="cost_price"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errorMessages.cost_price ? 'border-accent-error-300 focus:ring-accent-error-500 focus:border-accent-error-500' : 'border-neutral-300'}`}
                    required
                  />
                  {errorMessages.cost_price && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.cost_price[0]}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="stock" className="block text-body font-medium text-neutral-700 mb-2">
                    {t('stock_quantity')} <span className="text-accent-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errorMessages.stock ? 'border-accent-error-300 focus:ring-accent-error-500 focus:border-accent-error-500' : 'border-neutral-300'}`}
                    required
                  />
                  {errorMessages.stock && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.stock[0]}</p>}
                </div>
                <div>
                  <label htmlFor="reorder_level" className="block text-body font-medium text-neutral-700 mb-2">
                    {t('reorder_level')}
                  </label>
                  <input
                    type="number"
                    id="reorder_level"
                    name="reorder_level"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${errorMessages.reorder_level ? 'border-accent-error-300 focus:ring-accent-error-500 focus:border-accent-error-500' : 'border-neutral-300'}`}
                  />
                  {errorMessages.reorder_level && <p className="text-accent-error-600 text-caption mt-1">{errorMessages.reorder_level[0]}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="size" className="block text-body font-medium text-neutral-700 mb-2">
                    Size
                  </label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Size</option>
                    {SIZE_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="color" className="block text-body font-medium text-neutral-700 mb-2">
                    Color
                  </label>
                  <select
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Color</option>
                    {COLOR_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="additional_information" className="block text-body font-medium text-neutral-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  id="additional_information"
                  name="additional_information"
                  value={formData.additional_information}
                  onChange={(e) => setFormData({ ...formData, additional_information: e.target.value })}
                  rows={4}
                  placeholder="Enter any additional product information..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-body transition-colors focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
                />
              </div>
              
              <div>
                <label className="block text-body font-medium text-neutral-700 mb-3">
                  {t('active_status')}
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-3 text-body text-neutral-700">{t('is_active')}</label>
                </div>
              </div>
              
              {existingImages.length > 0 && (
                <div>
                  <label className="block text-body font-medium text-neutral-700 mb-3">{t('existing_images')}</label>
                  <div className="grid grid-cols-3 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image}
                          alt={image.alt_text || 'Product Image'}
                          className="w-full h-24 object-cover rounded-lg shadow-elevation-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(image.id)}
                          className="absolute -top-2 -right-2 bg-accent-error-500 text-white rounded-full p-1 shadow-elevation-sm hover:bg-accent-error-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="images" className="block text-body font-medium text-neutral-700 mb-2">
                  {t('upload_new_images')}
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-body file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-caption file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setFormVisible(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 text-body font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-body font-medium transition-colors"
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
