// ═══════════════════════════════════════════════════════════
// Alert Escalation — 4 levels, adapts by severity & context
// ═══════════════════════════════════════════════════════════

import type { RiskLevel } from '@/types';
import { notify } from '@/services/notifications/NotificationManager';
import { NOTIFICATION_CHANNELS } from '@/utils/constants';
import { logger } from '@/utils/logger';

export interface EscalationPayload {
  title: string;
  body: string;
  severity: RiskLevel;
  data?: Record<string, unknown>;
}

const LEVEL_TO_CHANNEL: Record<RiskLevel, string> = {
  safe: NOTIFICATION_CHANNELS.heartbeat,
  low: NOTIFICATION_CHANNELS.heartbeat,
  medium: NOTIFICATION_CHANNELS.zone,
  high: NOTIFICATION_CHANNELS.antitheft,
  critical: NOTIFICATION_CHANNELS.critical,
};

const LEVEL_TO_VIBRATE: Record<RiskLevel, boolean> = {
  safe: false, low: false, medium: true, high: true, critical: true,
};

const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 60_000;

export async function escalate(payload: EscalationPayload): Promise<void> {
  const key = `${payload.severity}:${payload.title}`;
  const last = cooldownMap.get(key) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) {
    logger.info('escalation: cooldown skipped', key);
    return;
  }
  cooldownMap.set(key, Date.now());

  await notify({
    channel: LEVEL_TO_CHANNEL[payload.severity],
    title: payload.title,
    body: payload.body,
    vibrate: LEVEL_TO_VIBRATE[payload.severity],
    critical: payload.severity === 'critical',
    data: payload.data,
  });

  logger.info('escalation:', payload.severity, payload.title);
}
