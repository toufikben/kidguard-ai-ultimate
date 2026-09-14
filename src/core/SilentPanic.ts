// ═══════════════════════════════════════════════════════════
// Silent Panic — listens for a secret word (offline speech-to-text)
// When heard, sends silent SOS without sound/vibration on child's device.
// ═══════════════════════════════════════════════════════════

import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { PANIC_WORDS } from '@/utils/constants';
import { logger } from '@/utils/logger';

export type PanicEvent = { type: 'panic'; word: string; timestamp: number };

export class SilentPanic {
  private listening = false;
  private listeners: Set<(e: PanicEvent) => void> = new Set();
  private customWord: string | null = null;

  setCustomWord(w: string): void {
    this.customWord = w.trim().toLowerCase();
  }

  on(fn: (e: PanicEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: PanicEvent): void {
    for (const l of this.listeners) { try { l(e); } catch {} }
  }

  async start(): Promise<void> {
    if (this.listening) return;
    try {
      const perm = await SpeechRecognition.checkPermissions();
      if (perm.speechRecognition !== 'granted') {
        await SpeechRecognition.requestPermissions();
      }

      await SpeechRecognition.start({
        language: 'ar-DZ',
        partialResults: true,
        popup: false,
      } as any);

      SpeechRecognition.addListener('partialResults', (data: any) => {
        const matches: string[] = data?.matches ?? [];
        for (const m of matches) {
          const normalized = m.toLowerCase();
          const hit =
            (this.customWord && normalized.includes(this.customWord)) ||
            PANIC_WORDS.some((w) => normalized.includes(w.toLowerCase()));
          if (hit) {
            this.emit({ type: 'panic', word: m, timestamp: Date.now() });
            logger.security('panic word heard', m);
          }
        }
      });

      this.listening = true;
      logger.info('panic: listening started');
    } catch (e) {
      logger.error('panic: start failed', e);
    }
  }

  async stop(): Promise<void> {
    if (!this.listening) return;
    try {
      await SpeechRecognition.stop();
    } catch {}
    this.listening = false;
    logger.info('panic: stopped');
  }
}
