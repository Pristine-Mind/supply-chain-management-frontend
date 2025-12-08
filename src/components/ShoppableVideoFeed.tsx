import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, Share2, ShoppingBag, Volume2, VolumeX, Music2, Bookmark } from 'lucide-react';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { ShoppableVideo } from '../types/shoppableVideo';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

interface ShoppableVideoFeedProps {
    onClose: () => void;
    onRequireLogin: () => void;
}

const VideoItem: React.FC<{
    video: ShoppableVideo;
    isActive: boolean;
    onLikeToggle: (id: number, currentStatus: boolean) => void;
    onRequireLogin: () => void;
}> = ({ video, isActive, onLikeToggle, onRequireLogin }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [liked, setLiked] = useState(video.is_liked);
    const [likesCount, setLikesCount] = useState(video.likes_count);
    const [saved, setSaved] = useState(video.is_saved);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().catch(e => console.log("Autoplay prevented", e));
            shoppableVideosApi.incrementView(video.id).catch(console.error);
        } else {
            videoRef.current?.pause();
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }
        }
    }, [isActive, video.id]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!isAuthenticated) {
            onRequireLogin();
            return;
        }

        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
        
        try {
            const response = await shoppableVideosApi.likeVideo(video.id);
            // Sync with server response if needed, but optimistic is usually fine
            setLiked(response.liked);
            setLikesCount(response.likes_count);
            onLikeToggle(video.id, response.liked);
        } catch (error) {
            // Revert on error
            setLiked(!newLiked);
            setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
            console.error("Failed to like video", error);
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
                position: "bottom-center",
                autoClose: 1500,
                hideProgressBar: true,
                theme: "dark",
            });
        } catch (error) {
            setSaved(!newSaved);
            console.error("Failed to save video", error);
            toast.error('Failed to save video');
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
    };

    const handleProductClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Navigate to product page
        navigate(`/marketplace/${video.product.id}`);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Call API to increment share count
        try {
            await shoppableVideosApi.shareVideo(video.id);
        } catch (error) {
            console.error("Failed to record share", error);
        }

        const shareUrl = `${window.location.origin}/marketplace/${video.product.id}`;
        const shareData = {
            title: video.title,
            text: `Check out ${video.product.name} on Mulya Bazzar!`,
            url: shareUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied to clipboard!', {
                    position: "bottom-center",
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: false,
                    theme: "dark",
                });
            } catch (error) {
                console.error('Failed to copy link:', error);
                toast.error('Failed to copy link');
            }
        }
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-black snap-start shrink-0">
            <video
                ref={videoRef}
                src={video.video_file}
                className="h-full w-full object-cover"
                loop
                muted={isMuted}
                playsInline
                poster={video.thumbnail || undefined}
                onClick={toggleMute}
            />

            {/* Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white">
                <div className="flex justify-between items-end">
                    <div className="flex-1 mr-12">
                        {/* <div className="flex items-center mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-[2px] mr-2">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                    <span className="text-xs font-bold">{video.uploader_name.charAt(0).toUpperCase()}</span>
                                </div>
                            </div>
                            <span className="font-semibold text-base shadow-black drop-shadow-md">@{video.uploader_name}</span>
                        </div> */}
                        <h2 className="font-medium text-sm mb-2 drop-shadow-md">{video.title}</h2>
                        <h3 className="font-medium text-sm mb-2 drop-shadow-md">{video.description}</h3>
                        
                        <div className="flex items-center text-xs mb-4 opacity-90">
                            <Music2 size={14} className="mr-2 animate-spin-slow" />
                            <span className="truncate max-w-[200px]">Original Audio - {video.uploader_name}</span>
                        </div>
                        
                        {/* Product Card */}
                        {video.product && (
                            <div 
                                onClick={handleProductClick}
                                className="bg-black/40 backdrop-blur-md rounded-lg p-2 flex items-center cursor-pointer border border-white/10 hover:bg-black/60 transition-all active:scale-95"
                            >
                                {video.product.images && video.product.images.length > 0 && (
                                    <img 
                                        src={video.product.images[0].image} 
                                        alt={video.product.name} 
                                        className="w-12 h-12 rounded-md object-cover mr-3 bg-white"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-white">{video.product.name}</p>
                                    <div className="flex items-center mt-0.5">
                                        <span className="text-sm font-bold text-primary-400">
                                            Rs. {video.product.discounted_price || video.product.listed_price}
                                        </span>
                                        {video.product.discounted_price && (
                                            <span className="text-xs text-gray-400 line-through ml-2">
                                                Rs. {video.product.listed_price}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-primary-600 p-2 rounded-full ml-2 shadow-lg shadow-primary-600/20">
                                    <ShoppingBag size={18} className="text-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex flex-col items-center space-y-6 pb-4">
                        <button onClick={handleLike} className="flex flex-col items-center group">
                            <div className={`p-3 rounded-full bg-black/20 backdrop-blur-sm transition-transform group-active:scale-75 ${liked ? 'text-red-500' : 'text-white'}`}>
                                <Heart size={32} fill={liked ? "currentColor" : "none"} className={`filter drop-shadow-lg ${liked ? 'animate-heart-bounce' : ''}`} />
                            </div>
                            <span className="text-xs mt-1 font-medium drop-shadow-md">{likesCount}</span>
                        </button>
                        
                        <button onClick={handleSave} className="flex flex-col items-center group">
                            <div className={`p-3 rounded-full bg-black/20 backdrop-blur-sm transition-transform group-active:scale-75 ${saved ? 'text-yellow-400' : 'text-white'}`}>
                                <Bookmark size={30} fill={saved ? "currentColor" : "none"} className="filter drop-shadow-lg" />
                            </div>
                            <span className="text-xs mt-1 font-medium drop-shadow-md">Save</span>
                        </button>

                        <button onClick={handleShare} className="flex flex-col items-center group">
                            <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-transform group-active:scale-90">
                                <Share2 size={30} className="filter drop-shadow-lg" />
                            </div>
                            <span className="text-xs mt-1 font-medium drop-shadow-md">{video.shares_count}</span>
                        </button>

                        <button onClick={toggleMute} className="flex flex-col items-center group">
                            <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-transform group-active:scale-90">
                                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </div>
                        </button>
                        
                        {video.product && (
                             <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden animate-spin-slow mt-4">
                                {video.product.images && video.product.images.length > 0 ? (
                                    <img src={video.product.images[0].image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-800" />
                                )}
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShoppableVideoFeed: React.FC<ShoppableVideoFeedProps> = ({ onClose, onRequireLogin }) => {
    const [videos, setVideos] = useState<ShoppableVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchVideos = useCallback(async (pageNum: number) => {
        try {
            const data: any = await shoppableVideosApi.getVideos(pageNum);
            let newVideos: ShoppableVideo[] = [];

            if (Array.isArray(data)) {
                newVideos = data;
            } else if (data && Array.isArray(data.results)) {
                newVideos = data.results;
            } else {
                console.error("Invalid API response format", data);
            }

            if (pageNum === 1) {
                setVideos(newVideos);
            } else {
                setVideos(prev => [...prev, ...newVideos]);
            }
        } catch (error) {
            console.error("Failed to fetch videos", error);
            if (pageNum === 1) setVideos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVideos(1);
    }, [fetchVideos]);

    // Intersection Observer for better accuracy
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
            { threshold: 0.6 }
        );

        const children = container.querySelectorAll('[data-video-item]');
        children.forEach(child => observer.observe(child));

        return () => observer.disconnect();
    }, [videos]);


    return (
        <div className="fixed inset-0 z-50 bg-black flex justify-center">
            <div className="relative w-full max-w-md h-full bg-black shadow-2xl">
                {/* Header / Close Button */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <h2 className="text-white font-bold text-lg drop-shadow-md">Just For You</h2>
                    <button 
                        onClick={onClose}
                        className="text-white p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Video Feed */}
                <div 
                    ref={containerRef}
                    className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {loading && (!videos || videos.length === 0) ? (
                        <div className="h-full flex items-center justify-center text-white">
                            Loading...
                        </div>
                    ) : (
                        videos?.map((video, index) => (
                            <div key={video.id} className="h-full w-full snap-start" data-video-item data-index={index}>
                                <VideoItem 
                                    video={video} 
                                    isActive={index === activeVideoIndex}
                                    onLikeToggle={() => {
                                        // Optional: update local state if needed globally
                                    }}
                                    onRequireLogin={onRequireLogin}
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
