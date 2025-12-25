import axios from 'axios';

const API_BASE = import.meta.env.VITE_REACT_APP_API_URL;

export interface SellerChatMessage {
  id: number;
  sender: number;
  target_user: number | null;
  message: string;
  created_at: string;
}

export const listSellerChats = async (
  direction: 'inbox' | 'sent' = 'inbox',
  page = 1,
  page_size = 20,
  extraParams?: Record<string, any>
) => {
  const params = { direction, page, page_size, ...(extraParams || {}) };
  const res = await axios.get(`${API_BASE}/api/v1/seller-chats/`, {
    headers: { Authorization: `Token ${localStorage.getItem('token')}` },
    params,
  });
  return res.data;
};

export const sendSellerChat = async (targetUserId: number, message: string) => {
  const res = await axios.post(
    `${API_BASE}/api/v1/seller-chats/`,
    { target_user: targetUserId, message },
    { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
  );
  return res.data;
};

export const sendProductChat = async (userId: number, productId: number, message: string) => {
  const res = await axios.post(
    `${API_BASE}/api/v1/b2b-verified-users-products/${userId}/products/${productId}/chat/`,
    { message },
    { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
  );
  return res.data;
};

export const getSellerConversation = async (userId: number) => {
  const pageSize = 50;
  let page = 1;
  const allResults: any[] = [];
  
  while (true) {
    const res = await axios.get(`${API_BASE}/api/v1/seller-chats/`, {
      headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      params: { user_id: userId, page, page_size: pageSize },
    });
    
    const data = res.data;
    const pageResults = data.results || data || [];
    allResults.push(...pageResults);
    
    if (!data.next || (Array.isArray(pageResults) && pageResults.length === 0)) {
      break;
    }
    page += 1;
  }
  
  return { results: allResults, count: allResults.length };
};

export const sendSellerMessage = async (targetUserId: number, message: string, subject?: string) => {
  const response = await axios.post(
    `${API_BASE}/api/v1/seller-chats/`,
    {
      target_user: targetUserId,
      message,
      subject: subject || '',
    },
    { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
  );
  return response.data;
};

export default {
  listSellerChats,
  sendSellerChat,
  sendProductChat,
};
