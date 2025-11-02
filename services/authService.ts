import axios from 'axios';
import { TokenUtils } from './tokenUtils';
import { startTokenMonitoring, stopTokenMonitoring } from './axiosInterceptor';
import { CookieUtils } from './cookieUtils';
import { getBackendUrl, isCapacitor } from '../utils/capacitorUtils';

// Determine API URL based on environment
const getApiUrl = () => {
  const backendUrl = getBackendUrl();
  
  // If in Capacitor (mobile app), use full production URL
  if (isCapacitor()) {
    return `${backendUrl}/auth`;
  }
  
  // Check if we're in production (web deployment)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // In production web, API is on the same domain
    return '/auth';
  }
  
  // Development fallback
  return backendUrl.endsWith('/auth') ? backendUrl : `${backendUrl}/auth`;
};

const API_URL = getApiUrl();

export interface User {
  id: string;
  full_name: string; // Changed from 'name'
  email: string;
  avatar?: string;
  createdAt?: string; // Made optional as it's not always returned on login
  gemini_api_key?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SignupResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  full_name: string; // Changed from 'name'
  email: string;
  password: string;
  confirmPassword?: string; // Made optional as backend signup doesn't require it
}

// Removed mockUsers and delay constant

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    try {
      const savedUser = localStorage.getItem('planora_user');
      const savedToken = localStorage.getItem('planora_token');
      
      if (savedUser && savedToken) {
        // Check if token is expired before loading session
        if (TokenUtils.isTokenExpired(savedToken)) {
          this.clearSession();
          return;
        }
        
        const parsedUser = JSON.parse(savedUser);
        
        // Check if the stored user has the old structure (name instead of full_name)
        if (parsedUser.name && !parsedUser.full_name) {
          parsedUser.full_name = parsedUser.name;
          delete parsedUser.name;
          // Update localStorage with the corrected structure
          localStorage.setItem('planora_user', JSON.stringify(parsedUser));
        }
        
        // Load Gemini API key from cookie if it exists
        const geminiApiKey = CookieUtils.getGeminiApiKey();
        if (geminiApiKey) {
          parsedUser.gemini_api_key = geminiApiKey;
        }
        
        this.currentUser = parsedUser;
        this.token = savedToken;
        
        // Start token monitoring for auto logout
        startTokenMonitoring();
      }
    } catch (error) {
      this.clearSession();
    }
  }

  private saveSession(user: User, token: string): void {
    try {
      localStorage.setItem('planora_user', JSON.stringify(user));
      localStorage.setItem('planora_token', token);
    } catch (error) {
      // Error saving session
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem('planora_user');
      localStorage.removeItem('planora_token');
      // Clear user's Gemini API key cookie
      CookieUtils.deleteGeminiApiKey();
      // Clear encrypted default API key from sessionStorage (will be re-initialized on next login)
      CookieUtils.deleteDefaultApiKey();
    } catch (error) {
      // Error clearing session
    }
    this.currentUser = null;
    this.token = null;
    
    // Stop token monitoring when session is cleared
    stopTokenMonitoring();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Log for debugging (will be stripped in production builds)
      if (process.env.NODE_ENV === 'development') {
        console.log('Login attempt to:', `${API_URL}/signin`);
      }
      
      const response = await axios.post(`${API_URL}/signin`, credentials, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const { user, token } = response.data;
      
      const authenticatedUser: User = { 
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        createdAt: user.created_at, // Assuming backend returns created_at
        gemini_api_key: user.gemini_api_key, // Include Gemini API key from backend
      };

      this.currentUser = authenticatedUser;
      this.token = token;
      this.saveSession(authenticatedUser, token);

      // Handle Gemini API key cookie
      if (user.gemini_api_key) {
        CookieUtils.setGeminiApiKey(user.gemini_api_key);
      }

      // Re-initialize default API key (will be encrypted and stored if available)
      // This happens asynchronously but won't block login
      CookieUtils.reinitializeDefaultKey().catch(() => {
        // Silently fail - default key initialization is optional
      });

      // Start token monitoring for auto logout
      startTokenMonitoring();

      return { user: authenticatedUser, token };
    } catch (error) {
      // Enhanced error handling with better messages
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || 'Login failed';
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received (network error)
          console.error('Network error during login:', error.message);
          throw new Error('Network error: Unable to reach the server. Please check your internet connection and try again.');
        } else {
          // Error setting up the request
          console.error('Request setup error during login:', error.message);
          throw new Error('Failed to send login request. Please try again.');
        }
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during login');
    }
  }

  async signup(credentials: SignupCredentials): Promise<SignupResponse> {
    try {
      // Log for debugging (will be stripped in production builds)
      if (process.env.NODE_ENV === 'development') {
        console.log('Signup attempt to:', `${API_URL}/signup`);
      }
      
      const response = await axios.post(`${API_URL}/signup`, { 
        full_name: credentials.full_name, 
        email: credentials.email, 
        password: credentials.password 
      }, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return {
        message: response.data.message,
        email: response.data.email,
        requiresVerification: response.data.requiresVerification
      };
    } catch (error) {
      // Enhanced error handling with better messages
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || 'Signup failed';
          throw new Error(message);
        } else if (error.request) {
          // Request was made but no response received (network error)
          console.error('Network error during signup:', error.message);
          throw new Error('Network error: Unable to reach the server. Please check your internet connection and try again.');
        } else {
          // Error setting up the request
          console.error('Request setup error during signup:', error.message);
          throw new Error('Failed to send signup request. Please try again.');
        }
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during signup');
    }
  }

  async verifyOTP(email: string, otpCode: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otpCode
      }, {
        timeout: 30000, // 30 seconds for mobile networks
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const { user, token } = response.data;

      const verifiedUser: User = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        createdAt: user.created_at,
        gemini_api_key: user.gemini_api_key,
      };

      this.currentUser = verifiedUser;
      this.token = token;
      this.saveSession(verifiedUser, token);

      // Handle Gemini API key cookie
      if (user.gemini_api_key) {
        CookieUtils.setGeminiApiKey(user.gemini_api_key);
      }

      // Re-initialize default API key
      CookieUtils.reinitializeDefaultKey().catch(() => {
        // Silently fail - default key initialization is optional
      });

      // Start token monitoring for auto logout
      startTokenMonitoring();

      return { user: verifiedUser, token };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'OTP verification failed');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during OTP verification');
    }
  }

  async resendOTP(email: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/resend-otp`, { email }, {
        timeout: 30000, // 30 seconds for mobile networks
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to resend OTP');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred while resending OTP');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      // Debug logging for network issues
      if (process.env.NODE_ENV === 'development' || isCapacitor()) {
        console.log('Forgot Password API URL:', `${API_URL}/forgot-password`);
      }
      
      await axios.post(`${API_URL}/forgot-password`, { email }, {
        timeout: 30000, // 30 seconds for mobile networks
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to send password reset OTP');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred while requesting password reset');
    }
  }

  async verifyResetOTP(email: string, otpCode: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/verify-reset-otp`, {
        email,
        otpCode
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'OTP verification failed');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during OTP verification');
    }
  }

  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/reset-password`, {
        email,
        otpCode,
        newPassword
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to reset password');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred while resetting password');
    }
  }

  logout(): void {
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    if (!this.currentUser || !this.token) {
      return false;
    }
    
    // Check if token is expired
    if (TokenUtils.isTokenExpired(this.token)) {
      this.clearSession();
      return false;
    }
    
    return true;
  }

  getToken(): string | null {
    return this.token;
  }

  getAuthHeaders(): { Authorization: string } | {} {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // Update current user data (for profile updates)
  updateCurrentUser(updatedUser: User): void {
    this.currentUser = updatedUser;
    // Update localStorage with new user data
    localStorage.setItem('planora_user', JSON.stringify(updatedUser));
    
    // Handle Gemini API key cookie
    if (updatedUser.gemini_api_key) {
      CookieUtils.setGeminiApiKey(updatedUser.gemini_api_key);
    } else {
      CookieUtils.deleteGeminiApiKey();
    }
  }

  // Social Login Redirects
  loginWithGoogle(): void {
    window.location.href = `${API_URL}/google`;
  }

  // Removed updateProfile, changePassword, and resetPassword for now as they are not part of current backend scope

}

// Export singleton instance
export const authService = new AuthService();
