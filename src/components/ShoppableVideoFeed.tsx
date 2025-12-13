import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Heart,
  Share2,
  ShoppingBag,
  Volume2,
  VolumeX,
  Music2,
  Bookmark,
  MessageCircle,
  Send,
  UserPlus,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { creatorsApi } from '../api/creatorsApi';
import { ShoppableVideo, VideoComment } from '../types/shoppableVideo';
import FollowButton from './FollowButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CommentsSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  videoId: number;
  isAuthenticated: boolean;
  onRequireLogin: () => void;
}> = ({ isOpen, onClose, videoId, isAuthenticated, onRequireLogin }) => {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      shoppableVideosApi.getComments(videoId)
        .then((data: any) => {
          if (Array.isArray(data)) {
            setComments(data);
          } else if (data && Array.isArray(data.results)) {
            setComments(data.results);
          } else {
            setComments([]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, videoId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    try {
      const comment = await shoppableVideosApi.addComment({
        video: videoId,
        text: newComment,
      });
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
      toast.error('Failed to post comment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-md flex flex-col animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-bold">Comments ({comments.length})</h3>
        <button onClick={onClose} className="text-white p-1">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-white text-center mt-4">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="text-gray-400 text-center mt-4">No comments yet. Be the first!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold border border-white/10">
                {comment.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-xs mb-1 font-medium">
                  {comment.user_name} • {new Date(comment.created_at).toLocaleDateString()}
                </p>
                <p className="text-white text-sm">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handlePostComment} className="p-4 border-t border-white/10 bg-black flex items-center space-x-2 pb-safe-bottom">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 border border-white/10"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="p-2.5 bg-primary-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

// ===== VIDEO ITEM =====
const VideoItem: React.FC<{
  video: ShoppableVideo;
  isActive: boolean;
  onLikeToggle: (id: number, currentStatus: boolean) => void;
  onRequireLogin: () => void;
  onMuteAllOthers: () => void;
}> = ({ video, isActive, onLikeToggle, onRequireLogin, onMuteAllOthers }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(video.is_liked);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [saved, setSaved] = useState(video.is_saved);
  const [isFollowing, setIsFollowing] = useState(video.is_following || false);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      videoEl.muted = true;
      setIsMuted(true);
      videoEl.play().catch(() => {
        // play may be blocked by autoplay policies or interrupted by navigation; ignore rejection
      });
      
      // Avoid double-counting: track viewed video IDs in sessionStorage for the session
        try {
          const key = 'viewed_video_ids';
          const raw = sessionStorage.getItem(key);
          const seen: number[] = raw ? JSON.parse(raw) : [];
          if (!seen.includes(video.id)) {
            // mark immediately so concurrent increments don't double-post
            seen.push(video.id);
            sessionStorage.setItem(key, JSON.stringify(seen));
            creatorsApi.incrementVideoView(video.id).catch((err) => {
              console.error('Failed to increment creator-linked view', err);
            });
          }
        } catch (err) {
          // fallback to direct increment if sessionStorage unavailable
          creatorsApi.incrementVideoView(video.id).catch(console.error);
        }
    } else {
      videoEl.pause();
      videoEl.currentTime = 0;
    }
  }, [isActive, video.id]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
    if (!newMuted) {
      onMuteAllOthers();
    }
  };

  // === Handlers (same as before) ===
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    try {
      const response = await shoppableVideosApi.likeVideo(video.id);
      setLiked(response.liked);
      setLikesCount(response.likes_count);
    } catch (error) {
      setLiked(!newLiked);
      setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      const response = await shoppableVideosApi.saveVideo(video.id);
      setSaved(response.saved);
      toast.success(response.saved ? 'Video saved!' : 'Video removed from saved', {
        position: 'bottom-center',
        autoClose: 1500,
        hideProgressBar: true,
        theme: 'dark',
      });
    } catch (error) {
      setSaved(!newSaved);
      toast.error('Failed to save video');
    }
  };

  const handleProductClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/marketplace/${video.product.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await shoppableVideosApi.shareVideo(video.id);
    } catch (error) {
      console.error('Failed to record share', error);
    }

    const shareUrl = `${window.location.origin}/marketplace/${video.product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Check out ${video.product.name} on Mulya Bazzar!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share canceled or not supported');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!', {
          position: 'bottom-center',
          autoClose: 2000,
          hideProgressBar: true,
          theme: 'dark',
        });
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    try {
      const response = await creatorsApi.toggleFollow(video.uploader);
      setIsFollowing(response.following);
      toast.success(response.following ? `Following ${video.uploader_name}` : `Unfollowed ${video.uploader_name}`, {
        position: 'bottom-center',
        autoClose: 1500,
        hideProgressBar: true,
        theme: 'dark',
      });
    } catch (error) {
      console.error('Failed to toggle follow', error);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    try {
      const response = await shoppableVideosApi.addToCart(video.id, { quantity: 1 });
      toast.success(response.message, {
        position: 'bottom-center',
        autoClose: 2000,
        hideProgressBar: true,
        theme: 'dark',
      });
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    const reason = window.prompt('Why are you reporting this video?');
    if (reason) {
      try {
        await shoppableVideosApi.reportVideo({
          video: video.id,
          reason: 'other',
          description: reason,
        });
        toast.success('Video reported. Thank you.', { theme: 'dark', position: 'bottom-center' });
      } catch (error) {
        toast.error('Failed to report video');
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={video.video_file}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        poster={video.thumbnail || undefined}
        onClick={toggleMute}
      />

      <CommentsSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        videoId={video.id}
        isAuthenticated={isAuthenticated}
        onRequireLogin={onRequireLogin}
      />

      <div className="absolute inset-x-0 bottom-0 pt-20 pb-6 px-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white pointer-events-none">
        <div className="flex justify-between items-end">
          <div className="flex-1 mr-4 pointer-events-auto">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-[2px] mr-2">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-xs font-bold">{video.uploader_name.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base">@{video.uploader_name}</span>
                <FollowButton creatorId={video.uploader} initialFollowing={!!video.is_following} onToggle={(f) => setIsFollowing(f)} className="text-xs" />
              </div>
            </div>
            <h2 className="font-bold text-base mb-1 line-clamp-2">{video.title}</h2>
            <h3 className="font-medium text-sm mb-3 text-gray-200 line-clamp-2">{video.description}</h3>

            <div className="flex items-center text-xs mb-4 opacity-90">
              <Music2 size={14} className="mr-2 animate-spin-slow" />
              <span className="truncate max-w-[200px]">Original Audio - {video.uploader_name}</span>
            </div>

            {video.product && (
              <div
                onClick={handleProductClick}
                className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center cursor-pointer border border-white/20 hover:bg-white/20 transition-all active:scale-95 max-w-[85%]"
              >
                {video.product.images?.[0] && (
                  <img
                    src={video.product.images[0].image}
                    alt={video.product.name}
                    className="w-10 h-10 rounded-lg object-cover mr-3 bg-white shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs font-semibold truncate text-white mb-0.5">{video.product.name}</p>
                  <div className="flex items-center">
                    <span className="text-xs font-bold text-primary-400">
                      Rs. {video.product.discounted_price || video.product.listed_price}
                    </span>
                    {video.product.discounted_price && (
                      <span className="text-[10px] text-gray-400 line-through ml-2">
                        Rs. {video.product.listed_price}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="bg-primary-600 p-2 rounded-full shadow-lg shrink-0 hover:bg-primary-700 transition-colors"
                >
                  <ShoppingBag size={16} className="text-white" />
                </button>
              </div>
            )}

            {video.additional_products && video.additional_products.length > 0 && (
              <div className="mt-2 flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                {video.additional_products.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/marketplace/${prod.id}`);
                    }}
                    className="bg-black/40 backdrop-blur-md rounded-lg p-1.5 flex items-center flex-shrink-0 border border-white/10 max-w-[160px] active:scale-95"
                  >
                    {prod.images?.[0] && (
                      <img src={prod.images[0].image} className="w-8 h-8 rounded object-cover mr-2 bg-white" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-white truncate">{prod.name}</p>
                      <p className="text-[10px] font-bold text-primary-400">Rs. {prod.discounted_price || prod.listed_price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center space-y-5 pb-2 pointer-events-auto min-w-[50px]">
            <div className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white">
                <Eye size={26} />
              </div>
              <span className="text-xs mt-1 font-medium">{video.views_count}</span>
            </div>

            <button onClick={handleLike} className="flex flex-col items-center">
              <div className={`p-2.5 rounded-full bg-black/20 backdrop-blur-sm ${liked ? 'text-red-500' : 'text-white'}`}>
                <Heart size={28} fill={liked ? 'currentColor' : 'none'} className={liked ? 'animate-heart-bounce' : ''} />
              </div>
              <span className="text-xs mt-1 font-medium">{likesCount}</span>
            </button>

            <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white">
                <MessageCircle size={26} />
              </div>
              <span className="text-xs mt-1 font-medium">Comment</span>
            </button>

            <button onClick={handleSave} className="flex flex-col items-center">
              <div className={`p-2.5 rounded-full bg-black/20 backdrop-blur-sm ${saved ? 'text-yellow-400' : 'text-white'}`}>
                <Bookmark size={26} fill={saved ? 'currentColor' : 'none'} />
              </div>
              <span className="text-xs mt-1 font-medium">Save</span>
            </button>

            <button onClick={handleShare} className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white">
                <Share2 size={26} />
              </div>
              <span className="text-xs mt-1 font-medium">{video.shares_count}</span>
            </button>

            <button onClick={handleReport} className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white">
                <AlertTriangle size={22} />
              </div>
            </button>

            <button onClick={toggleMute} className="flex flex-col items-center">
              <div className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm text-white">
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </div>
            </button>

            {video.product?.images?.[0] && (
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden animate-spin-slow mt-2">
                <img src={video.product.images[0].image} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShoppableVideoFeed: React.FC<{ onClose: () => void; onRequireLogin: () => void }> = ({ onClose, onRequireLogin }) => {
  const [videos, setVideos] = useState<ShoppableVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const touchStart = useRef<{ y: number; time: number } | null>(null);

  const muteAllOthers = useCallback((exceptIndex: number) => {
    videoRefs.current.forEach((video, idx) => {
      if (video && idx !== exceptIndex) {
        video.muted = true;
      }
    });
  }, []);

  const fetchVideos = useCallback(async (pageNum: number) => {
    try {
      const data: any = await shoppableVideosApi.getVideos(pageNum);
      let newVideos: ShoppableVideo[] = [];
      if (Array.isArray(data)) {
        newVideos = data;
      } else if (data?.results && Array.isArray(data.results)) {
        newVideos = data.results;
      }
      setVideos((prev) => (pageNum === 1 ? newVideos : [...prev, ...newVideos]));
    } catch (error) {
      console.error('Failed to fetch videos', error);
      if (pageNum === 1) setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(1);
  }, [fetchVideos]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveVideoIndex(index);
          }
        });
      },
      { threshold: 0.65, rootMargin: '0px 0px -30% 0px' }
    );

    const items = container.querySelectorAll('[data-video-item]');
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [videos]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const { y: startY, time } = touchStart.current;
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY - endY;
    const deltaTime = Date.now() - time;
    const minSwipeDistance = 80;
    const maxDuration = 300;

    if (deltaTime > maxDuration) return;

    const container = containerRef.current;
    if (!container) return;

    if (Math.abs(deltaY) > minSwipeDistance) {
      e.preventDefault();
      if (deltaY > 0 && activeVideoIndex < videos.length - 1) {
        // Swipe up → next
        container.scrollTo({
          top: (activeVideoIndex + 1) * window.innerHeight,
          behavior: 'smooth',
        });
      } else if (deltaY < 0 && activeVideoIndex > 0) {
        // Swipe down → previous
        container.scrollTo({
          top: (activeVideoIndex - 1) * window.innerHeight,
          behavior: 'smooth',
        });
      }
    }

    touchStart.current = null;
  };

  const setVideoRef = (el: HTMLVideoElement | null, index: number) => {
    videoRefs.current[index] = el;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center">
      <div className="relative w-full max-w-md h-[100dvh] overflow-hidden bg-black">
        <div className="absolute top-0 left-0 right-0 z-30 pt-4 px-4 pb-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <h2 className="text-white font-bold text-lg">Just For You</h2>
          <button
            onClick={onClose}
            className="text-white p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {loading ? (
            <div className="h-[100dvh] w-full bg-gray-900 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-t-primary-500 border-gray-700 rounded-full animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <div className="h-[100dvh] flex items-center justify-center text-white">No videos.</div>
          ) : (
            videos.map((video, index) => (
              <div
                key={video.id}
                className="h-[100dvh] w-full snap-start relative"
                data-video-item
                data-index={index}
              >
                <VideoItem
                  video={video}
                  isActive={index === activeVideoIndex}
                  onLikeToggle={() => {}}
                  onRequireLogin={onRequireLogin}
                  onMuteAllOthers={() => muteAllOthers(index)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppableVideoFeed;