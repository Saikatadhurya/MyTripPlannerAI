import axios from 'axios';
import { getBackendUrl, isCapacitor } from '../utils/capacitorUtils';

// Determine API URL based on environment
const getApiUrl = () => {
  const backendUrl = getBackendUrl();
  
  // If in Capacitor (mobile app), use full production URL
  if (isCapacitor()) {
    return `${backendUrl}/api/history`;
  }
  
  // Check if we're in production (web deployment)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // In production web, API is on the same domain
    return '/api/history';
  }
  
  // Development fallback
  return backendUrl.endsWith('/api/history') ? backendUrl : `${backendUrl}/api/history`;
};

const API_URL = getApiUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export { api };
