import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

const CartIcon: React.FC = () => {
  const navigate = useNavigate();
  const { distinctItemCount } = useCart();

  return (
    <div className="relative group">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/cart')}
        className="relative p-2.5 rounded-xl transition-colors duration-300 bg-transparent hover:bg-slate-50 text-slate-600 hover:text-orange-600"
        aria-label="Shopping cart"
      >
        <ShoppingCart strokeWidth={2.2} size={22} />

        <AnimatePresence>
          {distinctItemCount > 0 && (
            <motion.span
              key="cart-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              key={distinctItemCount} 
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm"
            >
              {distinctItemCount > 9 ? '9+' : distinctItemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-[10px] py-1 px-2 rounded font-medium pointer-events-none">
        Cart
      </span>
    </div>
  );
};

export default CartIcon;
