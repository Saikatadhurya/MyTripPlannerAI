import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './authService';
import { TokenUtils } from './tokenUtils';

// Global logout handler
let globalLogoutHandler: (() => void) | null = null;

export const setGlobalLogoutHandler = (handler: () => void) => {
  globalLogoutHandler = handler;
};

export const triggerGlobalLogout = () => {
  if (globalLogoutHandler) {
    globalLogoutHandler();
  }
};

// Auto logout notification
let logoutNotificationShown = false;

const showLogoutNotification = (message: string) => {
  if (logoutNotificationShown) return;
  logoutNotificationShown = true;
  
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      logoutNotificationShown = false;
    }, 300);
  }, 5000);
};

// Request interceptor to add auth headers and check token validity
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authService.getToken();
    
    if (token) {
      // Check if token is expired before making the request
      if (TokenUtils.isTokenExpired(token)) {
        console.warn('Token is expired, clearing session');
        authService.logout();
        triggerGlobalLogout();
        showLogoutNotification('Your session has expired. Please sign in again.');
        return Promise.reject(new Error('Token expired'));
      }
      
      // Check if token will expire soon and show warning
      if (TokenUtils.willExpireSoon(token, 5)) {
        console.warn('Token will expire soon');
        showLogoutNotification('Your session will expire soon. Please save your work.');
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const errorMessage = (error.response.data as any)?.message || '';
      const errorMessageLower = errorMessage.toLowerCase();
      
      // Only logout for actual authentication/authorization errors
      // Be specific to avoid logging out for quota/rate limit errors
      const isAuthError = 
        errorMessageLower.includes('not authorized') ||
        errorMessageLower.includes('token failed') ||
        errorMessageLower.includes('token expired') ||
        errorMessageLower.includes('token invalid') ||
        errorMessageLower.includes('invalid token') ||
        errorMessageLower.includes('session expired') ||
        errorMessageLower.includes('authentication failed') ||
        errorMessageLower.includes('unauthorized') ||
        (errorMessageLower.includes('token') && (errorMessageLower.includes('expired') || errorMessageLower.includes('invalid'))) ||
        (errorMessageLower.includes('user not found') && errorMessageLower.includes('authorized'));
      
      // Explicitly exclude quota/rate limit errors
      const isQuotaError = 
        errorMessageLower.includes('quota') ||
        errorMessageLower.includes('rate limit') ||
        errorMessageLower.includes('429') ||
        errorMessageLower.includes('billing') ||
        errorMessageLower.includes('exceeded');
      
      if (isAuthError && !isQuotaError) {
        console.warn('Authentication failed, logging out user');
        authService.logout();
        triggerGlobalLogout();
        showLogoutNotification('Your session has expired. Please sign in again.');
        
        return Promise.reject(new Error('Session expired'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Token refresh timer (optional - for future implementation)
let tokenCheckInterval: NodeJS.Timeout | null = null;

export const startTokenMonitoring = () => {
  if (tokenCheckInterval) return;
  
  tokenCheckInterval = setInterval(() => {
    const token = authService.getToken();
    if (token && TokenUtils.isTokenExpired(token)) {
      console.warn('Token expired during monitoring, logging out');
      authService.logout();
      triggerGlobalLogout();
      showLogoutNotification('Your session has expired. Please sign in again.');
      stopTokenMonitoring();
    }
  }, 60000); // Check every minute
};

export const stopTokenMonitoring = () => {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
    tokenCheckInterval = null;
  }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopTokenMonitoring();
});
