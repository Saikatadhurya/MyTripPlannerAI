import axios from 'axios';
import { TokenUtils } from './tokenUtils';
import { startTokenMonitoring, stopTokenMonitoring } from './axiosInterceptor';

const API_URL = 'http://localhost:5000/auth'; // Backend auth API URL

export interface User {
  id: string;
  full_name: string; // Changed from 'name'
  email: string;
  avatar?: string;
  createdAt?: string; // Made optional as it's not always returned on login
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
      
      console.log('AuthService: Loading session from localStorage');
      console.log('AuthService: savedUser:', savedUser);
      console.log('AuthService: savedToken:', savedToken);
      
      if (savedUser && savedToken) {
        // Check if token is expired before loading session
        if (TokenUtils.isTokenExpired(savedToken)) {
          console.warn('AuthService: Saved token is expired, clearing session');
          this.clearSession();
          return;
        }
        
        const parsedUser = JSON.parse(savedUser);
        console.log('AuthService: Parsed user from localStorage:', parsedUser);
        console.log('AuthService: User full_name:', parsedUser.full_name);
        console.log('AuthService: User name (if exists):', parsedUser.name);
        
        // Check if the stored user has the old structure (name instead of full_name)
        if (parsedUser.name && !parsedUser.full_name) {
          console.warn('AuthService: Found user with old structure (name instead of full_name), migrating...');
          parsedUser.full_name = parsedUser.name;
          delete parsedUser.name;
          // Update localStorage with the corrected structure
          localStorage.setItem('planora_user', JSON.stringify(parsedUser));
        }
        
        this.currentUser = parsedUser;
        this.token = savedToken;
        console.log('AuthService: Session loaded successfully:', this.currentUser);
        
        // Start token monitoring for auto logout
        startTokenMonitoring();
      } else {
        console.log('AuthService: No saved session found');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearSession();
    }
  }

  private saveSession(user: User, token: string): void {
    try {
      localStorage.setItem('planora_user', JSON.stringify(user));
      localStorage.setItem('planora_token', token);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem('planora_user');
      localStorage.removeItem('planora_token');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    this.currentUser = null;
    this.token = null;
    
    // Stop token monitoring when session is cleared
    stopTokenMonitoring();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('AuthService: Attempting login for:', credentials.email);
      const response = await axios.post(`${API_URL}/signin`, credentials);
      console.log('AuthService: Login response received');
      
      const { user, token } = response.data;
      
      const authenticatedUser: User = { 
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        createdAt: user.created_at, // Assuming backend returns created_at
      };

      this.currentUser = authenticatedUser;
      this.token = token;
      this.saveSession(authenticatedUser, token);
      console.log('AuthService: Login successful for:', authenticatedUser.email);

      // Start token monitoring for auto logout
      startTokenMonitoring();

      return { user: authenticatedUser, token };
    } catch (error) {
      console.error('AuthService: Login failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('AuthService: API error:', error.response.data);
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during login');
    }
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      console.log('AuthService: Attempting signup for:', credentials.email);
      const response = await axios.post(`${API_URL}/signup`, { 
        full_name: credentials.full_name, 
        email: credentials.email, 
        password: credentials.password 
      });
      console.log('AuthService: Signup response received');
      
      const { user, token } = response.data;

      const newUser: User = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        createdAt: user.created_at,
      };

      this.currentUser = newUser;
      this.token = token;
      this.saveSession(newUser, token);
      console.log('AuthService: Signup successful for:', newUser.email);

      // Start token monitoring for auto logout
      startTokenMonitoring();

      return { user: newUser, token };
    } catch (error) {
      console.error('AuthService: Signup failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('AuthService: API error:', error.response.data);
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
      console.warn('Token is expired, clearing session');
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

  // Social Login Redirects
  loginWithGoogle(): void {
    window.location.href = `${API_URL}/google`;
  }

  // Removed updateProfile, changePassword, and resetPassword for now as they are not part of current backend scope

}

// Export singleton instance
export const authService = new AuthService();
