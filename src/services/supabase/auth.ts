// ═══════════════════════════════════════════════════════════
// Anonymous Auth — no email/phone required
// Each device gets a stable anonymous user id.
// ═══════════════════════════════════════════════════════════

import { supabase } from './client';
import { logger } from '@/utils/logger';

let currentUserId: string | null = null;

export async function ensureAnonymousSession(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    currentUserId = session.user.id;
    return currentUserId;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    logger.error('auth: anonymous sign-in failed', error);
    throw new Error('Anonymous auth failed: ' + (error?.message ?? 'unknown'));
  }

  currentUserId = data.user.id;
  logger.info('auth: anonymous session created', currentUserId);
  return currentUserId;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  currentUserId = null;
}
