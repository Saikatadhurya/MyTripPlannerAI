/**
 * Utility functions for Capacitor/mobile environment detection
 */

/**
 * Check if the app is running in a Capacitor environment (mobile app)
 */
export const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor;
};

/**
 * Check if the app is running on Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as any).Capacitor;
  return capacitor?.getPlatform() === 'android';
};

/**
 * Get the production backend URL
 * This should be set in your .env.production file as VITE_BACKEND_URL
 */
export const getBackendUrl = (): string => {
  // In Capacitor/mobile app, always use production backend
  if (isCapacitor()) {
    // Use import.meta.env for Vite environment variables
    return (import.meta.env.VITE_BACKEND_URL as string) || 'https://www.planmytripai.in';
  }
  
  // In web browser, check if production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Same domain in production (web)
      return '';
    }
  }
  
  // Development fallback
  return (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
};


