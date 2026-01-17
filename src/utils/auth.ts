import axios from 'axios';
import { toast } from 'react-toastify';

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getUserData = (): any => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast('Unauthorized request');
    }
    return Promise.reject(error);
  }
);
