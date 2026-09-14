// ═══════════════════════════════════════════════════════════
// Dead Man's Switch — if child doesn't check-in within window,
// escalate. Detects "child hasn't confirmed" situations.
// ═══════════════════════════════════════════════════════════

import { DEADMAN_DEFAULT_MINUTES } from '@/utils/constants';
import { logger } from '@/utils/logger';

export type DeadManEvent =
  | { type: 'armed'; expiresAt: number }
  | { type: 'confirmed' }
  | { type: 'expiring'; remainingMs: number }
  | { type: 'expired' }
  | { type: 'disarmed' };

export class DeadManSwitch {
  private timer: number | null = null;
  private warnTimer: number | null = null;
  private expiresAt = 0;
  private listeners: Set<(e: DeadManEvent) => void> = new Set();

  on(fn: (e: DeadManEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: DeadManEvent): void {
    for (const l of this.listeners) { try { l(e); } catch {} }
  }

  arm(minutes = DEADMAN_DEFAULT_MINUTES): void {
    this.disarm();
    const ms = minutes * 60_000;
    this.expiresAt = Date.now() + ms;
    this.emit({ type: 'armed', expiresAt: this.expiresAt });

    // warn 5 min before
    const warnAt = Math.max(0, ms - 5 * 60_000);
    this.warnTimer = window.setTimeout(() => {
      this.emit({ type: 'expiring', remainingMs: 5 * 60_000 });
    }, warnAt);

    this.timer = window.setTimeout(() => {
      this.emit({ type: 'expired' });
      logger.warn('deadman: expired');
    }, ms);

    logger.info('deadman: armed for', minutes, 'minutes');
  }

  confirm(): void {
    if (!this.timer) return;
    this.disarm();
    this.emit({ type: 'confirmed' });
    logger.info('deadman: confirmed');
  }

  disarm(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.warnTimer) { clearTimeout(this.warnTimer); this.warnTimer = null; }
    this.expiresAt = 0;
  }

  isArmed(): boolean {
    return this.timer !== null;
  }

  remainingMs(): number {
    if (!this.expiresAt) return 0;
    return Math.max(0, this.expiresAt - Date.now());
  }
}
