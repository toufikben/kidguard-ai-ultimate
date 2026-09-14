// ═══════════════════════════════════════════════════════════
// Realtime — subscribe to signaling + location + incidents
// ═══════════════════════════════════════════════════════════

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { logger } from '@/utils/logger';

export interface SignalingRow {
  id: number;
  from_device: string;
  to_device: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export function subscribeToSignaling(
  deviceId: string,
  onMessage: (row: SignalingRow) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`signaling-${deviceId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'signaling',
        filter: `to_device=eq.${deviceId}`,
      },
      (payload) => {
        const row = payload.new as SignalingRow;
        logger.info('realtime: signaling received', row.id);
        onMessage(row);
      }
    )
    .subscribe((status) => {
      logger.info('realtime: signaling channel', status);
    });

  return channel;
}

export function subscribeToLocation(
  deviceId: string,
  onUpdate: (row: { encrypted_payload: string; nonce: string; updated_at: string }) => void
): RealtimeChannel {
  return supabase
    .channel(`location-${deviceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'last_known_location',
        filter: `device_id=eq.${deviceId}`,
      },
      (payload) => {
        const row = payload.new as any;
        if (row?.encrypted_payload) onUpdate(row);
      }
    )
    .subscribe();
}

export function subscribeToIncidents(
  deviceId: string,
  onNew: (row: any) => void
): RealtimeChannel {
  return supabase
    .channel(`incidents-${deviceId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'incidents',
        filter: `device_id=eq.${deviceId}`,
      },
      (payload) => onNew(payload.new)
    )
    .subscribe();
}

/**
 * Insert a signaling message (ICE candidate, SDP offer/answer).
 */
export async function sendSignalingMessage(
  fromDevice: string,
  toDevice: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('signaling').insert({
    from_device: fromDevice,
    to_device: toDevice,
    payload,
  });
  if (error) logger.error('signaling insert failed', error);
}

/**
 * Upload encrypted location — server never sees plaintext.
 */
export async function pushEncryptedLocation(
  deviceId: string,
  encrypted_payload: string,
  nonce: string
): Promise<void> {
  const { error } = await supabase
    .from('last_known_location')
    .upsert({
      device_id: deviceId,
      encrypted_payload,
      nonce,
      updated_at: new Date().toISOString(),
    });
  if (error) logger.error('location upsert failed', error);
}

/**
 * Fetch peer's last known encrypted location.
 */
export async function fetchEncryptedLocation(deviceId: string) {
  const { data, error } = await supabase
    .from('last_known_location')
    .select('encrypted_payload, nonce, updated_at')
    .eq('device_id', deviceId)
    .maybeSingle();
  if (error) logger.error('location fetch failed', error);
  return data;
}

export async function insertIncident(
  deviceId: string,
  encrypted_payload: string,
  nonce: string,
  severity: string
): Promise<void> {
  const { error } = await supabase.from('incidents').insert({
    device_id: deviceId,
    encrypted_payload,
    nonce,
    severity,
  });
  if (error) logger.error('incident insert failed', error);
}
