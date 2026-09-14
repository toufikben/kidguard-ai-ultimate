// ═══════════════════════════════════════════════════════════
// Signaling — glue between WebRTC and Supabase Realtime
// ═══════════════════════════════════════════════════════════

import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  subscribeToSignaling,
  sendSignalingMessage,
  type SignalingRow,
} from '@/services/supabase/realtime';
import { logger } from '@/utils/logger';

export type SignalHandler = (payload: Record<string, unknown>) => void;

export class SignalingChannel {
  private channel: RealtimeChannel | null = null;
  private handlers: SignalHandler[] = [];

  constructor(
    private readonly selfDeviceId: string,
    private readonly peerDeviceId: string
  ) {}

  start(): void {
    this.channel = subscribeToSignaling(this.selfDeviceId, (row) => {
      // Filter: only messages from our peer
      if (row.from_device !== this.peerDeviceId) return;
      for (const h of this.handlers) {
        try { h(row.payload); } catch (e) {
          logger.error('signaling handler error', e);
        }
      }
    });
  }

  onSignal(handler: SignalHandler): void {
    this.handlers.push(handler);
  }

  async send(payload: Record<string, unknown>): Promise<void> {
    await sendSignalingMessage(this.selfDeviceId, this.peerDeviceId, payload);
  }

  stop(): void {
    this.channel?.unsubscribe();
    this.channel = null;
    this.handlers = [];
  }
}
