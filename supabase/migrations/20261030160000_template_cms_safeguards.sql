begin;
create unique index website_order_unapplied on public.website_orders(invitation_id,purpose) where applied_at is null and status in ('created','captured');
create index invitations_retention_v2 on public.invitations(expires_at,updated_at) where template_version_id is not null and deleted_at is null;
create index cms_audit_recent on public.cms_audit(created_at desc);
create function public.fmi_reserve_website_order(p_invitation uuid,p_owner uuid,p_purpose text,p_tax_bps integer) returns jsonb language plpgsql security invoker set search_path=public as $$
declare r invitations;o website_orders;t integer;begin
 select * into r from invitations where id=p_invitation and owner_id=p_owner and template_version_id is not null for update;
 if not found or r.deleted_at is not null then raise exception 'Invitation not found';end if;
 if (r.first_published_at is not null and r.expires_at+interval '90 days'<=now()) or (r.first_published_at is null and r.updated_at+interval '90 days'<=now()) then raise exception 'Recovery period ended';end if;
 if p_purpose not in ('publish','renew') or (p_purpose='renew' and r.first_published_at is null) or (p_purpose='publish' and r.first_published_at is not null) then raise exception 'Invalid order purpose';end if;
 select * into o from website_orders where invitation_id=r.id and purpose=p_purpose and applied_at is null and status in ('created','captured');
 if found then return jsonb_build_object('created',false,'order',to_jsonb(o));end if;
 if p_tax_bps is null or p_tax_bps<0 or p_tax_bps>10000 then raise exception 'Tax configuration required';end if;
 t=round(19900::numeric*p_tax_bps/10000);
 insert into website_orders(invitation_id,owner_id,template_version_id,purpose,base_paise,tax_bps,tax_paise,amount) values(r.id,p_owner,r.template_version_id,p_purpose,19900,p_tax_bps,t,19900+t) returning * into o;
 return jsonb_build_object('created',true,'order',to_jsonb(o));end$$;
create function public.fmi_claim_retention(p_limit integer default 50) returns integer language plpgsql security invoker set search_path=public as $$
declare r invitations;n integer:=0;begin
 for r in select * from invitations i where i.template_version_id is not null and i.deleted_at is null and ((i.first_published_at is not null and i.expires_at+interval '90 days'<=now()) or (i.first_published_at is null and i.updated_at+interval '90 days'<=now() and not exists(select 1 from website_orders o where o.invitation_id=i.id and o.status='captured' and o.applied_at is null))) order by i.updated_at limit least(greatest(p_limit,1),100) for update skip locked loop
 update invitations set deleted_at=now(),published=false,draft_content=null,published_content=null,data='{}' where id=r.id;
 update template_media set status='deleting' where invitation_id=r.id;
 insert into cms_audit(action,target,detail) values('invitation.retention',r.slug,jsonb_build_object('reason',case when r.first_published_at is null then 'inactive-draft' else 'expired-recovery' end));n:=n+1;
 end loop;return n;end$$;
create function public.fmi_lock_purchased_design() returns trigger language plpgsql set search_path=public as $$begin
 if old.template_version_id is not null and (new.template_version_id is distinct from old.template_version_id or new.owner_id is distinct from old.owner_id) then raise exception 'Invitation ownership and design are immutable';end if;return new;end$$;
create trigger fmi_lock_purchased_design before update on public.invitations for each row execute function public.fmi_lock_purchased_design();
revoke all on function public.fmi_reserve_website_order(uuid,uuid,text,integer),public.fmi_claim_retention(integer),public.fmi_lock_purchased_design(),public.fmi_version_immutable() from public,anon,authenticated;
grant execute on function public.fmi_reserve_website_order(uuid,uuid,text,integer),public.fmi_claim_retention(integer),public.fmi_lock_purchased_design(),public.fmi_version_immutable() to service_role;
commit;
