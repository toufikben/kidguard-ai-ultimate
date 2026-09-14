// ═══════════════════════════════════════════════════════════
// Geofence Monitor — time-aware safe zones + confirmation
// ═══════════════════════════════════════════════════════════

import type { GeoPoint, SafeZone } from '@/types';
import { isInsideZone, haversineMeters } from '@/utils/geo';
import {
  GEOFENCE_CONFIRM_READINGS,
  GEOFENCE_CONFIRM_DURATION_MS,
  STORAGE_KEYS,
} from '@/utils/constants';
import { logger } from '@/utils/logger';

export type ZoneEvent =
  | { type: 'exit'; zone: SafeZone; point: GeoPoint }
  | { type: 'enter'; zone: SafeZone; point: GeoPoint }
  | { type: 'nearest'; zone: SafeZone | null; distance: number };

interface ZoneState {
  zone: SafeZone;
  inside: boolean;
  outsideReadings: number;
  outsideSince: number | null;
  insideSince: number | null;
}

export class GeofenceMonitor {
  private states: Map<string, ZoneState> = new Map();
  private listeners: Set<(e: ZoneEvent) => void> = new Set();

  loadZones(zones: SafeZone[]): void {
    for (const z of zones) {
      if (!this.states.has(z.id)) {
        this.states.set(z.id, {
          zone: z, inside: true,
          outsideReadings: 0,
          outsideSince: null, insideSince: null,
        });
      }
    }
  }

  saveZones(zones: SafeZone[]): void {
    localStorage.setItem(STORAGE_KEYS.zones, JSON.stringify(zones));
    this.loadZones(zones);
  }

  getZones(): SafeZone[] {
    return Array.from(this.states.values()).map((s) => s.zone);
  }

  on(fn: (e: ZoneEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: ZoneEvent): void {
    for (const l of this.listeners) { try { l(e); } catch {} }
  }

  private isZoneActiveNow(z: SafeZone, now = new Date()): boolean {
    if (z.activeDays && z.activeDays.length > 0) {
      if (!z.activeDays.includes(now.getDay())) return false;
    }
    if (z.activeHours) {
      const h = now.getHours();
      const { start, end } = z.activeHours;
      if (start <= end) {
        if (h < start || h >= end) return false;
      } else {
        // wraps midnight
        if (h < start && h >= end) return false;
      }
    }
    return true;
  }

  evaluate(point: GeoPoint): void {
    let nearest: SafeZone | null = null;
    let nearestDist = Infinity;

    for (const st of this.states.values()) {
      const dist = haversineMeters(point, st.zone.center);
      if (dist < nearestDist) { nearestDist = dist; nearest = st.zone; }

      if (!this.isZoneActiveNow(st.zone)) {
        st.inside = false;
        st.outsideReadings = 0;
        continue;
      }

      const inside = isInsideZone(point, st.zone.center, st.zone.radius);
      const now = Date.now();

      if (inside) {
        if (!st.inside && st.insideSince === null) st.insideSince = now;
        if (st.insideSince !== null && now - st.insideSince >= 3000) {
          if (!st.inside) this.emit({ type: 'enter', zone: st.zone, point });
          st.inside = true;
          st.outsideReadings = 0;
          st.outsideSince = null;
          st.insideSince = null;
        }
      } else {
        st.insideSince = null;
        st.outsideReadings += 1;
        if (st.outsideSince === null) st.outsideSince = now;

        const confirmedByCount = st.outsideReadings >= GEOFENCE_CONFIRM_READINGS;
        const confirmedByTime =
          st.outsideSince !== null &&
          now - st.outsideSince >= GEOFENCE_CONFIRM_DURATION_MS;

        if (st.inside && (confirmedByCount || confirmedByTime)) {
          st.inside = false;
          st.outsideReadings = 0;
          st.outsideSince = null;
          this.emit({ type: 'exit', zone: st.zone, point });
        }
      }
    }

    this.emit({ type: 'nearest', zone: nearest, distance: nearestDist });
    logger.info('geofence: nearest', nearest?.name, nearestDist.toFixed(1));
  }

  reset(): void {
    for (const st of this.states.values()) {
      st.inside = true; st.outsideReadings = 0;
      st.outsideSince = null; st.insideSince = null;
    }
  }
}
