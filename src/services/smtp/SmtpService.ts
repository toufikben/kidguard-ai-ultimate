import { registerPlugin } from '@capacitor/core';
import { enqueue } from '@/services/offline/EncryptedQueue';
import { logger } from '@/utils/logger';

interface SmtpEmailPlugin {
  send(opts: {
    host: string;
    port: number;
    user: string;
    appPassword: string;
    to: string;
    subject?: string;
    body: string;
    html?: boolean;
  }): Promise<{ success: boolean }>;
}

const SmtpEmail = registerPlugin<SmtpEmailPlugin>('SmtpEmail');

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  appPassword: string;
  to: string;
}

export async function sendSmtp(
  cfg: SmtpConfig,
  subject: string,
  body: string,
  html = true
): Promise<boolean> {
  try {
    const res = await SmtpEmail.send({ ...cfg, subject, body, html });
    logger.info('smtp: sent', subject);
    return res.success;
  } catch (e) {
    logger.error('smtp: failed — queuing', e);
    // Fallback: enqueue for retry when network returns
    try {
      await enqueue('smtp', { cfg, subject, body, html }, cfg.user);
    } catch (err) {
      logger.error('smtp: enqueue failed', err);
    }
    return false;
  }
}

/**
 * Build a rich HTML email with map deep-link.
 */
export function buildAlertEmail(opts: {
  title: string;
  message: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  timestamp?: number;
  severity: string;
  appDeepLink?: string;
}): string {
  const mapUrl = opts.lat && opts.lng
    ? `https://www.openstreetmap.org/?mlat=${opts.lat}&mlon=${opts.lng}#map=17/${opts.lat}/${opts.lng}`
    : '';

  const color = opts.severity === 'critical' ? '#DC2626'
    : opts.severity === 'high' ? '#EF4444'
    : opts.severity === 'medium' ? '#F59E0B'
    : '#3B82F6';

  return `
<!doctype html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="margin:0;background:#0B1220;font-family:system-ui,-apple-system,sans-serif;color:#fff">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:linear-gradient(135deg,${color},#1E293B);padding:20px;border-radius:16px 16px 0 0">
      <h1 style="margin:0;font-size:20px">🛡️ KidGuard AI Ultimate</h1>
      <p style="margin:8px 0 0;opacity:.9;font-size:14px">${opts.title}</p>
    </div>
    <div style="background:#111827;padding:24px;border-radius:0 0 16px 16px">
      <div style="background:${color}22;border:1px solid ${color}66;border-radius:12px;padding:16px;margin-bottom:16px">
        <div style="font-weight:700;color:${color};margin-bottom:6px">${opts.severity.toUpperCase()}</div>
        <div style="font-size:14px;line-height:1.6">${opts.message}</div>
      </div>

      ${opts.lat ? `
      <div style="background:#0B1220;padding:16px;border-radius:12px;margin-bottom:16px">
        <div style="font-size:12px;color:#94A3B8;margin-bottom:6px">📍 الموقع</div>
        <div style="font-family:monospace;font-size:13px">${opts.lat.toFixed(6)}, ${opts.lng?.toFixed(6)}</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px">
          دقة: ±${Math.round(opts.accuracy ?? 0)}م
          ${opts.timestamp ? ` • ${new Date(opts.timestamp).toLocaleString('ar-DZ')}` : ''}
        </div>
        ${mapUrl ? `<a href="${mapUrl}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">فتح الخريطة →</a>` : ''}
      </div>` : ''}

      <div style="text-align:center;font-size:11px;color:#64748B;margin-top:24px">
        هذه رسالة تلقائية من KidGuard AI Ultimate<br>
        جميع البيانات مشفرة ولا تُخزَّن على أي سيرفر مركزي.
      </div>
    </div>
  </div>
</body>
</html>`;
}
