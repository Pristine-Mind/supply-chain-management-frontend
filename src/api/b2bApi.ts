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

export default {
  listB2BUsers,
  listB2BUserProducts,
  getB2BUser,
};
