create table public.personalization_drafts (
 id uuid primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('website','video')),
 template_id text not null,
 payload jsonb not null default '{}'::jsonb,
 revision integer not null default 1 check(revision > 0),
 last_job_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 deleted_at timestamptz,
 check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=200000)
);
create index personalization_drafts_owner_updated on public.personalization_drafts(owner_id,updated_at desc);
alter table public.personalization_drafts enable row level security;
revoke all on public.personalization_drafts from public,anon,authenticated;
grant select,insert,update,delete on public.personalization_drafts to service_role;
create policy personalization_server on public.personalization_drafts to service_role using(true) with check(true);
create function public.fmi_save_personalization_draft(p_id uuid,p_owner uuid,p_kind text,p_template text,p_payload jsonb,p_revision integer)
returns public.personalization_drafts language plpgsql security invoker set search_path='' as $$
declare v public.personalization_drafts;
begin
 if p_revision=0 then
  insert into public.personalization_drafts(id,owner_id,kind,template_id,payload)
   values(p_id,p_owner,p_kind,p_template,p_payload) on conflict(id) do nothing;
 end if;
 select * into v from public.personalization_drafts where id=p_id for update;
 if not found or v.owner_id<>p_owner or v.kind<>p_kind or v.template_id<>p_template or v.deleted_at is not null then
  raise sqlstate 'PT409' using message='This draft is unavailable. Open My invitations to continue.';
 end if;
 if v.payload=p_payload then return v; end if;
 if v.revision<>p_revision then
  raise sqlstate 'PT409' using message='This invitation changed on another device. Your local edits are safe. Reload the saved version before continuing.';
 end if;
 update public.personalization_drafts set payload=p_payload,revision=revision+1,updated_at=now() where id=p_id returning * into v;
 return v;
end;
$$;
revoke all on function public.fmi_save_personalization_draft(uuid,uuid,text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.fmi_save_personalization_draft(uuid,uuid,text,text,jsonb,integer) to service_role;
