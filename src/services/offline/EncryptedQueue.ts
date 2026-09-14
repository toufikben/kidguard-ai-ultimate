// ═══════════════════════════════════════════════════════════
// Encrypted Offline Queue — IndexedDB with E2EE
// When network returns, flush items to their destinations.
// ═══════════════════════════════════════════════════════════

import { encryptObject, decryptObject, initCrypto } from '@/crypto/e2ee';
import { getSharedKey } from '@/crypto/keyExchange';
import { logger } from '@/utils/logger';

const DB_NAME = 'kg_queue';
const STORE = 'items';
const VERSION = 1;

export type QueueKind = 'location' | 'incident' | 'sms' | 'smtp';

export interface QueueItem {
  id: number;
  kind: QueueKind;
  peerPublicKey: string;       // key recipient for re-encryption
  ciphertext: string;
  nonce: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('kind', 'kind');
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function enqueue(
  kind: QueueKind,
  payload: unknown,
  peerPublicKey: string
): Promise<void> {
  await initCrypto();
  const sharedKey = await getSharedKey(peerPublicKey);
  const enc = encryptObject(payload, sharedKey, kind);

  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).add({
    kind,
    peerPublicKey,
    ciphertext: enc.ciphertext,
    nonce: enc.nonce,
    createdAt: Date.now(),
    attempts: 0,
  });
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  logger.info('queue: enqueued', kind);
}

export async function listByKind(kind: QueueKind, limit = 50): Promise<QueueItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('kind');
    const req = idx.getAll(kind, limit);
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function decryptItem<T = unknown>(item: QueueItem): Promise<T> {
  await initCrypto();
  const sharedKey = await getSharedKey(item.peerPublicKey);
  return decryptObject<T>(
    { ciphertext: item.ciphertext, nonce: item.nonce, version: 1 },
    sharedKey,
    item.kind
  );
}

export async function removeItem(id: number): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await new Promise<void>((res) => { tx.oncomplete = () => res(); });
}

export async function markAttempt(id: number, error?: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const get = store.get(id);
  get.onsuccess = () => {
    const row = get.result as QueueItem;
    if (!row) return;
    row.attempts += 1;
    row.lastError = error;
    store.put(row);
  };
  await new Promise<void>((res) => { tx.oncomplete = () => res(); });
}

export async function count(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
