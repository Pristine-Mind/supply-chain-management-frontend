import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, Menu, X 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.png';

import FeaturedProducts from './FeaturedProducts';

const FeaturedSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { distinctItemCount } = useCart();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <header className={`sticky top-0 z-[100] transition-all duration-500 ${
        isScrolled ? 'py-2 bg-white/90 backdrop-blur-xl border-b border-slate-200' : 'py-5 bg-white'
      }`}>
        <nav className="container mx-auto px-6 flex items-center justify-between gap-8">
          <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer shrink-0">
            <img src={logo} className="w-10 h-10 object-contain" alt="Logo" />
            <span className="hidden sm:block text-2xl font-black text-orange-700 tracking-tighter">MulyaBazzar</span>
          </div>

          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search featured collection..."
              className="w-full bg-slate-100 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl py-3 pl-12 pr-12 transition-all font-medium text-slate-700"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={14} className="text-slate-500" />
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-6 shrink-0">
            <button onClick={() => navigate('/sell')} className="text-sm font-bold text-slate-600 hover:text-orange-600 uppercase tracking-widest transition-colors">Sell</button>
            <CartButton count={distinctItemCount} />
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-10">
        <FeaturedProducts searchQuery={searchQuery} />
      </main>

      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu onClose={() => setMobileMenuOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const CartButton = ({ count }: { count: number }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate('/cart')}
      className="relative p-3 bg-white text-orange-500 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-lg border border-orange-500 flex items-center justify-center"
    >
      <ShoppingCart size={20} className="text-orange-500"/>
      {count > 0 && (
        <motion.span 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white"
        >
          {count}
        </motion.span>
      )}
    </button>
  );
};

const MobileMenu = ({ onClose }: any) => (
  <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
    className="fixed inset-0 z-[200] bg-white p-8"
  >
    <div className="flex justify-between items-center mb-12">
      <span className="font-black text-2xl">Menu</span>
      <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X className="text-orange-500" /></button>
    </div>
    <div className="flex flex-col gap-6">
      {['All Products', 'Sell', 'Support', 'Cart'].map(item => (
        <button key={item} className="text-4xl font-black text-slate-900 text-left hover:text-orange-600 transition-colors uppercase tracking-tighter">
          {item}
        </button>
      ))}
    </div>
  </motion.div>
);

export default FeaturedSelectionPage;
