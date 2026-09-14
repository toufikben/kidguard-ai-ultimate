import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bell, Shield, Lock, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const s = useAppStore();
  const { settings, updateSettings } = s;

  const [smtp, setSmtp] = useState(settings.smtp ?? {
    host: 'smtp.gmail.com', port: 587, user: '', appPassword: '', to: '',
  });

  const saveSMTP = () => {
    updateSettings({ smtp, notifications: { ...settings.notifications, smtpEnabled: true } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto glass rounded-t-3xl sm:rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{t('nav.settings')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <Section title={t('settings.general')}>
          <Row label={t('settings.language')}><LanguageSwitcher /></Row>
          <Row label={t('settings.theme')}><ThemeToggle /></Row>
        </Section>

        <Section title={t('settings.notifications')} icon={<Bell size={16} />}>
          <Toggle
            label={t('settings.notifications.local')}
            checked={settings.notifications.localEnabled}
            onChange={(v) => updateSettings({
              notifications: { ...settings.notifications, localEnabled: v },
            })}
          />
          <Toggle
            label={t('settings.notifications.sound')}
            checked={settings.notifications.sound}
            onChange={(v) => updateSettings({
              notifications: { ...settings.notifications, sound: v },
            })}
          />
          <Toggle
            label={t('settings.notifications.vibration')}
            checked={settings.notifications.vibration}
            onChange={(v) => updateSettings({
              notifications: { ...settings.notifications, vibration: v },
            })}
          />
        </Section>

        <Section title={t('settings.safety')} icon={<Shield size={16} />}>
          <NumberRow
            label={t('settings.deadmanMinutes')}
            value={settings.deadmanTimerMinutes}
            min={5} max={240}
            onChange={(v) => updateSettings({ deadmanTimerMinutes: v })}
          />
          <TextRow
            label={t('settings.panicWord')}
            value={settings.panicWord}
            onChange={(v) => updateSettings({ panicWord: v })}
          />
        </Section>

        <Section title="SMTP" icon={<Wifi size={16} />}>
          <TextRow label="Host" value={smtp.host} onChange={(v) => setSmtp({ ...smtp, host: v })} />
          <NumberRow label="Port" value={smtp.port} min={1} max={65535} onChange={(v) => setSmtp({ ...smtp, port: v })} />
          <TextRow label="User" value={smtp.user} onChange={(v) => setSmtp({ ...smtp, user: v })} />
          <TextRow label="App Password" type="password" value={smtp.appPassword} onChange={(v) => setSmtp({ ...smtp, appPassword: v })} />
          <TextRow label="To" value={smtp.to} onChange={(v) => setSmtp({ ...smtp, to: v })} />
          <button onClick={saveSMTP} className="btn-primary w-full mt-2">{t('actions.save')}</button>
        </Section>

        <Section title={t('settings.privacy')} icon={<Lock size={16} />}>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t('settings.privacy.body')}
          </p>
        </Section>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
          {s.connectionState === 'connected'
            ? <><Wifi size={14} className="text-success-400" /> {t('status.connected')}</>
            : <><WifiOff size={14} className="text-slate-500" /> {t('status.disconnected')}</>}
          <span>•</span>
          <Smartphone size={14} />
          <span className="font-mono text-[10px]">{s.deviceId?.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">
        {icon}{title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-2"
    >
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-white/10'
      }`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
          checked ? 'left-5 rtl:left-auto rtl:right-5' : 'left-0.5 rtl:left-auto rtl:right-0.5'
        }`} />
      </span>
    </button>
  );
}

function TextRow({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-slate-300 w-32">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
      />
    </div>
  );
}

function NumberRow({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-slate-300 w-32">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
      />
    </div>
  );
}
