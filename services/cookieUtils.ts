// Cookie utilities for managing Gemini API key
import { encryptString, decryptString } from './clientCrypto';

export class CookieUtils {
  private static readonly GEMINI_API_KEY_COOKIE = 'gemini_api_key';
  private static readonly DEFAULT_API_KEY_STORAGE_KEY = 'default_gemini_api_key_encrypted';
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
  // NOTE: These methods are ONLY for user's own API key (stored in cookies)
  // The default key from env.GEMINI_API_KEY is stored in sessionStorage, NOT cookies
  static setGeminiApiKey(apiKey: string): void {
    // This is for USER's own key only, not the default key
    this.setCookie(this.GEMINI_API_KEY_COOKIE, apiKey);
    // Ensure the shared default key is never used once the user sets their own
    this.deleteDefaultApiKey();
  }

  static getGeminiApiKey(): string | null {
    // This gets USER's own key from cookie, not the default key
    return this.getCookie(this.GEMINI_API_KEY_COOKIE);
  }

  static deleteGeminiApiKey(): void {
    this.deleteCookie(this.GEMINI_API_KEY_COOKIE);
  }

  // Check if Gemini API key exists
  static hasGeminiApiKey(): boolean {
    return this.getGeminiApiKey() !== null;
  }

  // Delete the encrypted default API key from sessionStorage
  static deleteDefaultApiKey(): void {
    try {
      sessionStorage.removeItem(this.DEFAULT_API_KEY_STORAGE_KEY);
    } catch (error) {
      // Failed to delete default API key
    }
  }

  // Re-initialize the encrypted default API key (public method for login/signup)
  // This will encrypt and store the default key from .env if available
  static async reinitializeDefaultKey(): Promise<void> {
    // Delete existing default key first to force re-initialization
    this.deleteDefaultApiKey();
    // Then initialize it again
    await this.initializeDefaultKey();
  }

  // Initialize and encrypt default API key if available
  // IMPORTANT: Default key is stored in sessionStorage, NOT in cookies
  private static async initializeDefaultKey(): Promise<void> {
    // Check if we already have encrypted default key stored
    try {
      const existingEncrypted = sessionStorage.getItem(this.DEFAULT_API_KEY_STORAGE_KEY);
      if (existingEncrypted) {
        return; // Already initialized
      }
    } catch (error) {
      // sessionStorage might not be available (e.g., in incognito mode with restrictions)
    }

    // Get default key from env (only available at build time)
    // NOTE: This is the default key from .env file (GEMINI_API_KEY)
    // It is stored in sessionStorage only, NEVER in cookies
    const defaultKey = process.env.GEMINI_API_KEY;
    if (defaultKey && defaultKey.trim().length > 0) {
      // Encrypt and store the default key in sessionStorage (NOT cookies)
      const encrypted = await encryptString(defaultKey);
      if (encrypted) {
        try {
          // Store in sessionStorage - default key is NEVER stored in cookies
          sessionStorage.setItem(this.DEFAULT_API_KEY_STORAGE_KEY, encrypted);
        } catch (error) {
          // Failed to store default API key
        }
      }
    }
  }

  // Get decrypted default API key from encrypted sessionStorage
  private static async getDecryptedDefaultKey(): Promise<string | null> {
    try {
      const encryptedDefault = sessionStorage.getItem(this.DEFAULT_API_KEY_STORAGE_KEY);
      if (!encryptedDefault) {
        return null;
      }

      try {
        const decrypted = await decryptString(encryptedDefault);
        return decrypted && decrypted.trim().length > 0 ? decrypted : null;
      } catch (error) {
        return null;
      }
    } catch (error) {
      // sessionStorage might not be available
      return null;
    }
  }

  // Get API key with priority: user's own key > encrypted default key
  // If user has set their own key (from profile or cookie), use it
  // If user deleted their key or hasn't set one, fall back to encrypted default key
  // Returns both the API key and whether we're using the default key
  static async getApiKeyWithSource(userApiKey?: string): Promise<{ apiKey: string; isUsingDefaultKey: boolean }> {
    // Initialize encrypted default key if needed (only happens once)
    await this.initializeDefaultKey();

    // Priority: user's own key (from profile or cookie) > encrypted default key (fallback)
    
    // Step 1: Check if userApiKey from profile is provided and not empty (user has set their own key)
    // Also validate it's not a placeholder like "SET" or obviously invalid
    if (userApiKey && userApiKey.trim().length > 0) {
      const trimmedKey = userApiKey.trim();
      // Reject placeholder values or obviously invalid keys (API keys are typically 39+ characters)
      if (trimmedKey === 'SET' || trimmedKey.length < 10) {
        // Fall through to check cookie/default key
      } else {
        this.deleteDefaultApiKey();
        return { apiKey: trimmedKey, isUsingDefaultKey: false };
      }
    }
    
    // Step 2: Check user's cookie key (user has set their own key in browser)
    const cookieKey = this.getGeminiApiKey();
    if (cookieKey && cookieKey.trim().length > 0) {
      const trimmedKey = cookieKey.trim();
      if (trimmedKey.length >= 10 && trimmedKey !== 'SET') {
        this.deleteDefaultApiKey();
        return { apiKey: trimmedKey, isUsingDefaultKey: false };
      }
    }
    
    // Step 3: Fall back to encrypted default key (user hasn't set their own key or deleted it)
    const decryptedDefaultKey = await this.getDecryptedDefaultKey();
    if (decryptedDefaultKey && decryptedDefaultKey.trim().length > 0) {
      const trimmedKey = decryptedDefaultKey.trim();
      return { apiKey: trimmedKey, isUsingDefaultKey: true };
    }
    
    throw new Error("Gemini key not set. Please provide your Gemini API key in your profile settings.");
  }
}
