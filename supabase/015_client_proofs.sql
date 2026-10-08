-- Client approval desk: one row per client video job (registration → stills review → changes → approved → video → dispatched).
-- Operator workflow records only. Not guest invitations. Not analytics_events. Browser roles have no table access.
create table if not exists public.client_jobs (
 id text primary key check (id ~ '^[0-9a-f]{12}$'),
 couple text not null check (char_length(couple) between 1 and 120),
 client_name text not null default '' check (char_length(client_name) <= 120),
 client_phone text not null default '' check (char_length(client_phone) <= 32),
 template text not null default '' check (char_length(template) <= 80),
 notes text not null default '' check (char_length(notes) <= 2000),
 status text not null default 'registered' check (status in ('registered','stills_review','changes_requested','approved','video','dispatched','cancelled')),
 round integer not null default 0 check (round >= 0),
 proof_token text not null unique check (proof_token ~ '^[a-f0-9]{48}$'),
 owner_id text not null default '',
 final_url text not null default '' check (char_length(final_url) <= 500),
 sent_at timestamptz,
 approved_at timestamptz,
 dispatched_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists client_jobs_updated_idx on public.client_jobs(updated_at desc);

create table if not exists public.client_job_stills (
 job_id text not null references public.client_jobs(id) on delete cascade,
 scene integer not null check (scene between 1 and 40),
 title text not null default '' check (char_length(title) <= 120),
 caption text not null default '' check (char_length(caption) <= 600),
 version integer not null default 1 check (version >= 1),
 decision text not null default 'pending' check (decision in ('pending','approved','change')),
 comment text not null default '' check (char_length(comment) <= 1000),
 decided_at timestamptz,
 updated_at timestamptz not null default now(),
 primary key (job_id, scene)
);

-- Approval trail (who decided what, which round). Business record for the job, not page-view analytics.
create table if not exists public.client_job_log (
 id bigserial primary key,
 job_id text not null references public.client_jobs(id) on delete cascade,
 kind text not null check (kind in ('registered','still_uploaded','sent','approved','change','client_submit','video','dispatched','cancelled','link_rotated')),
 actor text not null check (actor in ('operator','client')),
 scene integer,
 round integer not null default 0,
 detail text not null default '' check (char_length(detail) <= 1000),
 created_at timestamptz not null default now()
);
create index if not exists client_job_log_job_idx on public.client_job_log(job_id, created_at);

alter table public.client_jobs enable row level security;
alter table public.client_job_stills enable row level security;
alter table public.client_job_log enable row level security;
revoke all on public.client_jobs, public.client_job_stills, public.client_job_log from anon, authenticated;
grant all on public.client_jobs, public.client_job_stills, public.client_job_log to service_role;
grant usage, select on sequence public.client_job_log_id_seq to service_role;
