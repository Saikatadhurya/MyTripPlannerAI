export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
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
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Mock user data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    createdAt: new Date().toISOString(),
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor() {
    // Check for existing session on initialization
    this.loadSession();
  }

  private loadSession(): void {
    try {
      const savedUser = localStorage.getItem('planora_user');
      const savedToken = localStorage.getItem('planora_token');
      
      if (savedUser && savedToken) {
        this.currentUser = JSON.parse(savedUser);
        this.token = savedToken;
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
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(1000); // Simulate API call

    // Validate credentials
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Check if user exists (mock validation)
    const existingUser = mockUsers.find(user => user.email === credentials.email);
    
    if (!existingUser) {
      throw new Error('Invalid email or password');
    }

    // In a real app, you would validate the password here
    if (credentials.password.length < 6) {
      throw new Error('Invalid email or password');
    }

    // Generate mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save session
    this.currentUser = existingUser;
    this.token = token;
    this.saveSession(existingUser, token);

    return {
      user: existingUser,
      token
    };
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    await delay(1000); // Simulate API call

    // Validate credentials
    if (!credentials.name || !credentials.email || !credentials.password) {
      throw new Error('All fields are required');
    }

    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if email already exists
    const existingUser = mockUsers.find(user => user.email === credentials.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      name: credentials.name,
      email: credentials.email,
      createdAt: new Date().toISOString(),
    };

    // Add to mock database
    mockUsers.push(newUser);

    // Generate mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save session
    this.currentUser = newUser;
    this.token = token;
    this.saveSession(newUser, token);

    return {
      user: newUser,
      token
    };
  }

  logout(): void {
    this.clearSession();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }

  // Method to update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    await delay(500); // Simulate API call

    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    // Update user data
    const updatedUser = { ...this.currentUser, ...updates };
    
    // Update in mock database
    const userIndex = mockUsers.findIndex(user => user.id === this.currentUser!.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser;
    }

    // Update current user and save to session
    this.currentUser = updatedUser;
    this.saveSession(updatedUser, this.token!);

    return updatedUser;
  }

  // Method to change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await delay(1000); // Simulate API call

    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // In a real app, you would validate the current password here
    if (currentPassword.length < 6) {
      throw new Error('Current password is incorrect');
    }

    // Password changed successfully
    // In a real app, you would update the password in the database
  }

  // Method to reset password (forgot password)
  async resetPassword(email: string): Promise<void> {
    await delay(1000); // Simulate API call

    const user = mockUsers.find(user => user.email === email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    // In a real app, you would send a password reset email here
    console.log(`Password reset email would be sent to ${email}`);
  }
}

// Export singleton instance
export const authService = new AuthService();
