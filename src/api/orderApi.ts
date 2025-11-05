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

export interface CreateOrderRequest {
  cart_id: number;
  delivery_info: DeliveryInfoRequest;
  payment_method?: string;
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