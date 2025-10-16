import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - auth context will handle redirect
      console.log('Authentication error - token may have expired');
    }
    return Promise.reject(error);
  }
);

export default api;
