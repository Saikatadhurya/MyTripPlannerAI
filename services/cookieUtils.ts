// Cookie utilities for managing Gemini API key
export class CookieUtils {
  private static readonly GEMINI_API_KEY_COOKIE = 'gemini_api_key';
  private static readonly COOKIE_EXPIRES_DAYS = 30; // 30 days

  // Set a cookie
  static setCookie(name: string, value: string, days: number = this.COOKIE_EXPIRES_DAYS): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const expiresStr = expires.toUTCString();
    
    // Set cookie with secure flags
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresStr}; path=/; SameSite=Strict; Secure=${window.location.protocol === 'https:'}`;
  }

  // Get a cookie value
  static getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  // Delete a cookie
  static deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure=${window.location.protocol === 'https:'}`;
  }

  // Gemini API key specific methods
  static setGeminiApiKey(apiKey: string): void {
    this.setCookie(this.GEMINI_API_KEY_COOKIE, apiKey);
  }

  static getGeminiApiKey(): string | null {
    return this.getCookie(this.GEMINI_API_KEY_COOKIE);
  }

  static deleteGeminiApiKey(): void {
    this.deleteCookie(this.GEMINI_API_KEY_COOKIE);
  }

  // Check if Gemini API key exists
  static hasGeminiApiKey(): boolean {
    return this.getGeminiApiKey() !== null;
  }
}
