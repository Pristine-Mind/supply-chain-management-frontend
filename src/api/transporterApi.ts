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

export interface MarketplaceSaleBasic {
  id: number;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: string;
}

export interface Transporter {
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
  vehicle_type: string;
  vehicle_number: string;
  vehicle_capacity: string;
  status: string;
  status_display: string;
}

export interface DeliveryDetail {
  id: number;
  delivery_id: string;
  marketplace_sale: MarketplaceSaleBasic;
  tracking_number: string;
  pickup_address: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_instructions: string | null;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  delivery_instructions: string | null;
  package_weight: string;
  package_dimensions: string | null;
  package_value: string | null;
  fragile: boolean;
  requires_signature: boolean;
  special_instructions: string | null;
  transporter: Transporter | null;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  requested_pickup_date: string | null;
  requested_delivery_date: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  delivery_fee: string;
  distance_km: number | null;
  fuel_surcharge: string | null;
  estimated_delivery_time: string | null;
  actual_pickup_time: string | null;
  delivery_photo: string | null;
  signature_image: string | null;
  delivery_notes: string | null;
  delivery_attempts: number;
  max_delivery_attempts: number;
  is_overdue: boolean;
  time_since_pickup: string | null;
  success_rate: number;
  created_at: string;
  updated_at: string;
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
  distance: number;
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


export const getDeliveryDetail = async (deliveryId: string): Promise<DeliveryDetail> => {
  try {
    const response = await axios.get<DeliveryDetail>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/deliveries/${deliveryId}/`,
      {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch delivery details');
    }
    throw new Error('Failed to fetch delivery details. Please try again.');
  }
};


export const claimDelivery = async (deliveryId: string): Promise<Delivery> => {
  try {
    const response = await axios.post<Delivery>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/deliveries/${deliveryId}/accept/`,
      {},
      {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to claim delivery');
    }
    throw new Error('Failed to claim delivery. Please try again.');
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
