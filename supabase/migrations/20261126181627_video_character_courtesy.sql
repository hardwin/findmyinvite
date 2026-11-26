begin;
-- Each named person receives one extra successful identity on this invitation.
alter table public.video_invitation_orders add column character_courtesy text[] not null default '{}' check (character_courtesy <@ array['bride','groom']::text[]);

create or replace function public.fmi_claim_video_character_set(p_owner uuid,p_invitation uuid,p_template text,p_version integer,p_profile text,p_prompt text,p_model text,p_key text,p_photos jsonb,p_regenerate text[],p_redo boolean,p_identities jsonb)
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
   if generated>=2 + (case when exists(select 1 from public.video_invitation_orders o where o.id=p_invitation and person=any(o.character_courtesy)) then 1 else 0 end) then raise sqlstate 'PT409' using message='The included redo for this character has been used. Your previous characters are still available.';end if;
   if generated>=1 then redo:=redo||person;end if;
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
commit;
