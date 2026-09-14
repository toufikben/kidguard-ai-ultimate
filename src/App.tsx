import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { ensureAnonymousSession } from '@/services/supabase/auth';
import { initNotifications } from '@/services/notifications/NotificationManager';
import { initCrypto } from '@/crypto/e2ee';
import { getOrCreateIdentity } from '@/crypto/keyExchange';
import { registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { logger } from '@/utils/logger';

import Onboarding from '@/ui/components/Onboarding';
import AlertBanner from '@/ui/components/AlertBanner';
import PairingScreen from '@/ui/components/PairingScreen';
import ParentApp from '@/ui/parent/ParentApp';
import ChildView from '@/ui/child/ChildView';
import { useSensorStream } from '@/hooks/useSensorStream';

import type { DeviceRole } from '@/types';

interface HeartbeatForeground {
  start(): Promise<{ started: boolean }>;
  stop(): Promise<{ stopped: boolean }>;
}
const Foreground = registerPlugin<HeartbeatForeground>('HeartbeatForeground');

export default function App() {
  const { t, i18n } = useTranslation();
  const {
    onboardingDone, role, deviceId, pairedWith, language, theme,
    setDeviceId, setRole, setLanguage, setTheme,
  } = useAppStore();

  const [showPairing, setShowPairing] = useState(false);

  useSensorStream(!!role);

  // Bootstrap
  useEffect(() => {
    (async () => {
      try {
        await initCrypto();
        await getOrCreateIdentity();
        const info = await Device.getId();
        const id = info.identifier || crypto.randomUUID();
        setDeviceId(id);

        await initNotifications();

        if (import.meta.env.VITE_SUPABASE_URL) {
          await ensureAnonymousSession();
        }

        // Start foreground heartbeat service
        try { await Foreground.start(); } catch (e) {
          logger.warn('foreground not available (dev/web)', e);
        }
      } catch (e) {
        logger.error('boot failed', e);
      }
    })();
  }, [setDeviceId]);

  useEffect(() => {
    i18n.changeLanguage(language);
    setLanguage(language);
  }, [language, i18n, setLanguage]);

  useEffect(() => { setTheme(theme); }, [theme, setTheme]);

  if (!onboardingDone) return <Onboarding />;

  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-dark">
        <AlertBanner />
        <div className="glass rounded-3xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-extrabold mb-2 text-center bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            {t('app.name')}
          </h1>
          <p className="text-sm text-slate-400 mb-8 text-center">{t('app.tagline')}</p>
          <p className="text-slate-300 mb-4 text-center text-sm">اختر دور هذا الجهاز</p>
          <div className="space-y-3">
            {(['parent', 'child', 'vehicle'] as DeviceRole[]).map((r) => (
              <button key={r} onClick={() => setRole(r)} className="btn-primary w-full">
                {t(`role.${r}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!pairedWith && !showPairing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-dark">
        <AlertBanner />
        <div className="glass rounded-3xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-3">لم يتم الاقتران بعد</h2>
          <p className="text-sm text-slate-400 mb-6">
            اربط هذا الجهاز بجهاز آخر (والد ↔ طفل) لتفعيل الحماية الكاملة.
          </p>
          <button onClick={() => setShowPairing(true)} className="btn-primary w-full">
            ابدأ الاقتران
          </button>
        </div>
      </div>
    );
  }

  if (showPairing) {
    return <PairingScreen onDone={() => setShowPairing(false)} />;
  }

  return (
    <div className="min-h-screen bg-surface-dark text-white">
      <AlertBanner />
      {role === 'parent' || role === 'vehicle' ? <ParentApp /> : <ChildView />}
    </div>
  );
}
