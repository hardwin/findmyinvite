-- Anonymous storefront traffic for the /akay operator dashboard. Browser roles have no table access.
create table if not exists public.analytics_events (
 id uuid primary key default gen_random_uuid(),
 occurred_at timestamptz not null default now(),
 session_id text not null check (session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
 visitor_id text not null check (visitor_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
 path text not null check (char_length(path) between 1 and 200),
 event_type text not null check (event_type in ('pageview','heartbeat','leave')),
 dwell_ms integer not null default 0 check (dwell_ms between 0 and 3600000),
 referrer text not null default '' check (char_length(referrer) <= 300),
 viewport text not null default '' check (char_length(viewport) <= 20)
);
create index if not exists analytics_events_occurred_idx on public.analytics_events(occurred_at desc);
create index if not exists analytics_events_session_idx on public.analytics_events(session_id, occurred_at);
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant all on public.analytics_events to service_role;
