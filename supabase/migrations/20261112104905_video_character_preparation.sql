create table public.video_character_jobs (
 id uuid primary key default gen_random_uuid(),
 invitation_id uuid not null references public.personalization_drafts(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 slot text not null check(slot in ('groom','bride','couple')),
 kind text not null check(kind in ('initial','redo','dependent')),
 request_key text not null,
 model text not null,
 model_version text,
 prompt_revision text not null,
 reference_data jsonb not null,
 basis jsonb not null default '{}'::jsonb,
 status text not null default 'queued' check(status in ('queued','submitting','processing','preparing','review','approved','failed')),
 provider_id text unique,
 attempts integer not null default 0 check(attempts between 0 and 3),
 lease_id uuid,
 lease_until timestamptz,
 output_media_id uuid,
 raw_key text,
 error text,
 approved_current boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 approved_at timestamptz,
 unique(invitation_id,request_key)
);
create index video_characters_owner on public.video_character_jobs(owner_id,created_at desc);
create index video_characters_pending on public.video_character_jobs(status,updated_at) where status in ('queued','submitting','processing','preparing');
create unique index video_characters_approved on public.video_character_jobs(invitation_id,slot) where approved_current;
alter table public.video_character_jobs enable row level security;
revoke all on public.video_character_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.video_character_jobs to service_role;
create policy video_characters_server on public.video_character_jobs to service_role using(true) with check(true);

create function public.fmi_claim_video_character(p_owner uuid,p_invitation uuid,p_slot text,p_kind text,p_key text,p_model text,p_prompt text,p_refs jsonb,p_basis jsonb)
returns public.video_character_jobs language plpgsql security invoker set search_path='' as $$
declare d public.personalization_drafts; j public.video_character_jobs; b jsonb; initial_done boolean; redo_done boolean;
begin
 select * into d from public.personalization_drafts where id=p_invitation and owner_id=p_owner and kind='video' and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 if not exists(select 1 from public.video_invitation_orders where id=p_invitation and owner_id=p_owner and status in ('captured','complimentary')) then raise sqlstate 'PT402' using message='Unlock this invitation before creating characters.';end if;
 select * into j from public.video_character_jobs where invitation_id=p_invitation and request_key=p_key;
 if found then return j;end if;
 if exists(select 1 from public.video_character_jobs where invitation_id=p_invitation and slot=p_slot and status in ('queued','submitting','processing','preparing')) then raise sqlstate 'PT409' using message='This character is already being prepared. Please wait for it to finish.';end if;
 select exists(select 1 from public.video_character_jobs where invitation_id=p_invitation and slot=p_slot and status in ('review','approved')),exists(select 1 from public.video_character_jobs where invitation_id=p_invitation and slot=p_slot and kind='redo' and status in ('review','approved')) into initial_done,redo_done;
 if p_kind='initial' and initial_done or p_kind='redo' and (not initial_done or redo_done) then raise sqlstate 'PT409' using message='This character includes its first version and one requested redo. Your previous result is still available.';end if;
 if p_slot='couple' then
  select jsonb_object_agg(slot,id::text) into b from public.video_character_jobs where invitation_id=p_invitation and approved_current and slot in ('groom','bride');
  if b is null or not (b ? 'groom' and b ? 'bride') or p_basis<>b then raise sqlstate 'PT409' using message='Approve the groom and bride before preparing their couple character.';end if;
 end if;
 if p_kind='dependent' then
  if p_slot<>'couple' or not initial_done or exists(select 1 from public.video_character_jobs where invitation_id=p_invitation and slot='couple' and basis=p_basis and status in ('review','approved')) then raise sqlstate 'PT409' using message='There is no dependent couple update to prepare.';end if;
 end if;
 insert into public.video_character_jobs(invitation_id,owner_id,slot,kind,request_key,model,prompt_revision,reference_data,basis) values(p_invitation,p_owner,p_slot,p_kind,p_key,p_model,p_prompt,p_refs,p_basis) returning * into j;
 return j;
end;$$;

create function public.fmi_approve_video_character(p_owner uuid,p_job uuid,p_revision integer)
returns public.personalization_drafts language plpgsql security invoker set search_path='' as $$
declare d public.personalization_drafts;j public.video_character_jobs;b jsonb;
begin
 select * into j from public.video_character_jobs where id=p_job and owner_id=p_owner;
 if not found then raise sqlstate 'PT404' using message='Character not found.';end if;
 select * into d from public.personalization_drafts where id=j.invitation_id and owner_id=p_owner and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 if not exists(select 1 from public.video_invitation_orders where id=d.id and owner_id=p_owner and status in ('captured','complimentary')) then raise sqlstate 'PT402' using message='Invitation access is not unlocked.';end if;
 if j.approved_current then return d;end if;
 if j.status not in ('review','approved') or j.output_media_id is null then raise sqlstate 'PT409' using message='This character is not ready for approval.';end if;
 if d.revision<>p_revision then raise sqlstate 'PT409' using message='This invitation changed on another device. Reload the saved version before approving.';end if;
 if j.slot='couple' then
  select jsonb_object_agg(slot,id::text) into b from public.video_character_jobs where invitation_id=d.id and approved_current and slot in ('groom','bride');
  if j.basis<>b then raise sqlstate 'PT409' using message='The individual characters changed. Prepare the included couple update first.';end if;
 end if;
 update public.video_character_jobs set approved_current=false where invitation_id=d.id and slot=j.slot and approved_current;
 update public.video_character_jobs set approved_current=true,status='approved',approved_at=now(),updated_at=now() where id=j.id;
 update public.personalization_drafts set payload=jsonb_set(jsonb_set(payload,'{content,photos}',coalesce(payload#>'{content,photos}','{}'::jsonb)),array['content','photos',j.slot],jsonb_build_object('id',j.output_media_id,'mode','prepared','confirmed',true)),revision=revision+1,updated_at=now() where id=d.id returning * into d;
 return d;
end;$$;
revoke all on function public.fmi_claim_video_character(uuid,uuid,text,text,text,text,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.fmi_approve_video_character(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.fmi_claim_video_character(uuid,uuid,text,text,text,text,text,jsonb,jsonb),public.fmi_approve_video_character(uuid,uuid,integer) to service_role;
