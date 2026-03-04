import axios from 'axios';

// Frontend → backend base URL
// Priority:
// 1) VITE_BACKEND_URL (your local/dev API, e.g. http://localhost:5000)
// 2) VITE_API_URL (optional deployed API)
// 3) Fallback: http://localhost:5000 (matches backend/.env PORT=5000)
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
