-- Keep the published artwork usable while its replacement is in customer review.
alter table public.video_character_assets add column scene_input jsonb;
create function public.fmi_revise_video_scenes(p_owner uuid,p_set uuid,p_key text,p_prompt text,p_changes jsonb)
returns public.video_character_sets language plpgsql security invoker set search_path='' as $$
declare base public.video_character_sets; result public.video_character_sets; a public.video_character_assets;
 d public.personalization_drafts; new_id uuid; change jsonb; slot text;
begin
 select * into base from public.video_character_sets where id=p_set and owner_id=p_owner;
 if not found then raise sqlstate 'PT404' using message='Illustrations unavailable.';end if;
 select * into d from public.personalization_drafts where id=base.invitation_id and owner_id=p_owner and kind='video' and deleted_at is null for update;
 if not found or d.template_id<>base.template_id or coalesce((d.payload->>'masterVersion')::integer,1)<>base.master_version then raise sqlstate 'PT409' using message='Reopen this invitation to update its artwork.';end if;
 if not exists(select 1 from public.video_invitation_orders where id=d.id and owner_id=p_owner and template_id=d.template_id and status in ('captured','complimentary')) then raise sqlstate 'PT402' using message='Unlock this invitation first.';end if;
 select * into result from public.video_character_sets where invitation_id=d.id and request_key=p_key;
 if found then return result;end if;
 select * into base from public.video_character_sets where id=p_set for update;
 if base.status not in ('review','approved') or exists(select 1 from public.video_character_sets where invitation_id=d.id and id<>p_set and status in ('identities','identity_review','poses','review')) then raise sqlstate 'PT409' using message='Open the latest illustrations before editing a scene.';end if;
 if jsonb_typeof(p_changes) is distinct from 'object' or p_changes='{}'::jsonb then raise sqlstate 'PT400' using message='Choose a scene.';end if;
 for slot in select jsonb_object_keys(p_changes) loop
  if not exists(select 1 from public.video_character_assets where set_id=base.id and asset='pose:'||slot and status='ready') then raise sqlstate 'PT409' using message='Choose a ready scene.';end if;
 end loop;
 if exists(select 1 from public.video_character_assets where set_id=base.id and status<>'ready') then raise sqlstate 'PT409' using message='Wait for the current illustrations to finish.';end if;
 if not base.approved_current then update public.video_character_sets set status='superseded',updated_at=now() where id=base.id;end if;
 insert into public.video_character_sets(invitation_id,owner_id,template_id,master_version,profile,prompt_revision,kind,regenerate,redo,request_key,photos,status,confirmed_at)
 values(d.id,p_owner,base.template_id,base.master_version,base.profile,p_prompt,base.kind,base.regenerate,base.redo,p_key,base.photos,'poses',now()) returning * into result;
 for a in select * from public.video_character_assets where set_id=base.id loop
  new_id:=gen_random_uuid();
  change:=case when a.asset like 'pose:%' then p_changes->substr(a.asset,6) else null end;
  if change is not null then
   insert into public.video_character_assets(id,set_id,owner_id,invitation_id,asset,model,input_key,scene_input)
    values(new_id,result.id,p_owner,d.id,a.asset,change->>'model',change->>'key',change->'input');
  else
   insert into public.video_character_assets(id,set_id,owner_id,invitation_id,asset,model,model_version,input_key,scene_input,status,output_key,output_sha256,output_media_id,reused_from)
    values(new_id,result.id,p_owner,d.id,a.asset,a.model,a.model_version,a.input_key,a.scene_input,'ready',a.output_key,a.output_sha256,new_id,coalesce(a.reused_from,a.id));
  end if;
 end loop;
 return result;
end;$$;
revoke all on function public.fmi_revise_video_scenes(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.fmi_revise_video_scenes(uuid,uuid,text,text,jsonb) to service_role;
