import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { CHANNELS } from './Channels';
import { NOTIFICATION_CHANNELS } from '@/utils/constants';
import { logger } from '@/utils/logger';

let channelsReady = false;

export async function initNotifications(): Promise<void> {
  if (channelsReady) return;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // Android: create channels
    if ((window as any).Capacitor?.getPlatform?.() === 'android') {
      for (const c of CHANNELS) {
        await LocalNotifications.createChannel({
          id: c.id,
          name: c.name,
          description: c.description,
          importance: c.importance,
          vibration: c.vibration,
          lights: c.lights,
          visibility: c.importance >= 4 ? 1 : 0,
        } as any);
      }
    }
    channelsReady = true;
    logger.info('notifications: channels ready');
  } catch (e) {
    logger.error('notifications init failed', e);
  }
}

export interface NotifyOptions {
  channel?: string;
  title: string;
  body: string;
  vibrate?: boolean;
  critical?: boolean;
  data?: Record<string, unknown>;
}

let nextId = 1;

export async function notify(opts: NotifyOptions): Promise<void> {
  const channel = opts.channel ?? NOTIFICATION_CHANNELS.zone;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: nextId++,
        title: opts.title,
        body: opts.body,
        channelId: channel,
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#3B82F6',
        ongoing: opts.critical === true,
        autoCancel: opts.critical !== true,
        extra: opts.data ?? {},
      }] as any,
    });

    if (opts.vibrate) {
      await Haptics.impact({ style: opts.critical ? ImpactStyle.Heavy : ImpactStyle.Medium });
    }
  } catch (e) {
    logger.error('notify failed', e);
  }
}

export async function clearAll(): Promise<void> {
  await LocalNotifications.removeAllDeliveredNotifications();
}
