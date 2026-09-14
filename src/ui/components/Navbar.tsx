import { useTranslation } from 'react-i18next';
import { Home, Map, Shield, BarChart3, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const TABS = [
  { key: 'home', icon: Home },
  { key: 'map', icon: Map },
  { key: 'zones', icon: Shield },
  { key: 'report', icon: BarChart3 },
  { key: 'settings', icon: Settings },
] as const;

export default function Navbar() {
  const { t } = useTranslation();
  const { activeTab, setActiveTab, currentRisk } = useAppStore();

  const riskColor: Record<string, string> = {
    safe: 'bg-success-500',
    low: 'bg-primary-500',
    medium: 'bg-warn-500',
    high: 'bg-danger-500',
    critical: 'bg-danger-600 animate-pulse',
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-white/10 pb-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-5 h-16">
        {TABS.map(({ key, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label={t(`nav.${key}`)}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 bg-primary-400 rounded-b-full" />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{t(`nav.${key}`)}</span>
              {key === 'home' && currentRisk === 'critical' && (
                <span className={`absolute top-2 right-4 w-2 h-2 rounded-full ${riskColor.critical}`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
