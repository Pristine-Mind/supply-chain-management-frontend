import axios from 'axios';

export interface ProductDetails {
  id: number;
  images: string[];
  category_details: string;
  name: string;
  category: string;
  description: string;
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
  producer: number;
  user: number;
  location: string | null;
}

export interface PurchaseOrder {
  id: number;
  product_details: ProductDetails;
  quantity: number;
  created_at: string;
  approved: boolean;
  sent_to_vendor: boolean;
  product: number;
  user: number;
}

export interface PurchaseOrderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PurchaseOrder[];
}

export async function fetchPurchaseOrders(token: string, limit = 10, offset = 0): Promise<PurchaseOrderResponse> {
  const response = await axios.get<PurchaseOrderResponse>(
    `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/purchase-orders/?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return response.data;
}
