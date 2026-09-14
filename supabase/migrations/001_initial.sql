-- ═══════════════════════════════════════════════════════════
-- KidGuard AI Ultimate — Initial Schema
-- تشغيل عبر: supabase db push
-- ═══════════════════════════════════════════════════════════

-- 1. الأجهزة المسجلة
create table if not exists devices (
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users(id) on delete cascade,
role text not null check (role in ('parent','child','vehicle')),
display_name text,
public_key text,                    -- مفتاح E2EE العام
fcm_token text,
created_at timestamptz default now(),
last_seen_at timestamptz default now()
);

-- 2. جلسات الاقتران
create table if not exists pairings (
id uuid primary key default gen_random_uuid(),
code text unique not null,          -- رمز من 6 أرقام
parent_device_id uuid references devices(id) on delete cascade,
child_device_id uuid references devices(id) on delete cascade,
expires_at timestamptz not null,
consumed boolean default false,
created_at timestamptz default now()
);

-- 3. آخر موقع معروف (مشفّر)
create table if not exists last_known_location (
device_id uuid primary key references devices(id) on delete cascade,
encrypted_payload text not null,    -- E2EE: Supabase لا يفك التشفير
nonce text not null,
updated_at timestamptz default now()
);

-- 4. نبضات الحياة (Heartbeats)
create table if not exists heartbeats (
id bigserial primary key,
device_id uuid references devices(id) on delete cascade,
battery int,
network text,
created_at timestamptz default now()
);
create index if not exists idx_heartbeats_device_time
on heartbeats(device_id, created_at desc);

-- 5. الحوادث (مشفّرة)
create table if not exists incidents (
id uuid primary key default gen_random_uuid(),
device_id uuid references devices(id) on delete cascade,
encrypted_payload text not null,
nonce text not null,
severity text not null,
created_at timestamptz default now()
);

-- 6. رسائل Signaling لـ WebRTC (لا تُخزَّن، تُبث فقط)
create table if not exists signaling (
id bigserial primary key,
from_device uuid references devices(id) on delete cascade,
to_device uuid references devices(id) on delete cascade,
payload jsonb not null,
created_at timestamptz default now()
);
create index if not exists idx_signaling_to_device
on signaling(to_device, created_at desc);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security — سياسات صارمة
-- ═══════════════════════════════════════════════════════════

alter table devices enable row level security;
alter table pairings enable row level security;
alter table last_known_location enable row level security;
alter table heartbeats enable row level security;
alter table incidents enable row level security;
alter table signaling enable row level security;

-- كل مستخدم يرى فقط أجهزته
drop policy if exists "own_devices" on devices;
create policy "own_devices" on devices
for all using (auth.uid() = user_id);

drop policy if exists "own_pairings" on pairings;
create policy "own_pairings" on pairings
for all using (
parent_device_id in (select id from devices where user_id = auth.uid())
or
child_device_id in (select id from devices where user_id = auth.uid())
);

drop policy if exists "own_location" on last_known_location;
create policy "own_location" on last_known_location
for all using (
device_id in (select id from devices where user_id = auth.uid())
);

drop policy if exists "own_heartbeats" on heartbeats;
create policy "own_heartbeats" on heartbeats
for all using (
device_id in (select id from devices where user_id = auth.uid())
);

drop policy if exists "own_incidents" on incidents;
create policy "own_incidents" on incidents
for all using (
device_id in (select id from devices where user_id = auth.uid())
);

drop policy if exists "own_signaling" on signaling;
create policy "own_signaling" on signaling
for all using (
from_device in (select id from devices where user_id = auth.uid())
or
to_device in (select id from devices where user_id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════
-- Realtime — تمكين البث الفوري
-- ═══════════════════════════════════════════════════════════

alter publication supabase_realtime add table signaling;
alter publication supabase_realtime add table last_known_location;
alter publication supabase_realtime add table incidents;

-- ═══════════════════════════════════════════════════════════
-- Cleanup: حذف الـ signaling القديم كل ساعة
-- ═══════════════════════════════════════════════════════════

create or replace function cleanup_old_signaling()
returns void language sql as delete from signaling where created_at < now() - interval '1 hour';
delete from heartbeats where created_at < now() - interval '7 days';

;
