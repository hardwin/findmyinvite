-- Additive pilot schema. Existing invitations and guest responses are unchanged.
create table if not exists public.studio_projects (
 id uuid primary key, owner_hash text not null, template_id text not null,
 data jsonb not null, html text not null, revision integer not null default 0,
 git_sha text, session_id text, run_started_at timestamptz, run_revision integer,
 lock_until timestamptz, published_slug text unique,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.studio_versions (
 project_id uuid references public.studio_projects(id) on delete cascade,
 revision integer not null, data jsonb not null, html text not null,
 git_sha text, message text not null default '', created_at timestamptz not null default now(),
 primary key(project_id,revision)
);
create table if not exists public.studio_publications (
 slug text primary key references public.invitations(slug) on delete cascade,
 project_id uuid not null references public.studio_projects(id),
 revision integer not null, html text not null, data jsonb not null,
 published_at timestamptz not null default now()
);
alter table public.studio_projects enable row level security;
alter table public.studio_versions enable row level security;
alter table public.studio_publications enable row level security;
revoke all on public.studio_projects,public.studio_versions,public.studio_publications from anon,authenticated;
grant all on public.studio_projects,public.studio_versions,public.studio_publications to service_role;

create or replace function public.studio_publish(p_id uuid,p_revision integer,p_slug text,p_hash text,p_data jsonb,p_expires timestamptz)
returns boolean language plpgsql security invoker set search_path=public as $$
declare project public.studio_projects; existing public.invitations;
begin
 select * into project from public.studio_projects where id=p_id for update;
 if not found or project.revision<>p_revision or project.session_id is not null then raise exception 'Draft changed; reload before publishing'; end if;
 if project.published_slug is not null and project.published_slug<>p_slug then raise exception 'Published address cannot change'; end if;
 select * into existing from public.invitations where slug=p_slug for update;
 if found and existing.management_hash<>p_hash then raise exception 'Address unavailable'; end if;
 insert into public.invitations(slug,management_hash,data,published,expires_at) values(p_slug,p_hash,p_data,true,p_expires)
 on conflict(slug) do update set data=excluded.data,published=true,expires_at=excluded.expires_at,updated_at=now();
 insert into public.studio_publications(slug,project_id,revision,html,data) values(p_slug,p_id,p_revision,project.html,p_data)
 on conflict(slug) do update set revision=excluded.revision,html=excluded.html,data=excluded.data,published_at=now();
 update public.studio_projects set published_slug=p_slug where id=p_id;
 return true;
end $$;
revoke all on function public.studio_publish(uuid,integer,text,text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.studio_publish(uuid,integer,text,text,jsonb,timestamptz) to service_role;

create or replace function public.studio_checkpoint(p_id uuid,p_revision integer,p_data jsonb,p_html text,p_sha text,p_message text)
returns setof public.studio_projects language plpgsql security invoker set search_path=public as $$
declare project public.studio_projects;
begin
 update public.studio_projects set data=p_data,html=p_html,git_sha=p_sha,revision=revision+1,session_id=null,run_started_at=null,updated_at=now()
 where id=p_id and revision=p_revision returning * into project;
 if not found then raise exception 'Draft changed; reload'; end if;
 insert into public.studio_versions(project_id,revision,data,html,git_sha,message) values(p_id,project.revision,p_data,p_html,p_sha,left(p_message,1000));
 return next project;
end $$;
revoke all on function public.studio_checkpoint(uuid,integer,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.studio_checkpoint(uuid,integer,jsonb,text,text,text) to service_role;
