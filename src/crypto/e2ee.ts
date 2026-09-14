// ═══════════════════════════════════════════════════════════
// E2EE — End-to-End Encryption using libsodium
// Zero-Knowledge: Server sees only ciphertext + nonce
// ═══════════════════════════════════════════════════════════

import sodium from 'libsodium-wrappers';
import { logger } from '@/utils/logger';

export interface EncryptedPayload {
  ciphertext: string;   // base64
  nonce: string;        // base64
  version: 1;
}

let ready = false;

export async function initCrypto(): Promise<void> {
  if (ready) return;
  await sodium.ready;
  ready = true;
  logger.info('crypto: libsodium ready');
}

/**
 * Derive a shared symmetric key from own secret + peer public key
 * using X25519 → BLAKE2b (this is what crypto_box uses internally).
 */
export function deriveSharedKey(
  ownSecretKey: Uint8Array,
  peerPublicKey: Uint8Array
): Uint8Array {
  if (!ready) throw new Error('crypto not ready');
  // crypto_box_beforenm = X25519 + HSalsa20 → shared key
  return sodium.crypto_box_beforenm(peerPublicKey, ownSecretKey);
}

/**
 * Encrypt any JS object using XSalsa20-Poly1305 with a shared key.
 * Returns base64 ciphertext + nonce.
 */
export function encryptObject(
  data: unknown,
  sharedKey: Uint8Array,
  additionalData?: string
): EncryptedPayload {
  if (!ready) throw new Error('crypto not ready');
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const plaintext = sodium.from_string(JSON.stringify(data));
  const ad = additionalData ? sodium.from_string(additionalData) : null;

  const ciphertext = ad
    ? sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        plaintext, ad, null, nonce, sharedKey
      )
    : sodium.crypto_secretbox_easy(plaintext, nonce, sharedKey);

  return {
    ciphertext: sodium.to_base64(ciphertext, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
    version: 1,
  };
}

/**
 * Decrypt a payload back to object.
 */
export function decryptObject<T = unknown>(
  payload: EncryptedPayload,
  sharedKey: Uint8Array,
  additionalData?: string
): T {
  if (!ready) throw new Error('crypto not ready');
  if (payload.version !== 1) throw new Error('unsupported version');

  const ciphertext = sodium.from_base64(
    payload.ciphertext, sodium.base64_variants.ORIGINAL
  );
  const nonce = sodium.from_base64(
    payload.nonce, sodium.base64_variants.ORIGINAL
  );
  const ad = additionalData ? sodium.from_string(additionalData) : null;

  const plaintext = ad
    ? sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null, ciphertext, ad, nonce, sharedKey
      )
    : sodium.crypto_secretbox_open_easy(ciphertext, nonce, sharedKey);

  if (!plaintext) throw new Error('decryption failed');
  return JSON.parse(sodium.to_string(plaintext)) as T;
}

/**
 * HMAC-SHA256 signature — used to sign heartbeats.
 */
export function signHMAC(data: string, key: Uint8Array): string {
  if (!ready) throw new Error('crypto not ready');
  const signature = sodium.crypto_auth(
    sodium.from_string(data),
    key
  );
  return sodium.to_base64(signature, sodium.base64_variants.ORIGINAL);
}

export function verifyHMAC(data: string, signature: string, key: Uint8Array): boolean {
  if (!ready) throw new Error('crypto not ready');
  try {
    return sodium.crypto_auth_verify(
      sodium.from_base64(signature, sodium.base64_variants.ORIGINAL),
      sodium.from_string(data),
      key
    );
  } catch {
    return false;
  }
}

/**
 * Generate a random pairing code (6 digits).
 */
export function generatePairingCode(): string {
  if (!ready) throw new Error('crypto not ready');
  const bytes = sodium.randombytes_buf(4);
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(num % 1_000_000).padStart(6, '0');
}
