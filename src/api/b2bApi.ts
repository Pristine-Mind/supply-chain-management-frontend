import axios from 'axios';

const API_BASE = import.meta.env.VITE_REACT_APP_API_URL;

export interface B2BUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  registered_business_name?: string | null;
  description?: string | null;
  business_type?: string | null;
}

export interface MiniProduct {
  id: number;
  name: string;
  brand_name?: string | null;
  price?: number | null;
  thumbnail?: string | null;
  description?: string | null;
  category_info?: { id: number; name: string } | null;
  marketplace_id?: number | null;
}

export const listB2BUsers = async (q?: string, page = 1, page_size = 20) => {
  const params: any = { page, page_size };
  if (q) params.q = q;
  const res = await axios.get(`${API_BASE}/api/v1/b2b-verified-users-products/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    params,
  });
  const data = res.data;
  const payload = data?.data ?? data;
  const results = payload.results ?? (Array.isArray(payload) ? payload : []);
  const count = payload.count ?? results.length;
  return { results, count, next: payload.next ?? null, previous: payload.previous ?? null };
};

export const listB2BUserProducts = async (userId: number, q?: string, page = 1, page_size = 24) => {
  const params: any = { page, page_size };
  if (q) params.q = q;
  const res = await axios.get(`${API_BASE}/api/v1/b2b-verified-users-products/${userId}/products/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    params,
  });
  const data = res.data;
  const payload = data?.data ?? data;
  const results = payload.results ?? (Array.isArray(payload) ? payload : []);
  const count = payload.count ?? results.length;
  return { results, count, next: payload.next ?? null, previous: payload.previous ?? null };
};

export const getB2BUser = async (userId: number) => {
  const res = await axios.get(`${API_BASE}/api/v1/b2b-verified-users-products/${userId}/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  });
  const data = res.data;
  return data?.data ?? data; // single user object (normalize wrapper)
};

export const getRecommendedBusinesses = async () => {
  const res = await axios.get(`${API_BASE}/api/v1/recommendations/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  });
  return res.data; // expected array of { user_id, business_name, ... }
};

export interface Negotiation {
  id: number;
  buyer: number;
  seller: number;
  product: number;
  product_details?: {
    name: string;
    thumbnail: string;
    price: number;
  };
  buyer_details?: {
    username: string;
    full_name: string;
  };
  proposed_price: number;
  proposed_quantity: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER';
  last_offer_by: number;
  created_at: string;
  updated_at: string;
  history?: NegotiationHistory[];
}

export interface NegotiationHistory {
  id: number;
  negotiation: number;
  offer_by: number;
  price: number;
  quantity: number;
  message: string;
  timestamp: string;
}

export const createNegotiation = async (marketplaceId: number, price: number, quantity: number, message: string) => {
  const res = await axios.post(`${API_BASE}/api/v1/negotiations/`, {
    product: marketplaceId,
    proposed_price: price,
    proposed_quantity: quantity,
    message,
  }, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  });
  return res.data;
};

export const listNegotiations = async (params?: any) => {
  const res = await axios.get(`${API_BASE}/api/v1/negotiations/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    params,
  });
  return res.data;
};

export const getNegotiation = async (negotiationId: number) => {
  const res = await axios.get(`${API_BASE}api/v1/negotiations/${negotiationId}/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  });
  return res.data;
};

export const updateNegotiation = async (negotiationId: number, data: { price?: number; quantity?: number; status?: string; message?: string }) => {
  const res = await axios.patch(`${API_BASE}api/v1/negotiations/${negotiationId}/`, data, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  });
  return res.data;
};

export const getActiveNegotiation = async (marketplaceId: number) => {
  const res = await axios.get(`${API_BASE}/api/v1/negotiations/active/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    params: { product: marketplaceId },
  });
  return res.data;
};

export default {
  listB2BUsers,
  listB2BUserProducts,
  getB2BUser,
  createNegotiation,
  listNegotiations,
  getNegotiation,
  updateNegotiation,
  getActiveNegotiation,
};
