import { useEffect, useState } from 'react';
import { ShieldCheck, Radio, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useLocation } from '@/hooks/useLocation';
import { useWebRTC } from '@/hooks/useWebRTC';
import SilentMode from './SilentMode';
import CheckInPrompt from './CheckInPrompt';
import SettingsModal from '@/ui/components/SettingsModal';
import { escalate } from '@/core/AlertEscalation';
import { haversineMeters } from '@/utils/geo';

export default function ChildView() {
  const {
    deviceId, pairedWith, safeZones, currentLocation, setCurrentLocation,
  } = useAppStore();

  const [showSettings, setShowSettings] = useState(false);
  const [inZone, setInZone] = useState(true);

  const { point } = useLocation(true);
  const { lastPeer } = useHeartbeat(deviceId, pairedWith, 'send');
  const { state: rtcState, send } = useWebRTC(deviceId, pairedWith, false);

  useEffect(() => {
    if (point) setCurrentLocation(point);
  }, [point, setCurrentLocation]);

  // Broadcast location via P2P when connected
  useEffect(() => {
    if (rtcState === 'connected' && currentLocation) {
      send({ type: 'location', payload: currentLocation });
    }
  }, [rtcState, currentLocation, send]);

  // Zone check
  useEffect(() => {
    if (!currentLocation || safeZones.length === 0) return;
    const inside = safeZones.some(
      (z) => haversineMeters(currentLocation, z.center) <= z.radius
    );
    if (!inside && inZone) {
      escalate({
        title: 'خروج من المنطقة الآمنة',
        body: `أنت الآن خارج: ${safeZones.map((z) => z.name).join(', ')}`,
        severity: 'medium',
      });
    }
    setInZone(inside);
  }, [currentLocation, safeZones, inZone]);

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-500 to-primary-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-sm font-bold">أنت محمي 🛡️</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {deviceId?.slice(0, 8)}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      <div className={`glass rounded-2xl p-4 border ${
        inZone ? 'border-success-500/30' : 'border-warn-500/40'
      }`}>
        <div className="flex items-center gap-2">
          <Radio size={16} className={inZone ? 'text-success-400' : 'text-warn-400'} />
          <span className="text-sm font-medium">
            {inZone ? 'داخل المنطقة الآمنة' : 'خارج المنطقة الآمنة'}
          </span>
        </div>
        {currentLocation && (
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
          </div>
        )}
      </div>

      <SilentMode />

      <button
        onClick={() => escalate({
          title: 'استغاثة',
          body: 'الطفل أرسل نداء استغاثة',
          severity: 'critical',
        })}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-danger-600 to-danger-500 text-white font-bold flex items-center justify-center gap-2 shadow-danger active:scale-95 transition-all"
      >
        <AlertTriangle size={22} />
        استغاثة SOS
      </button>

      {lastPeer && (
        <div className="text-center text-[10px] text-slate-500">
          الوالد متصل • RTC: {rtcState}
        </div>
      )}

      <CheckInPrompt />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
