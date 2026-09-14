import { useState } from 'react';
import { Car, Bike, Shield, ShieldOff, Plus, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AntiTheftMode } from '@/core/AntiTheftMode';
import { ANTITHEFT_DEFAULT_RADIUS_M } from '@/utils/constants';
import type { AntiTheftZone, GeoPoint } from '@/types';

export default function AntiTheftPanel() {
  const { antiTheftZones, addAntiTheftZone, updateAntiTheftZone, removeAntiTheftZone,
    currentLocation } = useAppStore();

  const [label, setLabel] = useState('');
  const [type, setType] = useState<'car' | 'bike'>('car');

  const createZone = () => {
    if (!currentLocation) return;
    const z: AntiTheftZone = {
      id: crypto.randomUUID(),
      name: label || (type === 'car' ? 'سيارة' : 'دراجة'),
      center: { lat: currentLocation.lat, lng: currentLocation.lng },
      radius: ANTITHEFT_DEFAULT_RADIUS_M,
      sensitivity: 0.5,
      enabled: false,
      lastMovementAt: 0,
    };
    addAntiTheftZone(z);
    setLabel('');
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold">وضع مكافحة السرقة</h3>
        </div>

        <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
          ثبّت الهاتف في السيارة/الدراجة. عند أي حركة مشبوهة وأنت لست قريباً،
          سيبدأ التتبع التلقائي ويصلك تنبيه.
        </p>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setType('car')}
            className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
              type === 'car'
                ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                : 'border-white/10 text-slate-400'
            }`}
          >
            <Car size={18} /> سيارة
          </button>
          <button
            onClick={() => setType('bike')}
            className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
              type === 'bike'
                ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                : 'border-white/10 text-slate-400'
            }`}
          >
            <Bike size={18} /> دراجة
          </button>
        </div>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="اسم (مثال: سيارة أبي)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:border-primary-500"
        />

        <button
          onClick={createZone}
          disabled={!currentLocation}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus size={16} /> إنشاء منطقة حماية
        </button>

        {!currentLocation && (
          <p className="text-[10px] text-warn-400 mt-2 text-center">
            انتظر تحديد الموقع أولاً
          </p>
        )}
      </div>

      {antiTheftZones.map((z) => (
        <AntiTheftCard
          key={z.id}
          zone={z}
          onToggle={() => updateAntiTheftZone(z.id, { enabled: !z.enabled })}
          onSensitivity={(v) => updateAntiTheftZone(z.id, { sensitivity: v })}
          onDelete={() => removeAntiTheftZone(z.id)}
          currentLocation={currentLocation}
        />
      ))}
    </div>
  );
}

function AntiTheftCard({
  zone, onToggle, onSensitivity, onDelete, currentLocation,
}: {
  zone: AntiTheftZone;
  onToggle: () => void;
  onSensitivity: (v: number) => void;
  onDelete: () => void;
  currentLocation: GeoPoint | null;
}) {
  return (
    <div className={`glass rounded-2xl p-4 border ${
      zone.enabled ? 'border-primary-500/40' : 'border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className={zone.enabled ? 'text-primary-400' : 'text-slate-500'} />
          <span className="font-semibold text-sm">{zone.name}</span>
        </div>
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-colors ${
            zone.enabled
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          {zone.enabled ? <Shield size={16} /> : <ShieldOff size={16} />}
        </button>
      </div>

      <div className="text-[10px] text-slate-500 mb-3 font-mono">
        {zone.center.lat.toFixed(5)}, {zone.center.lng.toFixed(5)} • {zone.radius}m
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>الحساسية</span>
          <span>{Math.round(zone.sensitivity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={zone.sensitivity * 100}
          onChange={(e) => onSensitivity(Number(e.target.value) / 100)}
          className="w-full accent-primary-500"
        />
      </div>

      <button
        onClick={onDelete}
        className="text-[10px] text-danger-400 hover:underline"
      >
        حذف
      </button>
    </div>
  );
}
