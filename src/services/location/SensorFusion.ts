// ═══════════════════════════════════════════════════════════
// Sensor Fusion — GPS + IMU + BLE
// Combines sources to produce stable, tamper-resistant location.
// ═══════════════════════════════════════════════════════════

import type { GeoPoint, MotionData } from '@/types';
import { haversineMeters, smoothLocation } from '@/utils/geo';
import { logger } from '@/utils/logger';

export interface FusedState {
  location: GeoPoint | null;
  motion: MotionData | null;
  confidence: number;          // 0..1
  lastMotionAt: number;
  estimatedSpeed: number;
  isMoving: boolean;
}

const MAX_AGE_MS = 60_000;
const STILLNESS_THRESHOLD = 0.15;

export class SensorFusion {
  private state: FusedState = {
    location: null,
    motion: null,
    confidence: 0,
    lastMotionAt: 0,
    estimatedSpeed: 0,
    isMoving: false,
  };

  updateLocation(p: GeoPoint): void {
    const prev = this.state.location;
    const smoothed = smoothLocation(prev, p);

    let speed = 0;
    if (prev) {
      const d = haversineMeters(prev, smoothed);
      const dt = Math.max(1, (p.timestamp - prev.timestamp) / 1000);
      speed = d / dt;
    }

    // confidence: prefers fused/gps, penalizes mocked
    let conf = p.source === 'fused' ? 0.95 : p.source === 'gps' ? 0.85 : 0.6;
    if (p.isMocked) conf *= 0.2;
    if (p.accuracy > 50) conf *= 0.7;
    if (Date.now() - p.timestamp > MAX_AGE_MS) conf *= 0.5;

    this.state = {
      ...this.state,
      location: smoothed,
      confidence: conf,
      estimatedSpeed: speed,
      isMoving: speed > 0.4,
    };
  }

  updateMotion(m: MotionData): void {
    const still = m.magnitude < STILLNESS_THRESHOLD;
    this.state = {
      ...this.state,
      motion: m,
      lastMotionAt: still ? this.state.lastMotionAt : m.timestamp,
    };
  }

  get(): FusedState {
    return this.state;
  }

  reset(): void {
    this.state = {
      location: null, motion: null, confidence: 0,
      lastMotionAt: 0, estimatedSpeed: 0, isMoving: false,
    };
    logger.info('fusion: reset');
  }
}
