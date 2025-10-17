// Test utility for auto logout functionality
// This file can be used to test the auto logout feature

import { TokenUtils } from './tokenUtils';
import { authService } from './authService';

export class AutoLogoutTester {
  /**
   * Test token expiration detection
   */
  static testTokenExpiration() {
    console.log('=== Testing Token Expiration Detection ===');
    
    // Create a mock expired token (expired 1 hour ago)
    const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const mockExpiredToken = this.createMockToken(expiredTime);
    
    console.log('Testing expired token:', mockExpiredToken);
    console.log('Is expired:', TokenUtils.isTokenExpired(mockExpiredToken));
    console.log('Time until expiry:', TokenUtils.getTimeUntilExpiry(mockExpiredToken));
    console.log('Will expire soon:', TokenUtils.willExpireSoon(mockExpiredToken));
    
    // Create a mock valid token (expires in 30 minutes)
    const validTime = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
    const mockValidToken = this.createMockToken(validTime);
    
    console.log('\nTesting valid token:', mockValidToken);
    console.log('Is expired:', TokenUtils.isTokenExpired(mockValidToken));
    console.log('Time until expiry:', TokenUtils.getTimeUntilExpiry(mockValidToken));
    console.log('Will expire soon:', TokenUtils.willExpireSoon(mockValidToken));
    
    // Create a mock token that expires soon (in 2 minutes)
    const soonExpiredTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
    const mockSoonExpiredToken = this.createMockToken(soonExpiredTime);
    
    console.log('\nTesting soon-to-expire token:', mockSoonExpiredToken);
    console.log('Is expired:', TokenUtils.isTokenExpired(mockSoonExpiredToken));
    console.log('Time until expiry:', TokenUtils.getTimeUntilExpiry(mockSoonExpiredToken));
    console.log('Will expire soon:', TokenUtils.willExpireSoon(mockSoonExpiredToken));
  }

  /**
   * Test authentication state
   */
  static testAuthenticationState() {
    console.log('=== Testing Authentication State ===');
    
    console.log('Current user:', authService.getCurrentUser());
    console.log('Is authenticated:', authService.isAuthenticated());
    console.log('Current token:', authService.getToken());
  }

  /**
   * Simulate token expiration scenario
   */
  static simulateTokenExpiration() {
    console.log('=== Simulating Token Expiration ===');
    
    // Get current token
    const currentToken = authService.getToken();
    if (!currentToken) {
      console.log('No current token found. Please log in first.');
      return;
    }
    
    // Check if token is expired
    if (TokenUtils.isTokenExpired(currentToken)) {
      console.log('Current token is already expired!');
      console.log('Authentication status:', authService.isAuthenticated());
    } else {
      console.log('Current token is valid');
      console.log('Time until expiry:', TokenUtils.getTimeUntilExpiry(currentToken), 'seconds');
      console.log('Will expire soon:', TokenUtils.willExpireSoon(currentToken));
    }
  }

  /**
   * Create a mock JWT token for testing
   */
  private static createMockToken(exp: number): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const payload = {
      id: 'test-user-id',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: exp
    };
    
    // Simple base64 encoding (not secure, just for testing)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Run all tests
   */
  static runAllTests() {
    console.log('🧪 Running Auto Logout Tests...\n');
    
    this.testTokenExpiration();
    console.log('\n');
    
    this.testAuthenticationState();
    console.log('\n');
    
    this.simulateTokenExpiration();
    
    console.log('\n✅ All tests completed!');
  }
}

// Make it available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).AutoLogoutTester = AutoLogoutTester;
}
