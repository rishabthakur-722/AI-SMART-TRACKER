import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from './baseUrl';

const getStoredToken = () => localStorage.getItem('stockiq_token');
const clearStoredToken = () => localStorage.removeItem('stockiq_token');

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const isTimeout = error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout');
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED';
    const message = isTimeout
      ? 'The API took too long to respond. Please try again.'
      : isNetworkError
        ? 'Unable to reach the StockIQ API. Check the deployed backend URL, CORS settings, and server status.'
        : error.response?.data?.message || error.message || 'Something went wrong';

    if (error.response?.status === 401) {
      clearStoredToken();
      window.dispatchEvent(new CustomEvent('stockiq:auth-expired'));
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
