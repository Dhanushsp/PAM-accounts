import axios from 'axios';
import { API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Add auth token if available
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = token;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Request timeout:', error.config?.url);
      // You can show a user-friendly error message here
      return Promise.reject(new Error('Request timed out. Please check your internet connection and try again.'));
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      try {
        await AsyncStorage.removeItem('token');
        // In React Native, you would navigate to login screen instead of window.location
        console.log('Token removed due to 401 error');
      } catch (storageError) {
        console.error('Error removing token:', storageError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 