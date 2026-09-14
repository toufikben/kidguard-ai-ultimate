// ═══════════════════════════════════════════════════════════
// Mock Location Detector — heuristic, no server needed
// Flags: identical repeated coords, impossible speed, IMU mismatch.
// ═══════════════════════════════════════════════════════════

import type { GeoPoint, MotionData } from '@/types';
import { haversineMeters } from '@/utils/geo';

interface Sample {
  point: GeoPoint;
  motion: MotionData | null;
}

const HISTORY_SIZE = 6;
const IMPOSSIBLE_SPEED_MS = 55; // ~200 km/h
const STATIONARY_ACCEL = 0.08;  // almost no movement

export class MockDetector {
  private history: Sample[] = [];

  push(point: GeoPoint, motion: MotionData | null): void {
    this.history.push({ point, motion });
    if (this.history.length > HISTORY_SIZE) this.history.shift();
  }

  /**
   * Returns score 0..1 — higher = more likely mocked.
   */
  score(): number {
    if (this.history.length < 3) return 0;
    let s = 0;

    const a = this.history[this.history.length - 2].point;
    const b = this.history[this.history.length - 1].point;

    const dist = haversineMeters(a, b);
    const dtSec = Math.max(0.001, (b.timestamp - a.timestamp) / 1000);
    const speed = dist / dtSec;

    if (speed > IMPOSSIBLE_SPEED_MS) s += 0.6;

    // Identical coordinates repeated while device reports movement
    const identicalCount = this.history.filter(
      (h) => Math.abs(h.point.lat - b.lat) < 1e-7 && Math.abs(h.point.lng - b.lng) < 1e-7
    ).length;
    if (identicalCount >= 3 && b.accuracy < 5) s += 0.25;

    // IMU mismatch: no movement but location changed significantly
    const motion = this.history[this.history.length - 1].motion;
    if (motion && dist > 30 && motion.magnitude < STATIONARY_ACCEL) s += 0.3;

    // Android-level flag
    if (b.isMocked) s += 0.5;

    return Math.min(1, s);
  }

  reset(): void {
    this.history = [];
  }
}
