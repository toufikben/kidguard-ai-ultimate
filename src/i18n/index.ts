import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// Auto-load every JSON file inside ./locales/
// Adding a new language = drop a .json file. No code changes.
// ═══════════════════════════════════════════════════════════

const modules = import.meta.glob('./locales/*.json', { eager: true });

const resources: Record<string, { translation: Record<string, unknown> }> = {};

for (const path in modules) {
  const match = path.match(/\/([a-zA-Z-]+)\.json$/);
  if (!match) continue;
  const code = match[1];
  const mod = modules[path] as { default: Record<string, unknown> };
  resources[code] = { translation: mod.default };
}

// Detect initial language
function detectInitial(): string {
  const saved = localStorage.getItem('kg_lang');
  if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) return saved;

  const browser = (navigator.language || 'en').split('-')[0];
  const exact = navigator.language;

  if (SUPPORTED_LANGUAGES.some((l) => l.code === exact)) return exact;
  if (SUPPORTED_LANGUAGES.some((l) => l.code === browser)) return browser;
  return 'en';
}

const initial = detectInitial();

i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: ['en', 'ar'],
  supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
  interpolation: { escapeValue: false },
  returnNull: false,
});

const meta = SUPPORTED_LANGUAGES.find((l) => l.code === initial);
if (meta) {
  document.documentElement.lang = initial;
  document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
}

export default i18n;
