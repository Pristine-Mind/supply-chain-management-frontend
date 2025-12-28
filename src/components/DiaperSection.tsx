import React from 'react';
import BabyProductImg from '../assets/baby-diaper.png';
import { useNavigate } from 'react-router-dom';

const DiaperSection: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/marketplace/categories/pet-baby-care');
  };

  return (
    <section className="w-full py-12 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Baby Products & Diapers
            </h2>
            <p className="mt-2 text-sm text-gray-500">Premium care essentials for your little one</p>
          </div>
        </div>

        <div 
          onClick={handleClick}
          className="w-full cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        >
          <div className="bg-gradient-to-r from-orange-200 to-orange-500 rounded-2xl overflow-hidden shadow-lg p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                  Care for Your Little One
                </h3>
                <p className="text-gray-700 text-lg mb-4">
                  Premium diapers and baby essentials from trusted brands
                </p>
                <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-50 transition-colors duration-200">
                  Shop Now
                </button>
              </div>
              <div className="w-full flex items-center justify-center">
                <img 
                  src={BabyProductImg} 
                  alt="Baby products collection" 
                  className="w-full max-w-xl h-64 md:h-80 object-cover rounded-lg shadow-md" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiaperSection;