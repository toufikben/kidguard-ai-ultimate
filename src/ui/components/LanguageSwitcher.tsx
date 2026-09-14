import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();

  return (
    <div className="flex items-center gap-2">
      <Globe size={18} className="text-slate-400" />
      <select
        value={language}
        onChange={(e) => {
          setLanguage(e.target.value);
          i18n.changeLanguage(e.target.value);
        }}
        className="bg-surface-card border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}
