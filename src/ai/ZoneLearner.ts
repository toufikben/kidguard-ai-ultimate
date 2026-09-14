// ═══════════════════════════════════════════════════════════
// Zone Learner — automatically suggests safe zones
// from recurring locations during specific hours.
// ═══════════════════════════════════════════════════════════

import type { GeoPoint } from '@/types';
import { haversineMeters } from '@/utils/geo';

const CLUSTER_RADIUS_M = 80;
const MIN_VISITS = 4;
const HOUR_BUCKET = 2; // 2-hour windows

interface Cluster {
  center: { lat: number; lng: number };
  visits: number;
  hours: Map<number, number>;
  days: Set<number>;
}

export interface SuggestedZone {
  center: { lat: number; lng: number };
  radius: number;
  hours: { start: number; end: number } | null;
  days: number[];
  confidence: number;
  label: string;
}

export class ZoneLearner {
  private samples: { point: GeoPoint; hour: number; day: number }[] = [];

  add(p: GeoPoint): void {
    const d = new Date(p.timestamp);
    this.samples.push({ point: p, hour: d.getHours(), day: d.getDay() });
    if (this.samples.length > 5000) this.samples.shift();
  }

  suggest(): SuggestedZone[] {
    const clusters: Cluster[] = [];

    for (const s of this.samples) {
      let placed = false;
      for (const c of clusters) {
        if (haversineMeters(s.point, c.center) < CLUSTER_RADIUS_M) {
          c.visits++;
          // moving average of center
          const a = 1 / c.visits;
          c.center.lat = c.center.lat * (1 - a) + s.point.lat * a;
          c.center.lng = c.center.lng * (1 - a) + s.point.lng * a;
          c.hours.set(s.hour, (c.hours.get(s.hour) ?? 0) + 1);
          c.days.add(s.day);
          placed = true;
          break;
        }
      }
      if (!placed) {
        const hours = new Map<number, number>();
        hours.set(s.hour, 1);
        clusters.push({
          center: { lat: s.point.lat, lng: s.point.lng },
          visits: 1,
          hours,
          days: new Set([s.day]),
        });
      }
    }

    return clusters
      .filter((c) => c.visits >= MIN_VISITS)
      .map((c) => {
        const sortedHours = Array.from(c.hours.entries()).sort((a, b) => b[1] - a[1]);
        const hourRange: { start: number; end: number } | null =
          sortedHours.length > 2
            ? {
                start: Math.min(...sortedHours.map(([h]) => h)) * HOUR_BUCKET,
                end: (Math.max(...sortedHours.map(([h]) => h)) + 1) * HOUR_BUCKET,
              }
            : null;

        return {
          center: c.center,
          radius: Math.max(60, CLUSTER_RADIUS_M),
          hours: hourRange,
          days: Array.from(c.days).sort(),
          confidence: Math.min(1, c.visits / 12),
          label: `Auto-zone (${c.visits} visits)`,
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  reset(): void { this.samples = []; }
}
