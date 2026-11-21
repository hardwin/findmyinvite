begin;
create function public.fmi_free_website(p_template text) returns boolean language sql immutable security invoker set search_path='' as $$ select p_template in ('kerala-lanterns','christian-bells','moonlit-nikah','theeram','thiruvarul','kalyana-payanam','midnight-stage','little-blessing','noir-and-gold','golden-hour','pearl-and-sapphire','royal-crimson','garden-curtains','pulli','pattu','olai','jasmine-arch','palace-of-lights','the-ring-box','home-sweet-home','up-and-away','temple-doors'); $$;
create function public.fmi_free_video(p_template text) returns boolean language sql immutable security invoker set search_path='' as $$ select p_template in ('temple-v1','kerala-christian-v1','film-drive-v1','film-temple-v1','film-vector-v1','film-garden-v1','film-tiles-v1','film-bollywood-v1','film-truckart-v1','film-kovil-v1','film-royal-v1','film-kerala-v1','film-veedu-v1','film-walk-v1','film-kurinji-v1','film-valli-v1','film-aranmanai-v1','film-gettimelam-v1','film-kondattam-v1','film-mandapam-v1','film-thottam-v1','film-jannal-v1','film-poonga-v1','film-roja-v1','film-malligai-v1','film-gopuram-v1','film-theppam-v1','film-chettinad-v1','film-kalyana-v1','film-avalum-v1','film-thamarai-v1','film-savedate-v1','film-kulam-v1','film-karaikudi-v1','film-hopon-v1','film-oonjal-v1','film-rajakumari-v1','film-rajakumaran-v1','film-ilavarasi-v1','film-velicham-v1'); $$;
revoke all on function public.fmi_free_website(text),public.fmi_free_video(text) from public,anon,authenticated;
grant execute on function public.fmi_free_website(text),public.fmi_free_video(text) to service_role;

alter table public.website_orders drop constraint website_orders_base_paise_check;
alter table public.website_orders add constraint website_orders_base_paise_check check(base_paise in (0,100,19900));
alter table public.website_orders drop constraint website_orders_status_check;
alter table public.website_orders add constraint website_orders_status_check check(status in ('created','captured','refunded','free'));
alter table public.website_orders add constraint website_free_evidence check(
 (status='free' and base_paise=0 and tax_bps=0 and tax_paise=0 and amount=0 and razorpay_order_id is null and razorpay_payment_id is null)
 or (status<>'free' and base_paise>0));
create unique index website_free_unapplied on public.website_orders(invitation_id,purpose) where applied_at is null and status='free';

create function public.fmi_reserve_free_website_order(p_invitation uuid,p_owner uuid,p_purpose text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.invitations; o public.website_orders; tid text;
begin
 select * into r from public.invitations where id=p_invitation and owner_id=p_owner for update;
 if not found or r.deleted_at is not null then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 if r.first_published_at is not null and r.expires_at+interval '90 days'<=now() then raise exception 'Recovery period ended';end if;
 if p_purpose not in ('publish','renew') or (p_purpose='renew' and r.first_published_at is null) or (p_purpose='publish' and r.first_published_at is not null) then raise exception 'Invalid order purpose';end if;
 select template_id into tid from public.template_versions where id=r.template_version_id;
 if not coalesce(public.fmi_free_website(tid),false) then raise sqlstate 'PT402' using message='This design requires payment.';end if;
 select * into o from public.website_orders where invitation_id=r.id and owner_id=p_owner and template_version_id=r.template_version_id and purpose=p_purpose and status in ('captured','free') and applied_at is null order by case when status='captured' then 0 else 1 end limit 1;
 if found then return jsonb_build_object('order',to_jsonb(o),'created',false);end if;
 insert into public.website_orders(invitation_id,owner_id,template_version_id,purpose,base_paise,tax_bps,tax_paise,amount,status) values(r.id,p_owner,r.template_version_id,p_purpose,0,0,0,0,'free') returning * into o;
 return jsonb_build_object('order',to_jsonb(o),'created',true);
end;$$;
revoke all on function public.fmi_reserve_free_website_order(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.fmi_reserve_free_website_order(uuid,uuid,text) to service_role;

create function public.fmi_publish_invitation_v2(p_slug text,p_owner uuid,p_revision integer,p_order uuid default null,p_renew boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.invitations;o public.website_orders;begin
 select * into r from public.invitations where slug=p_slug and owner_id=p_owner and template_version_id is not null for update;
 if not found or r.deleted_at is not null then raise exception 'Invitation not found';end if;
 if r.first_published_at is not null and r.expires_at+interval '90 days'<=now() then raise exception 'Recovery period ended';end if;

 if p_order is not null then
 select * into o from public.website_orders where id=p_order and invitation_id=r.id and owner_id=p_owner and template_version_id=r.template_version_id and (status='captured' or (status='free' and amount=0 and exists(select 1 from public.template_versions v where v.id=r.template_version_id and public.fmi_free_website(v.template_id)))) for update;
 if not found then raise exception 'Captured payment required';end if;
 if o.applied_at is not null then return to_jsonb(r);end if;
 if (p_renew and o.purpose<>'renew') or (not p_renew and o.purpose<>'publish') then raise exception 'Wrong payment purpose';end if;
 end if;
 if r.draft_revision<>p_revision then raise exception 'Draft changed; reload before publishing';end if;
 if p_renew then
 if r.first_published_at is null or p_order is null then raise exception 'Renewal requires a published invitation and payment';end if;
 update public.invitations set expires_at=(greatest(expires_at,now()) at time zone 'UTC'+interval '6 months') at time zone 'UTC',published=true where id=r.id returning * into r;
 elsif r.first_published_at is null then
 if p_order is null then raise exception 'Payment required';end if;
 if not exists(select 1 from public.template_versions v join public.template_catalog c on c.id=v.template_id where v.id=r.template_version_id and v.approved_at is not null) then raise exception 'Template is not approved for publication';end if;
 update public.invitations set first_published_at=now(),expires_at=(now() at time zone 'UTC'+interval '6 months') at time zone 'UTC',published_content=draft_content,published_revision=draft_revision,published=true where id=r.id returning * into r;
 else
 if r.expires_at<=now() then raise exception 'Renew hosting before publishing';end if;
 update public.invitations set published_content=draft_content,published_revision=draft_revision,published=true where id=r.id returning * into r;
 end if;
 if p_order is not null then update public.website_orders set applied_at=now() where id=o.id;end if;
 insert into public.cms_audit(actor_id,action,target,detail) values(p_owner,case when p_renew then 'invitation.renew' else 'invitation.publish' end,p_slug,jsonb_build_object('revision',r.published_revision,'order',p_order));return to_jsonb(r);
end$$;

revoke all on function public.fmi_publish_invitation_v2(text,uuid,integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.fmi_publish_invitation_v2(text,uuid,integer,uuid,boolean) to service_role;

-- Free access is independent of the historical payment state and amount.
alter table public.video_invitation_orders add column free_access boolean not null default false;
alter table public.video_invitation_orders add constraint video_free_access_template check(not free_access or public.fmi_free_video(template_id));
alter table public.video_invitation_orders drop constraint video_invitation_orders_status_check;
alter table public.video_invitation_orders add constraint video_invitation_orders_status_check check(status in ('pending','captured','complimentary','refunded','free'));
alter table public.video_invitation_orders drop constraint video_unlock_evidence;
alter table public.video_invitation_orders add constraint video_unlock_evidence check(
 status='pending' or
 (status='free' and free_access and total_paise=0 and unlocked_at is not null and razorpay_order_id is null and razorpay_payment_id is null) or
 (status='complimentary' and promo_sha256 is not null and promo_sha256 ~ '^[a-f0-9]{64}$' and unlocked_at is not null) or
 (status in ('captured','refunded') and razorpay_order_id is not null and razorpay_payment_id is not null and unlocked_at is not null));
alter table public.video_invitation_orders drop constraint video_invitation_orders_total_paise_check;
alter table public.video_invitation_orders add constraint video_invitation_orders_total_paise_check check(
 (status='free' and free_access and total_paise=0 and base_paise is not null and base_paise=0 and tax_bps is not null and tax_bps=0 and tax_paise is not null and tax_paise=0)
 or (total_paise=29900 and base_paise is null and tax_bps is null and tax_paise is null)
 or (base_paise is not null and tax_bps is not null and tax_paise is not null and tax_bps=1800 and total_paise=base_paise+tax_paise and ((base_paise=49900 and tax_paise=8982) or (template_id='wedding-bells-v1' and base_paise=69900 and tax_paise=12582))));

create function public.fmi_reserve_video_invitation_v4(p_id uuid,p_owner uuid,p_template text) returns setof public.video_invitation_orders language plpgsql security invoker set search_path='' as $$
declare v public.video_invitation_orders;
begin
 if not coalesce(public.fmi_free_video(p_template),false) then return query select * from public.fmi_reserve_video_invitation_v3(p_id,p_owner,p_template);return;end if;
 perform 1 from public.personalization_drafts where id=p_id and owner_id=p_owner and template_id=p_template and kind='video' and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Save your invitation before continuing.';end if;
 insert into public.video_invitation_orders(id,owner_id,template_id,base_paise,tax_bps,tax_paise,total_paise,status,free_access,unlocked_at) values(p_id,p_owner,p_template,0,0,0,0,'free',true,now()) on conflict(id) do nothing;
 select * into v from public.video_invitation_orders where id=p_id for update;
 if v.owner_id<>p_owner or v.template_id<>p_template then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 if not v.free_access then update public.video_invitation_orders set free_access=true where id=p_id returning * into v;end if;
 return next v;
end;$$;
revoke all on function public.fmi_reserve_video_invitation_v4(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.fmi_reserve_video_invitation_v4(uuid,uuid,text) to service_role;
create or replace function public.fmi_claim_video_character(p_owner uuid,p_invitation uuid,p_slot text,p_kind text,p_key text,p_model text,p_prompt text,p_refs jsonb,p_basis jsonb)
returns public.video_character_jobs language plpgsql security invoker set search_path='' as $$
declare d public.personalization_drafts; j public.video_character_jobs; b jsonb; initial_done boolean; redo_done boolean;
begin
 select * into d from public.personalization_drafts where id=p_invitation and owner_id=p_owner and kind='video' and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 if not exists(select 1 from public.video_invitation_orders where id=p_invitation and owner_id=p_owner and (status in ('captured','complimentary') or free_access)) then raise sqlstate 'PT402' using message='Unlock this invitation before creating characters.';end if;
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

create or replace function public.fmi_approve_video_character(p_owner uuid,p_job uuid,p_revision integer)
returns public.personalization_drafts language plpgsql security invoker set search_path='' as $$
declare d public.personalization_drafts;j public.video_character_jobs;b jsonb;
begin
 select * into j from public.video_character_jobs where id=p_job and owner_id=p_owner;
 if not found then raise sqlstate 'PT404' using message='Character not found.';end if;
 select * into d from public.personalization_drafts where id=j.invitation_id and owner_id=p_owner and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Invitation not found.';end if;
 if not exists(select 1 from public.video_invitation_orders where id=d.id and owner_id=p_owner and (status in ('captured','complimentary') or free_access)) then raise sqlstate 'PT402' using message='Invitation access is not unlocked.';end if;
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

commit;
