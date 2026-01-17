import axios from 'axios';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

export type NotificationType = 
  | 'order' 
  | 'negotiation' 
  | 'inventory' 
  | 'loyalty' 
  | 'delivery' 
  | 'payment' 
  | 'system';

export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  is_read: boolean;
  created_at: string;
  data?: {
    action_url?: string;
    related_id?: number;
    metadata?: Record<string, any>;
  };
}

export interface NotificationResponse {
  results: Notification[];
  count: number;
  next?: string;
  previous?: string;
}

export const fetchNotifications = async (
  token: string,
  limit: number = 50,
  offset: number = 0
): Promise<Notification[] | NotificationResponse> => {
  const response = await axios.get<Notification[] | NotificationResponse>(
    `${API_URL}/api/v1/notifications/`,
    {
      headers: { Authorization: `Token ${token}` },
      params: { limit, offset },
    }
  );
  return response.data;
};

export const fetchNotificationsByType = async (
  token: string,
  type: NotificationType,
  limit: number = 50,
  offset: number = 0
): Promise<NotificationResponse> => {
  const response = await axios.get<NotificationResponse>(
    `${API_URL}/api/v1/notifications/`,
    {
      headers: { Authorization: `Token ${token}` },
      params: { type, limit, offset },
    }
  );
  return response.data;
};

export const markNotificationAsRead = async (
  token: string,
  notificationId: number
): Promise<Notification> => {
  const response = await axios.patch<Notification>(
    `${API_URL}/api/v1/notifications/${notificationId}/`,
    { is_read: true },
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const markAllNotificationsAsRead = async (
  token: string
): Promise<{ success: boolean }> => {
  const response = await axios.post<{ success: boolean }>(
    `${API_URL}/api/v1/notifications/mark-all-read/`,
    {},
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const deleteNotification = async (
  token: string,
  notificationId: number
): Promise<{ success: boolean }> => {
  const response = await axios.delete<{ success: boolean }>(
    `${API_URL}/api/v1/notifications/${notificationId}/`,
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const getNotificationPreferences = async (token: string) => {
  const response = await axios.get(
    `${API_URL}/api/v1/notification-preferences/`,
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const updateNotificationPreferences = async (
  token: string,
  preferences: Record<string, boolean>
) => {
  const response = await axios.patch(
    `${API_URL}/api/v1/notification-preferences/`,
    preferences,
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    order: '📦',
    negotiation: '🤝',
    inventory: '📊',
    loyalty: '⭐',
    delivery: '🚚',
    payment: '💳',
    system: '⚙️',
  };
  return icons[type] || '🔔';
};

export const getNotificationColor = (severity: NotificationSeverity) => {
  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      badge: 'bg-green-100 text-green-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-700',
    },
  };
  return colors[severity];
};
