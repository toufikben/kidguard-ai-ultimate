import { useEffect, useRef, useState } from 'react';
import { WebRTCManager, type ConnectionState } from '@/p2p/WebRTCManager';

export function useWebRTC(
  selfDeviceId: string | null,
  peerDeviceId: string | null,
  initiator: boolean,
  onData?: (data: unknown) => void
) {
  const ref = useRef<WebRTCManager | null>(null);
  const [state, setState] = useState<ConnectionState>('idle');

  useEffect(() => {
    if (!selfDeviceId || !peerDeviceId) return;
    const mgr = new WebRTCManager({
      selfDeviceId,
      peerDeviceId,
      initiator,
      onStateChange: setState,
      onData,
    });
    ref.current = mgr;
    mgr.start();
    return () => mgr.destroy();
  }, [selfDeviceId, peerDeviceId, initiator]);

  return {
    state,
    send: (d: unknown) => ref.current?.send(d),
    manager: ref.current,
  };
}
