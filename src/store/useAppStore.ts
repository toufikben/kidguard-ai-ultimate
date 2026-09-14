// ═══════════════════════════════════════════════════════════
// Global State — Zustand
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppSettings, DeviceRole, Incident, SafeZone, AntiTheftZone,
  GeoPoint, Heartbeat, RiskLevel, SafetyScore,
} from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { SUPPORTED_LANGUAGES } from '@/utils/constants';

interface AppState {
  // Identity
  deviceId: string | null;
  role: DeviceRole | null;
  pairedWith: string | null;
  peerPublicKey: string | null;

  // Settings
  settings: AppSettings;

  // Runtime
  currentLocation: GeoPoint | null;
  peerLocation: GeoPoint | null;
  peerHeartbeat: Heartbeat | null;
  heartbeatMissed: number;
  connectionState: 'idle' | 'connecting' | 'connected' | 'failed';

  // Zones
  safeZones: SafeZone[];
  antiTheftZones: AntiTheftZone[];

  // Risk
  currentRisk: RiskLevel;
  riskScore: number;
  safetyScore: SafetyScore | null;

  // Incidents
  incidents: Incident[];

  // UI
  onboardingDone: boolean;
  activeTab: 'home' | 'map' | 'zones' | 'report' | 'settings';
  language: string;
  theme: 'dark' | 'light' | 'auto';
  alertBanner: { level: RiskLevel; message: string } | null;

  // Actions
  setDeviceId: (id: string) => void;
  setRole: (r: DeviceRole) => void;
  setPairing: (info: { peerDeviceId: string; peerPublicKey: string }) => void;
  clearPairing: () => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
  setLanguage: (code: string) => void;
  setTheme: (t: 'dark' | 'light' | 'auto') => void;

  setCurrentLocation: (p: GeoPoint | null) => void;
  setPeerLocation: (p: GeoPoint | null) => void;
  setPeerHeartbeat: (hb: Heartbeat | null, missed: number) => void;
  setConnectionState: (s: AppState['connectionState']) => void;

  addSafeZone: (z: SafeZone) => void;
  removeSafeZone: (id: string) => void;
  addAntiTheftZone: (z: AntiTheftZone) => void;
  removeAntiTheftZone: (id: string) => void;
  updateAntiTheftZone: (id: string, patch: Partial<AntiTheftZone>) => void;

  setRisk: (level: RiskLevel, score: number) => void;
  setSafetyScore: (s: SafetyScore | null) => void;

  addIncident: (i: Incident) => void;
  resolveIncident: (id: string) => void;

  setOnboardingDone: (v: boolean) => void;
  setActiveTab: (t: AppState['activeTab']) => void;
  showAlertBanner: (level: RiskLevel, message: string) => void;
  dismissAlertBanner: () => void;
}

const defaultSettings: AppSettings = {
  role: 'parent',
  language: 'ar',
  theme: 'dark',
  heartbeatIntervalMs: 60_000,
  locationUpdateMs: 30_000,
  antitheftEnabled: false,
  deadmanTimerMinutes: 60,
  panicWord: 'نجدة',
  notifications: {
    localEnabled: true,
    sound: true,
    vibration: true,
    smsEnabled: false,
    smtpEnabled: false,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      deviceId: null,
      role: null,
      pairedWith: null,
      peerPublicKey: null,

      settings: defaultSettings,

      currentLocation: null,
      peerLocation: null,
      peerHeartbeat: null,
      heartbeatMissed: 0,
      connectionState: 'idle',

      safeZones: [],
      antiTheftZones: [],

      currentRisk: 'safe',
      riskScore: 0,
      safetyScore: null,

      incidents: [],

      onboardingDone: false,
      activeTab: 'home',
      language: 'ar',
      theme: 'dark',
      alertBanner: null,

      setDeviceId: (id) => set({ deviceId: id }),
      setRole: (r) => set((s) => ({
        role: r,
        settings: { ...s.settings, role: r },
      })),

      setPairing: ({ peerDeviceId, peerPublicKey }) => set({
        pairedWith: peerDeviceId,
        peerPublicKey,
      }),
      clearPairing: () => set({ pairedWith: null, peerPublicKey: null }),

      updateSettings: (patch) => set((s) => ({
        settings: { ...s.settings, ...patch },
      })),

      setLanguage: (code) => {
        const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
        if (!found) return;
        document.documentElement.lang = code;
        document.documentElement.dir = found.rtl ? 'rtl' : 'ltr';
        localStorage.setItem('kg_lang', code);
        set({ language: code });
      },

      setTheme: (t) => {
        const root = document.documentElement;
        const apply = t === 'auto'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : t;
        root.classList.toggle('dark', apply === 'dark');
        set({ theme: t });
      },

      setCurrentLocation: (p) => set({ currentLocation: p }),
      setPeerLocation: (p) => set({ peerLocation: p }),
      setPeerHeartbeat: (hb, missed) => set({ peerHeartbeat: hb, heartbeatMissed: missed }),
      setConnectionState: (s) => set({ connectionState: s }),

      addSafeZone: (z) => set((s) => ({ safeZones: [...s.safeZones, z] })),
      removeSafeZone: (id) => set((s) => ({
        safeZones: s.safeZones.filter((z) => z.id !== id),
      })),

      addAntiTheftZone: (z) => set((s) => ({
        antiTheftZones: [...s.antiTheftZones, z],
      })),
      removeAntiTheftZone: (id) => set((s) => ({
        antiTheftZones: s.antiTheftZones.filter((z) => z.id !== id),
      })),
      updateAntiTheftZone: (id, patch) => set((s) => ({
        antiTheftZones: s.antiTheftZones.map((z) =>
          z.id === id ? { ...z, ...patch } : z
        ),
      })),

      setRisk: (level, score) => set({ currentRisk: level, riskScore: score }),
      setSafetyScore: (s) => set({ safetyScore: s }),

      addIncident: (i) => set((s) => ({ incidents: [i, ...s.incidents].slice(0, 200) })),
      resolveIncident: (id) => set((s) => ({
        incidents: s.incidents.map((i) =>
          i.id === id ? { ...i, resolvedAt: Date.now() } : i
        ),
      })),

      setOnboardingDone: (v) => set({ onboardingDone: v }),
      setActiveTab: (t) => set({ activeTab: t }),

      showAlertBanner: (level, message) => set({ alertBanner: { level, message } }),
      dismissAlertBanner: () => set({ alertBanner: null }),
    }),
    {
      name: STORAGE_KEYS.settings,
      partialize: (s) => ({
        deviceId: s.deviceId,
        role: s.role,
        pairedWith: s.pairedWith,
        peerPublicKey: s.peerPublicKey,
        settings: s.settings,
        safeZones: s.safeZones,
        antiTheftZones: s.antiTheftZones,
        incidents: s.incidents,
        onboardingDone: s.onboardingDone,
        language: s.language,
        theme: s.theme,
      }),
    }
  )
);
