import React, { useState } from 'react';
import FeaturedProducts from './FeaturedProducts';
import BrandsSection from './BrandsSection';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const FeaturedSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { distinctItemCount } = useCart();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar (responsive) */}
      <div className="bg-white shadow-elevation-sm border-b border-neutral-200">
        <div className="container mx-auto container-padding flex flex-col md:flex-row items-center md:justify-between py-3 gap-2">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center">
              <img src={logo} alt="Logo" className="w-8 h-8 sm:w-12 sm:h-12 mr-2 sm:mr-3" />
              <span className="font-bold text-h2 sm:text-h1 text-primary-500">MulyaBazzar</span>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button onClick={() => navigate('/marketplace/all-products')} className="text-neutral-700 hover:text-primary-600">All Products</button>
              <button onClick={() => navigate('/sell')} className="text-neutral-700 hover:text-primary-600">Sell</button>
              <button onClick={() => navigate('/support')} className="text-neutral-700 hover:text-primary-600">Support</button>
              <button
                className="relative p-2 text-neutral-600 hover:text-primary-500"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="w-6 h-6" />
                {distinctItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {distinctItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="w-full flex items-center justify-end md:hidden gap-2">
            <button
              className="relative p-2 text-neutral-600 hover:text-primary-500"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="w-6 h-6" />
              {distinctItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {distinctItemCount}
                </span>
              )}
            </button>
            <button onClick={() => setMobileMenuOpen((s) => !s)} className="p-2 rounded-md text-neutral-700 hover:bg-neutral-100">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="w-full md:hidden bg-white border-t border-neutral-200 mt-2 p-3 space-y-2">
              <button onClick={() => { navigate('/marketplace/all-products'); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-neutral-700">All Products</button>
              <button onClick={() => { navigate('/sell'); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-neutral-700">Sell</button>
              <button onClick={() => { navigate('/support'); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-neutral-700">Support</button>
            </div>
          )}
        </div>
      </div>

      {/* Featured Products section */}
      <FeaturedProducts />
      <BrandsSection />

      {/* Footer */}
    </div>
  );
};

export default FeaturedSelectionPage;
