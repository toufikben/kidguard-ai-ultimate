import { useEffect, useState } from 'react';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import LiveMapCore from '@/ui/components/LiveMap';
import { haversineMeters } from '@/utils/geo';
import type { GeoPoint } from '@/types';

export default function LiveMapTab() {
  const {
    peerLocation, peerHeartbeat, safeZones, currentRisk, heartbeatMissed,
  } = useAppStore();

  const [trail, setTrail] = useState<GeoPoint[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!peerLocation) return;
    setTrail((t) => [...t.slice(-100), peerLocation]);
  }, [peerLocation]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const ageSec = peerHeartbeat ? Math.round((now - peerHeartbeat.timestamp) / 1000) : null;

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              ageSec !== null && ageSec < 90 ? 'bg-success-500 animate-pulse' : 'bg-danger-500'
            }`} />
            <span className="text-sm font-semibold">
              {ageSec !== null && ageSec < 90 ? 'مباشر' : 'غير متصل'}
            </span>
          </div>
          <button
            onClick={() => setTrail([])}
            className="p-2 rounded-lg hover:bg-white/10"
            title="مسح المسار"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <Stat
            icon={<MapPin size={14} />}
            label="آخر قراءة"
            value={ageSec !== null ? `${ageSec} ث` : '—'}
          />
          <Stat
            icon={<Navigation size={14} />}
            label="البطارية"
            value={peerHeartbeat ? `${peerHeartbeat.battery}%` : '—'}
          />
          <Stat
            label="فقدان النبض"
            value={`${heartbeatMissed}`}
            accent={heartbeatMissed > 0}
          />
        </div>
      </div>

      <LiveMapCore
        center={peerLocation}
        peer={peerLocation}
        zones={safeZones}
        trail={trail}
        height={380}
      />

      {currentRisk !== 'safe' && (
        <div className="glass rounded-xl p-3 text-xs text-warn-400 border border-warn-500/20">
          ⚠ مستوى الخطر الحالي: <b>{currentRisk}</b>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent }: {
  icon?: React.ReactNode; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5">
      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
        {icon}{label}
      </div>
      <div className={`font-bold ${accent ? 'text-danger-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
