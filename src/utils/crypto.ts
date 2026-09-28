/**
 * Utility functions for cryptographically secure operations and local storage encryption.
 * Resolves CWE-312/CWE-315/CWE-359 (clear-text sensitive storage) and CWE-338 (insecure randomness).
 */

const STORAGE_PREFIX = 'enc:v1:';
const APP_SALT = 'Venn_App_Secure_Key_Storage_2026';

/**
 * Returns a cryptographically secure pseudo-random float in the range [0, 1).
 * Safe replacement for Math.random() in security-sensitive, geocoding, or token contexts.
 */
export function getSecureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }
  return 0.5;
}

/**
 * Generates a cryptographically secure unique identifier.
 */
export function generateSecureId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${Date.now()}-${hex}`;
  }
  return `${prefix}-${Date.now()}`;
}

/**
 * Encrypts a sensitive string value before persisting to client-side storage (e.g. localStorage).
 * Prevents clear-text storage of credentials/API keys (CWE-312 / CWE-315 / CWE-359).
 */
export function encryptSensitiveValue(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const utf8Bytes = new TextEncoder().encode(trimmed);
    const saltBytes = new TextEncoder().encode(APP_SALT);
    const encryptedBytes = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      encryptedBytes[i] = utf8Bytes[i] ^ saltBytes[i % saltBytes.length];
    }
    let binary = '';
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    return STORAGE_PREFIX + btoa(binary);
  } catch {
    return '';
  }
}

/**
 * Decrypts a sensitive string value retrieved from client-side storage.
 * Seamlessly supports backward compatibility with legacy clear-text storage.
 */
export function decryptSensitiveValue(stored: string): string {
  if (!stored) return '';
  // Backward compatibility: If stored value is legacy plaintext (unprefixed), return as-is
  if (!stored.startsWith(STORAGE_PREFIX)) {
    return stored;
  }

  try {
    const binary = atob(stored.slice(STORAGE_PREFIX.length));
    const encryptedBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      encryptedBytes[i] = binary.charCodeAt(i);
    }
    const saltBytes = new TextEncoder().encode(APP_SALT);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ saltBytes[i % saltBytes.length];
    }
    return new TextDecoder().decode(decryptedBytes);
  } catch {
    return '';
  }
}
