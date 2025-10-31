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
    const iv = Buffer.from(ivB64, 'base64');
    const ciphertext = Buffer.from(ctB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    
    // Validate lengths
    if (iv.length !== IV_LENGTH || !ciphertext.length || !authTag.length) {
      // Invalid encrypted format, but might be plain text that happens to have dots
      // Try to decrypt anyway, but if it fails, return as plain text
      console.warn('Crypto: Suspicious format but attempting decryption');
    }
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const decrypted = plain.toString('utf8');
    
    // Successfully decrypted - validate it doesn't look like an encrypted string
    // (i.e., it shouldn't have exactly 3 dot-separated base64 parts)
    const decryptedParts = decrypted.split('.');
    if (decrypted && decryptedParts.length !== 3) {
      return decrypted.trim();
    }
    
    // Decrypted result still looks encrypted - something went wrong
    console.error('Crypto: Decryption resulted in what looks like encrypted data');
    return null;
  } catch (error) {
    // Decryption failed - if it looked encrypted, this is an error
    // If it's a plain text API key that happens to have 2 dots, return it
    // Most API keys don't have exactly 2 dots separating 3 base64-looking parts
    console.error('Crypto: Decryption failed for encrypted-looking payload:', error.message);
    
    // Check if this might be a valid API key (they're usually alphanumeric with some special chars)
    // Encrypted strings are base64, so they won't have spaces or many special chars
    if (/^[A-Za-z0-9+/=._-]+$/.test(payload) && payload.length > 20) {
      // Looks like it might be a valid API key format, return it
      return payload;
    }
    
    // Looks encrypted but can't decrypt - return null to indicate error
    return null;
  }
}

module.exports = { encryptString, decryptString };
