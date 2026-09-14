import { NOTIFICATION_CHANNELS } from '@/utils/constants';

export interface ChannelDef {
  id: string;
  name: string;
  description: string;
  importance: 1 | 2 | 3 | 4 | 5;
  vibration: boolean;
  sound: boolean;
  lights: boolean;
}

export const CHANNELS: ChannelDef[] = [
  {
    id: NOTIFICATION_CHANNELS.heartbeat,
    name: 'Heartbeat',
    description: 'Status updates (low priority)',
    importance: 2,
    vibration: false, sound: false, lights: false,
  },
  {
    id: NOTIFICATION_CHANNELS.zone,
    name: 'Zone Alerts',
    description: 'Safe zone exit / entry',
    importance: 3,
    vibration: true, sound: true, lights: true,
  },
  {
    id: NOTIFICATION_CHANNELS.antitheft,
    name: 'Anti-Theft',
    description: 'Vehicle / bike movement',
    importance: 4,
    vibration: true, sound: true, lights: true,
  },
  {
    id: NOTIFICATION_CHANNELS.critical,
    name: 'Critical Alerts',
    description: 'SOS / panic / emergency',
    importance: 5,
    vibration: true, sound: true, lights: true,
  },
];
