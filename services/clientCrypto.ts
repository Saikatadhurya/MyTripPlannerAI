// Client-side encryption utility for storing default API key securely
// Uses Web Crypto API for AES-GCM encryption

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16; // GCM auth tag is 16 bytes

// Derive a key from a static secret (for encrypting default API keys)
// Note: This provides obfuscation, not true security since the secret is in client code
// The goal is to prevent accidental exposure in browser dev tools, not to protect against determined attackers
async function deriveKey(): Promise<CryptoKey> {
  const secret = 'planora_default_key_encryption_secret_v1';
  const encoder = new TextEncoder();
  const salt = encoder.encode('planora_salt_v1'); // Fixed salt for deterministic key
  
  // Import the raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string using AES-GCM
 */
export async function encryptString(plainText: string): Promise<string | null> {
  if (!plainText || plainText.trim().length === 0) {
    return null;
  }

  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: AUTH_TAG_LENGTH * 8, // tagLength is in bits
      },
      key,
      data
    );

    // GCM automatically appends the auth tag to the encrypted data
    const encryptedArray = new Uint8Array(encrypted);
    
    // The last 16 bytes are the auth tag
    const ciphertext = encryptedArray.slice(0, encryptedArray.length - AUTH_TAG_LENGTH);
    const authTag = encryptedArray.slice(encryptedArray.length - AUTH_TAG_LENGTH);

    // Convert to base64
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ciphertextB64 = btoa(String.fromCharCode(...ciphertext));
    const authTagB64 = btoa(String.fromCharCode(...authTag));
    
    // Format: iv.ciphertext.tag (matching backend format)
    return `${ivB64}.${ciphertextB64}.${authTagB64}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt a string encrypted with encryptString
 */
export async function decryptString(encryptedPayload: string): Promise<string | null> {
  if (!encryptedPayload || encryptedPayload.trim().length === 0) {
    return null;
  }

  try {
    const parts = encryptedPayload.split('.');
    if (parts.length !== 3) {
      // Not in encrypted format, might be plain text (for backward compatibility)
      return encryptedPayload;
    }

    const [ivB64, ciphertextB64, authTagB64] = parts;
    if (!ivB64 || !ciphertextB64 || !authTagB64) {
      return encryptedPayload;
    }

    // Convert base64 to Uint8Array
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    const authTag = Uint8Array.from(atob(authTagB64), c => c.charCodeAt(0));

    // Combine ciphertext and auth tag (GCM expects them together)
    const encrypted = new Uint8Array(ciphertext.length + authTag.length);
    encrypted.set(ciphertext);
    encrypted.set(authTag, ciphertext.length);

    const key = await deriveKey();

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: AUTH_TAG_LENGTH * 8,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);
    return result.trim().length > 0 ? result : null;
  } catch (error) {
    console.error('Decryption failed:', error);
    // If decryption fails, might be plain text (backward compatibility)
    // Return null to indicate it's not a valid encrypted value
    return null;
  }
}

