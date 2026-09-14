import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { DeadManSwitch } from '@/core/DeadManSwitch';

export default function CheckInPrompt() {
  const [visible, setVisible] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [sw] = useState(() => new DeadManSwitch());

  useEffect(() => {
    sw.on((e) => {
      if (e.type === 'expiring') {
        setVisible(true);
        setRemaining(e.remainingMs);
      }
      if (e.type === 'expired') {
        setVisible(true);
        setRemaining(0);
      }
      if (e.type === 'confirmed') setVisible(false);
    });
    sw.arm(60);
    const id = setInterval(() => setRemaining(sw.remainingMs()), 1000);
    return () => clearInterval(id);
  }, [sw]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="glass rounded-3xl p-6 max-w-sm w-full text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-primary-400" />
        <h3 className="text-lg font-bold mb-2">تأكيد الحضور</h3>
        <p className="text-sm text-slate-400 mb-4">
          اضغط الزر لتأكيد أنك بخير.
          <br />
          الوقت المتبقي: <b className="text-primary-400">
            {Math.max(0, Math.round(remaining / 60000))} دقيقة
          </b>
        </p>
        <button
          onClick={() => { sw.confirm(); setVisible(false); }}
          className="btn-primary w-full"
        >
          أنا بخير ✓
        </button>
        <button
          onClick={() => setVisible(false)}
          className="mt-3 text-xs text-slate-500 hover:text-white"
        >
          <X size={14} className="inline" /> لاحقاً
        </button>
      </div>
    </div>
  );
}
