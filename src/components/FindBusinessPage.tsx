import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Users, TrendingUp, MapPin, Filter } from 'lucide-react';
import B2BUserProfile from './b2b/B2BUserProfile';

// Feature data
const features = [
  {
    icon: Search,
    title: 'Advanced Search',
    description: 'Find businesses by name, location, type, and verified status with powerful filters'
  },
  {
    icon: Users,
    title: 'Verified Partners', 
    description: 'All businesses are verified and authenticated for your security and trust'
  },
  {
    icon: MapPin,
    title: 'Location-Based',
    description: 'Find businesses near you with geographic distance filtering up to 100km'
  },
  {
    icon: TrendingUp,
    title: 'Smart Recommendations',
    description: 'AI-powered recommendations based on your business needs and preferences'
  }
];

const FindBusinessPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();

  if (userId) {
    return <B2BUserProfile />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-blue-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-200">
                Business Partner
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-orange-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with verified businesses, explore comprehensive profiles, and build lasting partnerships in Nepal's growing marketplace
            </p>
            
            {/* CTA Button */}
            <button
              onClick={() => navigate('/find-business/directory')}
              className="group inline-flex items-center gap-3 bg-white text-orange-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 hover:bg-orange-50"
            >
              <Search className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Start Exploring Businesses
            </button>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold mb-2">10,000+</div>
                <div className="text-orange-100">Verified Businesses</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 mx-auto">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-orange-100">Success Rate</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold mb-2">All Nepal</div>
                <div className="text-orange-100">Geographic Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Business Directory?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced features designed to help you find and connect with the right business partners
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-gray-50 rounded-2xl p-6 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4 group-hover:bg-orange-200 transition-colors">
                  <feature.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Quick Access Section */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Find Your Next Business Partner?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/find-business/directory')}
              className="bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-700 transition-colors shadow-lg flex items-center justify-center gap-3"
            >
              <Search className="w-5 h-5" />
              Search All Businesses
            </button>
            <button
              onClick={() => navigate('/find-business/directory')}
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-3"
            >
              <Filter className="w-5 h-5" />
              Advanced Filters
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FindBusinessPage;
