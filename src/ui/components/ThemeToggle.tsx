import { Moon, Sun, Monitor } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function ThemeToggle() {
  const { theme, setTheme } = useAppStore();

  const options = [
    { key: 'light', icon: Sun },
    { key: 'dark', icon: Moon },
    { key: 'auto', icon: Monitor },
  ] as const;

  return (
    <div className="inline-flex bg-surface-card border border-white/10 rounded-xl p-1">
      {options.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`p-2 rounded-lg transition-all ${
            theme === key
              ? 'bg-primary-600 text-white shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label={key}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
