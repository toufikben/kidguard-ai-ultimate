import { AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const COLORS = {
  safe: 'from-success-600 to-success-500',
  low: 'from-primary-600 to-primary-500',
  medium: 'from-warn-600 to-warn-500',
  high: 'from-danger-600 to-danger-500',
  critical: 'from-danger-700 to-danger-600 animate-pulse',
} as const;

export default function AlertBanner() {
  const { alertBanner, dismissAlertBanner } = useAppStore();
  if (!alertBanner) return null;

  const { level, message } = alertBanner;
  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 bg-gradient-to-r ${COLORS[level]} text-white px-4 py-3 flex items-center gap-3 shadow-lg`}
      role="alert"
    >
      <AlertTriangle size={20} className="shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={dismissAlertBanner}
        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );
}
