import React from 'react';
import { Link } from 'react-router-dom';

const Buyer: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to MulyaBazzar</h1>
              <p className="text-lg text-gray-600 mb-6">
                Discover fresh, high-quality agricultural products directly from farmers and suppliers.
                Get the best prices and support local agriculture.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/marketplace" 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition duration-300"
                >
                  Browse Marketplace
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white hover:bg-gray-100 text-orange-500 border-2 border-orange-500 font-semibold py-3 px-6 rounded-lg text-center transition duration-300"
                >
                  Create Account
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80" 
                alt="Fresh produce"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose MulyaBazzar?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Quality Products</h3>
              <p className="text-gray-600 text-center">
                Source directly from trusted farmers and verified suppliers for the freshest produce.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Best Prices</h3>
              <p className="text-gray-600 text-center">
                Get competitive prices by eliminating middlemen and buying directly from the source.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-center">
                Enjoy reliable and timely delivery of your fresh produce right to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Shop by Category</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Fruits', image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80' },
              { name: 'Vegetables', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80' },
              { name: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1550583724-2692cb30b9b7?auto=format&fit=crop&w=400&q=80' },
              { name: 'Grains', image: 'https://images.unsplash.com/photo-1541013406130-14e302adba6b?auto=format&fit=crop&w=400&q=80' },
            ].map((category, index) => (
              <Link 
                key={index} 
                to="/marketplace" 
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition duration-300"
              >
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <h3 className="text-white text-xl font-bold">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link 
              to="/marketplace" 
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
            >
              View All Categories
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start shopping?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of satisfied customers who trust MulyaBazzar for their agricultural needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/marketplace" 
              className="bg-white text-orange-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition duration-300"
            >
              Browse Products
            </Link>
            <Link 
              to="/register" 
              className="bg-transparent border-2 border-white hover:bg-white hover:text-orange-600 font-semibold py-3 px-8 rounded-lg transition duration-300"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Buyer;
