-- Love Studio drafts. Browser roles have no table access; the API uses service_role.
-- Already applied in production as studio_pilot / studio_lease (2026-09-17).
create table if not exists public.studio_projects (
 id uuid primary key,
 owner_hash text not null,
 template_id text not null,
 data jsonb not null,
 html text not null,
 revision integer not null default 0,
 git_sha text,
 session_id text,
 run_started_at timestamptz,
 run_revision integer,
 lock_until timestamptz,
 published_slug text unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.studio_versions (
 project_id uuid not null references public.studio_projects(id) on delete cascade,
 revision integer not null,
 data jsonb not null,
 html text not null,
 git_sha text,
 message text not null default '',
 created_at timestamptz not null default now(),
 primary key (project_id, revision)
);
create table if not exists public.studio_publications (
 slug text primary key references public.invitations(slug),
 project_id uuid not null references public.studio_projects(id),
 revision integer not null,
 html text not null,
 data jsonb not null,
 published_at timestamptz not null default now()
);
alter table public.studio_projects enable row level security;
alter table public.studio_versions enable row level security;
alter table public.studio_publications enable row level security;
revoke all on public.studio_projects, public.studio_versions, public.studio_publications from anon, authenticated;
grant all on public.studio_projects, public.studio_versions, public.studio_publications to service_role;
