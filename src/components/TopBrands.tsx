import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Brand {
  id: number;
  name: string;
  description: string;
  logo: string | null;
  logo_url: string | null;
  website: string;
  country_of_origin: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  manufacturer_info: string;
  contact_email: string;
  contact_phone: string;
  products_count: number;
}

const TopBrands = () => {
  const brandsRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState([] as Brand[]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setBrandsLoading(true);
    setBrandsError('');
    
    try {
      // Replace with your actual API URL
      const apiUrl = "https://appmulyabazzar.com";
      if (!apiUrl) {
        console.error('VITE_REACT_APP_API_URL is not defined');
        setBrandsError('Configuration error: API URL not set');
        setBrands([]);
        setBrandsLoading(false);
        return;
      }
      const url = `${apiUrl}/api/v1/brands/`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json') || contentType.includes('+json')) {
        try {
          data = await response.json();
        } catch (err) {
          const text = await response.text();
          console.error('Failed to parse JSON response for brands:', text, err);
          throw new Error('Invalid JSON response from brands API');
        }
      } else {
        // Not JSON (could be HTML error page, plain text, etc.) — read and report
        const text = await response.text();
        console.error('Non-JSON response from brands API:', text);
        throw new Error('Non-JSON response from brands API');
      }

      console.log('Fetched brands data:', data);
      if (data && data.results) {
        setBrands(data.results);
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrandsError('Error fetching brands');
      setBrands([]);
    } finally {
      setBrandsLoading(false);
    }
  };

  const scrollBrandsBy = (offset: number) => {
    if (brandsRef.current) {
      brandsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleBrandClick = (brandId: string | number) => {
    // Replace with your navigation logic
    console.log('Navigate to brand:', brandId);
    navigate(`/brand-products/${brandId}`);
  };

  return (
    <div className="bg-[#FCFCFD] py-24 border-t border-neutral-100 overflow-hidden">
      <div className="container mx-auto px-4 relative group">
        
        {/* Editorial Title Section */}
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="flex items-center gap-3 mb-3 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
            <span className="h-[1px] w-8 bg-orange-400" />
            <span className="text-orange-500 font-bold text-[10px] tracking-[0.4em] uppercase">
              Elite Partners
            </span>
            <span className="h-[1px] w-8 bg-orange-400" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
            Featured <span className="italic font-serif text-slate-400 font-light underline decoration-orange-200 underline-offset-8">Brands</span>
          </h2>
        </div>

        {/* Floating Glass Navigation Buttons */}
        <div className="absolute top-[60%] -translate-y-1/2 left-4 right-4 flex justify-between z-30 pointer-events-none">
          <button
            onClick={() => scrollBrandsBy(-400)}
            className="pointer-events-auto bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl p-4 border border-white text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-500 opacity-0 group-hover:opacity-100 -translate-x-10 group-hover:translate-x-0 hidden lg:block"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => scrollBrandsBy(400)}
            className="pointer-events-auto bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl p-4 border border-white text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-500 opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 hidden lg:block"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Brand Scroller */}
        <div 
          ref={brandsRef}
          className="flex items-center gap-12 overflow-x-auto py-12 px-8 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {brandsLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-36 h-36 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
            ))
          ) : brandsError && brands.length === 0 ? (
            <div className="w-full text-center py-8 text-rose-500 font-medium">{brandsError}</div>
          ) : (
            brands.map((brand, idx) => (
              <div
                key={brand.id}
                onClick={() => handleBrandClick(brand.id)}
                className="flex-shrink-0 cursor-pointer group/brand relative flex flex-col items-center opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Visual Orbit Container */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  
                  {/* Rotating Animated Background Ring */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-slate-200 group-hover/brand:border-orange-500/50 group-hover/brand:rotate-180 transition-all duration-1000 ease-in-out" />
                  
                  {/* Main Logo Sphere */}
                  <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center p-7 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 group-hover/brand:shadow-[0_25px_50px_rgba(249,115,22,0.2)] group-hover/brand:-translate-y-3 transition-all duration-500 z-10 overflow-hidden">
                    
                    {/* Subtle Internal Glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-orange-400/5 opacity-0 group-hover/brand:opacity-100 transition-opacity duration-500" />
                    
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain grayscale group-hover/brand:grayscale-0 group-hover/brand:scale-110 transition-all duration-700 ease-out"
                      />
                    ) : (
                      <span className="text-[10px] font-black text-center text-slate-400 group-hover/brand:text-orange-600 uppercase tracking-tighter">
                        {brand.name}
                      </span>
                    )}
                  </div>

                  {/* Floating Action Badge */}
                  <div className="absolute bottom-2 right-4 bg-slate-900 text-white p-2 rounded-xl scale-0 group-hover/brand:scale-100 group-hover/brand:translate-y-[-12px] transition-all duration-300 delay-75 z-20 shadow-xl">
                    <ArrowUpRight size={14} />
                  </div>
                </div>

                {/* Brand Name with Reveal Effect */}
                <div className="mt-2 text-center overflow-hidden">
                  <p className="text-[11px] font-black text-slate-400 group-hover/brand:text-slate-900 uppercase tracking-[0.2em] transition-colors duration-300">
                    {brand.name}
                  </p>
                  <div className="h-[2px] w-full bg-orange-500 origin-center scale-x-0 group-hover/brand:scale-x-100 transition-transform duration-300" />
                </div>
              </div>
            ))
          )}
        </div>
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeInUp {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TopBrands;
