import { useEffect, useRef, useState } from 'react';
import { startBackgroundLocation, stopBackgroundLocation } from '@/services/location/BackgroundLocation';
import { SensorFusion } from '@/services/location/SensorFusion';
import { MockDetector } from '@/services/location/MockDetector';
import type { GeoPoint, MotionData } from '@/types';

export function useLocation(active: boolean) {
  const fusionRef = useRef(new SensorFusion());
  const mockRef = useRef(new MockDetector());
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [mockScore, setMockScore] = useState(0);

  useEffect(() => {
    if (!active) return;
    let mounted = true;

    (async () => {
      await startBackgroundLocation((p) => {
        if (!mounted) return;
        fusionRef.current.updateLocation(p);
        mockRef.current.push(p, fusionRef.current.get().motion);
        setPoint(fusionRef.current.get().location);
        setMockScore(mockRef.current.score());
      });
    })();

    const onMotion = (e: Event) => {
      const m = (e as CustomEvent<MotionData>).detail;
      fusionRef.current.updateMotion(m);
    };
    window.addEventListener('kg:motion', onMotion);

    return () => {
      mounted = false;
      stopBackgroundLocation();
      window.removeEventListener('kg:motion', onMotion);
    };
  }, [active]);

  return {
    point,
    mockScore,
    fusion: fusionRef.current,
    confidence: fusionRef.current.get().confidence,
  };
}
