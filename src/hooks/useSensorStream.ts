import { useEffect } from 'react';
import { Motion } from '@capacitor/motion';
import type { MotionData } from '@/types';

/**
 * Streams accelerometer + gyroscope as kg:motion events.
 * Consumers: MotionSignature, AntiTheftMode, SensorFusion.
 */
export function useSensorStream(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let last: MotionData = {
      accel: { x: 0, y: 0, z: 0 },
      gyro: { x: 0, y: 0, z: 0 },
      magnitude: 0,
      timestamp: 0,
    };

    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      const r = e.rotationRate;
      if (!a) return;

      const ax = a.x ?? 0, ay = a.y ?? 0, az = a.z ?? 0;
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);

      last = {
        accel: { x: ax, y: ay, z: az },
        gyro: {
          x: r?.alpha ?? 0,
          y: r?.beta ?? 0,
          z: r?.gamma ?? 0,
        },
        magnitude: mag,
        timestamp: Date.now(),
      };
      window.dispatchEvent(new CustomEvent('kg:motion', { detail: last }));
    };

    (async () => {
      try {
        await Motion.addListener('accel', (event) => {
          const a = event.acceleration;
          const mag = Math.sqrt(
            (a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2
          );
          const data: MotionData = {
            accel: { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0 },
            gyro: { x: 0, y: 0, z: 0 },
            magnitude: mag,
            timestamp: Date.now(),
          };
          window.dispatchEvent(new CustomEvent('kg:motion', { detail: data }));
        });
      } catch {
        window.addEventListener('devicemotion', handler);
      }
    })();

    return () => {
      window.removeEventListener('devicemotion', handler);
    };
  }, [active]);
}
