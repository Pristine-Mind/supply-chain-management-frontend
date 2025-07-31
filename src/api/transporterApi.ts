import axios from 'axios';
import type { DeliveryFilterParams } from '../types/delivery';

export interface TransporterProfile {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  license_number: string;
  phone: string;
  emergency_contact: string | null;
  business_name: string | null;
  tax_id: string | null;
  vehicle_type: string;
  vehicle_type_display: string;
  vehicle_number: string;
  vehicle_capacity: string;
  vehicle_image: string | null;
  vehicle_documents: any[] | null;
  insurance_expiry: string | null;
  license_expiry: string | null;
  current_latitude: string;
  current_longitude: string;
  service_radius: number;
  is_available: boolean;
  status: string;
  status_display: string;
  last_location_update: string | null;
  rating: string;
  total_deliveries: number;
  successful_deliveries: number;
  cancelled_deliveries: number;
  success_rate: number;
  cancellation_rate: number;
  earnings_total: string;
  commission_rate: string;
  is_verified: boolean;
  verification_documents: Record<string, any>;
  is_documents_expired: boolean | null;
  current_deliveries_count: number;
  created_at: string;
  updated_at: string;
}

export const registerTransporter = async (data: FormData) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/register/transporter/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export interface MarketplaceSaleBasic {
  id: number;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: string;
}

export interface Delivery {
  id: number;
  delivery_id: string;
  tracking_number: string;
  marketplace_sale: MarketplaceSaleBasic;
  pickup_address: string;
  delivery_address: string;
  package_weight: string;
  fragile: boolean;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  requested_pickup_date: string;
  requested_delivery_date: string;
  delivery_fee: string;
  distance_km: number;
  is_overdue: boolean;
  delivery_attempts: number;
  created_at: string;
  transporter_name: string;
}

export const getTransporterProfile = async (): Promise<TransporterProfile> => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/profile/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getTransporterDeliveries = async (limit = 10, offset = 0): Promise<PaginatedResponse<Delivery>> => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/deliveries/my/`, {
      params: {
        limit,
        offset
      },
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    throw error.response?.data || error.message;
  }
};

export interface NearbyDelivery extends Omit<Delivery, 'distance_km'> {
  distance: number; // in km
}

export const getNearbyDeliveries = async (radius: number = 10): Promise<NearbyDelivery[]> => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/deliveries/nearby/`, {
      params: { radius },
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching nearby deliveries:', error);
    throw error.response?.data || error.message;
  }
};

export const getAvailableDeliveries = async (filters: DeliveryFilterParams = {}): Promise<PaginatedResponse<Delivery>> => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/deliveries/available/`, {
      params: {
        ...filters,
        limit: filters.limit || 10,
        offset: filters.offset || 0
      },
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching available deliveries:', error);
    throw error.response?.data || error.message;
  }
};
