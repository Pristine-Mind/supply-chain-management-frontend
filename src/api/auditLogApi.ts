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

export async function fetchAuditLogs(token: string) {
  const response = await axios.get(`${BASE_URL}`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response;
}

export async function addAuditLog(data: Omit<AuditLog, 'id'>, token: string) {
  const response = await axios.post(`${BASE_URL}`, data, {
    headers: { Authorization: `Token ${token}` },
  });
  return response;
}

export async function updateAuditLog(id: number, data: Omit<AuditLog, 'id'>, token: string) {
  const response = await axios.patch(`${BASE_URL}${id}/`, data, {
    headers: { Authorization: `Token ${token}` },
  });
  return response;
}
