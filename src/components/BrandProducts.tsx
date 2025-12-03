import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  fetchBrandById, 
  fetchBrandProducts, 
  type Brand, 
  type BrandProduct, 
  type BrandProductsResponse 
} from '../api/brandsApi';
import { 
  Search, 
  Grid3X3, 
  List, 
  Star, 
  ShoppingCart, 
  MapPin, 
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import Footer from './Footer';
import logo from '../assets/logo.png';

const PLACEHOLDER = 'https://via.placeholder.com/300x300?text=No+Image';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: '-name', label: 'Name Z-A' },
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at', label: 'Oldest First' },
  { value: '-stock', label: 'Stock: High to Low' }
];

const BrandProducts: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // State
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<BrandProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const pageSize = 20;

  // Fetch brand details and products
  const fetchData = async (page: number = 1) => {
    if (!brandId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch brand details
      const brandData = await fetchBrandById(parseInt(brandId));
      setBrand(brandData);

      // Prepare filters
      const filters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        sortBy: sortBy || undefined,
      };

      // Fetch brand products
      const response = await fetchBrandProducts(parseInt(brandId), page, pageSize, filters);
      
      setProducts(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / pageSize));
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching brand data:', err);
      setError('Failed to load brand products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update URL search params
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy && sortBy !== '-created_at') params.set('sort', sortBy);
    
    setSearchParams(params);
  };

  // Handle add to cart
  const handleAddToCart = async (product: BrandProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!isAuthenticated) {
        setPendingProduct(product);
        setShowLoginModal(true);
        return;
      }

      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.image || PLACEHOLDER,
        stock: product.stock,
        brand: product.brand_name,
      };

      await addToCart(cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Effects
  useEffect(() => {
    if (brandId) {
      fetchData(1);
    }
  }, [brandId]);

  useEffect(() => {
    updateSearchParams();
  }, [searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    if (brandId) {
      fetchData(currentPage);
    }
  }, [searchParams]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('-created_at');
    setCurrentPage(1);
  };

  if (loading && !brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brand products...</p>
        </div>
      </div>
    );
  }

  if (error && !brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setPendingProduct(null);
          }}
          onSuccess={async () => {
            setShowLoginModal(false);
            if (pendingProduct) {
              try {
                await handleAddToCart(pendingProduct, { stopPropagation: () => {} } as any);
              } catch (e) {
                console.error('Error adding to cart after login:', e);
              } finally {
                setPendingProduct(null);
              }
            }
          }}
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/marketplace')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Marketplace</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-orange-600">MulyaBazzar</span>
            </div>
          </div>
        </div>
      </header>

      {/* Brand Header */}
      {brand && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center space-x-6">
              {brand.logo_url && (
                <div className="flex-shrink-0">
                  <img 
                    src={brand.logo_url} 
                    alt={brand.name}
                    className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white p-2"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{brand.name}</h1>
                </div>
                {brand.description && (
                  <p className="text-gray-700">{brand.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {totalCount} {totalCount === 1 ? 'product' : 'products'} available
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>


            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Clear Filters */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button 
              onClick={() => fetchData(currentPage)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">
              {brand?.name} doesn't have any products matching your criteria.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} products
              </p>
            </div>

            {/* Products Grid */}
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
            }`}>
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                  onClick={() => navigate(`/marketplace/${product.id}`)}
                >
                  {/* Product Image */}
                  <div className={`${
                    viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-square'
                  } overflow-hidden bg-gray-50 relative`}>
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="text-white font-semibold">Out of Stock</span>
                      </div>
                    )}
                    <img
                      src={product.images?.[0]?.image || PLACEHOLDER}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {product.stock > 0 && product.stock <= 5 && (
                      <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Only {product.stock} left
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex-1">
                    <div className="space-y-2">
                      {/* Category */}
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
                        {product.category_details}
                      </span>

                      {/* Product Name */}
                      <h6 className="font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h6>

                      {/* Brand */}
                      <p className="text-sm text-gray-600">by {product.brand_name}</p>

                      {/* Price */}
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          Rs. {product.price?.toLocaleString()}
                        </span>
                      </div>                    

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock === 0}
                        className={`w-full mt-3 py-2 px-4 rounded-lg font-medium transition-colors ${
                          product.stock === 0
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <ShoppingCart className="w-4 h-4" />
                          <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg border ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BrandProducts;