import React, { useEffect, useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import CosmeticImg from '../assets/costemtic.jpeg';
import { useNavigate } from 'react-router-dom';
import BrandTile from './BrandTile';

type Brand = {
  id?: number | string;
  name?: string;
  image?: string;
  logo?: string;
  thumbnail?: string;
  [key: string]: any;
};

const BrandsSection: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    fetch('https://appmulyabazzar.com/api/v1/brands/?category_id=4')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.results || data.data || [];
        if (mounted) setBrands(items);
      })
      .catch((err) => {
        console.error('Failed to load brands', err);
        if (mounted) setError(true);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="w-full py-12 bg-gradient-to-b from-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-orange-500" />
              Brands — Beauty
            </h2>
            <p className="mt-2 text-sm text-gray-500">Shop from brands in the beauty category</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg border border-gray-200 animate-pulse" />
                <div className="mt-2 h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-3 text-gray-400" />
            <p>Unable to load brands at this time</p>
          </div>
        ) : brands && brands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 items-start">
            {brands.slice(0, 12).map((b) => {
              const img = b.logo_url || b.logo || b.image || b.thumbnail || b.img || b.avatar;
              return (
                <BrandTile key={b.id ?? b.name} brand={b} img={img} />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <p>No brands available</p>
          </div>
        )}

        {/* Decorative cosmetic banner below brands */}
        {brands.length > 0 && (
          <div className="mt-12 w-full">
            <div className="bg-gradient-to-r from-orange-200 to-orange-600 rounded-2xl overflow-hidden shadow-sm p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Discover Beauty</h3>
                  <p className="text-gray-600">Explore our curated collection of premium beauty brands</p>
                </div>
                <div className="w-full flex items-center justify-center">
                  <img src={CosmeticImg} alt="Discover beauty" className="w-full max-w-xl h-64 md:h-64 object-cover rounded-lg shadow-md" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandsSection;
