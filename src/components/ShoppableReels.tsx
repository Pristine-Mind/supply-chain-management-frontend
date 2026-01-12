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
  Send,
  MoreVertical,
  Flag,
  Bookmark,
  Sparkles
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
  const [isSaved, setIsSaved] = useState(video.is_saved);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [sharesCount, setSharesCount] = useState(video.shares_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<VideoComment | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0); // For COLLECTION type
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<'spam' | 'inappropriate' | 'harassment' | 'misleading' | 'other'>('inappropriate');
  const [reportDescription, setReportDescription] = useState('');
  const [showRelated, setShowRelated] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<ShoppableVideo[]>([]);
  const [alsoWatchedVideos, setAlsoWatchedVideos] = useState<ShoppableVideo[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
    } else if (startTimeRef.current) {
      const dwellTime = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (dwellTime > 0) {
        shoppableVideosApi.trackInteraction(video.id, {
          event_type: 'watch_time',
          dwell_time: dwellTime
        }).catch(console.error);
      }
      startTimeRef.current = null;
    }

    return () => {
      if (startTimeRef.current) {
        const dwellTime = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (dwellTime > 0) {
          shoppableVideosApi.trackInteraction(video.id, {
            event_type: 'watch_time',
            dwell_time: dwellTime
          }).catch(console.error);
        }
      }
    };
  }, [isActive, video.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && video.content_type === 'VIDEO') {
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
    } else if (isActive && (video.content_type === 'IMAGE' || video.content_type === 'COLLECTION')) {
       // For non-video types, still increment view
       const key = `viewed_${video.id}`;
       if (!sessionStorage.getItem(key)) {
         shoppableVideosApi.incrementView(video.id).catch(console.error);
         sessionStorage.setItem(key, 'true');
       }
    }
  }, [isActive, video.id, video.content_type]);

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

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const originalSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const res = await shoppableVideosApi.saveVideo(video.id);
      setIsSaved(res.saved);
    } catch (err) {
      setIsSaved(originalSaved);
      toast.error('Failed to update save status');
    }
  };

  const handleShowRelated = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRelated(true);
    setRelatedLoading(true);
    try {
      const [similar, alsoWatched] = await Promise.all([
        shoppableVideosApi.getMoreLikeThis(video.id),
        shoppableVideosApi.getAlsoWatched(video.id)
      ]);
      setRelatedVideos(similar);
      setAlsoWatchedVideos(alsoWatched);
    } catch (err) {
      console.error('Failed to fetch related', err);
    } finally {
      setRelatedLoading(false);
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

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    try {
      await shoppableVideosApi.reportVideo({
        video: video.id,
        reason: reportReason,
        description: reportDescription || 'Reported from Reels UI'
      });
      toast.success('Video reported. Thank you for making the platform safer.');
      setShowReportModal(false);
      setShowMoreMenu(false);
    } catch (err) {
      toast.error('Failed to report video');
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
        parent: replyingTo?.id || null
      });
      if (replyingTo) {
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.id) {
            return { ...c, replies: [comment, ...(c.replies || [])] };
          }
          return c;
        }));
      } else {
        setComments((prev) => [comment, ...prev]);
      }
      setNewComment('');
      setReplyingTo(null);
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
      shoppableVideosApi.trackInteraction(video.id, { event_type: 'cta_click', extra_data: { action: 'add_to_cart' } }).catch(console.error);
      const res = await shoppableVideosApi.addToCart(video.id, { quantity: 1 });
      toast.success(res.message || 'Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const handleViewProduct = (e: React.MouseEvent) => {
    e.stopPropagation();
    shoppableVideosApi.trackInteraction(video.id, { event_type: 'cta_click', extra_data: { action: 'view_product' } }).catch(console.error);
    navigate(`/marketplace/${video.product.id}`);
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
      {/* Background Media */}
      {video.content_type === 'VIDEO' ? (
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
      ) : video.content_type === 'IMAGE' ? (
        <img 
          src={video.image_file || video.thumbnail || ''} 
          alt={video.title} 
          className="h-full w-full object-contain"
          onClick={() => {/* Maybe toggle UI */}}
        />
      ) : video.content_type === 'COLLECTION' && video.items && video.items.length > 0 ? (
        <div className="relative h-full w-full overflow-hidden" 
             onTouchStart={(e) => {
               const startX = e.touches[0].clientX;
               const onTouchEnd = (ee: TouchEvent) => {
                 const endX = ee.changedTouches[0].clientX;
                 if (startX - endX > 50) {
                   setActiveItemIndex(p => Math.min(p + 1, video.items!.length - 1));
                 } else if (endX - startX > 50) {
                   setActiveItemIndex(p => Math.max(p - 1, 0));
                 }
                 document.removeEventListener('touchend', onTouchEnd);
               };
               document.addEventListener('touchend', onTouchEnd);
             }}>
          <div className="h-full w-full flex transition-transform duration-300" style={{ transform: `translateX(-${activeItemIndex * 100}%)` }}>
            {video.items.map((item, idx) => (
              <div key={item.id} className="h-full w-full shrink-0 flex items-center justify-center">
                {item.file.toLowerCase().endsWith('.mp4') ? (
                  <video src={item.file} className="h-full w-full object-contain" autoPlay={isActive && activeItemIndex === idx} loop muted />
                ) : (
                  <img src={item.file} className="h-full w-full object-contain" alt="" />
                )}
              </div>
            ))}
          </div>
          {/* Collection Dots */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1 z-30">
             {video.items.map((_, idx) => (
               <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === activeItemIndex ? 'bg-white' : 'bg-white/40'}`} />
             ))}
          </div>
        </div>
      ) : (
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
      )}

      {/* Right Side Actions */}
      <div className="absolute right-2 sm:right-4 bottom-32 sm:bottom-36 flex flex-col items-center gap-4 sm:gap-6 z-30">
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2.5 sm:p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/30 active:scale-90"
          >
            <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          {showMoreMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-neutral-900 rounded-xl border border-white/10 shadow-2xl p-1 min-w-[120px]">
              <button 
                onClick={() => setShowReportModal(true)}
                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/10 rounded-lg flex items-center gap-2"
              >
                <Flag size={14} className="text-red-400" />
                Report
              </button>
            </div>
          )}
        </div>

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
            onClick={handleSave}
            className={`p-2.5 sm:p-3 rounded-full backdrop-blur-md transition-all active:scale-90 ${isSaved ? 'bg-yellow-500/80 text-white' : 'bg-black/20 text-white border border-white/30'}`}
          >
            <Bookmark className={`w-5 h-5 sm:w-6 sm:h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <span className="text-white text-[10px] sm:text-xs font-medium">{isSaved ? 'Saved' : 'Save'}</span>
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
            onClick={handleShowRelated}
            className="p-2.5 sm:p-3 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/30 active:scale-90"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <span className="text-white text-[10px] sm:text-xs font-medium">Similar</span>
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
          <div className="space-y-2">
            <div 
              onClick={handleViewProduct}
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

            {/* Additional Products Carousel/List */}
            {video.additional_products && video.additional_products.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[90%]">
                {video.additional_products.map((ap) => (
                   <div 
                    key={ap.id}
                    onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/${ap.id}`); }}
                    className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 cursor-pointer hover:bg-black/60 shrink-0"
                   >
                     <img src={ap.images?.[0]?.image || '/product-placeholder.png'} className="w-7 h-7 rounded-md object-cover" alt="" />
                     <span className="text-white text-[9px] font-bold pr-1">Rs. {ap.discounted_price || ap.listed_price}</span>
                   </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Videos Overlay */}
      {showRelated && (
        <div className="absolute inset-0 z-40 bg-black/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-bold">More Like This</h3>
            <button onClick={() => setShowRelated(false)} className="text-white p-1 hover:bg-white/10 rounded-full">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {relatedLoading ? (
              <div className="text-white text-center mt-10">Searching for similar style...</div>
            ) : (relatedVideos.length === 0 && alsoWatchedVideos.length === 0) ? (
              <div className="text-gray-400 text-center mt-10">No similar videos found.</div>
            ) : (
              <div className="space-y-6">
                {relatedVideos.length > 0 && (
                  <section>
                    <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">More Like This (Style)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {relatedVideos.map((v) => (
                        <div 
                          key={`similar-${v.id}`} 
                          onClick={() => {
                             setShowRelated(false);
                             navigate(`/marketplace/${v.product?.id || ''}`);
                          }}
                          className="relative aspect-[9/16] rounded-xl overflow-hidden bg-neutral-800 cursor-pointer group"
                        >
                          <img src={v.thumbnail || ''} alt={v.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-[10px] font-medium truncate">{v.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {alsoWatchedVideos.length > 0 && (
                  <section>
                    <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">People Also Watched</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {alsoWatchedVideos.map((v) => (
                        <div 
                          key={`also-${v.id}`} 
                          onClick={() => {
                             setShowRelated(false);
                             navigate(`/marketplace/${v.product?.id || ''}`);
                          }}
                          className="relative aspect-[9/16] rounded-xl overflow-hidden bg-neutral-800 cursor-pointer group"
                        >
                          <img src={v.thumbnail || ''} alt={v.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-[10px] font-medium truncate">{v.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mute/Unmute Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-300">
         {isMuted ? <VolumeX className="w-16 h-16 text-white/50" /> : <Volume2 className="w-16 h-16 text-white/50" />}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-neutral-900">Report Content</h3>
                <button onClick={() => setShowReportModal(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleReport} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Reason</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full bg-neutral-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 outline-none"
                  >
                    <option value="spam">Spam</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="harassment">Harassment</option>
                    <option value="misleading">Misleading information</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Details (Optional)</label>
                  <textarea 
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Tell us what's wrong..."
                    className="w-full bg-neutral-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
                    rows={3}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Submit Report
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

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
                <div key={comment.id} className="space-y-3">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold border border-white/10">
                      {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-400 text-[10px] mb-1 font-medium">
                        {comment.user_name} • {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-white text-sm">{comment.text}</p>
                      <button 
                        onClick={() => {
                          setReplyingTo(comment);
                          setNewComment(`@${comment.user_name} `);
                        }}
                        className="text-primary-400 text-xs font-semibold mt-1 hover:text-primary-300"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-10 space-y-3 border-l border-white/10 pl-4">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex space-x-3">
                           <div className="w-6 h-6 rounded-full bg-neutral-700 flex-shrink-0 flex items-center justify-center text-white text-[10px] border border-white/10">
                            {reply.user_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-400 text-[10px] mb-1 font-medium">{reply.user_name}</p>
                            <p className="text-white text-xs">{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {replyingTo && (
            <div className="px-4 py-2 bg-primary-900/40 border-t border-white/10 flex items-center justify-between">
              <span className="text-white/60 text-xs">Replying to <strong>@{replyingTo.user_name}</strong></span>
              <button onClick={() => setReplyingTo(null)} className="text-white/40 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}

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
