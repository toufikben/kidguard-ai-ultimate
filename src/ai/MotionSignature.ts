// ═══════════════════════════════════════════════════════════
// Motion Signature — learns normal motion patterns per hour
// Detects: sudden running, fall, device snatch, prolonged stillness.
// Runs entirely on-device with lightweight statistics.
// ═══════════════════════════════════════════════════════════

import type { MotionData } from '@/types';

const HOURS = 24;
const DECAY = 0.05;
const FALL_THRESHOLD = 22;      // m/s^2 magnitude spike
const RUN_THRESHOLD = 8;
const SNATCH_SPIKE = 15;        // sudden jerk then stillness

interface HourBucket {
  mean: number;
  variance: number;
  samples: number;
}

export type MotionAnomaly =
  | { type: 'fall'; magnitude: number }
  | { type: 'running'; magnitude: number }
  | { type: 'snatch'; magnitude: number }
  | { type: 'unusual'; z: number };

export class MotionSignature {
  private buckets: HourBucket[] = Array.from({ length: HOURS }, () => ({
    mean: 0, variance: 0, samples: 0,
  }));
  private recent: number[] = [];
  private lastJerkAt = 0;

  learn(m: MotionData): void {
    const h = new Date(m.timestamp).getHours();
    const b = this.buckets[h];
    const n = b.samples + 1;
    const delta = m.magnitude - b.mean;
    b.mean += delta / n;
    b.variance += delta * (m.magnitude - b.mean);
    b.samples = n;
  }

  analyze(m: MotionData): MotionAnomaly | null {
    // Hard thresholds
    if (m.magnitude > FALL_THRESHOLD) {
      return { type: 'fall', magnitude: m.magnitude };
    }
    if (m.magnitude > RUN_THRESHOLD) {
      return { type: 'running', magnitude: m.magnitude };
    }

    // Snatch: sudden jerk followed by prolonged low magnitude
    if (m.magnitude > SNATCH_SPIKE) {
      this.lastJerkAt = m.timestamp;
    }
    if (
      this.lastJerkAt &&
      m.timestamp - this.lastJerkAt < 800 &&
      m.magnitude < 0.3
    ) {
      this.lastJerkAt = 0;
      return { type: 'snatch', magnitude: m.magnitude };
    }

    // Statistical anomaly vs hour bucket
    const h = new Date(m.timestamp).getHours();
    const b = this.buckets[h];
    if (b.samples < 20) return null;
    const std = Math.sqrt(b.variance / Math.max(1, b.samples));
    if (std < 0.01) return null;
    const z = (m.magnitude - b.mean) / std;
    if (Math.abs(z) > 3.5) {
      return { type: 'unusual', z };
    }
    return null;
  }

  reset(): void {
    this.buckets = Array.from({ length: HOURS }, () => ({
      mean: 0, variance: 0, samples: 0,
    }));
    this.recent = [];
  }

  toJSON() { return this.buckets; }
  fromJSON(b: HourBucket[]) { this.buckets = b; }
}
