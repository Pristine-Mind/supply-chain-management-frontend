import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { creatorsApi } from '../api/creatorsApi';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { CreatorProfile, PaginatedCreators, ShoppableVideoBrief } from '../types/creator';
import FollowButton from './FollowButton';
import { useAuth } from '../context/AuthContext';
import { Play, Heart, CheckCircle, Search } from 'lucide-react';

interface CreatorsListProps {
  selectedCategory?: string;
}

const CreatorsList: React.FC<CreatorsListProps> = ({ selectedCategory }) => {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedCreators | null>(null);
  const [q, setQ] = useState('');
  const [videosByCreator, setVideosByCreator] = useState<Record<number, ShoppableVideoBrief[]>>({});
  const { user } = useAuth();

  const load = useCallback(async (p = 1, isSearch = false) => {
    if (isSearch || p === 1) setLoading(true);
    
    try {
      const data = await creatorsApi.listCreators(q || undefined, p, selectedCategory);
      
      setCreators(prev => p === 1 ? data.results : [...prev, ...data.results]);
      setPagination(data);
      setPage(p);

      const vidsResp: any = await shoppableVideosApi.getVideos();
      const vids = Array.isArray(vidsResp) ? vidsResp : (vidsResp?.results || []);
      
      const map: Record<number, ShoppableVideoBrief[]> = {};
      vids.forEach((v: any) => {
        const uid = v.uploader || v.uploader_id || v.uploader_profile?.id;
        if (uid) {
          if (!map[uid]) map[uid] = [];
          map[uid].push(v);
        }
      });
      setVideosByCreator(map);
    } catch (err) {
      console.error('Smooth load failed', err);
    } finally {
      setLoading(false);
    }
  }, [q, selectedCategory]);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 px-4 py-4 transition-all duration-300">
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-neutral-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all outline-none"
              placeholder="Search your favorite creators..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1, true)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
            Explore <span className="text-orange-600">Creators</span>
          </h2>
          <p className="text-neutral-500 mt-2 font-medium">Discover trendsetters and shop their style</p>
        </motion.div>

        {loading && page === 1 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="mb-4 h-64 bg-neutral-200 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4"
          >
            <AnimatePresence>
              {creators.map((c: any, index: number) => {
                const vids = videosByCreator[c.id] || [];
                const thumb = vids[0]?.thumbnail || c.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
                
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="break-inside-avoid mb-4 group relative"
                  >
                    <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                      {/* Image Content - Now wraps the whole identity area as well for better UX */}
                      <Link to={`/creators/${c.id}`} className="block relative group/card">
                        <img 
                          src={thumb} 
                          loading="lazy"
                          className="w-full h-auto object-cover min-h-[250px]"
                          alt={c.display_name}
                        />
                        {/* Smooth Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Center Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500 shadow-lg shadow-orange-600/40">
                              <Play size={24} fill="white" className="text-white ml-1" />
                           </div>
                        </div>

                        {/* Info Identity */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 pb-20">
                          <div className="flex items-center gap-3">
                            <img 
                              src={c.avatar || c.profile_image || '/placeholder-avatar.png'} 
                              className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
                              alt=""
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-sm flex items-center gap-1">
                                <span className="truncate">{c.display_name}</span>
                                {c.is_verified && <CheckCircle size={14} className="text-blue-400 fill-blue-400/20" />}
                              </h4>
                              <p className="text-white/70 text-xs truncate italic">@{c.username}</p>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Interaction UI - Absolute but outside Link to handle separate clicks */}
                      <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all">
                          <Heart size={20} />
                        </button>
                      </div>

                      {/* Action Panel - Absolute bottom area */}
                      <div className="absolute bottom-5 left-5 right-5 z-20">
                        <div className="pt-4 border-t border-white/10">
                           <FollowButton
                              creatorId={c.id}
                              initialFollowing={!!c.is_following}
                              className="w-full !bg-white !text-black !rounded-xl !py-2 !text-xs !font-bold hover:!bg-orange-600 hover:!text-white transition-colors"
                           />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && creators.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-neutral-100">
            <div className="mb-4 flex justify-center text-neutral-300">
              <Search size={64} strokeWidth={1} />
            </div>
            <h3 className="text-2xl font-black text-neutral-900">No curators matching this style</h3>
            <p className="text-neutral-500 mt-2">Try exploring another category or check back soon!</p>
            <button 
              onClick={() => load(1)} 
              className="mt-8 bg-neutral-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-neutral-900/10"
            >
              Show All Creators
            </button>
          </div>
        )}

        {/* Load More - Premium Style */}
        {pagination?.next && (
          <div className="flex justify-center mt-16">
            <button
              onClick={() => load(page + 1)}
              className="group relative px-10 py-4 bg-black text-white rounded-2xl font-bold transition-all hover:bg-orange-600 hover:shadow-2xl hover:shadow-orange-600/30 overflow-hidden"
            >
              <span className="relative z-10">Discover More</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorsList;
