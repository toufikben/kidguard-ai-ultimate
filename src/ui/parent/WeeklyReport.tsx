import { BarChart3, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function WeeklyReport() {
  const { incidents, peerHeartbeat } = useAppStore();

  const last7 = incidents.filter(
    (i) => Date.now() - i.startedAt < 7 * 24 * 3600 * 1000
  );
  const resolved = last7.filter((i) => i.resolvedAt).length;

  const byType = last7.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-primary-400" />
          <h3 className="font-semibold">التقرير الأسبوعي</h3>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <Metric label="حوادث" value={last7.length} icon={<AlertCircle size={14} />} />
          <Metric label="تم الحل" value={resolved} icon={<CheckCircle2 size={14} />} />
          <Metric
            label="آخر نبض"
            value={peerHeartbeat
              ? `${Math.round((Date.now() - peerHeartbeat.timestamp) / 60000)}د`
              : '—'}
            icon={<Clock size={14} />}
          />
        </div>

        <div className="space-y-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            حسب النوع
          </div>
          {Object.keys(byType).length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">لا حوادث هذا الأسبوع ✅</p>
          )}
          {Object.entries(byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
              <span className="text-xs">{type}</span>
              <span className="text-xs font-mono text-primary-400">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          آخر الحوادث
        </div>
        {incidents.slice(0, 10).map((i) => (
          <div key={i.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <div className={`w-2 h-2 rounded-full ${
              i.severity === 'critical' ? 'bg-danger-500' :
              i.severity === 'high' ? 'bg-danger-400' :
              i.severity === 'medium' ? 'bg-warn-500' : 'bg-primary-500'
            }`} />
            <div className="flex-1">
              <div className="text-xs font-medium">{i.type}</div>
              <div className="text-[10px] text-slate-500">
                {new Date(i.startedAt).toLocaleString('ar-DZ')}
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              i.resolvedAt ? 'bg-success-500/20 text-success-400' : 'bg-danger-500/20 text-danger-400'
            }`}>
              {i.resolvedAt ? 'محلول' : 'نشط'}
            </span>
          </div>
        ))}
        {incidents.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">سجل نظيف 🎉</p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-white/5">
      <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1">
        {icon}{label}
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
