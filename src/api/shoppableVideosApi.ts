import axios from 'axios';
import { ShoppableVideo, ShoppableVideoListResponse } from '../types/shoppableVideo';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '';
const BASE_URL = `${API_BASE_URL}/api/v1/shoppable-videos/`.replace(/([^:]\/)\/+/g, "$1"); // Remove double slashes

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const shoppableVideosApi = {
    getVideos: async (page: number = 1, pageSize: number = 10): Promise<ShoppableVideoListResponse> => {
        const response = await axios.get(BASE_URL, {
            params: {
                page,
                page_size: pageSize,
            },
            headers: getAuthHeaders(), // Pass auth headers even for read to get is_liked status
        });
        return response.data;
    },

    getVideoDetails: async (id: number): Promise<ShoppableVideo> => {
        const response = await axios.get(`${BASE_URL}${id}/`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    likeVideo: async (id: number): Promise<{ status: string; liked: boolean; likes_count: number }> => {
        const response = await axios.post(`${BASE_URL}${id}/like/`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    saveVideo: async (id: number): Promise<{ status: string; saved: boolean }> => {
        const response = await axios.post(`${BASE_URL}${id}/save_video/`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    shareVideo: async (id: number): Promise<{ status: string; shares_count: number }> => {
        const response = await axios.post(`${BASE_URL}${id}/share/`, {}, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    incrementView: async (id: number): Promise<{ status: string; views_count: number }> => {
        const response = await axios.post(`${BASE_URL}${id}/view/`, {}, {
             headers: getAuthHeaders(),
        });
        return response.data;
    },
};
