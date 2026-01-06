import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  created_at: string;
}

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
  category_details: string;
  category: string;
}

export interface MadeInNepalItem {
  id: number;
  product: number;
  product_details: ProductDetails;
  discounted_price: number | null;
  listed_price: number;
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
}

const MadeInNepal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<MadeInNepalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-trending/made-in-nepal/`;
        const response = await axios.get<{ results?: MadeInNepalItem[]; }>(url);
        const data = response.data.results || [];
        setProducts(data);
      } catch (err) {
        setError('Heritage collection currently unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getPrice = (product: MadeInNepalItem): number => {
    const isB2B = user?.b2b_verified && product.is_b2b_eligible;
    if (isB2B) {
      return product.b2b_discounted_price ?? product.b2b_price ?? product.listed_price;
    }
    return product.discounted_price ?? product.listed_price;
  };

  if (loading) return <CollectionSkeleton />;
  if (error) return null;

  return (
    <section className="relative py-24 bg-[#FCFAFB] overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-orange-900">
          <pattern id="dhaka" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 5L5 0L10 5L5 10Z" />
          </pattern>
          <rect width="100" height="100" fill="url(#dhaka)" />
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <MapPin size={12} className="text-orange-600" />
              Direct from Artisans
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]"
            >
              The Nepal <br />
              <span className="font-serif italic font-light text-orange-600">Heritage</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-500 font-medium max-w-xs text-sm leading-relaxed"
          >
            A curated selection of authentic goods, preserving centuries-old techniques for the modern home.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.slice(0, 8).map((product, idx) => (
            <ArtisanCard
              key={product.id}
              product={product}
              index={idx}
              price={getPrice(product)}
              onClick={() => navigate(`/marketplace/${product.id}`)}
            />
          ))}
        </div>

        {products.length > 8 && (
          <div className="mt-20 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/marketplace/all-products?made_in_nepal=true')}
              className="group relative px-12 py-5 bg-slate-900 text-white rounded-full font-black uppercase text-xs tracking-widest overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-3">
                Explore The Full Atelier <ArrowRight size={16} />
              </span>
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
};

interface ArtisanCardProps {
  product: MadeInNepalItem;
  index: number;
  price: number;
  onClick: () => void;
}

const ArtisanCard: React.FC<ArtisanCardProps> = ({ product, index, price, onClick }) => {
  const imageUrl = product.product_details?.images?.[0]?.image || '';
  const name = product.product_details?.name || 'Untitled Product';
  const category = product.product_details?.category_details || 'Authentic';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      onClick={onClick}
      className={`group cursor-pointer flex flex-col ${index % 2 !== 0 ? 'md:mt-12' : ''}`}
    >
      <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-[2rem] bg-white shadow-sm border border-slate-100 transition-all duration-700 group-hover:shadow-2xl group-hover:rounded-[1rem]">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 origin-bottom-left -rotate-90">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-orange-500 transition-colors">
            {category}
          </span>
        </div>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}

        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all duration-500 flex items-center justify-center">
          <div className="bg-white p-4 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 delay-100 shadow-2xl">
            <ShoppingCart className="w-5 h-5 text-slate-900" />
          </div>
        </div>
      </div>

      <div className="px-2">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors mb-2">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-slate-900">
            Rs. {Number(price).toLocaleString()}
          </span>
          <div className="h-[1px] flex-1 mx-4 bg-slate-100 group-hover:bg-orange-100 transition-colors" />
          <Sparkles size={14} className="text-slate-200 group-hover:text-orange-400 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};

const CollectionSkeleton: React.FC = () => (
  <div className="py-24 container mx-auto px-6">
    <div className="h-20 w-1/2 bg-slate-100 rounded-3xl mb-12 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="aspect-[3/4] bg-slate-100 rounded-[2rem] animate-pulse" />
          <div className="h-6 w-3/4 bg-slate-100 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

const ArrowRight = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

export default MadeInNepal;
