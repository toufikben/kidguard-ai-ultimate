import { TrendingUp, TrendingDown, Minus, ShieldCheck } from 'lucide-react';
import type { SafetyScore } from '@/types';

export default function SafetyScoreCard({ score }: { score: SafetyScore | null }) {
  if (!score) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <ShieldCheck size={28} className="mx-auto mb-2 text-slate-500" />
        <p className="text-xs text-slate-500">يتم جمع البيانات لبناء درجة الأمان</p>
      </div>
    );
  }

  const tone =
    score.score >= 80 ? 'text-success-400' :
    score.score >= 60 ? 'text-primary-400' :
    score.score >= 40 ? 'text-warn-400' : 'text-danger-400';

  const Trend = score.trend === 'improving' ? TrendingUp
    : score.trend === 'declining' ? TrendingDown : Minus;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          درجة الأمان المتوقعة
        </div>
        <Trend size={18} className={
          score.trend === 'improving' ? 'text-success-400' :
          score.trend === 'declining' ? 'text-danger-400' : 'text-slate-500'
        } />
      </div>

      <div className="flex items-end gap-4 mb-5">
        <div className={`text-5xl font-black ${tone}`}>{score.score}</div>
        <div className="text-xs text-slate-500 mb-2">
          <div>من 100</div>
          <div>متوقع 24س: <b className={tone}>{score.predictedNext24h}</b></div>
        </div>
      </div>

      <div className="space-y-2">
        {score.factors.map((f) => (
          <div key={f.name} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 w-20 truncate">{f.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full ${f.impact >= 0 ? 'bg-success-500' : 'bg-danger-500'}`}
                style={{ width: `${Math.min(100, Math.abs(f.impact))}%` }}
              />
            </div>
            <span className={`text-[10px] font-mono w-10 text-right ${
              f.impact >= 0 ? 'text-success-400' : 'text-danger-400'
            }`}>
              {f.impact >= 0 ? '+' : ''}{f.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
