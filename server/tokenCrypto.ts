import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Encrypts AniList access tokens before they are written at rest (Redis or node-persist).
 * Tokens grant full API access to a user's AniList account, so they must not
 * sit in plaintext on the filesystem.
 *
 * AES-256-GCM provides confidentiality + integrity. The key is derived from
 * SESSION_SECRET (required in production), so no extra env var is needed.
 */

const ALGORITHM = "aes-256-gcm";
const ENCRYPTED_PREFIX = "enc:v1:";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_SALT = "anilistcal:token-encryption:v1";

// Dev-only fallback so local runs without SESSION_SECRET still work. In
// production buildSessionOptions() refuses to start without SESSION_SECRET.
const DEV_KEY_SECRET = "anilistcal-dev-token-encryption-key";

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET || DEV_KEY_SECRET;
  return scryptSync(secret, KEY_SALT, 32);
}

export function isEncryptedToken(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ENCRYPTED_PREFIX + Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a stored token. Values without the encryption prefix are treated as
 * legacy plaintext and returned as-is (backward compatibility). Throws if an
 * encrypted value cannot be authenticated/decrypted (e.g. SESSION_SECRET changed).
 */
export function decryptToken(stored: string): string {
  if (!isEncryptedToken(stored)) {
    return stored;
  }

  const raw = Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const authTag = raw.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const encrypted = raw.subarray(IV_BYTES + AUTH_TAG_BYTES);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
