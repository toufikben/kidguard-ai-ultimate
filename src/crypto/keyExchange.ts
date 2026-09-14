// ═══════════════════════════════════════════════════════════
// Key Exchange — X25519 keypairs with persistent storage
// Private keys NEVER leave the device.
// ═══════════════════════════════════════════════════════════

import sodium from 'libsodium-wrappers';
import { Preferences } from '@capacitor/preferences';
import { initCrypto, deriveSharedKey } from './e2ee';
import { STORAGE_KEYS } from '@/utils/constants';
import { logger } from '@/utils/logger';

export interface IdentityKeypair {
  publicKey: string;   // base64
  secretKey: string;   // base64 — LOCAL ONLY
  createdAt: number;
}

export interface PeerPublicKey {
  deviceId: string;
  publicKey: string;   // base64
}

/**
 * Load or create the device's long-term X25519 identity.
 */
export async function getOrCreateIdentity(): Promise<IdentityKeypair> {
  await initCrypto();
  const { value } = await Preferences.get({ key: STORAGE_KEYS.identity });

  if (value) {
    try {
      const parsed = JSON.parse(value) as IdentityKeypair;
      logger.info('identity: loaded existing keypair');
      return parsed;
    } catch {
      logger.warn('identity: corrupt, regenerating');
    }
  }

  const kp = sodium.crypto_box_keypair();
  const identity: IdentityKeypair = {
    publicKey: sodium.to_base64(kp.publicKey, sodium.base64_variants.ORIGINAL),
    secretKey: sodium.to_base64(kp.privateKey, sodium.base64_variants.ORIGINAL),
    createdAt: Date.now(),
  };

  await Preferences.set({
    key: STORAGE_KEYS.identity,
    value: JSON.stringify(identity),
  });

  logger.info('identity: new keypair created');
  return identity;
}

/**
 * Derive shared key with a peer and cache it in memory.
 * Cache is keyed by peer public key.
 */
const sharedKeyCache = new Map<string, Uint8Array>();

export async function getSharedKey(peerPublicKeyB64: string): Promise<Uint8Array> {
  const cached = sharedKeyCache.get(peerPublicKeyB64);
  if (cached) return cached;

  await initCrypto();
  const identity = await getOrCreateIdentity();

  const ownSecret = sodium.from_base64(
    identity.secretKey, sodium.base64_variants.ORIGINAL
  );
  const peerPublic = sodium.from_base64(
    peerPublicKeyB64, sodium.base64_variants.ORIGINAL
  );

  const shared = deriveSharedKey(ownSecret, peerPublic);
  sharedKeyCache.set(peerPublicKeyB64, shared);
  logger.info('keyExchange: shared key derived');
  return shared;
}

/**
 * Verify a peer's public key is well-formed.
 */
export function isValidPublicKey(b64: string): boolean {
  try {
    const bytes = sodium.from_base64(b64, sodium.base64_variants.ORIGINAL);
    return bytes.length === sodium.crypto_box_PUBLICKEYBYTES;
  } catch {
    return false;
  }
}

/**
 * Clear all crypto material — used on "unpair" or "reset".
 */
export async function wipeIdentity(): Promise<void> {
  await Preferences.remove({ key: STORAGE_KEYS.identity });
  sharedKeyCache.clear();
  logger.security('identity: wiped');
}
