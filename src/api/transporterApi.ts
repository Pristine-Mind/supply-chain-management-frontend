import axios from 'axios';

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

export const getTransporterProfile = async (): Promise<TransporterProfile> => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/profile/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};
