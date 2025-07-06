import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/audit-logs/`;

interface AuditLog {
  id: number;
  transactionType: string;
  referenceId: string;
  date: string; // YYYY-MM-DD
  entityId: number;
  amount: string;
}

const getAuthHeaders = () => ({
  headers: { Authorization: `Token ${localStorage.getItem('token')}` },
});

interface AuditLogApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export const fetchAuditLogs = () => axios.get<AuditLogApiResponse>(BASE_URL, getAuthHeaders());
export const addAuditLog = (data: Omit<AuditLog, 'id'>) => axios.post(BASE_URL, data, getAuthHeaders());
export const updateAuditLog = (id: number, data: Omit<AuditLog, 'id'>) => axios.patch(`${BASE_URL}${id}/`, data, getAuthHeaders());
