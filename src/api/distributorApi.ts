import axios from 'axios';

const getToken = () => localStorage.getItem('token');

export interface DistributorProductInsight {
  id: number;
  name: string;
  views: number;
  bids: number;
  total_sold: number;
  avg_rating: number;
}

export interface DistributorProfileResponse {
  products: DistributorProductInsight[];
  orders_count: number;
}

export const getDistributorProfile = async (): Promise<DistributorProfileResponse> => {
  const token = getToken();
  if (!token) throw new Error('Auth token missing');
  const res = await axios.get<DistributorProfileResponse>(
    `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/distributor/profile/`,
    { headers: { Authorization: `Token ${token}` } }
  );
  return res.data;
};

export interface DistributorOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DistributorOrder {
  id: number;
  order_number: string;
  customer: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  seller_items: DistributorOrderItem[];
  total_amount: number;
}

export const listDistributorOrders = async (): Promise<DistributorOrder[]> => {
  const token = getToken();
  if (!token) throw new Error('Auth token missing');
  const res = await axios.get<DistributorOrder[]>(
    `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/distributor/orders/`,
    { headers: { Authorization: `Token ${token}` } }
  );
  return res.data;
};

// Fetch invoice PDF (returns Blob) or throws on error
export const fetchDistributorOrderInvoice = async (orderId: number): Promise<Blob | { message: string }> => {
  const token = getToken();
  if (!token) throw new Error('Auth token missing');

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/distributor/orders/${orderId}/invoice/`,
      {
        headers: { Authorization: `Token ${token}`, Accept: 'application/pdf' },
        responseType: 'blob',
      }
    );

    // If server responded with JSON (e.g., message) it will still be a blob; try to parse
    const contentType = res.headers['content-type'] || '';
    if (contentType.includes('application/pdf')) {
      return res.data as Blob;
    }

    // Try to decode JSON message from blob
    const text = await new Response(res.data).text();
    try {
      const json = JSON.parse(text);
      return json as { message: string };
    } catch (e) {
      throw new Error('Unexpected response when fetching invoice');
    }
  } catch (err: any) {
    if (err.response && err.response.data) {
      // Try to extract json
      try {
        const text = await new Response(err.response.data).text();
        const json = JSON.parse(text);
        throw new Error(json.error || json.message || 'Failed to fetch invoice');
      } catch (e) {
        throw new Error('Failed to fetch invoice');
      }
    }
    throw err;
  }
};
