import { useEffect, useRef, useState } from 'react';
import { HeartRateService } from '@/services/heartrate/HeartRateService';
import type { HeartRateReading } from '@/types';

export function useHeartRate(enabled: boolean, isMoving: boolean) {
  const svcRef = useRef(new HeartRateService());
  const [last, setLast] = useState<HeartRateReading | null>(null);
  const [anomaly, setAnomaly] = useState<{ bpm: number; reason: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    (async () => {
      const ok = await svcRef.current.connect();
      if (!ok) return;
      const id = setInterval(() => {
        if (!mounted) return;
        setLast(svcRef.current.getLast());
        setAnomaly(svcRef.current.detectAnomaly(isMoving));
      }, 5000);
      return () => clearInterval(id);
    })();
    return () => {
      mounted = false;
      svcRef.current.disconnect();
    };
  }, [enabled, isMoving]);

  return { last, anomaly };
}
