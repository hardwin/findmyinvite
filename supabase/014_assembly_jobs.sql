-- Operator cloud Assembly job ledger. Browser roles have no table access.
-- Not guest invitations. Not analytics_events.
create table if not exists public.assembly_jobs (
 id text primary key check (char_length(id) between 8 and 32 and id ~ '^[0-9a-f]+$'),
 status text not null check (status in ('queued','running','preview','failed','cancelled')),
 phase text not null default 'queued',
 percent integer not null default 0 check (percent between 0 and 100),
 label text not null default '',
 detail text not null default '',
 input jsonb not null default '{}'::jsonb,
 spend jsonb not null default '{}'::jsonb,
 palette jsonb,
 assets jsonb not null default '{}'::jsonb,
 written jsonb not null default '[]'::jsonb,
 clone_id text,
 demo text,
 branch text,
 github_url text,
 preview_url text,
 sandbox_id text,
 callback_secret text not null,
 cancel_requested boolean not null default false,
 moderation_stop boolean not null default false,
 error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists assembly_jobs_updated_idx on public.assembly_jobs(updated_at desc);
alter table public.assembly_jobs enable row level security;
revoke all on public.assembly_jobs from anon, authenticated;
grant all on public.assembly_jobs to service_role;
