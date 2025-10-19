import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  fetchMarketplaceOrders,
  fetchMarketplaceOrderById,
  cancelMarketplaceOrder,
  type MarketplaceOrder,
  type OrderFilters
} from '../api/marketplaceOrderApi';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from './auth/LoginModal';
import {
  Search,
  Filter,
  Package,
  Truck,
  XCircle,
  Eye,
  ShoppingCart,
  MapPin,
  Phone,
  Clock,
  CreditCard,
  X
} from 'lucide-react';

interface FilterState {
  status: string;
  paymentStatus: string;
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
}

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const itemsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    paymentStatus: 'all',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadOrders = useCallback(async (page = 1, showLoading = true) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const orderFilters: OrderFilters = {
        page,
        limit: itemsPerPage,
      };

      // Apply filters
      if (filters.status !== 'all') orderFilters.status = filters.status;
      if (filters.paymentStatus !== 'all') orderFilters.payment_status = filters.paymentStatus;
      if (filters.searchTerm.trim()) orderFilters.search = filters.searchTerm.trim();
      if (filters.dateFrom) orderFilters.date_from = filters.dateFrom;
      if (filters.dateTo) orderFilters.date_to = filters.dateTo;

      const response = await fetchMarketplaceOrders(orderFilters);
      
      setOrders(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters]);

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadOrders(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      paymentStatus: 'all',
      searchTerm: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
    loadOrders(1);
  };

  const handlePageChange = (page: number) => {
    loadOrders(page);
  };

  const handleViewDetails = async (orderId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [orderId]: true }));
      const order = await fetchMarketplaceOrderById(orderId);
      setSelectedOrder(order);
      setShowOrderDetails(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      alert('Failed to load order details. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [orderId]: true }));
      await cancelMarketplaceOrder(orderId, 'Cancelled by customer');
      await loadOrders(currentPage, false); // Refresh current page
      alert('Order cancelled successfully.');
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleReorder = async (orderId: number) => {
    try {
      setActionLoading(prev => ({ ...prev, [orderId]: true }));
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (order.items.length === 1) {
        // If only one item, navigate to product page
        navigate(`/marketplace/${order.items[0].product.id}`);
      } else {
        // For multiple items, show message and navigate to marketplace
        alert(`This order contains ${order.items.length} different products. Please add them to cart individually from the marketplace.`);
        navigate('/marketplace');
      }
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Failed to reorder. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelOrder = (order: MarketplaceOrder) => {
    const status = order.order_status.toLowerCase();
    return ['pending', 'confirmed'].includes(status);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onSuccess={() => setShowLoginModal(false)}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
            <p className="text-gray-600 mb-6">You need to be logged in to view your orders.</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your marketplace orders</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search orders by number, product..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={filters.paymentStatus}
                      onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="all">All Payment Status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-6">
                {Object.values(filters).some(f => f !== '' && f !== 'all') 
                  ? 'No orders match your current filters. Try adjusting your search criteria.'
                  : 'You haven\'t placed any orders yet. Start shopping to see your orders here!'
                }
              </p>
              <button
                onClick={() => navigate('/marketplace')}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.order_number}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Placed on {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                            {order.order_status_display}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status_display}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                              {item.product.product_details.images?.[0] && (
                                <img
                                  src={item.product.product_details.images[0].image}
                                  alt={item.product.product_details.name}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              )}
                              <span className="text-sm text-gray-700">
                                {item.product.product_details.name} × {item.quantity}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex items-center justify-center bg-gray-100 rounded-lg px-3 py-2">
                              <span className="text-sm text-gray-500">
                                +{order.items.length - 3} more items
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            NPR {parseFloat(order.total_amount).toFixed(2)}
                          </span>
                          {order.tracking_number && (
                            <span className="flex items-center">
                              <Truck className="h-4 w-4 mr-1" />
                              {order.tracking_number}
                            </span>
                          )}
                        </div>
                        {order.estimated_delivery_date && (
                          <span className="flex items-center mt-2 sm:mt-0">
                            <Clock className="h-4 w-4 mr-1" />
                            Est. delivery: {formatDate(order.estimated_delivery_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mt-4 lg:mt-0 lg:ml-6">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        disabled={actionLoading[order.id]}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading[order.id] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        View
                      </button>
                      
                      {canCancelOrder(order) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={actionLoading[order.id]}
                          className="flex items-center px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading[order.id] ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Cancel
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={actionLoading[order.id]}
                        className="flex items-center px-3 py-2 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading[order.id] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                        ) : (
                          <ShoppingCart className="h-4 w-4 mr-2" />
                        )}
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalCount > itemsPerPage && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} orders
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevious}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Order Details - #{selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Order Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(selectedOrder.order_status)}`}>
                      {selectedOrder.order_status_display}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payment Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                      {selectedOrder.payment_status_display}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Date</p>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      {item.product.product_details.images?.[0] && (
                        <img
                          src={item.product.product_details.images[0].image}
                          alt={item.product.product_details.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product.product_details.name}</h4>
                        <p className="text-sm text-gray-500">{item.product.product_details.category_details}</p>
                        <p className="text-sm text-gray-500">SKU: {item.product.product_details.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-gray-900">NPR {parseFloat(item.unit_price).toFixed(2)}</p>
                        <p className="text-sm font-medium text-gray-900">Total: NPR {parseFloat(item.total_price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Delivery Address</p>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900">{selectedOrder.delivery.customer_name}</p>
                          <p className="text-sm text-gray-700">{selectedOrder.delivery.address}</p>
                          <p className="text-sm text-gray-700">
                            {selectedOrder.delivery.city}, {selectedOrder.delivery.state} {selectedOrder.delivery.zip_code}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Contact Information</p>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{selectedOrder.delivery.phone_number}</p>
                      </div>
                      {selectedOrder.delivery.delivery_instructions && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500">Delivery Instructions</p>
                          <p className="text-sm text-gray-700">{selectedOrder.delivery.delivery_instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm text-gray-900">
                        NPR {selectedOrder.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-lg border-t border-gray-200 pt-2">
                      <span className="text-gray-900">Total Amount</span>
                      <span className="text-gray-900">NPR {parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                    {selectedOrder.transaction_id && (
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Transaction ID</span>
                        <span className="text-gray-900 font-mono">{selectedOrder.transaction_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                {canCancelOrder(selectedOrder) && (
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      handleCancelOrder(selectedOrder.id);
                    }}
                    className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowOrderDetails(false);
                    handleReorder(selectedOrder.id);
                  }}
                  className="px-4 py-2 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  Reorder
                </button>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default MyOrders;