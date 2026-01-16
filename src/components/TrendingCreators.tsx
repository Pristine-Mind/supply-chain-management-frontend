import React, { useEffect, useState } from 'react';
import { creatorsApi } from '../api/creatorsApi';
import { CreatorProfile } from '../types/creator';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TrendingCreators: React.FC = () => {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    creatorsApi.getTrendingCreators()
      .then(data => {
        if (data && data.results && Array.isArray(data.results)) {
          setCreators(data.results.slice(0, 10));
        } else if (Array.isArray(data)) {
          setCreators(data.slice(0, 10));
        }
      })
      .catch(err => console.error('Failed to load trending creators', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && creators.length === 0) return null;
  if (creators.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight mb-4 px-1">Trending Creators</h2>
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-1 px-1">
        {creators.map((creator) => (
          <motion.div
            key={creator.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/creators/${creator.id}`)}
            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer w-24"
          >
            <div className="w-20 h-20 rounded-full p-0.5 ring-2 ring-primary-500/20 hover:ring-primary-500 transition-all">
              <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                <img 
                  src={creator.avatar || creator.profile_image || '/placeholder-avatar.png'} 
                  alt={creator.display_name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-[11px] font-bold text-center truncate w-full text-neutral-800">
              {creator.display_name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrendingCreators;
