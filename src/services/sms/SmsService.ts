import { registerPlugin } from '@capacitor/core';
import { enqueue } from '@/services/offline/EncryptedQueue';
import { logger } from '@/utils/logger';

interface AutomaticSmsPlugin {
  send(opts: { to: string; body: string }): Promise<{ success: boolean }>;
}

const AutomaticSms = registerPlugin<AutomaticSmsPlugin>('AutomaticSms');

export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!to) return false;
  try {
    const res = await AutomaticSms.send({ to, body: body.slice(0, 160 * 3) });
    logger.info('sms: sent');
    return res.success;
  } catch (e) {
    logger.error('sms: failed — queuing', e);
    try { await enqueue('sms', { to, body }, to); } catch {}
    return false;
  }
}

export function buildSmsBody(opts: {
  title: string;
  lat?: number;
  lng?: number;
  timestamp?: number;
}): string {
  const parts = [`[KidGuard] ${opts.title}`];
  if (opts.lat) {
    parts.push(`📍 https://www.openstreetmap.org/?mlat=${opts.lat}&mlon=${opts.lng}#map=17/${opts.lat}/${opts.lng}`);
  }
  if (opts.timestamp) {
    parts.push(new Date(opts.timestamp).toLocaleString('ar-DZ'));
  }
  return parts.join('\n');
}
