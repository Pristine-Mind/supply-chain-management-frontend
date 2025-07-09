import React from 'react';

const Footer: React.FC = () => (
  <footer className="w-full bg-white border-t border-gray-200 py-6 mt-12">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-2 mb-2 md:mb-0">
        <span className="text-xl font-extrabold text-orange-600">Mulyabazzar</span>
        <span className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} All rights reserved.</span>
      </div>
      <div className="text-sm text-gray-500 flex gap-4">
        <a href="/about" className="hover:text-orange-600 transition">About</a>
        <a href="/contact" className="hover:text-orange-600 transition">Contact</a>
        <a href="/privacy" className="hover:text-orange-600 transition">Privacy Policy</a>
      </div>
    </div>
  </footer>
);

export default Footer;
