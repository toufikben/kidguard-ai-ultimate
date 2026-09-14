import { useEffect, useRef, useState } from 'react';
import { HeartbeatProtocol, type HeartbeatEvent } from '@/core/HeartbeatProtocol';
import type { Heartbeat } from '@/types';

export function useHeartbeat(
  selfDeviceId: string | null,
  peerDeviceId: string | null,
  mode: 'send' | 'watch' | 'both'
) {
  const ref = useRef<HeartbeatProtocol | null>(null);
  const [lastPeer, setLastPeer] = useState<Heartbeat | null>(null);
  const [missed, setMissed] = useState(0);

  useEffect(() => {
    if (!selfDeviceId) return;
    const hb = new HeartbeatProtocol(selfDeviceId);
    ref.current = hb;

    (async () => {
      await hb.initialize();
      if (peerDeviceId) hb.setPeer(peerDeviceId);

      hb.on((e: HeartbeatEvent) => {
        if (e.type === 'peer_alive') { setLastPeer(e.hb); setMissed(0); }
        if (e.type === 'peer_missing') setMissed(e.missed);
      });

      if (mode === 'send' || mode === 'both') hb.startSending();
      if (mode === 'watch' || mode === 'both') hb.startWatching();
    })();

    return () => hb.destroy();
  }, [selfDeviceId, peerDeviceId, mode]);

  return { lastPeer, missed };
}
