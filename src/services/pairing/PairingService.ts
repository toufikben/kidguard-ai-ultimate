import { supabase } from '@/services/supabase/client';
import { getOrCreateIdentity } from '@/crypto/keyExchange';
import { generatePairingCode } from '@/crypto/e2ee';
import { ensureAnonymousSession } from '@/services/supabase/auth';
import { logger } from '@/utils/logger';

export interface PairingSession {
  code: string;
  selfDeviceId: string;
  peerDeviceId?: string;
  peerPublicKey?: string;
  expiresAt: number;
  consumed: boolean;
}

/**
 * Parent side: creates a code and waits for child to join.
 */
export async function createPairing(
  deviceId: string,
  role: 'parent' | 'child' | 'vehicle'
): Promise<PairingSession> {
  await ensureAnonymousSession();
  const identity = await getOrCreateIdentity();
  const code = generatePairingCode();
  const expiresAt = Date.now() + 10 * 60_000;

  // Register this device
  await supabase.from('devices').upsert({
    id: deviceId,
    role,
    public_key: identity.publicKey,
    last_seen_at: new Date().toISOString(),
  });

  const { error } = await supabase.from('pairings').insert({
    code,
    parent_device_id: role === 'parent' ? deviceId : null,
    child_device_id: role === 'child' || role === 'vehicle' ? deviceId : null,
    expires_at: new Date(expiresAt).toISOString(),
  });

  if (error) {
    logger.error('pairing: insert failed', error);
    throw error;
  }

  logger.info('pairing: created', code);
  return { code, selfDeviceId: deviceId, expiresAt, consumed: false };
}

/**
 * Child side: joins using the parent's code.
 */
export async function joinPairing(
  code: string,
  deviceId: string,
  role: 'child' | 'vehicle'
): Promise<PairingSession> {
  await ensureAnonymousSession();
  const identity = await getOrCreateIdentity();

  // Register child device
  await supabase.from('devices').upsert({
    id: deviceId,
    role,
    public_key: identity.publicKey,
    last_seen_at: new Date().toISOString(),
  });

  const { data: row, error } = await supabase
    .from('pairings')
    .select('*')
    .eq('code', code)
    .eq('consumed', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !row) {
    throw new Error('رمز غير صالح أو منتهي');
  }

  const { error: upErr } = await supabase
    .from('pairings')
    .update({ child_device_id: deviceId })
    .eq('id', row.id);
  if (upErr) throw upErr;

  // Fetch parent's public key
  const { data: parent } = await supabase
    .from('devices')
    .select('public_key')
    .eq('id', row.parent_device_id)
    .maybeSingle();

  logger.info('pairing: joined successfully');
  return {
    code,
    selfDeviceId: deviceId,
    peerDeviceId: row.parent_device_id,
    peerPublicKey: parent?.public_key ?? undefined,
    expiresAt: new Date(row.expires_at).getTime(),
    consumed: false,
  };
}

/**
 * Parent polls for child joining.
 */
export async function pollPairing(
  code: string
): Promise<{ peerDeviceId?: string; peerPublicKey?: string }> {
  const { data: row } = await supabase
    .from('pairings')
    .select('child_device_id, parent_device_id')
    .eq('code', code)
    .maybeSingle();

  if (!row?.child_device_id) return {};

  const { data: child } = await supabase
    .from('devices')
    .select('public_key')
    .eq('id', row.child_device_id)
    .maybeSingle();

  return {
    peerDeviceId: row.child_device_id,
    peerPublicKey: child?.public_key,
  };
}

export async function consumePairing(code: string): Promise<void> {
  await supabase
    .from('pairings')
    .update({ consumed: true })
    .eq('code', code);
}
