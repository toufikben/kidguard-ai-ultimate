// Edge Function — تُشغَّل يومياً عبر Cron
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
const supabase = createClient(
Deno.env.get('SUPABASE_URL')!,
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
await supabase.from('keepalive').update({ last_ping: new Date().toISOString() }).eq('id', 1);
return new Response(JSON.stringify({ ok: true }), {
headers: { 'Content-Type': 'application/json' },
});
});
