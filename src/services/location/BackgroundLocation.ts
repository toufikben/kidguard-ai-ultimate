import { registerPlugin } from '@capacitor/core';
import type {
  BackgroundGeolocationPlugin,
  CallbackError,
  Location,
} from '@capacitor-community/background-geolocation';
import type { GeoPoint } from '@/types';
import { logger } from '@/utils/logger';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export type LocationCallback = (p: GeoPoint) => void;

let watcherId: string | null = null;

export async function startBackgroundLocation(
  onUpdate: LocationCallback,
  intervalMs = 30_000
): Promise<void> {
  if (watcherId) return;

  watcherId = await BackgroundGeolocation.addWatcher(
    {
      backgroundMessage: 'KidGuard is protecting this device.',
      backgroundTitle: 'KidGuard active',
      requestPermissions: true,
      stale: false,
      distanceFilter: 5,
    },
    (location?: Location, error?: CallbackError) => {
      if (error) {
        logger.error('bg location error', error);
        return;
      }
      if (!location) return;
      onUpdate({
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy ?? 10,
        altitude: location.altitude ?? undefined,
        speed: location.speed ?? undefined,
        heading: location.bearing ?? undefined,
        timestamp: location.time ?? Date.now(),
        source: 'gps',
        isMocked: location.simulated,
      });
    }
  );

  logger.info('bg location: started', { watcherId, intervalMs });
}

export async function stopBackgroundLocation(): Promise<void> {
  if (!watcherId) return;
  try {
    await BackgroundGeolocation.removeWatcher({ id: watcherId });
  } catch (e) {
    logger.warn('bg location remove failed', e);
  }
  watcherId = null;
}
