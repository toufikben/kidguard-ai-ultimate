import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import type { GeoPoint } from '@/types';
import { haversineMeters } from '@/utils/geo';

interface Props { trail: GeoPoint[]; }

export default function HeatMap({ trail }: Props) {
  const clusters = useMemo(() => {
    const map: { lat: number; lng: number; count: number }[] = [];
    for (const p of trail) {
      const hit = map.find((c) => haversineMeters(c, p) < 80);
      if (hit) hit.count++;
      else map.push({ lat: p.lat, lng: p.lng, count: 1 });
    }
    return map.sort((a, b) => b.count - a.count).slice(0, 8);
  }, [trail]);

  const max = clusters[0]?.count ?? 1;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
        <Flame size={16} className="text-danger-400" />
        الخريطة الحرارية (آخر 7 أيام)
      </div>

      {clusters.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">
          لا توجد بيانات كافية بعد
        </p>
      ) : (
        <div className="space-y-3">
          {clusters.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 text-[10px] text-slate-500 font-mono">#{i + 1}</div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 via-warn-500 to-danger-500"
                    style={{ width: `${(c.count / max) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span className="font-mono">{c.lat.toFixed(4)}, {c.lng.toFixed(4)}</span>
                  <span>{c.count} زيارة</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
