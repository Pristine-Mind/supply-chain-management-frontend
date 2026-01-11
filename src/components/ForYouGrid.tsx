import React, { useEffect, useRef, useState } from 'react';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { creatorsApi } from '../api/creatorsApi';
import { ShoppableVideo } from '../types/shoppableVideo';
import FollowButton from './FollowButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoginModal from './auth/LoginModal';
import { useCallback } from 'react';
import ShoppableReels from './ShoppableReels';

const ForYouGrid: React.FC<{ query?: string, compact?: boolean, creatorId?: number, viewMode?: 'grid' | 'reels' }> = ({ query, compact = false, creatorId, viewMode = 'grid' }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const getProductName = useCallback((p: any) => {
    return p?.product_details?.name || p?.product_name || p?.title || '';
    
  }, []);

  const load = async (p = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      let data: any;
      let results: any[] = [];
      if (creatorId) {
        data = await creatorsApi.getCreatorVideos(creatorId, p);
        results = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
      } else {
        data = await shoppableVideosApi.getVideos();
        results = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
      }
      if (p === 1) {
        setVideos(results);
      } else {
        setVideos((prev) => [...prev, ...results]);
      }
      setPage(p);
      // If API returns pagination info, detect if there's a next page
      if (data && typeof data === 'object' && 'next' in data) {
        setHasMore(!!(data as any).next);
      } else {
        // fallback: if fewer results returned than page size, stop
        setHasMore(results.length >= 48);
      }
    } catch (err) {
      console.error('Failed to load videos', err);
      if (p === 1) setVideos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loading) {
          load(page + 1);
        }
      });
    }, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef.current, page, hasMore, loading]);

  const filtered = query && query.trim().length > 0
    ? videos.filter(v => (v.title || '').toLowerCase().includes(query.toLowerCase()) || (v.uploader_name || '').toLowerCase().includes(query.toLowerCase()))
    : videos;

  const creators = Array.from(
    new Map(videos.map(v => [v.uploader, { 
      id: v.uploader, 
      name: v.uploader_name, 
      avatar: (v as any).uploader_avatar, 
      is_following: !!v.is_following 
    }])).values()
  ).slice(0, 30);

  const displayList = compact ? filtered.slice(0, 30) : filtered;

  if (loading && videos.length === 0) return <div className="p-6">Loading...</div>;

  if (viewMode === 'reels') {
    return (
      <div className="w-full">
        <ShoppableReels 
          videos={displayList} 
          loading={loading} 
          hasMore={hasMore} 
          onLoadMore={() => load(page + 1)} 
        />
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => setShowLoginModal(false)}
          />
        )}
      </div>
    );
  }

  const wrapperClass = compact ? 'w-full px-2' : 'container mx-auto container-padding py-6';

  const renderCard = (v: ShoppableVideo) => (
    <div key={v.id} className="relative bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Creator header at the top */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
      </div>

      {/* Video thumbnail */}
      <div className="aspect-[9/16] w-full relative overflow-hidden bg-gray-100">
        <VideoThumbnail video={v} />

        {/* subtle overlay to indicate tappable/playable area (kept for UX) */}
        {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 rounded-full p-4 shadow-lg opacity-60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7L8 5z" fill="#334155" />
            </svg>
          </div>
        </div> */}

        {/* Bottom-left compact product badge + pill (price + Buy Now) */}
        {v.product && (
          <div className="absolute left-3 bottom-4 z-30 pointer-events-auto">
            <div className="mb-2">
              <div
                title={getProductName(v.product)}
                className="inline-flex bg-white rounded-xl px-3 py-1 text-[11px] sm:text-xs text-primary-600 font-semibold shadow-sm max-w-[200px] sm:max-w-[240px] whitespace-normal break-words"
                onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${v.product.id}`); }}
              >
                {getProductName(v.product)}
              </div>
            </div>

            <div
              className="inline-flex items-center gap-2 sm:gap-3 bg-white rounded-full px-3 py-1 shadow-md cursor-pointer"
              onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${v.product.id}`); }}
            >
              <div className="text-[12px] sm:text-sm font-bold text-primary-600">Rs. {v.product.discounted_price || v.product.listed_price}</div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    setShowLoginModal(true);
                    return;
                  }
                  try {
                    const res = await shoppableVideosApi.addToCart(v.id, { quantity: 1 });
                    toast.success(res.message || 'Added to cart');
                  } catch (err) {
                    console.error('Failed to add to cart', err);
                    toast.error('Failed to add to cart');
                  }
                }}
                className="bg-primary-600 text-white text-xs sm:text-sm px-3 py-1 rounded-full shadow-sm hover:bg-primary-700 transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Video thumbnail component: show poster image by default and only load/play video when visible.
  const VideoThumbnail: React.FC<{ video: ShoppableVideo }> = React.memo(({ video }) => {
    const vidRef = React.useRef<HTMLVideoElement | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isInView, setIsInView] = useState(false);

    // Observe whether the thumbnail is visible; only then load/play the video.
    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsInView(true);
        });
      }, { root: null, rootMargin: '200px', threshold: 0.25 });
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    // Only attempt to autoplay when actually in view. Use muted autoplay to satisfy mobile browsers.
    useEffect(() => {
      const el = vidRef.current;
      if (!el) return;
      if (!isInView) {
        try { el.pause(); } catch (_) {}
        return;
      }
      // ask other players to pause before starting
      const myId = `forYou-video-${video.id}`;
      document.dispatchEvent(new CustomEvent('forYou:request-play', { detail: myId }));
      el.muted = true;
      el.play().catch(() => {
        // Ignore play failures; user can tap to play.
      });
      return () => {
        try { el.pause(); } catch (_) {}
      };
    }, [isInView, video.video_file, (video as any).video_url]);

    const toggleAudio = async (e?: React.SyntheticEvent) => {
      e?.stopPropagation();
      const el = vidRef.current;
      if (!el) return;
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      el.muted = newMuted;
      try {
        if (!newMuted) {
          // before playing with audio, request other players pause
          const myId = `forYou-video-${video.id}`;
          document.dispatchEvent(new CustomEvent('forYou:request-play', { detail: myId }));
          await el.play();
        }
      } catch (err) {
        console.debug('Play with audio blocked', err);
        setIsMuted(true);
        if (el) el.muted = true;
      }
    };

    // listen for other players requesting play and pause if it's not this one
    useEffect(() => {
      const myId = `forYou-video-${video.id}`;
      const handler = (e: Event) => {
        try {
          const otherId = (e as CustomEvent).detail;
          if (otherId !== myId) {
            const el = vidRef.current;
            if (el && !el.paused) {
              try { el.pause(); } catch (_) {}
            }
          }
        } catch (_) {}
      };
      document.addEventListener('forYou:request-play', handler as EventListener);
      return () => document.removeEventListener('forYou:request-play', handler as EventListener);
    }, [video.id]);

    return (
      <div ref={wrapperRef} className="w-full h-full relative">
        {!isInView ? (
          <img
            src={video.thumbnail || '/video-thumb-placeholder.png'}
            alt={video.title || 'video thumbnail'}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={vidRef}
              src={video.video_file || (video as any).video_url}
              poster={video.thumbnail || '/video-thumb-placeholder.png'}
              className="w-full h-full object-cover"
              muted={isMuted}
              autoPlay
              loop
              playsInline
              preload="metadata"
              aria-label={video.title}
              onClick={toggleAudio}
            />

            <button
              onClick={toggleAudio}
              title={isMuted ? 'Tap to unmute' : 'Tap to mute'}
              className="absolute right-3 top-3 z-40 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline-block">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
                  <path d="M19 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline-block">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
                  <path d="M15 9c1.333 1.333 1.333 3.667 0 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 7c2.667 2.667 2.667 6.667 0 9.333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    );
  });

  return (
    <div className={wrapperClass}>
      {/* Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
        {displayList.map((v) => renderCard(v))}
      </div>

      {/* sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-8" />

      {loading && <div className="py-6 text-center">Loading more...</div>}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};

export default ForYouGrid;