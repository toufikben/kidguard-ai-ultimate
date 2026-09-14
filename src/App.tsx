import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { ensureAnonymousSession } from '@/services/supabase/auth';
import { initNotifications } from '@/services/notifications/NotificationManager';
import { initCrypto } from '@/crypto/e2ee';
import { getOrCreateIdentity } from '@/crypto/keyExchange';
import { logger } from '@/utils/logger';
import { Device } from '@capacitor/device';
import Onboarding from '@/ui/components/Onboarding';
import AlertBanner from '@/ui/components/AlertBanner';
import ParentApp from '@/ui/parent/ParentApp';
import ChildView from '@/ui/child/ChildView';
import type { DeviceRole } from '@/types';

export default function App() {
  const { t, i18n } = useTranslation();
  const {
    onboardingDone, role, deviceId, language, theme,
    setDeviceId, setRole, setLanguage, setTheme,
  } = useAppStore();

  // Bootstrap
  useEffect(() => {
    (async () => {
      try {
        await initCrypto();
        const identity = await getOrCreateIdentity();
        const info = await Device.getId();
        const id = info.identifier || crypto.randomUUID();
        setDeviceId(id);
        logger.info('boot: identity ready', identity.publicKey.slice(0, 16));

        await initNotifications();

        // Supabase is optional — app works without it
        if (import.meta.env.VITE_SUPABASE_URL) {
          await ensureAnonymousSession();
        }
      } catch (e) {
        logger.error('boot failed', e);
      }
    })();
  }, [setDeviceId]);

  // Sync language + theme
  useEffect(() => {
    i18n.changeLanguage(language);
    setLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language, i18n, setLanguage]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

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
              <button
                key={r}
                onClick={() => setRole(r)}
                className="btn-primary w-full"
              >
                {t(`role.${r}`)}
              </button>
            ))}
          </div>
          {deviceId && (
            <div className="text-[10px] text-slate-500 text-center mt-6 font-mono">
              {deviceId.slice(0, 12)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark text-white">
      <AlertBanner />
      {role === 'parent' || role === 'vehicle' ? <ParentApp /> : <ChildView />}
    </div>
  );
}
