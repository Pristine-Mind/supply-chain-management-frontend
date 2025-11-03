import axios from 'axios';

export interface UserProfile {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  phone_number?: string;
  date_joined: string;
  last_login?: string;
  is_active?: boolean;
  business_type?: string;
  role?: string;
  shop_id?: string;
  has_access_to_marketplace: boolean;
  profile_picture?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  date_of_birth?: string;
  gender?: string;
  notification_preferences?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    order_updates: boolean;
  };
  shipping_addresses?: ShippingAddress[];
}

export interface ShippingAddress {
  id: number;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  date_of_birth?: string;
  gender?: string;
  notification_preferences?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    order_updates: boolean;
  };
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const fetchUserProfile = async (): Promise<UserProfile> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get<UserProfile>(
      'https://appmulyabazzar.com/api/v1/user-profile/',
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );


    // Check if the response has a nested data structure
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as any).data as UserProfile;
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.patch<UserProfile>(
      'https://appmulyabazzar.com/api/v1/user-profile/',
      data,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (file: File): Promise<{ profile_picture: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('profile_picture', file);

    const response = await axios.post<{ profile_picture: string }>(
      'https://appmulyabazzar.com/api/v1/user-profile/upload-picture/',
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

export const changePassword = async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<{ success: boolean; message: string }>(
      'https://appmulyabazzar.com/api/v1/user/change-password/',
      data,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const addShippingAddress = async (address: Omit<ShippingAddress, 'id' | 'created_at'>): Promise<ShippingAddress> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<ShippingAddress>(
      'https://appmulyabazzar.com/api/v1/user-profile/shipping-addresses/',
      address,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error adding shipping address:', error);
    throw error;
  }
};

export const updateShippingAddress = async (
  id: number, 
  address: Partial<Omit<ShippingAddress, 'id' | 'created_at'>>
): Promise<ShippingAddress> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.patch<ShippingAddress>(
      `https://appmulyabazzar.com/api/v1/user-profile/shipping-addresses/${id}/`,
      address,
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating shipping address:', error);
    throw error;
  }
};

export const deleteShippingAddress = async (id: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    await axios.delete(
      `https://appmulyabazzar.com/api/v1/user-profile/shipping-addresses/${id}/`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
  } catch (error) {
    console.error('Error deleting shipping address:', error);
    throw error;
  }
};