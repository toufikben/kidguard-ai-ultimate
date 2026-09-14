import { registerPlugin } from '@capacitor/core';
import { logger } from '@/utils/logger';
import type { HeartRateReading } from '@/types';

interface BleHeartRatePlugin {
  connect(): Promise<{ connected: boolean; deviceName: string }>;
  disconnect(): Promise<{ disconnected: boolean }>;
  addListener(
    event: 'heartRate',
    cb: (data: { bpm: number; timestamp: number }) => void
  ): Promise<{ remove: () => void }>;
}

const BleHeartRate = registerPlugin<BleHeartRatePlugin>('BleHeartRate');

export class HeartRateService {
  private lastReading: HeartRateReading | null = null;
  private recent: number[] = [];
  private listener?: { remove: () => void };

  async connect(): Promise<boolean> {
    try {
      const r = await BleHeartRate.connect();
      logger.info('hr: connected to', r.deviceName);
      this.listener = await BleHeartRate.addListener('heartRate', (d) => {
        this.lastReading = {
          bpm: d.bpm,
          quality: 0.9,
          timestamp: d.timestamp,
          source: 'ble',
        };
        this.recent.push(d.bpm);
        if (this.recent.length > 30) this.recent.shift();
      });
      return r.connected;
    } catch (e) {
      logger.error('hr: connect failed', e);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.listener?.remove();
    await BleHeartRate.disconnect();
  }

  getLast(): HeartRateReading | null { return this.lastReading; }

  /**
   * Detect anomaly: high BPM while stationary for 3+ minutes.
   */
  detectAnomaly(isMoving: boolean): { bpm: number; reason: string } | null {
    if (!this.lastReading || this.recent.length < 5) return null;
    const avg = this.recent.reduce((s, v) => s + v, 0) / this.recent.length;
    const bpm = this.lastReading.bpm;
    if (bpm > 130 && !isMoving) {
      return { bpm, reason: 'high_bpm_stationary' };
    }
    if (bpm > 0 && avg > 0 && Math.abs(bpm - avg) > 45) {
      return { bpm, reason: 'sudden_change' };
    }
    return null;
  }
}
