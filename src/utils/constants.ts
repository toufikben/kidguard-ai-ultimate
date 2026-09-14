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

export const SUPPORTED_LANGUAGES = [
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'en', label: 'English', rtl: false },
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'es', label: 'Español', rtl: false },
];

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
