// ═══════════════════════════════════════════════════════════
// Heartbeat Protocol — proves child's phone is alive
// Detects: phone off, network loss, forced shutdown, theft.
// ═══════════════════════════════════════════════════════════

import { supabase } from '@/services/supabase/client';
import { getOrCreateIdentity } from '@/crypto/keyExchange';
import { signHMAC, initCrypto } from '@/crypto/e2ee';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import {
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_MISS_THRESHOLD,
  STORAGE_KEYS,
} from '@/utils/constants';
import { logger } from '@/utils/logger';
import type { Heartbeat } from '@/types';

export type HeartbeatEvent =
  | { type: 'sent'; hb: Heartbeat }
  | { type: 'peer_missing'; missed: number; lastSeen: number }
  | { type: 'peer_alive'; hb: Heartbeat };

type Listener = (e: HeartbeatEvent) => void;

export class HeartbeatProtocol {
  private sendTimer: number | null = null;
  private checkTimer: number | null = null;
  private listeners: Set<Listener> = new Set();
  private selfDeviceId: string;
  private peerDeviceId: string | null = null;
  private lastPeerHeartbeatAt = 0;
  private hmacKey: Uint8Array | null = null;

  constructor(selfDeviceId: string) {
    this.selfDeviceId = selfDeviceId;
  }

  async initialize(): Promise<void> {
    await initCrypto();
    // Derive an HMAC key from the device's identity secret (never leaves device)
    const identity = await getOrCreateIdentity();
    const enc = new TextEncoder();
    this.hmacKey = enc.encode(identity.secretKey.slice(0, 32));
    logger.info('heartbeat: initialized');
  }

  setPeer(peerDeviceId: string): void {
    this.peerDeviceId = peerDeviceId;
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(e: HeartbeatEvent): void {
    for (const l of this.listeners) {
      try { l(e); } catch (err) { logger.error('heartbeat listener', err); }
    }
  }

  startSending(): void {
    if (this.sendTimer) return;
    this.sendTimer = window.setInterval(() => this.sendOnce(), HEARTBEAT_INTERVAL_MS);
    this.sendOnce();
    logger.info('heartbeat: sender started');
  }

  stopSending(): void {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
  }

  private async sendOnce(): Promise<void> {
    try {
      const info = await Device.getInfo();
      const battery = await Device.getBatteryInfo();
      const net = await Network.getStatus();

      const hb: Heartbeat = {
        deviceId: this.selfDeviceId,
        timestamp: Date.now(),
        battery: Math.round((battery.batteryLevel ?? 1) * 100),
        network: net.connected ? 'online' : 'offline',
        signature: '',
      };

      hb.signature = this.hmacKey
        ? signHMAC(`${hb.deviceId}|${hb.timestamp}|${hb.battery}`, this.hmacKey)
        : '';

      // Insert into Supabase (server sees only metadata, no location here)
      const { error } = await supabase.from('heartbeats').insert({
        device_id: this.selfDeviceId,
        battery: hb.battery,
        network: hb.network,
      });
      if (error) logger.warn('heartbeat: insert failed', error.message);

      // Also broadcast over P2P if available
      window.dispatchEvent(new CustomEvent('kg:heartbeat', { detail: hb }));
      this.emit({ type: 'sent', hb });
    } catch (e) {
      logger.error('heartbeat: send error', e);
    }
  }

  /**
   * Parent side: watch child's heartbeats.
   * Polls the heartbeats table every 20s.
   */
  startWatching(intervalMs = 20_000): void {
    if (this.checkTimer) return;
    this.checkTimer = window.setInterval(() => this.checkPeer(), intervalMs);
    this.checkPeer();
    logger.info('heartbeat: watcher started');
  }

  stopWatching(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private async checkPeer(): Promise<void> {
    if (!this.peerDeviceId) return;
    const { data, error } = await supabase
      .from('heartbeats')
      .select('created_at, battery, network')
      .eq('device_id', this.peerDeviceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.warn('heartbeat: no peer data');
      return;
    }

    const lastAt = new Date(data.created_at).getTime();
    const now = Date.now();
    const gapMs = now - lastAt;

    if (gapMs > HEARTBEAT_INTERVAL_MS * HEARTBEAT_MISS_THRESHOLD) {
      const missed = Math.floor(gapMs / HEARTBEAT_INTERVAL_MS);
      this.emit({ type: 'peer_missing', missed, lastSeen: lastAt });
    } else {
      this.emit({
        type: 'peer_alive',
        hb: {
          deviceId: this.peerDeviceId,
          timestamp: lastAt,
          battery: data.battery ?? 0,
          network: (data.network as any) ?? 'offline',
          signature: '',
        },
      });
    }

    this.lastPeerHeartbeatAt = lastAt;
  }

  getLastPeerSeen(): number {
    return this.lastPeerHeartbeatAt;
  }

  destroy(): void {
    this.stopSending();
    this.stopWatching();
    this.listeners.clear();
  }
}

/**
 * Helper: persist pairing info to storage (used by pairing flow, part 3).
 */
export function savePairingLocally(pairing: {
  childDeviceId: string;
  parentDeviceId?: string;
  peerPublicKey: string;
}): void {
  localStorage.setItem(STORAGE_KEYS.pairing, JSON.stringify(pairing));
}

export function loadPairingLocally(): {
  childDeviceId: string;
  parentDeviceId?: string;
  peerPublicKey: string;
} | null {
  const raw = localStorage.getItem(STORAGE_KEYS.pairing);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
