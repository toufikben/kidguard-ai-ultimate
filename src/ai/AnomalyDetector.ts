// ═══════════════════════════════════════════════════════════
// Anomaly Detector — route anomalies (off-course detection)
// Uses grid-cell frequency over N days, no ML model needed.
// ═══════════════════════════════════════════════════════════

import type { GeoPoint } from '@/types';

const GRID_PRECISION = 4; // ~11m cells
const HISTORY_DAYS = 14;

interface CellData {
  count: number;
  lastSeen: number;
}

export type RouteAnomaly = { type: 'off_course'; cellKey: string; confidence: number };

export class AnomalyDetector {
  private cells: Map<string, CellData> = new Map();
  private readonly dayMs = 24 * 60 * 60 * 1000;

  private key(p: GeoPoint): string {
    return `${p.lat.toFixed(GRID_PRECISION)},${p.lng.toFixed(GRID_PRECISION)}`;
  }

  learn(p: GeoPoint): void {
    const k = this.key(p);
    const cur = this.cells.get(k) ?? { count: 0, lastSeen: 0 };
    cur.count += 1;
    cur.lastSeen = Date.now();
    this.cells.set(k, cur);
    this.pruneOld();
  }

  private pruneOld(): void {
    const cutoff = Date.now() - HISTORY_DAYS * this.dayMs;
    for (const [k, v] of this.cells) {
      if (v.lastSeen < cutoff && v.count < 3) this.cells.delete(k);
    }
  }

  analyze(p: GeoPoint): RouteAnomaly | null {
    if (this.cells.size < 30) return null; // not enough learning
    const k = this.key(p);
    const known = this.cells.get(k);
    if (known) return null;

    // If none of the 8 neighbors are known → truly unfamiliar
    const lat = parseFloat(p.lat.toFixed(GRID_PRECISION));
    const lng = parseFloat(p.lng.toFixed(GRID_PRECISION));
    const step = Math.pow(10, -GRID_PRECISION);
    let neighborHits = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nk = `${(lat + i * step).toFixed(GRID_PRECISION)},${(lng + j * step).toFixed(GRID_PRECISION)}`;
        if (this.cells.has(nk)) neighborHits++;
      }
    }
    if (neighborHits === 0) {
      const confidence = Math.min(1, 0.5 + this.cells.size / 200);
      return { type: 'off_course', cellKey: k, confidence };
    }
    return null;
  }

  reset(): void { this.cells.clear(); }
  size(): number { return this.cells.size; }
  toJSON() { return Array.from(this.cells.entries()); }
  fromJSON(entries: [string, CellData][]) { this.cells = new Map(entries); }
}
