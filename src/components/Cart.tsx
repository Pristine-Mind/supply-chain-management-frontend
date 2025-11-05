import React, { useState } from 'react';
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
  } = useCart();

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
      <div className="min-h-screen bg-soft-gradient">
        {/* Brand Header Bar */}
        <div className="bg-primary-600 text-white py-2 px-4">
          <div className="max-w-7xl mx-auto text-center text-body-sm">
            Welcome to MulyaBazzar - Your Premium Marketplace
          </div>
        </div>

        {/* Header */}
        <nav className="bg-white shadow-soft">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center focus-ring rounded-lg p-2 -ml-2">
                  <img className="h-8 w-auto" src={logo} alt="MulyaBazzar Logo" />
                </Link>
                <Link to="/marketplace" className="text-neutral-900 hover:text-primary-600 font-bold text-h3 transition-colors">
                  MulyaBazzar
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/cart" className="relative p-2 text-primary-600 focus-ring rounded-lg">
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-caption-bold">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Empty Cart Content */}
        <div className="max-w-4xl mx-auto container-padding section-spacing">
          <div className="text-center content-spacing">
            <div className="flex justify-center mb-8">
              <div className="bg-neutral-100 rounded-2xl p-12">
                <ShoppingBag className="w-20 h-20 text-neutral-400" />
              </div>
            </div>
            
            <h2 className="text-h1 font-bold text-neutral-900 mb-4">Your cart is empty</h2>
            <p className="text-body text-neutral-600 mb-8 max-w-md mx-auto">
              Discover amazing products from trusted sellers across Nepal. Start your shopping journey today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <button
                onClick={() => navigate('/marketplace')}
                className="btn-primary flex-1"
              >
                Browse Products
              </button>
              <button
                onClick={() => navigate('/marketplace/all-products')}
                className="btn-secondary flex-1"
              >
                View All Products
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="bg-accent-success-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-accent-success-600" />
                </div>
                <h4 className="text-body font-semibold text-neutral-900 mb-2">Free Shipping</h4>
                <p className="text-body-sm text-neutral-600">On orders over NPR 2500</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="text-body font-semibold text-neutral-900 mb-2">Secure Payment</h4>
                <p className="text-body-sm text-neutral-600">Multiple payment options</p>
              </div>
              
              <div className="text-center">
                <div className="bg-secondary-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-secondary-600" />
                </div>
                <h4 className="text-body font-semibold text-neutral-900 mb-2">Fast Delivery</h4>
                <p className="text-body-sm text-neutral-600">Same day delivery available</p>
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
      {/* Orange Header Bar */}
      <div className="bg-primary-500 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto text-center text-caption">
          Welcome to MulyaBazzar - Your Premium Marketplace
        </div>
      </div>

      {/* Header */}
      <nav className="bg-white shadow-elevation-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center">
                <img className="h-8 w-auto" src={logo} alt="Logo" />
              </Link>
              <Link to="/marketplace" className="text-gray-900 hover:text-primary-500 font-semibold text-h3 transition-colors">
                MulyaBazzar
              </Link>
              <div className="h-6 w-px bg-neutral-200 hidden sm:block" />
              <button
                onClick={() => navigate('/marketplace')}
                className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Continue Shopping</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-primary-500">
                <ShoppingCart className="w-6 h-6 text-primary-500" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-error-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-caption font-medium">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - F Pattern */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-h1 font-bold text-gray-900 mb-2">Shopping Cart</h1>
              <p className="text-body text-neutral-600">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            <button
              onClick={handleClearCart}
              disabled={clearingCart || cartLoading}
              className="btn-secondary text-accent-error-600 hover:text-accent-error-700 hover:bg-accent-error-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {clearingCart ? 'Clearing...' : 'Clear Cart'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {cartError && (
          <div className="card-elevated mb-6 bg-accent-error-50 border border-accent-error-200">
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
          <div className="card-elevated mb-6 bg-accent-info-50 border border-accent-info-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-info-600"></div>
              <p className="text-accent-info-800">Updating cart...</p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items - Primary Content Area */}
          <div className="lg:col-span-8">
            <div className="card-elevated bg-white">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-h2 font-semibold text-gray-900">Cart Items</h2>
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

                      {/* Product Details - F Pattern Layout */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-h3 font-medium text-gray-900 mb-1">{item.name}</h3>
                            <p className="text-h3 font-semibold text-primary-500">
                              Rs. {item.price.toLocaleString()}
                            </p>
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
                            <span className="text-body text-neutral-600">Quantity:</span>
                            <div className="flex items-center border border-neutral-300 rounded-lg">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                disabled={loading[item.id] || cartLoading || item.quantity <= 1}
                                className="p-2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={item.quantity <= 1 ? "Use remove button to delete item" : "Decrease quantity"}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 text-center font-medium min-w-[3rem] text-body">
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
                            <p className="text-h3 font-bold text-gray-900">
                              Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Loading State */}
                        {loading[item.id] && (
                          <div className="mt-2 flex items-center gap-2 text-caption text-accent-info-600">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent-info-600"></div>
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

          {/* Cart Summary - Secondary Content Area */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="card-elevated bg-white sticky top-8">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-h2 font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-body">
                    <span className="text-neutral-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium">Rs. {total.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-h3 font-semibold text-gray-900">Total</span>
                      <span className="text-h2 font-bold text-primary-500">Rs. {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={cartLoading || clearingCart || cart.length === 0}
                  className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {cartLoading ? 'Updating...' : clearingCart ? 'Clearing...' : 'Proceed to Checkout'}
                </button>
                
                <button
                  onClick={() => navigate('/marketplace')}
                  className="btn-secondary w-full mt-3 flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Continue Shopping
                </button>
                
                {/* Security & Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="flex items-center gap-3 text-body text-neutral-600">
                    <Truck className="w-4 h-4 text-accent-success-500" />
                    <span>Free shipping on all orders</span>
                  </div>
                  <div className="flex items-center gap-3 text-body text-neutral-600 mt-2">
                    <Package className="w-4 h-4 text-accent-success-500" />
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
