// ═══════════════════════════════════════════════════════════
// Global Constants — KidGuard AI Ultimate
// ═══════════════════════════════════════════════════════════

export const APP_NAME = 'KidGuard AI Ultimate';
export const APP_VERSION = '1.0.0';

export const HEARTBEAT_INTERVAL_MS = 60_000;
export const HEARTBEAT_MISS_THRESHOLD = 3;

export const LOCATION_UPDATE_MS = 30_000;
export const LOCATION_FAST_MS = 10_000;

export const ANTITHEFT_DEFAULT_RADIUS_M = 5;
export const ANTITHEFT_MOVEMENT_THRESHOLD = 0.5; // m/s^2

export const GEOFENCE_CONFIRM_READINGS = 3;
export const GEOFENCE_CONFIRM_DURATION_MS = 60_000;

export const ZONE_EXIT_COOLDOWN_MS = 5 * 60_000;

export const BLE_HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
export const BLE_HEART_RATE_CHAR = '00002a37-0000-1000-8000-00805f9b34fb';

export const DEADMAN_DEFAULT_MINUTES = 60;

export const PANIC_WORDS = ['نجدة', 'ساعدني', 'help', 'mayday'];

export interface LanguageMeta {
  code: string;
  label: string;       // native name
  english: string;     // English name
  rtl: boolean;
  flag: string;        // emoji flag
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // ══ RTL — Right-to-Left ══
  { code: 'ar', label: 'العربية',      english: 'Arabic',      rtl: true,  flag: '🇩🇿' },
  { code: 'ur', label: 'اردو',          english: 'Urdu',        rtl: true,  flag: '🇵🇰' },
  { code: 'fa', label: 'فارسی',         english: 'Persian',     rtl: true,  flag: '🇮🇷' },
  { code: 'he', label: 'עברית',         english: 'Hebrew',      rtl: true,  flag: '🇮🇱' },

  // ══ LTR — Left-to-Right ══
  { code: 'en', label: 'English',       english: 'English',     rtl: false, flag: '🇬🇧' },
  { code: 'fr', label: 'Français',      english: 'French',      rtl: false, flag: '🇫🇷' },
  { code: 'es', label: 'Español',       english: 'Spanish',     rtl: false, flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',       english: 'German',      rtl: false, flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',      english: 'Italian',     rtl: false, flag: '🇮🇹' },
  { code: 'pt', label: 'Português',     english: 'Portuguese',  rtl: false, flag: '🇵🇹' },
  { code: 'nl', label: 'Nederlands',    english: 'Dutch',       rtl: false, flag: '🇳🇱' },
  { code: 'sv', label: 'Svenska',       english: 'Swedish',     rtl: false, flag: '🇸🇪' },
  { code: 'pl', label: 'Polski',        english: 'Polish',      rtl: false, flag: '🇵🇱' },
  { code: 'el', label: 'Ελληνικά',      english: 'Greek',       rtl: false, flag: '🇬🇷' },
  { code: 'ru', label: 'Русский',       english: 'Russian',     rtl: false, flag: '🇷🇺' },
  { code: 'uk', label: 'Українська',    english: 'Ukrainian',   rtl: false, flag: '🇺🇦' },
  { code: 'tr', label: 'Türkçe',        english: 'Turkish',     rtl: false, flag: '🇹🇷' },
  { code: 'ro', label: 'Română',        english: 'Romanian',    rtl: false, flag: '🇷🇴' },
  { code: 'zh', label: '中文',           english: 'Chinese',     rtl: false, flag: '🇨🇳' },
  { code: 'ja', label: '日本語',         english: 'Japanese',    rtl: false, flag: '🇯🇵' },
  { code: 'ko', label: '한국어',         english: 'Korean',      rtl: false, flag: '🇰🇷' },
  { code: 'hi', label: 'हिन्दी',          english: 'Hindi',       rtl: false, flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা',         english: 'Bengali',     rtl: false, flag: '🇧🇩' },
  { code: 'ta', label: 'தமிழ்',          english: 'Tamil',       rtl: false, flag: '🇱🇰' },
  { code: 'id', label: 'Bahasa Indonesia', english: 'Indonesian', rtl: false, flag: '🇮🇩' },
  { code: 'ms', label: 'Bahasa Melayu', english: 'Malay',       rtl: false, flag: '🇲🇾' },
  { code: 'vi', label: 'Tiếng Việt',    english: 'Vietnamese',  rtl: false, flag: '🇻🇳' },
  { code: 'th', label: 'ไทย',           english: 'Thai',        rtl: false, flag: '🇹🇭' },
  { code: 'sw', label: 'Kiswahili',     english: 'Swahili',     rtl: false, flag: '🇰🇪' },
];

export function getLanguageMeta(code: string): LanguageMeta | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}

export const NOTIFICATION_CHANNELS = {
  heartbeat: 'heartbeat',
  zone: 'zone_alerts',
  antitheft: 'antitheft',
  critical: 'critical_alerts',
} as const;

export const STORAGE_KEYS = {
  settings: 'kg_settings_v1',
  zones: 'kg_zones_v1',
  antitheft: 'kg_antitheft_v1',
  pairing: 'kg_pairing_v1',
  identity: 'kg_identity_v1',
  queue: 'kg_queue_v1',
  incidents: 'kg_incidents_v1',
} as const;

export const RISK_WEIGHTS = {
  outsideZone: 30,
  heartbeatLost: 40,
  mockLocation: 25,
  antitheftTriggered: 50,
  panicWord: 80,
  heartRateAnomaly: 20,
  motionAnomaly: 15,
  deadmanExpired: 35,
} as const;
