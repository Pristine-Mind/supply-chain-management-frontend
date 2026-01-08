import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ChevronRight } from 'lucide-react';

const FreeDeliveryBanner: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="group relative w-full mt-6 overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-lg">
      {/* Background with subtle motion */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 transition-opacity duration-500 group-hover:opacity-90" />
      
      {/* Content Container - Reduced padding for height compression */}
      <div className="relative z-10 px-6 py-4 md:py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side: Icon & Text Bundle */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Truck 
                size={24} 
                className="text-white animate-truck-move" 
                strokeWidth={2} 
              />
            </div>
            <div className="text-left">
              <h2 className="text-lg md:text-xl font-black text-white leading-tight">
                Free Delivery <span className="font-light text-orange-100 italic">on first order</span>
              </h2>
              <p className="text-[11px] font-bold text-orange-100/80 uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Zero shipping fees • Nationwide
              </p>
            </div>
          </div>
          
          {/* Right Side: Action Area */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Promo Tag (Mini) */}
            <div className="hidden sm:block px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 text-[10px] font-bold text-white whitespace-nowrap">
              CODE: <span className="text-yellow-300">WELCOME</span>
            </div>
            
            {/* Compact CTA */}
            <button
              onClick={() => navigate('/marketplace/all-products')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-orange-600 hover:bg-orange-50 transition-all active:scale-95 shadow-md"
            >
              Shop Now
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for truck animation */}
      <style>{`
        @keyframes truck-move {
          0%, 100% {
            transform: translateX(-3px);
          }
          50% {
            transform: translateX(3px);
          }
        }
        
        .animate-truck-move {
          animation: truck-move 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default FreeDeliveryBanner;
