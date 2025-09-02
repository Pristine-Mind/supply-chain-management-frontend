import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
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
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    total,
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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center">
                <img className="h-8 w-auto" src={logo} alt="Logo" />
              </Link>
              <Link to="/marketplace" className="text-black hover:text-orange-600 font-bold">
                MulyaBazzar
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-orange-600">
                <FaShoppingCart className="text-gray-700 hover:text-orange-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-24">
            <div className="flex justify-center mb-6">
              <FaShoppingCart className="text-6xl text-gray-300" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center">
              <img className="h-8 w-auto" src={logo} alt="Logo" />
            </Link>
            <Link to="/marketplace" className="text-black hover:text-orange-600 font-bold">
              MulyaBazzar
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative p-2 text-orange-600">
              <FaShoppingCart className="text-gray-700 hover:text-orange-600" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            {/* <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 mr-4"
            >
              <FaArrowLeft className="text-gray-600" />
            </button> */}
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={clearCart}
              className="text-gray-600 hover:text-orange-600"
            >
              Clear Cart
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Your Cart ({itemCount})</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <div className="grid grid-cols-12 gap-4 font-medium text-gray-500">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
          </div>

          <div className="divide-y">
            {cart.map((item) => (
              <div key={item.id} className="p-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6 flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg mr-4"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        disabled={loading[item.id]}
                        className="text-rose-600 text-sm hover:text-rose-800 flex items-center mt-1 disabled:opacity-50"
                      >
                        <FaTrash className="mr-1" size={12} /> 
                        {loading[item.id] ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-medium">Rs. {item.price.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={loading[item.id]}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="mx-3 w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={loading[item.id]}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gray-50 border-t">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={clearCart}
                className="text-rose-600 hover:text-rose-800 text-sm font-medium"
              >
                Clear Cart
              </button>
              <div className="text-right">
                <div className="text-lg font-bold">
                  Subtotal: Rs. {total.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">Shipping calculated at checkout</p>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
      <Footer/>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Cart;
