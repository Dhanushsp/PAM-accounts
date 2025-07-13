// Configuration for the app
export const config = {
  API_BASE_URL: process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in',
  APP_NAME: 'PAM Accounts',
  VERSION: '1.0.0',
};

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  PRODUCTS: '/api/products',
  CUSTOMERS: '/api/customers',
  SALES: '/api/sales',
}; 