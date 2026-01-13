import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const reportsApi = {
  getWeeklyDigests: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/reports/weekly-digests/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  getRFMSegments: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/reports/rfm-segments/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  getLostSales: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/reports/lost-sales/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  getCommandPalette: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/reports/palette/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/reports/system-health/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },
};
