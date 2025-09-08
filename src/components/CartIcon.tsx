import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const CartIcon: React.FC = () => {
  const navigate = useNavigate();
  const { distinctItemCount } = useCart();

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/cart')}
        className="p-2 text-gray-600 hover:text-gray-900 relative"
        aria-label="Shopping cart"
      >
        <FaShoppingCart className="text-xl" />
        {distinctItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {distinctItemCount > 9 ? '9+' : distinctItemCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default CartIcon;
