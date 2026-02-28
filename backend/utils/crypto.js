const crypto = require('crypto');

// Prefer a 32-byte key provided via base64 in ENCRYPTION_KEY_BASE64.
// Fallback: derive a key from ENCRYPTION_SECRET using scrypt.
function resolveKey() {
  const base64Key = process.env.ENCRYPTION_KEY_BASE64;
  if (base64Key) {
    const key = Buffer.from(base64Key, 'base64');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
    }
    return key;
  }

  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('Missing ENCRYPTION_KEY_BASE64 or ENCRYPTION_SECRET');
  }
  // Deterministically derive a 32-byte key using scrypt with a fixed app salt
  return crypto.scryptSync(secret, 'planora_app_fixed_salt_v1', 32);
}

let KEY;
try {
  KEY = resolveKey();
} catch (error) {
  console.error('CRITICAL: Failed to resolve encryption key:', error.message);
  console.error('Please set either ENCRYPTION_KEY_BASE64 or ENCRYPTION_SECRET environment variable');
  // Use a temporary key for development, but this should fail in production
  KEY = crypto.randomBytes(32);
  console.warn('Using temporary random key - encryption/decryption will not work correctly!');
}

const IV_LENGTH = 12; // GCM recommended 12 bytes

function encryptString(plainText) {
  if (plainText === null || plainText === undefined) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store as base64: iv.ciphertext.tag
  return `${iv.toString('base64')}.${ciphertext.toString('base64')}.${authTag.toString('base64')}`;
}

function decryptString(payload) {
  if (payload === null || payload === undefined) return null;
  
  // Support already-plain values (for backward compatibility with existing unencrypted keys)
  if (typeof payload !== 'string') return payload;
  
  // Check if it looks like an encrypted payload (format: iv.ciphertext.tag)
  // Encrypted payloads will have exactly 3 parts separated by dots
  const parts = payload.split('.');
  if (parts.length !== 3) {
    // Not in encrypted format, assume it's plain text (backward compatibility)
    return payload;
  }
  
  const [ivB64, ctB64, tagB64] = parts;
  if (!ivB64 || !ctB64 || !tagB64) {
    // Doesn't look like valid encrypted format, treat as plain text
    return payload;
  }
  
  try {
    let iv, ciphertext, authTag;
    try {
      iv = Buffer.from(ivB64, 'base64');
      ciphertext = Buffer.from(ctB64, 'base64');
      authTag = Buffer.from(tagB64, 'base64');
    } catch (base64Error) {
      // Invalid base64 encoding - return as plain text
      return payload;
    }
    
    // Validate lengths before attempting decryption
    // GCM auth tag should be 16 bytes
    const EXPECTED_AUTH_TAG_LENGTH = 16;
    
    if (iv.length !== IV_LENGTH) {
      // Invalid IV length - this is definitely not valid encrypted data
      // Return as plain text (backward compatibility for keys that look encrypted)
      return payload;
    }
    
    if (!ciphertext.length || !authTag.length || authTag.length !== EXPECTED_AUTH_TAG_LENGTH) {
      // Empty ciphertext or invalid auth tag - invalid encrypted format
      // Return as plain text (backward compatibility)
      return payload;
    }
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const decrypted = plain.toString('utf8');
    
    // Successfully decrypted - validate the result
    // Empty decrypted string should return null (invalid/empty key)
    if (!decrypted || decrypted.trim().length === 0) {
      return null;
    }
    
    // Validate it doesn't look like an encrypted string
    // (i.e., it shouldn't have exactly 3 dot-separated base64 parts)
    const decryptedParts = decrypted.split('.');
    if (decryptedParts.length !== 3) {
      // Normal decrypted value - return trimmed
      return decrypted.trim();
    }
    
    // Decrypted result still looks encrypted - something went wrong
    // This is extremely rare but could indicate double encryption or corruption
    console.error('Crypto: Decryption resulted in what looks like encrypted data');
    return null;
  } catch (error) {
    // Decryption failed - check if this might be a plain text value that just looks encrypted
    // (e.g., an API key that happens to have 2 dots separating 3 base64-looking parts)
    
    // Check if this might be a valid API key (they're usually alphanumeric with some special chars)
    // API keys are typically 20-200 characters and base64-like
    const mightBePlainText = payload.length >= 20 && payload.length <= 200 && /^[A-Za-z0-9+/=._-]+$/.test(payload);
    
    // Use a more specific error check to identify authentication/decryption errors
    const errorMessage = error?.message || String(error) || '';
    const isAuthError = errorMessage.includes('Unsupported state') || 
                       errorMessage.includes('unable to authenticate') || 
                       errorMessage.includes('bad decrypt');
    
    if (mightBePlainText) {
      // Likely a plain text API key that happens to match encrypted format
      // Silently return it without logging (this is expected behavior for backward compatibility)
      return payload;
    }
    
    if (isAuthError) {
      // This is an authentication/decryption error for genuinely encrypted-looking data
      // Log once per unique payload using a simple in-memory cache to prevent spam
      if (!decryptString._errorCache) {
        decryptString._errorCache = new Set();
      }
      const cacheKey = `${payload.substring(0, 50)}_${errorMessage}`;
      if (!decryptString._errorCache.has(cacheKey)) {
        decryptString._errorCache.add(cacheKey);
        // Limit cache size to prevent memory issues
        if (decryptString._errorCache.size > 100) {
          const firstKey = decryptString._errorCache.values().next().value;
          decryptString._errorCache.delete(firstKey);
        }
        console.error('Crypto: Decryption failed for encrypted-looking payload:', errorMessage);
        console.error('Crypto: This might be due to a changed encryption key or corrupted data.');
        console.error('Crypto: The user will need to re-enter their API key.');
      }
      // Return null to indicate decryption failure, but don't spam logs
      return null;
    }
    
    // Other unexpected errors - log them (but also use cache to prevent spam)
    if (!decryptString._errorCache) {
      decryptString._errorCache = new Set();
    }
    const cacheKey = `other_${payload.substring(0, 50)}_${errorMessage}`;
      if (!decryptString._errorCache.has(cacheKey)) {
        decryptString._errorCache.add(cacheKey);
        if (decryptString._errorCache.size > 100) {
          const firstKey = decryptString._errorCache.values().next().value;
          decryptString._errorCache.delete(firstKey);
        }
        console.error('Crypto: Unexpected decryption error:', errorMessage);
    }
    return null;
  }
}

module.exports = { encryptString, decryptString };
