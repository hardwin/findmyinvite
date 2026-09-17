-- Apply after 002_studio_pilot.sql and before deploying the lease-aware API.
-- This project uses manually applied SQL patches, not CLI migration history.
begin;
drop function if exists public.studio_checkpoint(uuid,integer,jsonb,text,text,text);
drop function if exists public.studio_publish(uuid,integer,text,text,jsonb,timestamptz);

create or replace function public.studio_checkpoint(
 p_id uuid,p_revision integer,p_lock_until timestamptz,
 p_data jsonb,p_html text,p_sha text,p_message text)
returns setof public.studio_projects language plpgsql security invoker set search_path=public as $$
declare project public.studio_projects;
begin
 update public.studio_projects
 set data=p_data,html=p_html,git_sha=p_sha,revision=revision+1,
     session_id=null,run_started_at=null,run_revision=null,updated_at=now()
 where id=p_id and revision=p_revision
   and lock_until=p_lock_until and lock_until>clock_timestamp()
 returning * into project;
 if not found then raise sqlstate 'PT409' using message='Studio draft or operation lease changed'; end if;
 insert into public.studio_versions(project_id,revision,data,html,git_sha,message)
 values(p_id,project.revision,p_data,p_html,p_sha,left(p_message,1000));
 return next project;
end $$;
revoke all on function public.studio_checkpoint(uuid,integer,timestamptz,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.studio_checkpoint(uuid,integer,timestamptz,jsonb,text,text,text) to service_role;

create or replace function public.studio_publish(
 p_id uuid,p_revision integer,p_lock_until timestamptz,
 p_slug text,p_hash text,p_data jsonb,p_expires timestamptz)
returns boolean language plpgsql security invoker set search_path=public as $$
declare project public.studio_projects; existing public.invitations;
begin
 select * into project from public.studio_projects where id=p_id for update;
 if not found or project.revision<>p_revision or project.session_id is not null
    or p_lock_until is null or project.lock_until is distinct from p_lock_until
    or project.lock_until<=clock_timestamp()
 then raise sqlstate 'PT409' using message='Studio draft or operation lease changed'; end if;
 if project.published_slug is not null and project.published_slug<>p_slug
 then raise sqlstate 'PT409' using message='Published address cannot change'; end if;
 select * into existing from public.invitations where slug=p_slug for update;
 if found and existing.management_hash<>p_hash
 then raise sqlstate 'PT409' using message='Address unavailable'; end if;
 if exists(select 1 from public.studio_publications where slug=p_slug and project_id<>p_id)
 then raise sqlstate 'PT409' using message='Address belongs to another studio draft'; end if;
 insert into public.invitations(slug,management_hash,data,published,expires_at)
 values(p_slug,p_hash,p_data,true,p_expires)
 on conflict(slug) do update set data=excluded.data,published=true,expires_at=excluded.expires_at,updated_at=now();
 insert into public.studio_publications(slug,project_id,revision,html,data)
 values(p_slug,p_id,p_revision,project.html,p_data)
 on conflict(slug) do update set revision=excluded.revision,html=excluded.html,data=excluded.data,published_at=now();
 update public.studio_projects set published_slug=p_slug where id=p_id;
 return true;
end $$;
revoke all on function public.studio_publish(uuid,integer,timestamptz,text,text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.studio_publish(uuid,integer,timestamptz,text,text,jsonb,timestamptz) to service_role;
notify pgrst, 'reload schema';
commit;
