// ═══════════════════════════════════════════════════════════
// KidGuard AI Ultimate — Core Types
// ═══════════════════════════════════════════════════════════

export type DeviceRole = 'parent' | 'child' | 'vehicle';

export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type AlertChannel = 'local' | 'sms' | 'smtp' | 'push';

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
  source: 'gps' | 'network' | 'fused' | 'ble';
  isMocked?: boolean;
}

export interface SafeZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // meters
  activeHours?: { start: number; end: number }; // 0-23
  activeDays?: number[]; // 0-6 (Sunday=0)
  color: string;
  createdAt: number;
}

export interface AntiTheftZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // meters (default 5)
  sensitivity: number; // 0-1
  enabled: boolean;
  lastMovementAt: number;
}

export interface Heartbeat {
  deviceId: string;
  timestamp: number;
  battery: number;
  network: 'online' | 'offline';
  location?: GeoPoint;
  signature: string; // HMAC
}

export interface Incident {
  id: string;
  type: 'zone_exit' | 'heartbeat_loss' | 'anti_theft' | 'sos' | 'deadman' | 'panic_word' | 'anomaly';
  severity: RiskLevel;
  startedAt: number;
  resolvedAt?: number;
  location?: GeoPoint;
  metadata?: Record<string, unknown>;
}

export interface MotionData {
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
  magnitude: number;
  timestamp: number;
}

export interface HeartRateReading {
  bpm: number;
  quality: number; // 0-1
  timestamp: number;
  source: 'ble' | 'camera' | 'manual';
}

export interface AlertPolicy {
  channel: AlertChannel;
  minSeverity: RiskLevel;
  cooldownMs: number;
  retryCount: number;
}

export interface AppSettings {
  role: DeviceRole;
  language: string;
  theme: 'dark' | 'light' | 'auto';
  heartbeatIntervalMs: number;
  locationUpdateMs: number;
  antitheftEnabled: boolean;
  deadmanTimerMinutes: number;
  panicWord: string;
  notifications: {
    localEnabled: boolean;
    sound: boolean;
    vibration: boolean;
    smsEnabled: boolean;
    smtpEnabled: boolean;
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    appPassword: string;
    to: string;
  };
  sms?: {
    provider: 'twilio' | 'local';
    to: string;
  };
}

export interface PairingInfo {
  pairingCode: string;
  childDeviceId: string;
  parentDeviceId?: string;
  publicKey: string;
  createdAt: number;
  expiresAt: number;
}

export interface SafetyScore {
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  factors: { name: string; impact: number }[];
  predictedNext24h: number;
}
