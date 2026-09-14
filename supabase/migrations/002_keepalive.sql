-- يمنع إيقاف مشروع Supabase Free Tier بعد 7 أيام خمول
create table if not exists keepalive (
id int primary key default 1,
last_ping timestamptz default now()
);
insert into keepalive (id) values (1) on conflict do nothing;
