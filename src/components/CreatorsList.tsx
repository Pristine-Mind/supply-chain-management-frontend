import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { creatorsApi } from '../api/creatorsApi';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { CreatorProfile, PaginatedCreators, ShoppableVideoBrief } from '../types/creator';
import FollowButton from './FollowButton';
import { useAuth } from '../context/AuthContext';

const CreatorsList: React.FC = () => {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedCreators | null>(null);
  const [q, setQ] = useState('');
  const [videosByCreator, setVideosByCreator] = useState<Record<number, ShoppableVideoBrief[]>>({});
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = async (p = 1) => {
    const data = await creatorsApi.listCreators(q || undefined, p);
    setPagination(data);
    setCreators(data.results);
    setPage(p);

    // also fetch recent videos to show thumbnails
    try {
      const vidsResp: any = await shoppableVideosApi.getVideos(200);
      const vids = Array.isArray(vidsResp) ? vidsResp : (vidsResp && vidsResp.results) ? vidsResp.results : [];
      const map: Record<number, ShoppableVideoBrief[]> = {};
      vids.forEach((v: any) => {
        const uid = v.uploader || v.uploader_id || v.uploader_profile?.id;
        if (!uid) return;
        map[uid] = map[uid] || [];
        map[uid].push({
          id: v.id,
          title: v.title,
          video_url: v.video_file || v.video_url || '',
          thumbnail: v.thumbnail,
          uploader_profile: undefined,
          creator_profile: undefined,
          product_tags: v.product_tags || [],
          views_count: v.views_count || 0,
          created_at: v.created_at,
        });
      });
      setVideosByCreator(map);
    } catch (err) {
      console.error('Failed to load videos for creators', err);
    }

    // If user is logged in, check each creator's followers to set follow state
    if (user?.id) {
      try {
        await Promise.all(
          data.results.map(async (c: CreatorProfile) => {
            try {
              const followersResp: any = await creatorsApi.getFollowers(c.id);
              const list = Array.isArray(followersResp.results) ? followersResp.results : [];
              const isFollowing = list.some((f: any) => Number(f.user) === Number(user.id));
              if (isFollowing) {
                setCreators((prev) => prev.map((p) => (p.id === c.id ? { ...p, is_following: true, following: true } : p)));
              }
            } catch (err) {
              // ignore per-creator errors
            }
          })
        );
      } catch (err) {
        console.error('Failed to determine follow status', err);
      }
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Search Bar at Top - Sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 mb-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              placeholder="Search creators"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && load(1)}
            />
          </div>
        </div>
      </div>
      <div className="mb-12 text-center text-orange-600 text-xl font-semibold">Explore Your Creators</div>
      {/* Pinterest-style Masonry Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
          {creators.map((c: any) => {
            const vids = videosByCreator[c.id] || videosByCreator[c.user] || [];
            const thumb = vids[0]?.thumbnail || c.cover_image || '/video-thumb-placeholder.png';
            return (
              <div key={c.id} className="break-inside-avoid mb-4">
                <div className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  {/* Video Thumbnail */}
                  <Link to={`/creators/${c.id}`}>
                    <img 
                      src={thumb} 
                      className="w-full h-auto object-cover"
                      alt={c.display_name || c.username}
                    />
                  </Link>

                  {/* Play Button Overlay - Shows on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-white rounded-full p-4 shadow-xl">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5v14l11-7L8 5z" fill="#1f2937" />
                      </svg>
                    </div>
                  </div>

                  {/* Like Button - Shows on hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                          stroke="#1f2937" 
                          strokeWidth="2" 
                          fill="none" 
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Creator Info Overlay - Always visible at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-16">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Link to={`/creators/${c.id}`}>
                          <img 
                            src={c.avatar || c.profile_image || '/placeholder-avatar.png'} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-white flex-shrink-0"
                            alt={c.display_name || c.username}
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link to={`/creators/${c.id}`} className="block">
                            <div className="font-semibold text-white text-sm flex items-center gap-1.5 truncate">
                              <span className="truncate">{c.display_name || c.username || c.handle}</span>
                              {c.is_verified && (
                                <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </Link>
                          <div className="text-xs text-white/90 truncate">
                            @{c.username || (c.handle && String(c.handle).replace(/^https?:\/\//, ''))}
                          </div>
                        </div>
                      </div>
                      <FollowButton
                        creatorId={c.id}
                        initialFollowing={!!(c.is_following || c.following)}
                        onToggle={(following: boolean, follower_count?: number) => {
                          setCreators((prev) =>
                            prev.map((p) =>
                              p.id === c.id
                                ? {
                                    ...p,
                                    is_following: following,
                                    following: following,
                                    follower_count: follower_count ?? p.follower_count,
                                  }
                                : p
                            )
                          );
                        }}
                        className="text-xs px-4 py-1.5 flex-shrink-0 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {pagination && pagination.next && (
          <div className="flex justify-center py-8">
            <button
              onClick={() => load(page + 1)}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorsList;
