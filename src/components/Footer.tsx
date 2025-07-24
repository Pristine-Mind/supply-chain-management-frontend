import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const Footer: React.FC = () => (
  <footer className="w-full bg-gray-50 border-t border-gray-200 pt-12 pb-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-orange-400">MulyaBazzar</h3>
          <p className="text-gray-600">Connectiong You to Quality Products.</p>
          <div className="flex space-x-4 mb-4">
            <a href="https://www.facebook.com/profile.php?id=61571097347345" className="text-gray-400 hover:text-orange-600">
              <FaFacebook className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/mulya_bazzar/" className="text-gray-400 hover:text-orange-600">
              <FaInstagram className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/company/105111648/admin/dashboard/" className="text-gray-400 hover:text-orange-600">
              <FaLinkedin className="w-5 h-5" />
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Download our app</p>
            <div className="flex space-x-2">
              <a href="https://play.google.com/store/apps/your-app-id" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                  alt="Get it on Google Play" 
                  className="h-10" 
                />
              </a>
              <a href="https://apps.apple.com/us/app/your-app-id" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" 
                  alt="Download on the App Store" 
                  className="h-10" 
                />
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/about" className="text-gray-600 hover:text-orange-600 transition">About Us</a></li>
            <li><a href="/marketplace" className="text-gray-600 hover:text-orange-600 transition">Products</a></li>
            <li><a href="/sellers" className="text-gray-600 hover:text-orange-600 transition">Sellers</a></li>
            <li><a href="/buyers" className="text-gray-600 hover:text-orange-600 transition">Buyers</a></li>
            <li><a href="/blog" className="text-gray-600 hover:text-orange-600 transition">Blog</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Support</h3>
          <ul className="space-y-2">
            <li><a href="/faq" className="text-gray-600 hover:text-orange-600 transition">FAQ</a></li>
            <li><a href="/shipping" className="text-gray-600 hover:text-orange-600 transition">Shipping & Delivery</a></li>
            <li><a href="/returns" className="text-gray-600 hover:text-orange-600 transition">Returns & Refunds</a></li>
            <li><a href="/terms" className="text-gray-600 hover:text-orange-600 transition">Terms of Service</a></li>
            <li><a href="/privacy" className="text-gray-600 hover:text-orange-600 transition">Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Us</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <FaMapMarkerAlt className="text-orange-600 mt-1 mr-3 flex-shrink-0" />
              <span className="text-gray-600">Baluwatar, Kathmandu, Nepal</span>
            </li>
            <li className="flex items-center">
              <FaPhone className="text-orange-600 mr-3" />
              <a href="tel:+9771234567890" className="text-gray-600 hover:text-orange-600">+977 9767474645</a>
            </li>
            <li className="flex items-center">
              <FaEnvelope className="text-orange-600 mr-3" />
              <a href="mailto:mulyabazzar@gmail.com" className="text-gray-600 hover:text-orange-600">mulyabazzar@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-gray-500 text-sm mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} MulyaBazzar. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white px-3 py-1.5 rounded-md border border-gray-200">
            <svg className="w-6 h-6 text-green-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="text-sm font-medium text-gray-700">Cash on Delivery</span>
          </div>
          <div className="flex items-center bg-white px-3 py-1.5 rounded-md border border-gray-200">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
              alt="VISA" 
              className="h-5 w-auto mr-1.5" 
            />
          </div>
          <div className="flex items-center bg-white px-3 py-1.5 rounded-md border border-gray-200">
            <img 
              src="https://images.seeklogo.com/logo-png/38/1/khalti-digital-wallet-logo-png_seeklogo-380047.png" 
              alt="Khalti" 
              className="h-5 w-auto mr-1.5" 
            />
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
