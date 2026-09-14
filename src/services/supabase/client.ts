// ═══════════════════════════════════════════════════════════
// Supabase Client — single instance, anonymous auth
// ═══════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  console.warn(
    '[KG] Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

// Keep the local UI bootable before credentials are supplied. No request is
// made unless App.tsx detects the real URL in the environment.
export const supabase: SupabaseClient = createClient(
  url || 'https://disabled.invalid',
  anonKey || 'disabled-anon-key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  }
);
