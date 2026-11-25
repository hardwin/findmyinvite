-- DRAFT (Package 1B): generalized owner-scoped character sets for layered templates.
-- Create the real file with `supabase migration new video_character_sets`, paste this
-- body, run advisors, apply. Do not invent a timestamped filename.
-- Additive only: public.video_character_jobs and its Temple RPCs are untouched.
begin;

create table public.video_character_sets (
 id uuid primary key default gen_random_uuid(),
 invitation_id uuid not null references public.personalization_drafts(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 template_id text not null check (template_id ~ '^[a-z0-9-]{3,100}$'),
 master_version integer not null check (master_version between 1 and 1000),
 profile text not null check (profile ~ '^[a-z0-9-]{3,64}$'),
 prompt_revision text not null check (prompt_revision ~ '^[a-z0-9.-]{3,80}$'),
 kind text not null check (kind in ('initial','redo')),
 regenerate text[] not null check (cardinality(regenerate) between 1 and 2 and regenerate <@ array['bride','groom']::text[]),
 redo text[] not null default '{}'::text[] check (redo <@ regenerate),
 request_key text not null check (request_key ~ '^[a-f0-9]{64}$'),
 photos jsonb not null check (jsonb_typeof(photos)='object' and photos ? 'bride' and photos ? 'groom'),
 status text not null default 'identities' check (status in ('identities','identity_review','poses','review','approved','superseded')),
 approved_current boolean not null default false check (not approved_current or status='approved'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 confirmed_at timestamptz,
 approved_at timestamptz,
 unique (invitation_id,request_key),
 check ((kind='redo')=(cardinality(redo)>0))
);
create unique index video_character_sets_current on public.video_character_sets(invitation_id) where approved_current;
create unique index video_character_sets_open on public.video_character_sets(invitation_id) where status in ('identities','identity_review','poses','review');
create index video_character_sets_owner on public.video_character_sets(owner_id,invitation_id,created_at);
create index video_character_sets_moving on public.video_character_sets(status,updated_at) where status in ('identities','poses');

create table public.video_character_assets (
 id uuid primary key default gen_random_uuid(),
 set_id uuid not null references public.video_character_sets(id) on delete cascade,
 invitation_id uuid not null references public.personalization_drafts(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 asset text not null check (asset ~ '^(identity|pose):[A-Za-z]{2,40}$'),
 input_key text not null check (input_key ~ '^[a-f0-9]{64}$'),
 model text not null,
 model_version text,
 status text not null default 'queued' check (status in ('queued','submitting','processing','preparing','ready','failed')),
 provider_id text unique,
 attempts integer not null default 0 check (attempts between 0 and 3),
 lease_id uuid,
 lease_until timestamptz,
 raw_key text,
 output_key text,
 output_sha256 text check (output_sha256 is null or output_sha256 ~ '^[a-f0-9]{64}$'),
 output_media_id uuid,
 reused_from uuid references public.video_character_assets(id) on delete set null,
 error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (set_id,asset),
 check (status<>'ready' or (output_key is not null and output_sha256 is not null and output_media_id is not null))
);
create index video_character_assets_pending on public.video_character_assets(status,updated_at) where status in ('queued','submitting','processing','preparing');
create index video_character_assets_reuse on public.video_character_assets(invitation_id,input_key) where status='ready';
create index video_character_assets_set on public.video_character_assets(set_id);
create index video_character_assets_invitation on public.video_character_assets(invitation_id,owner_id);
create index video_character_assets_owner on public.video_character_assets(owner_id);
create index video_character_assets_reused on public.video_character_assets(reused_from) where reused_from is not null;

alter table public.video_character_sets enable row level security;
alter table public.video_character_assets enable row level security;
revoke all on public.video_character_sets,public.video_character_assets from public,anon,authenticated;
grant select,insert,update,delete on public.video_character_sets,public.video_character_assets to service_role;
create policy video_character_sets_server on public.video_character_sets to service_role using (true) with check (true);
create policy video_character_assets_server on public.video_character_assets to service_role using (true) with check (true);

-- Claim a character set. Idempotent per request key; one open set per invitation;
-- each identity has one included generation plus one included redo. Failed or
-- reused generations never consume allowance. Paid access is required.
create function public.fmi_claim_video_character_set(p_owner uuid,p_invitation uuid,p_template text,p_version integer,p_profile text,p_prompt text,p_model text,p_key text,p_photos jsonb,p_regenerate text[],p_redo boolean,p_identities jsonb)
returns public.video_character_sets language plpgsql security invoker set search_path='' as $$
declare d public.personalization_drafts; s public.video_character_sets; open_set public.video_character_sets; source public.video_character_assets;
 person text; generated integer; redo text[]:='{}'::text[]; item jsonb; v_id uuid; total integer;
begin
 select * into d from public.personalization_drafts where id=p_invitation and owner_id=p_owner and kind='video' and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 if d.template_id<>p_template or coalesce((d.payload->>'masterVersion')::integer,1)<>p_version then raise sqlstate 'PT409' using message='This invitation changed. Reload it before creating characters.';end if;
 if not exists(select 1 from public.video_invitation_orders o where o.id=p_invitation and o.owner_id=p_owner and o.template_id=p_template and o.status in ('captured','complimentary')) then raise sqlstate 'PT402' using message='Unlock this invitation before creating characters.';end if;
 select * into s from public.video_character_sets where invitation_id=p_invitation and request_key=p_key;
 if found then return s;end if;
 if p_regenerate is null or cardinality(p_regenerate) not between 1 and 2 or not (p_regenerate <@ array['bride','groom']::text[]) or not (p_photos ? 'bride' and p_photos ? 'groom') then raise sqlstate 'PT409' using message='Add a bride photo and a groom photo.';end if;
 select count(*) into total from public.video_character_sets where invitation_id=p_invitation;
 if total>=8 then raise sqlstate 'PT409' using message='Character preparation needs a support check. Your photos, payment and details are saved.';end if;
 select * into open_set from public.video_character_sets where invitation_id=p_invitation and status in ('identities','identity_review','poses','review') for update;
 if found then
  if exists(select 1 from public.video_character_assets a where a.set_id=open_set.id and a.status in ('queued','submitting','processing','preparing')) then raise sqlstate 'PT409' using message='Your characters are still being prepared. Please wait for them to finish.';end if;
  update public.video_character_sets set status='superseded',updated_at=now() where id=open_set.id;
 end if;
 foreach person in array array['bride','groom'] loop
  select count(*) into generated from public.video_character_assets a where a.invitation_id=p_invitation and a.asset='identity:'||person and a.status='ready' and a.reused_from is null;
  if person=any(p_regenerate) then
   if generated>=2 then raise sqlstate 'PT409' using message='The included redo for this character has been used. Your previous characters are still available.';end if;
   if generated=1 then redo:=redo||person;end if;
  elsif generated=0 then raise sqlstate 'PT409' using message='Create both characters from your photos first.';
  end if;
 end loop;
 if cardinality(redo)>0 and not coalesce(p_redo,false) then raise sqlstate 'PT409' using message='Use your included redo to change this character.';end if;
 insert into public.video_character_sets(invitation_id,owner_id,template_id,master_version,profile,prompt_revision,kind,regenerate,redo,request_key,photos)
  values(p_invitation,p_owner,p_template,p_version,p_profile,p_prompt,case when cardinality(redo)>0 then 'redo' else 'initial' end,p_regenerate,redo,p_key,p_photos) returning * into s;
 for item in select value from jsonb_array_elements(p_identities) loop
  if item->>'asset' not in ('identity:bride','identity:groom') then raise sqlstate 'PT409' using message='Invalid character identity.';end if;
  v_id:=gen_random_uuid();
  if substr(item->>'asset',10)=any(p_regenerate) then
   insert into public.video_character_assets(id,set_id,invitation_id,owner_id,asset,input_key,model) values(v_id,s.id,p_invitation,p_owner,item->>'asset',item->>'input_key',p_model);
  else
   select * into source from public.video_character_assets where id=(item->>'reuse')::uuid and invitation_id=p_invitation and owner_id=p_owner and asset=item->>'asset' and status='ready';
   if not found then raise sqlstate 'PT409' using message='A previous character is unavailable. Create both characters again.';end if;
   insert into public.video_character_assets(id,set_id,invitation_id,owner_id,asset,input_key,model,model_version,status,raw_key,output_key,output_sha256,output_media_id,reused_from)
    values(v_id,s.id,p_invitation,p_owner,source.asset,source.input_key,source.model,source.model_version,'ready',source.raw_key,source.output_key,source.output_sha256,v_id,source.id);
  end if;
 end loop;
 if (select count(*) from public.video_character_assets where set_id=s.id and asset in ('identity:bride','identity:groom'))<>2 then raise sqlstate 'PT409' using message='Both character identities are required.';end if;
 return s;
end;$$;

-- Customer-approved identities start the nine pose outputs. Unchanged inputs are
-- reused (no provider call); only dependent poses are generated. Idempotent.
create function public.fmi_confirm_video_character_set(p_owner uuid,p_set uuid,p_model text,p_poses jsonb)
returns public.video_character_sets language plpgsql security invoker set search_path='' as $$
declare s public.video_character_sets; source public.video_character_assets; item jsonb; v_id uuid; remaining integer;
begin
 select * into s from public.video_character_sets where id=p_set and owner_id=p_owner for update;
 if not found then raise sqlstate 'PT404' using message='Characters not found.';end if;
 if s.status in ('poses','review','approved') then return s;end if;
 if s.status<>'identity_review' then raise sqlstate 'PT409' using message='Your characters are not ready to confirm yet.';end if;
 if not exists(select 1 from public.video_invitation_orders o where o.id=s.invitation_id and o.owner_id=p_owner and o.template_id=s.template_id and o.status in ('captured','complimentary')) then raise sqlstate 'PT402' using message='Unlock this invitation before creating characters.';end if;
 if (select count(*) from public.video_character_assets where set_id=s.id and asset in ('identity:bride','identity:groom') and status='ready')<>2 then raise sqlstate 'PT409' using message='Both characters must be ready before continuing.';end if;
 if jsonb_typeof(p_poses)<>'array' or jsonb_array_length(p_poses) not between 1 and 24 then raise sqlstate 'PT409' using message='Invalid character scenes.';end if;
 for item in select value from jsonb_array_elements(p_poses) loop
  if coalesce(item->>'asset','') !~ '^pose:[A-Za-z]{2,40}$' then raise sqlstate 'PT409' using message='Invalid character scene.';end if;
  v_id:=gen_random_uuid();
  select * into source from public.video_character_assets where invitation_id=s.invitation_id and owner_id=p_owner and asset=item->>'asset' and input_key=item->>'input_key' and status='ready' order by created_at limit 1;
  if found then
   insert into public.video_character_assets(id,set_id,invitation_id,owner_id,asset,input_key,model,model_version,status,raw_key,output_key,output_sha256,output_media_id,reused_from)
    values(v_id,s.id,s.invitation_id,p_owner,source.asset,source.input_key,source.model,source.model_version,'ready',source.raw_key,source.output_key,source.output_sha256,v_id,source.id);
  else
   insert into public.video_character_assets(id,set_id,invitation_id,owner_id,asset,input_key,model) values(v_id,s.id,s.invitation_id,p_owner,item->>'asset',item->>'input_key',p_model);
  end if;
 end loop;
 select count(*) into remaining from public.video_character_assets where set_id=s.id and asset like 'pose:%' and status<>'ready';
 update public.video_character_sets set status=case when remaining=0 then 'review' else 'poses' end,confirmed_at=now(),updated_at=now() where id=s.id returning * into s;
 return s;
end;$$;

-- Atomically bind every pose of one reviewed set into the draft (revision-checked).
-- The previously approved set stays bound until this succeeds.
create function public.fmi_approve_video_character_set(p_owner uuid,p_set uuid,p_revision integer,p_slots text[])
returns public.personalization_drafts language plpgsql security invoker set search_path='' as $$
declare d public.personalization_drafts; s public.video_character_sets; bound jsonb; ready integer;
begin
 select * into s from public.video_character_sets where id=p_set and owner_id=p_owner;
 if not found then raise sqlstate 'PT404' using message='Characters not found.';end if;
 select * into d from public.personalization_drafts where id=s.invitation_id and owner_id=p_owner and kind='video' and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 select * into s from public.video_character_sets where id=p_set for update;
 if d.template_id<>s.template_id or coalesce((d.payload->>'masterVersion')::integer,1)<>s.master_version then raise sqlstate 'PT409' using message='These characters belong to a different invitation version.';end if;
 if not exists(select 1 from public.video_invitation_orders o where o.id=d.id and o.owner_id=p_owner and o.template_id=s.template_id and o.status in ('captured','complimentary')) then raise sqlstate 'PT402' using message='Invitation access is not unlocked.';end if;
 if s.approved_current then return d;end if;
 if s.status<>'review' then raise sqlstate 'PT409' using message='These characters are not ready for approval.';end if;
 if d.revision<>p_revision then raise sqlstate 'PT409' using message='This invitation changed on another device. Reload the saved version before approving.';end if;
 if p_slots is null or cardinality(p_slots)<1 then raise sqlstate 'PT409' using message='Every scene character must be ready before approval.';end if;
 select count(*),jsonb_object_agg(substr(a.asset,6),jsonb_build_object('id',a.output_media_id,'mode','prepared','confirmed',true)) into ready,bound
  from public.video_character_assets a where a.set_id=s.id and a.status='ready' and a.output_media_id is not null and a.asset like 'pose:%' and substr(a.asset,6)=any(p_slots);
 if ready<>cardinality(p_slots) then raise sqlstate 'PT409' using message='Every scene character must be ready before approval.';end if;
 update public.video_character_sets set approved_current=false,status='superseded',updated_at=now() where invitation_id=s.invitation_id and approved_current;
 update public.video_character_sets set approved_current=true,status='approved',approved_at=now(),updated_at=now() where id=s.id;
 update public.personalization_drafts set payload=jsonb_set(jsonb_set(payload,'{content}',coalesce(payload->'content','{}'::jsonb)),'{content,photos}',bound)||jsonb_build_object('personalPhotosEnabled',true,'charactersChoice','personal','characterSetId',s.id::text),revision=revision+1,updated_at=now() where id=d.id returning * into d;
 return d;
end;$$;

revoke all on function public.fmi_claim_video_character_set(uuid,uuid,text,integer,text,text,text,text,jsonb,text[],boolean,jsonb) from public,anon,authenticated;
revoke all on function public.fmi_confirm_video_character_set(uuid,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.fmi_approve_video_character_set(uuid,uuid,integer,text[]) from public,anon,authenticated;
grant execute on function public.fmi_claim_video_character_set(uuid,uuid,text,integer,text,text,text,text,jsonb,text[],boolean,jsonb),public.fmi_confirm_video_character_set(uuid,uuid,text,jsonb),public.fmi_approve_video_character_set(uuid,uuid,integer,text[]) to service_role;
commit;
