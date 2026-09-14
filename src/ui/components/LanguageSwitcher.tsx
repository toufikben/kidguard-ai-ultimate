import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  const filtered = SUPPORTED_LANGUAGES.filter((l) => {
    const q = query.toLowerCase();
    return (
      l.label.toLowerCase().includes(q) ||
      l.english.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-surface-card border border-white/10 rounded-lg px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
      >
        <Globe size={16} className="text-slate-400" />
        <span>{current?.flag} {current?.label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md max-h-[85vh] glass rounded-t-3xl sm:rounded-3xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">اختر اللغة</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-xl leading-none">×</button>
            </div>

            <div className="relative mb-3">
              <Search size={16} className="absolute top-3 left-3 rtl:left-auto rtl:right-3 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary-500"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto -mx-1 px-1">
              {filtered.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    i18n.changeLanguage(l.code);
                    document.documentElement.dir = l.rtl ? 'rtl' : 'ltr';
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    l.code === language ? 'bg-primary-600/20 text-primary-300' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <div className="flex-1 text-left rtl:text-right">
                    <div className="text-sm font-medium">{l.label}</div>
                    <div className="text-[10px] text-slate-500">{l.english}</div>
                  </div>
                  {l.code === language && <Check size={16} />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">لا نتائج</p>
              )}
            </div>

            <div className="text-[10px] text-slate-500 text-center mt-3">
              {SUPPORTED_LANGUAGES.length} لغة مدعومة
            </div>
          </div>
        </div>
      )}
    </>
  );
}
