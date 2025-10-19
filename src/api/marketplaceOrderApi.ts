import axios from 'axios';

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
  category_details: string;
  category: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_marketplace_created: boolean;
  avg_daily_demand: number;
  stddev_daily_demand: number;
  safety_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  lead_time_days: number;
  projected_stockout_date_field: string | null;
  producer: any;
  user: number;
  location: number;
}

export interface MarketplaceProduct {
  id: number;
  product: number;
  product_details: ProductDetails;
  discounted_price: number | null;
  listed_price: number;
  percent_off: number;
  savings_amount: number;
  offer_start: string | null;
  offer_end: string | null;
  is_offer_active: boolean | null;
  offer_countdown: string | null;
  estimated_delivery_days: number | null;
}

export interface MarketplaceOrderItem {
  id: number;
  product: MarketplaceProduct;
  quantity: number;
  unit_price: string;
  total_price: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryInfo {
  id: number;
  customer_name: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  delivery_instructions?: string;
}

export interface MarketplaceOrder {
  id: number;
  order_number: string;
  items: MarketplaceOrderItem[];
  delivery: DeliveryInfo;
  total_amount: string;
  payment_status: string;
  payment_status_display: string;
  order_status: string;
  order_status_display: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  estimated_delivery_date?: string;
  tracking_number?: string;
  notes?: string;
}

export interface MarketplaceOrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MarketplaceOrder[];
}

export interface OrderFilters {
  status?: string;
  payment_status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const fetchMarketplaceOrders = async (filters: OrderFilters = {}): Promise<MarketplaceOrdersResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams();
    
    // Add filters to params
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.payment_status && filters.payment_status !== 'all') {
      params.append('payment_status', filters.payment_status);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params.append('date_to', filters.date_to);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await axios.get<MarketplaceOrdersResponse>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/orders/my-orders/`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching marketplace orders:', error);
    throw error;
  }
};

export const fetchMarketplaceOrderById = async (orderId: number): Promise<MarketplaceOrder> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get<MarketplaceOrder>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/orders/${orderId}/`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching marketplace order:', error);
    throw error;
  }
};

export const cancelMarketplaceOrder = async (orderId: number, reason?: string): Promise<MarketplaceOrder> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<MarketplaceOrder>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/orders/${orderId}/cancel/`,
      {
        cancellation_reason: reason,
      },
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error cancelling marketplace order:', error);
    throw error;
  }
};

export const reorderMarketplaceOrder = async (orderId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<{ success: boolean; message: string }>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/orders/${orderId}/reorder/`,
      {},
      {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error reordering marketplace order:', error);
    throw error;
  }
};