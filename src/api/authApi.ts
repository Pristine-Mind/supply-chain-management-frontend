import axios from 'axios';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

export interface OtpResponse {
  message: string;
  otp?: string; // In production this might not be present
}

export interface LoginResponse {
  token: string;
  has_access_to_marketplace: boolean;
  business_type: string | null;
  shop_id: string | null;
  b2b_verified: boolean;
  username?: string;
  email?: string;
  role?: string;
}

export const requestOtp = async (phoneNumber: string): Promise<OtpResponse> => {
  const response = await axios.post<OtpResponse>(`${API_URL}/api/phone-login/`, {
    phone_number: phoneNumber,
  });
  return response.data;
};

export const verifyOtp = async (phoneNumber: string, otp: string): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_URL}/api/phone-login/`, {
    phone_number: phoneNumber,
    otp: otp,
  });
  return response.data;
};
