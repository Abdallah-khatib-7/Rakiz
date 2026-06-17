const crypto = require('crypto');

// AES-256-GCM: authenticated encryption, so tampering is detected, not just
// confidentiality. The key must be exactly 32 bytes — we derive it from the
// hex string in .env rather than using it raw, so any length input works.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

const getKey = () => {
  const raw = process.env.AES_SECRET_KEY;
  if (!raw) {
    throw new Error('AES_SECRET_KEY is not set');
  }
  // hash whatever we're given down to a stable 32-byte key
  return crypto.createHash('sha256').update(raw).digest();
};

// Output format: iv:authTag:ciphertext, all hex, joined so it's one string
// that fits in a normal VARCHAR column.
const encrypt = (plaintext) => {
  if (plaintext === null || plaintext === undefined) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (payload) => {
  if (!payload) return null;

  const [ivHex, authTagHex, encryptedHex] = payload.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted payload format');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };