import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DeviceRole } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

// Placeholder shell — full implementation arrives in Part 4
export default function App() {
  const { t } = useTranslation();
  const [role, setRole] = useState<DeviceRole | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    if (saved) {
      try { setRole(JSON.parse(saved).role ?? null); } catch {}
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-dark">
      <div className="glass rounded-3xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          {t('app.name')}
        </h1>
        <p className="text-sm text-slate-400 mb-8">{t('app.tagline')}</p>

        {!role ? (
          <div className="space-y-3">
            <p className="text-slate-300 mb-4">اختر دور الجهاز للبدء</p>
            {(['parent', 'child', 'vehicle'] as DeviceRole[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="btn-primary w-full"
              >
                {t(`role.${r}`)}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-slate-300">
            <p className="mb-2">الدور المختار: <b>{t(`role.${role}`)}</b></p>
            <p className="text-xs text-slate-500 mt-6">
              ⏳ الميزات الكاملة ستُضاف في المراحل 2-5
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-600 mt-8">
        KidGuard AI Ultimate v1.0.0 — Zero-Knowledge • P2P • Local AI
      </p>
    </div>
  );
}
