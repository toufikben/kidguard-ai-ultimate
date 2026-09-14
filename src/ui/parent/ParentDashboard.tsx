import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, MapPin, Battery, Wifi, WifiOff, AlertTriangle,
  CheckCircle2, Settings as SettingsIcon, Smartphone,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useWebRTC } from '@/hooks/useWebRTC';
import { escalate } from '@/core/AlertEscalation';
import SettingsModal from '@/ui/components/SettingsModal';
import SafetyScoreCard from './SafetyScoreCard';

export default function ParentDashboard() {
  const { t } = useTranslation();
  const {
    deviceId, pairedWith, peerHeartbeat, currentRisk, safetyScore,
    connectionState, showAlertBanner,
  } = useAppStore();

  const [showSettings, setShowSettings] = useState(false);

  const { lastPeer, missed } = useHeartbeat(
    deviceId,
    pairedWith,
    pairedWith ? 'watch' : 'send'
  );

  const { state: rtcState } = useWebRTC(
    deviceId,
    pairedWith,
    true // parent initiates
  );

  // Escalate on heartbeat loss
  useEffect(() => {
    if (missed >= 3) {
      escalate({
        title: t('alerts.heartbeatLost'),
        body: `لم يصل نبض الطفل منذ ${missed} دورات`,
        severity: 'high',
        data: { kind: 'heartbeat_lost', missed },
      });
      showAlertBanner('high', t('alerts.heartbeatLost'));
    }
  }, [missed, t, showAlertBanner]);

  const riskTone =
    currentRisk === 'critical' ? 'text-danger-400 border-danger-500/40' :
    currentRisk === 'high' ? 'text-danger-400 border-danger-500/30' :
    currentRisk === 'medium' ? 'text-warn-400 border-warn-500/30' :
    'text-success-400 border-success-500/30';

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-sm font-bold">لوحة الوالد</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {deviceId?.slice(0, 8) ?? '—'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Connection + Risk */}
      <div className={`glass rounded-2xl p-4 border ${riskTone}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {connectionState === 'connected' ? (
              <Wifi size={16} className="text-success-400" />
            ) : (
              <WifiOff size={16} className="text-slate-500" />
            )}
            <span className="text-xs font-medium">
              {connectionState === 'connected' ? t('status.connected') : t('status.disconnected')}
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${riskTone}`}>
            {t(`status.${currentRisk}`)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="flex items-center gap-1 text-slate-400">
            <MapPin size={12} />
            {peerHeartbeat ? 'متصل' : '—'}
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Battery size={12} />
            {peerHeartbeat ? `${peerHeartbeat.battery}%` : '—'}
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <AlertTriangle size={12} />
            {missed} فقدان
          </div>
        </div>
      </div>

      {/* Safety Score */}
      <SafetyScoreCard score={safetyScore} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => escalate({
            title: 'طلب تحقق',
            body: 'أرسل طلب تحقق من الطفل',
            severity: 'medium',
          })}
          className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/5"
        >
          <CheckCircle2 size={22} className="text-primary-400" />
          <span className="text-xs font-medium">{t('actions.checkIn')}</span>
        </button>

        <button
          onClick={() => showAlertBanner('critical', t('alerts.panicWord'))}
          className="glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/5 border-danger-500/30"
        >
          <AlertTriangle size={22} className="text-danger-400" />
          <span className="text-xs font-medium">اختبار الاستغاثة</span>
        </button>
      </div>

      {/* RTC info */}
      <div className="glass rounded-xl p-3 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <Smartphone size={12} />
          P2P: <b className={rtcState === 'connected' ? 'text-success-400' : 'text-slate-400'}>
            {rtcState}
          </b>
        </div>
        {lastPeer && (
          <span>آخر نبض: {new Date(lastPeer.timestamp).toLocaleTimeString('ar-DZ')}</span>
        )}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
