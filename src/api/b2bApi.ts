import axios from 'axios';

const API_BASE = import.meta.env.VITE_REACT_APP_API_URL;

export interface B2BUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  date_joined: string;
  is_active: boolean;
  phone_number?: string;
  business_type?: string | null;
  registered_business_name?: string | null;
  shop_id?: string;
  has_access_to_marketplace?: boolean;
  role_name?: string;
  role_code?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  b2b_verified?: boolean;
  credit_limit?: string | number;
  payment_terms_days?: number;
  registration_certificate?: string;
  pan_certificate?: string;
  profile_image?: string;
  description?: string | null;
}

// Filter interfaces for advanced search
export interface BusinessFilters {
  business_type?: string;
  b2b_verified?: boolean;
  has_marketplace_access?: boolean;
  city?: number;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  is_active?: boolean;
  registered_after?: string;
  registered_before?: string;
  min_credit_limit?: number;
  max_credit_limit?: number;
  search?: string;
  ordering?: string;
}

export interface BusinessListResponse {
  count: number;
  results: B2BUser[];
  filters_applied?: BusinessFilters;
  next?: string | null;
  previous?: string | null;
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
  min_order?: number;
  stock?: number;
}

export const listB2BUsers = async (
  query?: string,
  page = 1,
  page_size = 20,
  filters?: BusinessFilters
): Promise<BusinessListResponse> => {
  const params: any = { page, page_size };
  
  // Legacy query parameter for backward compatibility
  if (query) {
    params.q = query;
  }

  // Apply comprehensive filters
  if (filters) {
    if (filters.business_type) params.business_type = filters.business_type;
    if (filters.b2b_verified !== undefined) params.b2b_verified = filters.b2b_verified;
    if (filters.has_marketplace_access !== undefined) params.has_marketplace_access = filters.has_marketplace_access;
    if (filters.city) params.city = filters.city;
    if (filters.city_name) params.city_name = filters.city_name;
    if (filters.is_active !== undefined) params.is_active = filters.is_active;
    if (filters.registered_after) params.registered_after = filters.registered_after;
    if (filters.registered_before) params.registered_before = filters.registered_before;
    if (filters.min_credit_limit) params.min_credit_limit = filters.min_credit_limit;
    if (filters.max_credit_limit) params.max_credit_limit = filters.max_credit_limit;
    if (filters.search) params.search = filters.search;
    if (filters.ordering) params.ordering = filters.ordering;
    
    // Geographic filtering - all three parameters required together
    if (filters.latitude && filters.longitude && filters.radius_km) {
      params.latitude = filters.latitude;
      params.longitude = filters.longitude;
      params.radius_km = filters.radius_km;
    }
  }

  try {
    const res = await axios.get(`${API_BASE}/api/v1/businesses/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      params,
    });
    
    const data = res.data;
    const payload = data?.data ?? data;
    const results = payload.results ?? (Array.isArray(payload) ? payload : []);
    const count = payload.count ?? results.length;
    const filters_applied = payload.filters_applied || {};
    
    return { 
      results, 
      count, 
      filters_applied,
      next: payload.next ?? null, 
      previous: payload.previous ?? null 
    };
  } catch (error) {
    console.error('Error fetching B2B users:', error);
    // Fallback to existing endpoint for backward compatibility
    const res = await axios.get(`${API_BASE}/api/v1/b2b-verified-users-products/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      params: { q: query, page, page_size },
    });
    
    const data = res.data;
    const payload = data?.data ?? data;
    const results = payload.results ?? (Array.isArray(payload) ? payload : []);
    const count = payload.count ?? results.length;
    
    return { 
      results, 
      count,
      next: payload.next ?? null, 
      previous: payload.previous ?? null 
    };
  }
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

export const getRecommendedBusinesses = async (): Promise<B2BUser[]> => {
  try {
    // Try to get comprehensive recommended businesses from new endpoint
    const res = await axios.get(`${API_BASE}/api/v1/businesses/recommended/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    });
    
    const data = res.data;
    const payload = data?.data ?? data;
    return payload.results ?? (Array.isArray(payload) ? payload : []);
  } catch (error) {
    console.error('New recommendations endpoint not available, using fallback:', error);
    
    // Fallback to existing recommendations endpoint
    const res = await axios.get(`${API_BASE}/api/v1/recommendations/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    });
    
    const recommendationIds = res.data.map((r: any) => r.user_id);
    
    // Get full business details for recommended IDs
    if (recommendationIds.length > 0) {
      const businessesRes = await listB2BUsers(undefined, 1, 50, {
        // Filter to only get recommended businesses
        search: undefined
      });
      
      return businessesRes.results.filter(business => 
        recommendationIds.includes(business.id)
      );
    }
    
    return [];
  }
};

// Get recommended businesses from B2B verified users products API
export const getRecommendedBusinessesFromProducts = async (page = 1, pageSize = 12): Promise<{ results: B2BUser[]; count: number; next: string | null; previous: string | null }> => {
  try {
    const res = await axios.get(`${API_BASE}/api/v1/b2b-verified-users-products/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      params: { 
        page, 
        page_size: pageSize,
        verified_only: true, // Get only verified businesses
        has_products: true   // Ensure they have products
      },
    });
    
    const data = res.data;
    const payload = data?.data ?? data;
    const results = payload.results ?? (Array.isArray(payload) ? payload : []);
    const count = payload.count ?? results.length;
    
    return { 
      results, 
      count, 
      next: payload.next ?? null, 
      previous: payload.previous ?? null 
    };
  } catch (error) {
    console.error('Error fetching recommended businesses from products:', error);
    return { results: [], count: 0, next: null, previous: null };
  }
};

// Get user's current location
export const getUserLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Get cities for location filtering
export const getCities = async (search?: string) => {
  try {
    const params = search ? { search } : {};
    const res = await axios.get(`${API_BASE}/api/v1/cities/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      params,
    });
    const data = res.data;
    const payload = data?.data ?? data;
    return payload.results ?? (Array.isArray(payload) ? payload : []);
  } catch (error) {
    console.error('Error fetching cities:', error);
    // Fallback city list for Nepal
    return [
      { id: 1, name: 'Kathmandu' },
      { id: 2, name: 'Lalitpur' },
      { id: 3, name: 'Bhaktapur' },
      { id: 4, name: 'Pokhara' },
      { id: 5, name: 'Biratnagar' },
      { id: 6, name: 'Birgunj' },
      { id: 7, name: 'Dharan' },
      { id: 8, name: 'Butwal' },
      { id: 9, name: 'Nepalgunj' },
      { id: 10, name: 'Chitwan' }
    ];
  }
};

// Enhanced search with filter presets
export const getFilterPresets = () => {
  return {
    verified_businesses: {
      b2b_verified: true,
      is_active: true
    },
    marketplace_sellers: {
      has_marketplace_access: true,
      b2b_verified: true
    },
    high_credit_businesses: {
      min_credit_limit: 50000,
      b2b_verified: true
    },
    local_distributors: {
      business_type: 'distributor',
      is_active: true
    },
    new_businesses: {
      registered_after: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last year
      is_active: true
    }
  };
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
  masked_price?: string;
  proposed_quantity: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER' | 'ORDERED' | 'LOCKED';
  last_offer_by: number;
  lock_owner?: number | null;
  lock_expires_at?: string | null;
  is_locked?: boolean;
  lock_expires_in?: number;
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
  const res = await axios.get(`${API_BASE}/api/v1/negotiations/${negotiationId}/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  });
  return res.data;
};

export const updateNegotiation = async (negotiationId: number, data: { price?: number; quantity?: number; status?: string; message?: string }) => {
  const res = await axios.patch(`${API_BASE}/api/v1/negotiations/${negotiationId}/`, data, {
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

export const forceReleaseLock = async (negotiationId: number) => {
  const res = await axios.post(`${API_BASE}/api/v1/negotiations/${negotiationId}/force_release_lock/`, {}, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
  });
  return res.data;
};

export const extendLock = async (negotiationId: number, additionalSeconds: number = 300) => {
  const res = await axios.post(`${API_BASE}/api/v1/negotiations/${negotiationId}/extend_lock/`, {
    additional_seconds: additionalSeconds
  }, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
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
  forceReleaseLock,
  extendLock,
};
