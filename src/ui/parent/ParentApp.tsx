import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/ui/components/Navbar';
import ParentDashboard from './ParentDashboard';
import LiveMapTab from './LiveMap';
import AntiTheftPanel from './AntiTheftPanel';
import WeeklyReport from './WeeklyReport';
import SettingsModal from '@/ui/components/SettingsModal';
import { useState } from 'react';

export default function ParentApp() {
  const { t } = useTranslation();
  const { activeTab } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {activeTab === 'home' && <ParentDashboard />}

      {activeTab === 'map' && <LiveMapTab />}

      {activeTab === 'zones' && (
        <div className="p-4 pb-24 space-y-4">
          <h2 className="text-lg font-bold px-1">{t('nav.zones')}</h2>
          <AntiTheftPanel />
        </div>
      )}

      {activeTab === 'report' && (
        <div className="p-4 pb-24">
          <WeeklyReport />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="p-4 pb-24">
          <button
            onClick={() => setShowSettings(true)}
            className="btn-primary w-full"
          >
            {t('nav.settings')}
          </button>
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
      )}

      <Navbar />
    </>
  );
}
