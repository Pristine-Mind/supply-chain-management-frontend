import axios from 'axios';
import { ShoppableVideo, ShoppableVideoListResponse, VideoComment, VideoReportPayload, AddToCartPayload } from '../types/shoppableVideo';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '';
const VIDEOS_URL = `${API_BASE_URL}/api/v1/shoppable-videos/`.replace(/([^:]\/)\/+/g, "$1");
const COMMENTS_URL = `${API_BASE_URL}/api/v1/video-comments/`.replace(/([^:]\/)\/+/g, "$1");
const FOLLOWS_URL = `${API_BASE_URL}/api/v1/user-follows/`.replace(/([^:]\/)\/+/g, "$1");
const REPORTS_URL = `${API_BASE_URL}/api/v1/video-reports/`.replace(/([^:]\/)\/+/g, "$1");

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const shoppableVideosApi = {
    getVideos: async (page: number = 1, pageSize: number = 10): Promise<ShoppableVideoListResponse> => {
        const response = await axios.get(VIDEOS_URL, {
            params: {
                page,
                page_size: pageSize,
            },
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    getVideoDetails: async (id: number): Promise<ShoppableVideo> => {
        const response = await axios.get(`${VIDEOS_URL}${id}/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    likeVideo: async (id: number): Promise<{ status: string; liked: boolean; likes_count: number }> => {
        const response = await axios.post(`${VIDEOS_URL}${id}/like/`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    saveVideo: async (id: number): Promise<{ status: string; saved: boolean }> => {
        const response = await axios.post(`${VIDEOS_URL}${id}/save_video/`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    shareVideo: async (id: number): Promise<{ status: string; shares_count: number }> => {
        const response = await axios.post(`${VIDEOS_URL}${id}/share/`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    incrementView: async (id: number): Promise<{ status: string; views_count: number }> => {
        const response = await axios.post(`${VIDEOS_URL}${id}/view/`, {}, {
             headers: getAuthHeaders(),
        });
        return response.data;
    },

    addToCart: async (id: number, payload: AddToCartPayload): Promise<{ status: string; message: string; cart_item_count: number }> => {
        const response = await axios.post(`${VIDEOS_URL}${id}/add_to_cart/`, payload, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    getComments: async (videoId: number): Promise<VideoComment[]> => {
        const response = await axios.get(COMMENTS_URL, {
            params: { video_id: videoId },
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    addComment: async (payload: { video: number; text: string; parent?: number | null }): Promise<VideoComment> => {
        const response = await axios.post(COMMENTS_URL, payload, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    toggleFollow: async (followingId: number): Promise<{ status: string; is_following: boolean }> => {
        const response = await axios.post(`${FOLLOWS_URL}toggle_follow/`, { following_id: followingId }, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    reportVideo: async (payload: VideoReportPayload): Promise<{ status: string; message: string }> => {
        const response = await axios.post(REPORTS_URL, payload, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },
};
