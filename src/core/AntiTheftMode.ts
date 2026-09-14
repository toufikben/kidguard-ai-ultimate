// ═══════════════════════════════════════════════════════════
// Anti-Theft Mode — protects vehicles / bikes
// Uses sensor fusion (IMU + GPS) to detect movement of a parked object.
// Triggers escalating alerts when object is moved outside zone.
// ═══════════════════════════════════════════════════════════

import type { AntiTheftZone, GeoPoint, MotionData } from '@/types';
import { isInsideZone, haversineMeters } from '@/utils/geo';
import { ANTITHEFT_MOVEMENT_THRESHOLD, STORAGE_KEYS } from '@/utils/constants';
import { logger } from '@/utils/logger';

export type AntiTheftEvent =
  | { type: 'armed'; zone: AntiTheftZone }
  | { type: 'disarmed'; zone: AntiTheftZone }
  | { type: 'movement'; zone: AntiTheftZone; magnitude: number }
  | { type: 'moved_out'; zone: AntiTheftZone; point: GeoPoint; distance: number }
  | { type: 'returned'; zone: AntiTheftZone };

export class AntiTheftMode {
  private zones: Map<string, AntiTheftZone> = new Map();
  private lastMotionAt: Map<string, number> = new Map();
  private movementStrikes: Map<string, number> = new Map();
  private listeners: Set<(e: AntiTheftEvent) => void> = new Set();

  loadZones(zones: AntiTheftZone[]): void {
    this.zones.clear();
    for (const z of zones) this.zones.set(z.id, z);
  }

  saveZones(): void {
    localStorage.setItem(
      STORAGE_KEYS.antitheft,
      JSON.stringify(Array.from(this.zones.values()))
    );
  }

  getZones(): AntiTheftZone[] {
    return Array.from(this.zones.values());
  }

  addZone(z: AntiTheftZone): void {
    this.zones.set(z.id, z);
    this.saveZones();
    logger.info('antitheft: zone added', z.name);
  }

  removeZone(id: string): void {
    this.zones.delete(id);
    this.saveZones();
  }

  on(fn: (e: AntiTheftEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: AntiTheftEvent): void {
    for (const l of this.listeners) { try { l(e); } catch {} }
  }

  /**
   * Feed motion data (from Accelerometer/Gyroscope).
   * Higher magnitude + running zone = suspicious.
   */
  feedMotion(m: MotionData): void {
    for (const z of this.zones.values()) {
      if (!z.enabled) continue;

      const threshold = ANTITHEFT_MOVEMENT_THRESHOLD * (1 - z.sensitivity);
      if (m.magnitude > threshold) {
        const strikes = (this.movementStrikes.get(z.id) ?? 0) + 1;
        this.movementStrikes.set(z.id, strikes);
        this.lastMotionAt.set(z.id, m.timestamp);

        // 3 consecutive strikes = real movement
        if (strikes >= 3) {
          this.movementStrikes.set(z.id, 0);
          this.emit({ type: 'movement', zone: z, magnitude: m.magnitude });
          logger.warn('antitheft: movement detected', z.name, m.magnitude.toFixed(2));
        }
      } else {
        // decay strikes on stillness
        const s = this.movementStrikes.get(z.id) ?? 0;
        if (s > 0) this.movementStrikes.set(z.id, Math.max(0, s - 1));
      }
    }
  }

  /**
   * Feed location. Detects if object exits its zone.
   */
  feedLocation(p: GeoPoint): void {
    for (const z of this.zones.values()) {
      if (!z.enabled) continue;

      const inside = isInsideZone(p, z.center, z.radius);
      const dist = haversineMeters(p, z.center);

      if (!inside && dist > z.radius + 5) {
        this.emit({ type: 'moved_out', zone: z, point: p, distance: dist });
        logger.warn('antitheft: moved out', z.name, dist.toFixed(0), 'm');
      }
    }
  }

  arm(id: string, center: GeoPoint): void {
    const z = this.zones.get(id);
    if (!z) return;
    z.center = { lat: center.lat, lng: center.lng };
    z.enabled = true;
    z.lastMovementAt = Date.now();
    this.movementStrikes.set(id, 0);
    this.saveZones();
    this.emit({ type: 'armed', zone: z });
  }

  disarm(id: string): void {
    const z = this.zones.get(id);
    if (!z) return;
    z.enabled = false;
    this.saveZones();
    this.emit({ type: 'disarmed', zone: z });
  }
}
