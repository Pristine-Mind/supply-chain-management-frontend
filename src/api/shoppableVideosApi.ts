import axios from 'axios';
import { ShoppableVideo, ShoppableVideoListResponse, VideoComment, VideoReportPayload, AddToCartPayload, ShoppableCategory, InteractionPayload } from '../types/shoppableVideo';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '';
const VIDEOS_URL = `${API_BASE_URL}/api/v1/shoppable-videos/`.replace(/([^:]\/)\/+/g, "$1");
const CATEGORIES_URL = `${API_BASE_URL}/api/v1/shoppable-video-categories/`.replace(/([^:]\/)\/+/g, "$1");
const COMMENTS_URL = `${API_BASE_URL}/api/v1/video-comments/`.replace(/([^:]\/)\/+/g, "$1");
const FOLLOWS_URL = `${API_BASE_URL}/api/v1/user-follows/`.replace(/([^:]\/)\/+/g, "$1");
const REPORTS_URL = `${API_BASE_URL}/api/v1/video-reports/`.replace(/([^:]\/)\/+/g, "$1");

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const shoppableVideosApi = {
    getVideos: async (categoryId?: number, page?: number): Promise<ShoppableVideoListResponse> => {
        const params: any = {};
        if (categoryId) params.category = categoryId;
        if (page && page > 1) params.page = page;
        
        const response = await axios.get(VIDEOS_URL, {
            params,
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    uploadContent: async (formData: FormData): Promise<ShoppableVideo> => {
        const response = await axios.post(VIDEOS_URL, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    addItemToCollection: async (id: number, formData: FormData): Promise<any> => {
        const response = await axios.post(`${VIDEOS_URL}${id}/add-item/`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    trackInteraction: async (id: number, payload: InteractionPayload): Promise<{ status: string }> => {
        const response = await axios.post(`${VIDEOS_URL}${id}/track-interaction/`, payload, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    getMoreLikeThis: async (id: number): Promise<ShoppableVideo[]> => {
        const response = await axios.get(`${VIDEOS_URL}${id}/more-like-this/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    getAlsoWatched: async (id: number): Promise<ShoppableVideo[]> => {
        const response = await axios.get(`${VIDEOS_URL}${id}/also-watched/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    getCategoryCreators: async (id: number): Promise<any> => {
        const response = await axios.get(`${CATEGORIES_URL}${id}/creators/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    getCategoryVideos: async (id: number): Promise<ShoppableVideo[]> => {
        const response = await axios.get(`${CATEGORIES_URL}${id}/videos/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    getCategories: async (): Promise<ShoppableCategory[]> => {
        const response = await axios.get(CATEGORIES_URL, {
            headers: getAuthHeaders(),
        });
        return Array.isArray(response.data) ? response.data : response.data.results || [];
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
