-- Style Pulse inspiration queue for /akay/inspirations.
-- service_role only. No anon/authenticated access.
-- Apply on prod FindMyInvite Supabase (same project as invitations CMS).

create table if not exists public.inspiration_pulse_runs (
  id uuid primary key default gen_random_uuid(),
  pulse_slot text not null check (pulse_slot in ('morning','afternoon','evening')),
  pulse_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  inserted_count integer not null default 0,
  skipped_count integer not null default 0,
  limitations jsonb not null default '[]'::jsonb,
  error text,
  unique (pulse_date, pulse_slot)
);

create table if not exists public.inspiration_queue (
  id uuid primary key default gen_random_uuid(),
  style_name text not null,
  slug_hint text not null default '',
  primary_keyword text not null default '',
  style_lanes text[] not null default '{}',
  angle text not null default '',
  evidence_summary text not null default '',
  reference_urls text[] not null default '{}',
  ai_prompt text not null default '',
  sku_hint text not null default '',
  blog_seed_keywords text[] not null default '{}',
  seo_volume integer,
  seo_competition numeric,
  seo_locale text not null default 'south_india',
  pulse_slot text not null check (pulse_slot in ('morning','afternoon','evening')),
  pulse_date date not null,
  fingerprint text not null,
  status text not null default 'queued' check (status in ('queued','approved','rejected','published')),
  run_id uuid references public.inspiration_pulse_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists inspiration_queue_fingerprint_active_uidx
  on public.inspiration_queue (fingerprint)
  where status in ('queued','approved','published');

create index if not exists inspiration_queue_status_updated_idx
  on public.inspiration_queue (status, updated_at desc);

create index if not exists inspiration_queue_pulse_idx
  on public.inspiration_queue (pulse_date desc, pulse_slot);

alter table public.inspiration_pulse_runs enable row level security;
alter table public.inspiration_queue enable row level security;
revoke all on public.inspiration_pulse_runs, public.inspiration_queue from anon, authenticated;
grant all on public.inspiration_pulse_runs, public.inspiration_queue to service_role;
