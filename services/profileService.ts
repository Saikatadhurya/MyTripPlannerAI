import { User } from './authService';

export interface ProfileUpdateData {
  full_name?: string;
  email?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

class ProfileService {
  private baseUrl = '/api/profile';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('planora_token');
  }

  private getHeaders(): HeadersInit {
    // Refresh token from localStorage in case it was updated
    this.token = localStorage.getItem('planora_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Only clear session if the error message indicates token issues
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || '';
        
        if (errorMessage.includes('token') || errorMessage.includes('authorized') || errorMessage.includes('expired')) {
          localStorage.removeItem('planora_token');
          localStorage.removeItem('planora_user');
          throw new Error('Session expired. Please sign in again.');
        } else {
          // Don't clear session for other 401 errors (like wrong password)
          throw new Error(errorMessage || 'Authentication failed');
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Check if user is authenticated
  private isAuthenticated(): boolean {
    const token = localStorage.getItem('planora_token');
    return !!token;
  }

  // Get user profile
  async getProfile(): Promise<ProfileResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please sign in to access your profile.');
    }

    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<ProfileResponse>(response);
  }

  // Update profile information
  async updateProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please sign in to update your profile.');
    }

    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<ProfileResponse>(response);
  }

  // Change password
  async changePassword(data: PasswordChangeData): Promise<ProfileResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please sign in to change your password.');
    }

    const response = await fetch(`${this.baseUrl}/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<ProfileResponse>(response);
  }

  // Get social accounts
  async getSocialAccounts(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/social-accounts`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Check if user has Google account linked
  async hasGoogleAccount(): Promise<boolean> {
    try {
      const resp = await this.getSocialAccounts();
      const list = Array.isArray(resp)
        ? resp
        : (resp as any)?.data?.social_accounts ?? (resp as any)?.data ?? [];
      if (!Array.isArray(list)) return false;
      return list.some((account: any) => account?.provider === 'google');
    } catch (error) {
      return false;
    }
  }

  // Initiate Google OAuth linking
  initiateGoogleLinking(): void {
    // Get current user ID from localStorage
    const userStr = localStorage.getItem('planora_user');
    let userId = null;
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (error) {
        // Error parsing user data
      }
    }
    
    if (!userId) {
      throw new Error('User not found. Please sign in to link your Google account.');
    }
    
    // Redirect to Google OAuth with returnUrl and state parameters
    const currentUrl = window.location.href;
    const state = encodeURIComponent(JSON.stringify({ userId }));
    const linkingUrl = `${process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://localhost:5000'}/auth/google/link?returnUrl=${encodeURIComponent(currentUrl)}&state=${state}`;
    window.location.href = linkingUrl;
  }

  // Connect social account
  async connectSocialAccount(provider: string, providerId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/social-accounts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ provider, provider_id: providerId }),
    });

    return this.handleResponse(response);
  }

  // Disconnect social account
  async disconnectSocialAccount(provider: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/social-accounts/${provider}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Delete account
  async deleteAccount(password: string): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ password }),
    });

    return this.handleResponse(response);
  }

  // Update token (useful when token is refreshed)
  updateToken(newToken: string): void {
    this.token = newToken;
  }

  // Clear token
  clearToken(): void {
    this.token = null;
  }
}

export default new ProfileService();
