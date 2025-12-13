import axios from 'axios';
import {
  CreatorProfile,
  PaginatedCreators,
  PaginatedVideos,
  FollowToggleResponse,
  ShoppableVideoViewResponse,
} from '../types/creator';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '';
const CREATORS_URL = `${API_BASE_URL}/api/v1/creators/`.replace(/([^:]\/)\/+/, "$1");

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const creatorsApi = {
  listCreators: async (q: string | undefined, page: number = 1): Promise<PaginatedCreators> => {
    const response = await axios.get(CREATORS_URL, {
      params: { q, page },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getCreator: async (id: number): Promise<CreatorProfile> => {
    const response = await axios.get(`${CREATORS_URL}${id}/`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getCreatorVideos: async (id: number, page: number = 1): Promise<PaginatedVideos> => {
    const response = await axios.get(`${CREATORS_URL}${id}/videos/`, {
      params: { page },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  toggleFollow: async (id: number): Promise<FollowToggleResponse> => {
    const response = await axios.post(`${CREATORS_URL}${id}/follow/`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getFollowers: async (id: number): Promise<{ count: number; results: Array<{ user: number; username?: string }> }> => {
    const response = await axios.get(`${CREATORS_URL}${id}/followers/`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getMyFollowing: async (): Promise<CreatorProfile[]> => {
    const response = await axios.get(`${CREATORS_URL}me_following/`, {
      headers: getAuthHeaders(),
    });
    // backend may return paginated or array; normalize to array
    if (Array.isArray(response.data)) return response.data;
    if (response.data && Array.isArray(response.data.results)) return response.data.results;
    return [];
  },

  isFollowing: async (creatorId: number): Promise<boolean> => {
    try {
      const response = await axios.get(`${CREATORS_URL}me_following/`, { headers: getAuthHeaders() });
      const list = Array.isArray(response.data) ? response.data : (response.data && Array.isArray(response.data.results) ? response.data.results : []);
      return list.some((c: CreatorProfile) => c.id === creatorId);
    } catch (err) {
      return false;
    }
  },

  incrementVideoView: async (videoId: number): Promise<ShoppableVideoViewResponse> => {
    const base = `${API_BASE_URL}/api/v1/shoppable-videos/`.replace(/([^:]\/)\/+/, "$1");
    const response = await axios.post(`${base}${videoId}/view/`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
