import React from 'react';
import FeaturedProducts from './FeaturedProducts';
import BrandsSection from './BrandsSection';
import { useNavigate } from 'react-router-dom';

const MarketplaceFallback: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
        <p className="text-neutral-600 mb-6">A lightweight marketplace view (fallback). Featured products are shown below.</p>
        <FeaturedProducts />
        <BrandsSection />
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/marketplace/all-products')}
            className="px-6 py-3 bg-primary-600 text-white rounded-md"
          >
            View All Products
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFallback;
