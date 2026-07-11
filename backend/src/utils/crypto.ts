import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_HEX = process.env.BANK_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const PEPPER = process.env.AADHAAR_PEPPER || 'default_aadhaar_pepper_secret';

// Resolve 32-byte key from hex string
let key: Buffer;
try {
  key = Buffer.from(KEY_HEX, 'hex');
  if (key.length !== 32) {
    throw new Error('BANK_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).');
  }
} catch (err) {
  // Safe fallback for dev scaffolding, but enforce in prod
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid BANK_ENCRYPTION_KEY configuration in production: ' + (err as Error).message);
  }
  // Generate a mock key for local scaffolding if missing/invalid
  key = crypto.scryptSync('development_fallback_key', 'salt', 32);
}

/**
 * Encrypt bank account number using AES-256-CBC
 */
export function encryptBankAccount(accountNumber: string): string {
  if (!accountNumber) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(accountNumber, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt bank account number using AES-256-CBC
 */
export function decryptBankAccount(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const [ivHex, encryptedText] = encryptedData.split(':');
    if (!ivHex || !encryptedText) return '';
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', (error as Error).message);
    return '';
  }
}

/**
 * Hash Aadhaar using SHA-256 + Server-Side Pepper
 */
export function hashAadhaar(rawAadhaar: string): string {
  if (!rawAadhaar) return '';
  const cleanAadhaar = rawAadhaar.replace(/\s+/g, '');
  return crypto
    .createHmac('sha256', PEPPER)
    .update(cleanAadhaar)
    .digest('hex');
}

/**
 * Mask account number, leaving only the last 4 digits visible
 */
export function maskBankAccount(accountNumber: string): string {
  if (!accountNumber) return '';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

/**
 * Validates Aadhaar format (12 digits)
 */
export function isValidAadhaar(aadhaar: string): boolean {
  const clean = aadhaar.replace(/\s+/g, '');
  return /^\d{12}$/.test(clean);
}
