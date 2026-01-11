import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShoppableVideo } from '../types/shoppableVideo';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoginModal from './auth/LoginModal';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ShoppingBag, 
  Volume2, 
  VolumeX, 
  UserPlus, 
  Check, 
  Eye, 
  X, 
  Send 
} from 'lucide-react';
import FollowButton from './FollowButton';
import { VideoComment } from '../types/shoppableVideo';

interface ShoppableReelsProps {
  videos: ShoppableVideo[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const ReelItem: React.FC<{ video: ShoppableVideo; isActive: boolean }> = ({ video, isActive }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(video.is_liked);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [sharesCount, setSharesCount] = useState(video.shares_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => console.debug('Autoplay blocked:', err));
        
        // Auto-increment view
        const key = `viewed_${video.id}`;
        if (!sessionStorage.getItem(key)) {
          shoppableVideosApi.incrementView(video.id).catch(console.error);
          sessionStorage.setItem(key, 'true');
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, video.id]);

  useEffect(() => {
    if (showComments) {
      setCommentsLoading(true);
      shoppableVideosApi.getComments(video.id)
        .then((data: any) => {
          setComments(Array.isArray(data) ? data : data.results || []);
        })
        .finally(() => setCommentsLoading(false));
    }
  }, [showComments, video.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const originalLiked = isLiked;
    const originalCount = likesCount;
    
    // Optimistic UI
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const res = await shoppableVideosApi.likeVideo(video.id);
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch (err) {
      setIsLiked(originalLiked);
      setLikesCount(originalCount);
      toast.error('Failed to update like');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/marketplace/${video.product?.id || ''}`;
    
    try {
      const res = await shoppableVideosApi.shareVideo(video.id);
      setSharesCount(res.shares_count);
      
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      const comment = await shoppableVideosApi.addComment({
        video: video.id,
        text: newComment,
      });
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await shoppableVideosApi.addToCart(video.id, { quantity: 1 });
      toast.success(res.message || 'Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center snap-start overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        src={video.video_file || (video as any).video_url}
        poster={video.thumbnail || ''}
        className="h-full w-full object-contain"
        loop
        playsInline
        muted={isMuted}
        onClick={toggleMute}
      />

      {/* Right Side Actions */}
      <div className="absolute right-2 sm:right-4 bottom-32 sm:bottom-36 flex flex-col items-center gap-4 sm:gap-6 z-30">
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleLike}
            className={`p-2.5 sm:p-3 rounded-full backdrop-blur-md transition-all active:scale-90 ${isLiked ? 'bg-red-500/80 text-white' : 'bg-black/20 text-white border border-white/30'}`}
          >
            <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <span className="text-white text-[10px] sm:text-xs font-medium">{likesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setShowComments(true)}
            className="p-2.5 sm:p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/30 active:scale-90"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <span className="text-white text-[10px] sm:text-xs font-medium">{video.comments_count || comments.length || 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleShare}
            className="p-2.5 sm:p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/30 active:scale-90"
          >
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <span className="text-white text-[10px] sm:text-xs font-medium">{sharesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="p-2.5 sm:p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/30">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-white text-[10px] sm:text-xs font-medium">{video.views_count}</span>
        </div>

        {video.product && (
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={handleAddToCart}
              className="p-2.5 sm:p-3 rounded-full bg-primary-600 backdrop-blur-md text-white shadow-lg animate-bounce active:scale-90"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <span className="text-white text-[10px] sm:text-xs font-medium">Buy</span>
          </div>
        )}
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20">
        <div className="flex items-center gap-3 mb-3 max-w-[85%]">
          <div 
             onClick={() => navigate(`/creators/${video.uploader}`)}
             className="w-10 h-10 rounded-full border-2 border-white overflow-hidden cursor-pointer shrink-0"
          >
            <img src={video.uploader_avatar || '/placeholder-avatar.png'} alt={video.uploader_name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm sm:text-base truncate cursor-pointer" onClick={() => navigate(`/creators/${video.uploader}`)}>
              @{video.uploader_name}
            </h3>
          </div>
          <FollowButton 
            creatorId={video.uploader} 
            className="px-3 py-1 text-[10px] sm:text-xs h-auto min-w-[70px]" 
            initialFollowing={video.is_following} 
          />
        </div>

        <p className="text-white text-xs sm:text-sm mb-4 line-clamp-2 max-w-[80%]">{video.description || video.title}</p>

        {video.product && (
          <div 
            onClick={() => navigate(`/marketplace/${video.product.id}`)}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-2 sm:p-3 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20 transition-colors max-w-[90%] sm:max-w-md"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg overflow-hidden shrink-0">
              <img src={video.product.images?.[0]?.image || '/product-placeholder.png'} alt={video.product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[10px] sm:text-xs font-medium truncate">{video.product.name}</p>
              <p className="text-primary-400 text-xs sm:text-sm font-bold">Rs. {video.product.discounted_price || video.product.listed_price}</p>
            </div>
            <div className="bg-primary-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold">
              View
            </div>
          </div>
        )}
      </div>

      {/* Mute/Unmute Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-300">
         {isMuted ? <VolumeX className="w-16 h-16 text-white/50" /> : <Volume2 className="w-16 h-16 text-white/50" />}
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-bold">Comments ({comments.length})</h3>
            <button onClick={() => setShowComments(false)} className="text-white p-1 hover:bg-white/10 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="text-white text-center mt-4">Loading...</div>
            ) : comments.length === 0 ? (
              <div className="text-gray-400 text-center mt-4 pb-20">No comments yet. Be the first!</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold border border-white/10">
                    {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-[10px] mb-1 font-medium">
                      {comment.user_name} • {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-white text-sm">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePostComment} className="p-4 border-t border-white/10 bg-black flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/10 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 border border-white/10"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="p-2 bg-primary-600 rounded-full text-white disabled:opacity-50 hover:bg-primary-700 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

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

const ShoppableReels: React.FC<ShoppableReelsProps> = ({ videos, loading, onLoadMore, hasMore }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }

    // Load more when reaching near the end
    if (hasMore && !loading && (scrollTop + clientHeight >= containerRef.current.scrollHeight - 200)) {
    //   onLoadMore?.(); // This might trigger too often if not debounced
    }
  }, [activeIndex, hasMore, loading, onLoadMore]);

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100vh-180px)] sm:h-[calc(100vh-120px)] md:h-[800px] w-full max-w-[450px] mx-auto overflow-y-scroll snap-y snap-mandatory bg-black rounded-2xl sm:rounded-3xl shadow-2xl relative"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {videos.map((video, index) => (
        <ReelItem 
          key={video.id + '-' + index} 
          video={video} 
          isActive={index === activeIndex} 
        />
      ))}
      
      {loading && (
        <div className="h-full w-full flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      )}

      {videos.length === 0 && !loading && (
        <div className="h-full w-full flex flex-col items-center justify-center text-white p-6 text-center">
          <p className="text-xl font-bold mb-2">No videos found</p>
          <p className="text-white/60">Try following more creators or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default ShoppableReels;
