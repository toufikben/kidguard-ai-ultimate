// ═══════════════════════════════════════════════════════════
// WebRTC Manager — P2P DataChannel for real-time updates
// Privacy: signaling goes through Supabase, DATA goes P2P.
// Payloads on the wire are already E2EE (see crypto/e2ee.ts).
// ═══════════════════════════════════════════════════════════

import SimplePeer from 'simple-peer';
import { SignalingChannel } from './signaling';
import { logger } from '@/utils/logger';

export type ConnectionState =
  | 'idle'
  | 'signaling'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'closed';

export type DataHandler = (data: unknown) => void;

export interface WebRTCOptions {
  selfDeviceId: string;
  peerDeviceId: string;
  /** true = the parent (or the one who initiates) */
  initiator: boolean;
  onStateChange?: (state: ConnectionState) => void;
  onData?: DataHandler;
}

export class WebRTCManager {
  private peer: SimplePeer.Instance | null = null;
  private signaling: SignalingChannel;
  private state: ConnectionState = 'idle';
  private dataHandlers: Set<DataHandler> = new Set();
  private reconnectTimer: number | null = null;

  constructor(private readonly opts: WebRTCOptions) {
    this.signaling = new SignalingChannel(opts.selfDeviceId, opts.peerDeviceId);
  }

  start(): void {
    if (this.peer) return;
    this.setState('signaling');

    this.signaling.start();
    this.signaling.onSignal((payload) => this.handleSignal(payload));

    // Give signaling a moment to subscribe before creating peer
    setTimeout(() => this.createPeer(this.opts.initiator), 500);
  }

  private createPeer(initiator: boolean): void {
    logger.info('webrtc: creating peer', { initiator });

    this.peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          // NOTE: add TURN server here for production reliability
        ],
      },
    });

    this.peer.on('signal', (data) => {
      this.signaling.send({ type: 'signal', data });
    });

    this.peer.on('connect', () => {
      logger.info('webrtc: connected');
      this.setState('connected');
    });

    this.peer.on('data', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());
        for (const h of this.dataHandlers) h(parsed);
        this.opts.onData?.(parsed);
      } catch (e) {
        logger.error('webrtc: bad data', e);
      }
    });

    this.peer.on('error', (err) => {
      logger.error('webrtc: error', err);
      this.setState('failed');
      this.scheduleReconnect();
    });

    this.peer.on('close', () => {
      logger.info('webrtc: closed');
      this.setState('closed');
      this.scheduleReconnect();
    });
  }

  private handleSignal(payload: Record<string, unknown>): void {
    if (payload.type === 'signal' && this.peer) {
      this.peer.signal(payload.data as SimplePeer.SignalData);
    }
  }

  private setState(s: ConnectionState): void {
    this.state = s;
    this.opts.onStateChange?.(s);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      logger.info('webrtc: attempting reconnect');
      this.destroy();
      this.start();
    }, 5000);
  }

  send(data: unknown): boolean {
    if (!this.peer || this.state !== 'connected') return false;
    try {
      this.peer.send(JSON.stringify(data));
      return true;
    } catch (e) {
      logger.error('webrtc: send failed', e);
      return false;
    }
  }

  onData(handler: DataHandler): () => void {
    this.dataHandlers.add(handler);
    return () => this.dataHandlers.delete(handler);
  }

  getState(): ConnectionState {
    return this.state;
  }

  destroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.peer?.destroy();
    this.peer = null;
    this.signaling.stop();
    this.setState('idle');
  }
}
