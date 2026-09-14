import { useState } from 'react';
import { Moon, Check } from 'lucide-react';

export default function SilentMode() {
  const [active, setActive] = useState(false);
  const [until, setUntil] = useState(30);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Moon size={16} className="text-primary-400" />
        <h3 className="text-sm font-semibold">الوضع الصامت المشروع</h3>
      </div>

      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
        عند تفعيله، لن تصلك تنبيهات صوتية لمدة محددة. الوالد سيرى حالتك
        كـ "صامت مشروع" — مفيد في المسجد، القسم، أو الاجتماعات.
      </p>

      <div className="flex gap-2 mb-3">
        {[15, 30, 60, 120].map((m) => (
          <button
            key={m}
            onClick={() => setUntil(m)}
            className={`flex-1 py-2 rounded-lg text-xs transition-all ${
              until === m ? 'bg-primary-600 text-white' : 'bg-white/5 text-slate-400'
            }`}
          >
            {m}د
          </button>
        ))}
      </div>

      <button
        onClick={() => setActive(!active)}
        className={active ? 'btn-ghost w-full flex items-center justify-center gap-2' : 'btn-primary w-full flex items-center justify-center gap-2'}
      >
        {active ? <><Check size={16} /> إلغاء الوضع الصامت</> : `تفعيل لمدة ${until} دقيقة`}
      </button>
    </div>
  );
}
