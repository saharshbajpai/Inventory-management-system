import axios from 'axios';

// Vite environment variables are prefixed with VITE_
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error response interceptor to extract cleaner backend messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns structured error payload, let's return it as the error object
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
