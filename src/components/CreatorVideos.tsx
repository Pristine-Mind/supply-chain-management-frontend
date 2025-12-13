import React, { useEffect, useRef, useState } from 'react';
import { creatorsApi } from '../api/creatorsApi';
import { ShoppableVideoBrief, PaginatedVideos } from '../types/creator';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import { toast } from 'react-toastify';

const CreatorVideos: React.FC<{ creatorId: number; compact?: boolean }> = ({ creatorId, compact = false }) => {
  const [videos, setVideos] = useState<ShoppableVideoBrief[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedVideos | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ShoppableVideoBrief | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const data = await creatorsApi.getCreatorVideos(creatorId, p);
      setPagination(data);
      setVideos(data.results);
      setPage(p);
    } catch (err) {
      console.error('Failed to load creator videos', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [creatorId]);

  const handleAddToCart = async (videoId: number) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await shoppableVideosApi.addToCart(videoId, { quantity: 1 });
      toast.success(res.message || 'Added to cart');
    } catch (err) {
      console.error('Failed to add to cart', err);
      toast.error('Failed to add to cart');
    }
  };

  const incrementView = async (id: number) => {
    try {
      await shoppableVideosApi.incrementView(id);
    } catch (err) {
      // ignore
    }
  };

  // Video thumbnail component (same behavior as ForYouGrid)
  const VideoThumbnail: React.FC<{ video: ShoppableVideoBrief }> = ({ video }) => {
    const vidRef = useRef<HTMLVideoElement | null>(null);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
      const el = vidRef.current;
      if (!el) return;
      el.muted = true;
      el.play().catch(() => {});
      return () => { try { el.pause(); } catch (_) {} };
    }, [video.video_url]);

    const toggleAudio = async (e?: React.SyntheticEvent) => {
      e?.stopPropagation();
      const el = vidRef.current;
      if (!el) return;
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      el.muted = newMuted;
      try {
        if (!newMuted) await el.play();
      } catch (err) {
        setIsMuted(true);
        if (el) el.muted = true;
      }
    };

    return (
      <>
        <video
          ref={vidRef}
          src={(video as any).video_file || video.video_url}
          poster={video.thumbnail || '/video-thumb-placeholder.png'}
          className="w-full h-full object-cover"
          muted={isMuted}
          autoPlay
          loop
          playsInline
          preload="metadata"
          aria-label={video.title}
          onClick={() => toggleAudio()}
        />

        <button
          onClick={(e) => toggleAudio(e)}
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
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Videos</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((v) => (
          <div key={v.id} className="relative bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer" onClick={() => { setSelectedVideo(v); incrementView(v.id); }}>
            <div className="aspect-[9/16] w-full relative overflow-hidden bg-gray-100">
              <VideoThumbnail video={v} />

              {/* Bottom-left product badge + pill */}
              {(v as any).product && (
                <div className="absolute left-3 bottom-4 z-30 pointer-events-auto">
                  <div className="mb-2">
                    <div
                      title={(v as any).product?.name}
                      className="inline-flex bg-white rounded-xl px-3 py-1 text-[11px] sm:text-xs text-primary-600 font-semibold shadow-sm max-w-[200px] sm:max-w-[240px] whitespace-normal break-words"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      {(v as any).product?.product_details?.name}
                    </div>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 sm:gap-3 bg-white rounded-full px-3 py-1 shadow-md cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <div className="text-[12px] sm:text-sm font-bold text-primary-600">Rs. {(v as any).product?.discounted_price || (v as any).product?.listed_price}</div>
                    <button
                      onClick={async (e) => { e.stopPropagation(); await handleAddToCart(v.id); }}
                      className="bg-primary-600 text-white text-xs sm:text-sm px-3 py-1 rounded-full shadow-sm hover:bg-primary-700 transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-3">
              <div className="text-sm text-muted mb-1">Views: {v.views_count}</div>
              <div className="text-sm text-gray-700 line-clamp-2 font-medium">{v.title}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 modal-player">
          <div className="w-full max-w-3xl bg-black rounded-lg overflow-hidden shadow-2xl">
            <div className="relative">
              <button
                className="absolute right-2 top-2 z-20 bg-black/50 text-white rounded px-3 py-1"
                onClick={() => {
                  if (videoRef.current) { try { videoRef.current.pause(); } catch (e) {} }
                  setSelectedVideo(null);
                }}
              >
                Close
              </button>
              <video
                ref={videoRef}
                src={(selectedVideo as any).video_file || selectedVideo.video_url}
                poster={selectedVideo.thumbnail || undefined}
                className="w-full h-80 md:h-[480px] bg-black"
                controls
                autoPlay
                onPlay={() => {
                  try {
                    const key = 'viewed_video_ids';
                    const raw = sessionStorage.getItem(key);
                    const seen: number[] = raw ? JSON.parse(raw) : [];
                    if (!seen.includes(selectedVideo.id)) {
                      seen.push(selectedVideo.id);
                      sessionStorage.setItem(key, JSON.stringify(seen));
                      incrementView(selectedVideo.id);
                    }
                  } catch (err) {
                    incrementView(selectedVideo.id);
                  }
                }}
              />
            </div>
            <div className="p-4 text-white">
              <h4 className="font-semibold">{selectedVideo.title}</h4>
              <p className="text-sm text-gray-300">Views: {selectedVideo.views_count}</p>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

export default CreatorVideos;
