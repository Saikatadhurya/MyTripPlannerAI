// Token validation utilities
export interface TokenPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export class TokenUtils {
  /**
   * Decode JWT token without verification (for client-side checks)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTimeUntilExpiry(token: string): number {
    const payload = this.decodeToken(token);
    if (!payload) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  }

  /**
   * Check if token will expire within given minutes
   */
  static willExpireSoon(token: string, minutesThreshold: number = 5): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry(token);
    return timeUntilExpiry < (minutesThreshold * 60);
  }
}
