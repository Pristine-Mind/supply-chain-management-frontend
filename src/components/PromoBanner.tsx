import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ShoppingBag } from 'lucide-react';

const PromoBanner = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const promoCode = "FLAT5";

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full mt-8 overflow-hidden rounded-2xl bg-slate-900 shadow-2xl group">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 transition-transform duration-700 group-hover:scale-110" />
      
      {/* Decorative Glass Elements */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-black/20 rounded-full blur-2xl" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left: Offer Details */}
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="hidden sm:flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner transform -rotate-6 group-hover:rotate-0 transition-all duration-500">
              <span className="text-3xl font-black text-white">5%</span>
            </div>
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white uppercase tracking-wider mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Limited Time Offer
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Flat 5% <span className="text-orange-100">Discount</span>
              </h2>
              <p className="text-orange-100/80 font-medium">
                Save up to <strong className="text-white text-lg">Rs. 200</strong> on your next purchase
              </p>
            </div>
          </div>

          {/* Right: Interaction Zone */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Promo Code Box */}
            <div 
              onClick={handleCopy}
              className="group/code cursor-pointer relative flex items-center justify-between gap-4 bg-black/20 backdrop-blur-md border border-white/10 p-1 pl-4 rounded-xl w-full sm:w-64 transition-all hover:bg-black/30"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-white/60 uppercase font-bold tracking-tighter">Min. Order Rs. 3000</span>
                <span className="text-lg font-mono font-bold text-white tracking-widest">{promoCode}</span>
              </div>
              
              <div className="bg-white text-orange-600 p-3 rounded-lg shadow-lg group-hover/code:bg-orange-50 transition-colors">
                {copied ? <Check size={20} strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
              </div>
              
              {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-orange-600 text-[10px] font-bold px-2 py-1 rounded shadow-md animate-bounce">
                  COPIED!
                </span>
              )}
            </div>

            {/* Shop Button */}
            <button 
              onClick={() => navigate('/marketplace/all-products')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-orange-50 transition-all shadow-xl hover:shadow-white/10 active:scale-95"
            >
              <ShoppingBag size={18} />
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
