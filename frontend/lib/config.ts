// Configuration for API endpoints
export const API_BASE_URL = 'https://api.pamacc.dhanushdev.in';

// Platform-specific configurations
export const config = {
  apiUrl: API_BASE_URL,
  timeout: 10000, // 10 seconds
};

// Configure axios defaults
import axios from 'axios';

axios.defaults.timeout = config.timeout;
axios.defaults.headers.common['Content-Type'] = 'application/json'; 