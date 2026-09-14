// ═══════════════════════════════════════════════════════════
// Family Mesh — one parent, multiple children / vehicles
// Renders a live status board with priority ordering.
// ═══════════════════════════════════════════════════════════

import type { RiskLevel, Heartbeat, GeoPoint } from '@/types';
import { logger } from '@/utils/logger';

export interface MeshNode {
  deviceId: string;
  label: string;
  role: 'child' | 'vehicle';
  publicKey: string;
  lastHeartbeat?: Heartbeat;
  lastLocation?: GeoPoint;
  severity: RiskLevel;
  updatedAt: number;
}

export class FamilyMesh {
  private nodes: Map<string, MeshNode> = new Map();
  private listeners: Set<(nodes: MeshNode[]) => void> = new Set();

  addNode(node: Omit<MeshNode, 'updatedAt' | 'severity'>): void {
    this.nodes.set(node.deviceId, {
      ...node,
      severity: 'safe',
      updatedAt: Date.now(),
    });
    this.emit();
  }

  removeNode(deviceId: string): void {
    this.nodes.delete(deviceId);
    this.emit();
  }

  updateHeartbeat(deviceId: string, hb: Heartbeat, severity: RiskLevel): void {
    const n = this.nodes.get(deviceId);
    if (!n) return;
    n.lastHeartbeat = hb;
    n.severity = severity;
    n.updatedAt = Date.now();
    this.emit();
  }

  updateLocation(deviceId: string, p: GeoPoint): void {
    const n = this.nodes.get(deviceId);
    if (!n) return;
    n.lastLocation = p;
    n.updatedAt = Date.now();
    this.emit();
  }

  list(): MeshNode[] {
    const arr = Array.from(this.nodes.values());
    const order: Record<RiskLevel, number> = {
      critical: 0, high: 1, medium: 2, low: 3, safe: 4,
    };
    return arr.sort((a, b) => order[a.severity] - order[b.severity]);
  }

  on(fn: (nodes: MeshNode[]) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    const list = this.list();
    for (const l of this.listeners) { try { l(list); } catch {} }
    logger.info('mesh: update', list.length, 'nodes');
  }
}
