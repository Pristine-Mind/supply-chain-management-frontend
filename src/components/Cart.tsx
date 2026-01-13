import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowLeft, 
  Package, 
  CreditCard,
  Truck,
  X,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import Footer from './Footer';
import logo from '../assets/logo.png';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const [clearingCart, setClearingCart] = useState(false);
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    total,
    isLoading: cartLoading,
    error: cartError,
    clearError,
    refreshCart,
  } = useCart();

  // Refresh cart data when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated]); // Remove refreshCart from dependencies to avoid infinite loops

  const handleRemoveFromCart = async (productId: number) => {
    setLoading(prev => ({ ...prev, [productId]: true }));
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item from cart. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    setLoading(prev => ({ ...prev, [productId]: true }));
    try {
      await updateQuantity(productId, quantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Failed to update quantity. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleClearCart = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to clear all ${itemCount} item(s) from your cart? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setClearingCart(true);
    try {
      const result = await clearCart();
      if (!result.success) {
        if (result.failedItems && result.failedItems.length > 0) {
          alert(`Failed to remove ${result.failedItems.length} item(s). Please try again.`);
        } else {
          alert('Failed to clear cart. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      alert('Failed to clear cart. Please try again.');
    } finally {
      setClearingCart(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    navigate('/delivery-details');
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    navigate('/delivery-details');
  };

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Brand Header Bar */}
        <div className="bg-primary-600 text-white py-2 px-4">
          <div className="max-w-7xl mx-auto text-center text-sm">
            Welcome to MulyaBazzar - Your Premium Marketplace
          </div>
        </div>

        {/* Header */}
        <nav className="bg-white shadow-sm border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2 -ml-2">
                  <img className="h-8 w-auto" src={logo} alt="MulyaBazzar Logo" />
                </Link>
                <Link to="/marketplace" className="text-neutral-900 hover:text-primary-600 font-bold text-xl transition-colors">
                  MulyaBazzar
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/cart" className="relative p-2 text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg">
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Empty Cart Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-8">
              <div className="bg-neutral-100 rounded-2xl p-12">
                <ShoppingBag className="w-20 h-20 text-neutral-400" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Your cart is empty</h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              Discover amazing products from trusted sellers across Nepal. Start your shopping journey today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <button
                onClick={() => navigate('/marketplace')}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Browse Products
              </button>
              <button
                onClick={() => navigate('/marketplace/all-products')}
                className="flex-1 bg-white border border-neutral-200 text-neutral-700 px-6 py-3 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-colors font-medium"
              >
                View All Products
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="font-semibold text-neutral-900 mb-2">Free Shipping</h4>
                <p className="text-sm text-neutral-600">On orders over NPR 2500</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-neutral-900 mb-2">Secure Payment</h4>
                <p className="text-sm text-neutral-600">Multiple payment options</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-semibold text-neutral-900 mb-2">Fast Delivery</h4>
                <p className="text-sm text-neutral-600">Same day delivery available</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Cart with Items
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Bar */}
      <div className="bg-primary-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm">
          Welcome to MulyaBazzar - Your Premium Marketplace
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center">
                <img className="h-8 w-auto" src={logo} alt="Logo" />
              </Link>
              <Link to="/marketplace" className="text-gray-900 hover:text-primary-600 font-semibold text-xl transition-colors">
                MulyaBazzar
              </Link>
              <div className="h-6 w-px bg-neutral-200 hidden sm:block" />
              <button
                onClick={() => navigate('/marketplace')}
                className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Continue Shopping</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-primary-600">
                <ShoppingCart className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-error-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
              <p className="text-neutral-600">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            <button
              onClick={handleClearCart}
              disabled={clearingCart || cartLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-accent-error-600 rounded-lg hover:bg-accent-error-50 hover:border-accent-error-300 disabled:opacity-50 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {clearingCart ? 'Clearing...' : 'Clear Cart'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {cartError && (
          <div className="bg-accent-error-50 border border-accent-error-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-accent-error-800">{cartError}</p>
              <button
                onClick={clearError}
                className="text-accent-error-600 hover:text-accent-error-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {cartLoading && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <p className="text-primary-800">Updating cart...</p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
              </div>

              <div className="divide-y divide-neutral-200">
                {cart.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg border border-neutral-200"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h3>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-lg font-semibold text-primary-600">
                                Rs. {item.price.toLocaleString()}
                              </p>
                              {item.product.listed_price !== item.price && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  Negotiated Price
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            disabled={loading[item.id]}
                            className="p-2 text-neutral-400 hover:text-accent-error-600 transition-colors disabled:opacity-50"
                            title="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-neutral-600">Quantity:</span>
                            <div className="flex items-center border border-neutral-300 rounded-lg">
                              <button
                                onClick={() => {
                                  const isNegotiated = item.product.listed_price !== item.price;
                                  const minNegotiatedQty = item.product.b2b_min_quantity || 1;
                                  
                                  if (isNegotiated && item.quantity <= minNegotiatedQty) {
                                    if (window.confirm('Decreasing quantity below the negotiated amount may reset the price to the standard marketplace rate. Continue?')) {
                                      handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1));
                                    }
                                  } else {
                                    handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1));
                                  }
                                }}
                                disabled={loading[item.id] || cartLoading || item.quantity <= 1}
                                className="p-2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={item.quantity <= 1 ? "Use remove button to delete item" : "Decrease quantity"}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 text-center font-medium min-w-[3rem]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={loading[item.id] || cartLoading}
                                className="p-2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Item Total */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Loading State */}
                        {loading[item.id] && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-primary-600">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                            <span>Updating...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm sticky top-8">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium">Rs. {total.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-primary-600">Rs. {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={cartLoading || clearingCart || cart.length === 0}
                  className="w-full mt-6 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <CreditCard className="w-5 h-5" />
                  {cartLoading ? 'Updating...' : clearingCart ? 'Clearing...' : 'Proceed to Checkout'}
                </button>
                
                <button
                  onClick={() => navigate('/marketplace')}
                  className="w-full mt-3 bg-white border border-neutral-200 text-neutral-700 py-3 px-4 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Continue Shopping
                </button>
                
                {/* Security & Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  {/* <div className="flex items-center gap-3 text-neutral-600">
                    <Truck className="w-4 h-4 text-green-500" />
                    <span>Free shipping on all orders</span>
                  </div> */}
                  <div className="flex items-center gap-3 text-neutral-600 mt-2">
                    <Package className="w-4 h-4 text-green-500" />
                    <span>Easy returns within 30 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Cart;
