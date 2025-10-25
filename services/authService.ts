import axios from 'axios';
import { TokenUtils } from './tokenUtils';
import { startTokenMonitoring, stopTokenMonitoring } from './axiosInterceptor';
import { CookieUtils } from './cookieUtils';

const API_URL = process.env.REACT_APP_API_URL || process.env.VITE_API_URL; // Backend auth API URL

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
      // Clear Gemini API key cookie
      CookieUtils.deleteGeminiApiKey();
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
      const response = await axios.post(`${API_URL}/signin`, credentials);
      
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

      // Start token monitoring for auto logout
      startTokenMonitoring();

      return { user: authenticatedUser, token };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during login');
    }
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/signup`, { 
        full_name: credentials.full_name, 
        email: credentials.email, 
        password: credentials.password 
      });
      
      const { user, token } = response.data;

      const newUser: User = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        createdAt: user.created_at,
        gemini_api_key: user.gemini_api_key, // Include Gemini API key from backend
      };

      this.currentUser = newUser;
      this.token = token;
      this.saveSession(newUser, token);

      // Handle Gemini API key cookie
      if (user.gemini_api_key) {
        CookieUtils.setGeminiApiKey(user.gemini_api_key);
      }

      // Start token monitoring for auto logout
      startTokenMonitoring();

      return { user: newUser, token };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Signup failed');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during signup');
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
