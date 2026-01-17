import axios from 'axios';

// TypeScript interfaces matching the API serializer structure
export interface DeliveryInfoRequest {
  customer_name: string;
  customer_email?: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  delivery_instructions?: string;
}

// Interface for creating delivery from sale
export interface CreateDeliveryFromSaleRequest {
  sale_id: number;
  customer_name: string;
  phone_number: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  additional_instructions?: string;
}

// Interface for delivery tracking
export interface DeliveryTrackingResponse {
  id: number;
  cart: number | null;
  sale: number;
  marketplace_sale: number | null;
  marketplace_order: number | null;
  customer_name: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  additional_instructions: string;
  shop_id: string;
  delivery_status: string;
  delivery_person_name: string | null;
  delivery_person_phone: string | null;
  delivery_service: string | null;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  delivery_source: string;
  total_items: number;
  total_value: number;
  product_details: Array<{
    name: string;
    quantity: number;
  }>;
}

export interface CreateOrderRequest {
  cart_id: number;
  delivery_info: DeliveryInfoRequest;
  payment_method?: string;
  coupon_code?: string;
}

export interface OrderResponse {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_info: DeliveryInfoRequest;
  payment_method?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

// API service for order creation
export const createOrder = async (orderData: CreateOrderRequest): Promise<OrderResponse> => {
  try {    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    // Validate required fields
    if (!orderData.cart_id || orderData.cart_id <= 0) {
      throw new Error('Valid cart ID is required');
    }
    
    if (!orderData.delivery_info.customer_name?.trim()) {
      throw new Error('Customer name is required');
    }
    
    if (!orderData.delivery_info.phone_number?.trim()) {
      throw new Error('Phone number is required');
    }
    
    if (!orderData.delivery_info.address?.trim()) {
      throw new Error('Address is required');
    }
    
    if (!orderData.delivery_info.city?.trim()) {
      throw new Error('City is required');
    }
    
    if (!orderData.delivery_info.state?.trim()) {
      throw new Error('State is required');
    }
    
    if (!orderData.delivery_info.zip_code?.trim()) {
      throw new Error('ZIP code is required');
    }
    
    // Ensure coordinates are valid numbers
    if (typeof orderData.delivery_info.latitude !== 'number' || orderData.delivery_info.latitude === 0) {
      throw new Error('Valid latitude is required');
    }
    
    if (typeof orderData.delivery_info.longitude !== 'number' || orderData.delivery_info.longitude === 0) {
      throw new Error('Valid longitude is required');
    }

    const response = await axios.post<OrderResponse>(
      'https://appmulyabazzar.com/api/v1/marketplace/orders/create/',
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('❌ Order creation failed:', error);
    
    if (error.response?.data) {
      // Handle API validation errors
      const apiError = error.response.data;
      if (typeof apiError === 'object') {
        const errorMessages = [];
        
        // Collect all error messages
        for (const [, messages] of Object.entries(apiError)) {
          if (Array.isArray(messages)) {
            errorMessages.push(...messages);
          } else if (typeof messages === 'string') {
            errorMessages.push(messages);
          }
        }
        
        throw new Error(errorMessages.join('. ') || 'Order creation failed');
      } else if (typeof apiError === 'string') {
        throw new Error(apiError);
      }
    }
    
    throw new Error(error.message || 'Failed to create order. Please try again.');
  }
};

// Get order details by ID
export const getOrder = async (orderId: number): Promise<OrderResponse> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get<OrderResponse>(
      `https://appmulyabazzar.com/api/v1/marketplace/orders/${orderId}/`,
      {
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch order:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch order details');
  }
};

// Get user's orders
export const getUserOrders = async (): Promise<OrderResponse[]> => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get<{ results: OrderResponse[] }>(
      'https://appmulyabazzar.com/api/v1/marketplace/orders/',
      {
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      }
    );
    return response.data.results;
  } catch (error: any) {
    console.error('Failed to fetch user orders:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch orders');
  }
};

// Check if sale has delivery order
export const checkSaleDelivery = async (saleId: number): Promise<DeliveryTrackingResponse | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await axios.get<{ results: DeliveryTrackingResponse[] }>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/deliveries-main/?sale=${saleId}`,
      {
        headers: {
          'Authorization': `Token ${token}`,
        },
      }
    );

    // Return the first delivery found for this sale, or null if none
    return response.data.results.length > 0 ? response.data.results[0] : null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No delivery found for this sale
    }
    console.error('Failed to check sale delivery:', error);
    throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Failed to check delivery status');
  }
};

// Get delivery tracking details
export const getDeliveryTracking = async (deliveryId: number): Promise<DeliveryTrackingResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await axios.get<DeliveryTrackingResponse>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/deliveries-main/${deliveryId}/`,
      {
        headers: {
          'Authorization': `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to get delivery tracking:', error);
    throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Failed to get delivery tracking details');
  }
};

// Create delivery from sale
export const createDeliveryFromSale = async (deliveryData: CreateDeliveryFromSaleRequest): Promise<any> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await axios.post(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/deliveries-main/create-from-sale/`,
      deliveryData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to create delivery from sale:', error);
    throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Failed to create delivery order');
  }
};

// List all deliveries
export const getAllDeliveries = async (params?: {
  limit?: number;
  offset?: number;
  delivery_status?: string;
  sale?: number;
}): Promise<{ results: DeliveryTrackingResponse[]; count: number }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await axios.get<{ results: DeliveryTrackingResponse[]; count: number }>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/deliveries-main/${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
      {
        headers: {
          'Authorization': `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch deliveries:', error);
    throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch deliveries');
  }
};

// Update delivery status
export const updateDeliveryStatus = async (
  deliveryId: number, 
  delivery_status: string, 
  additionalData?: {
    estimated_delivery_date?: string;
    actual_delivery_date?: string;
    delivery_person_name?: string;
    delivery_person_phone?: string;
    tracking_number?: string;
  }
): Promise<DeliveryTrackingResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const updateData = {
      delivery_status,
      ...additionalData,
    };

    const response = await axios.patch<DeliveryTrackingResponse>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/deliveries-main/${deliveryId}/update-status/`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to update delivery status:', error);
    throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Failed to update delivery status');
  }
};