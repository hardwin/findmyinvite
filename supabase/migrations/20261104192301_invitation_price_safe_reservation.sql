begin;
-- Stage before deploying: old application instances retain their existing RPC and quote.
-- Existing orders retain the agreed amount; new orders use the server's explicit quote.
create or replace function public.fmi_reserve_website_order_at_price(p_invitation uuid,p_owner uuid,p_purpose text,p_tax_bps integer,p_base_paise integer) returns jsonb language plpgsql security invoker set search_path=public as $$
declare r invitations;o website_orders;t integer;begin
 select * into r from invitations where id=p_invitation and owner_id=p_owner and template_version_id is not null for update;
 if not found or r.deleted_at is not null then raise exception 'Invitation not found';end if;
 if (r.first_published_at is not null and r.expires_at+interval '90 days'<=now()) or (r.first_published_at is null and r.updated_at+interval '90 days'<=now() and not exists(select 1 from website_orders where invitation_id=r.id and status='captured' and applied_at is null)) then raise exception 'Recovery period ended';end if;
 if p_purpose not in ('publish','renew') or (p_purpose='renew' and r.first_published_at is null) or (p_purpose='publish' and r.first_published_at is not null) then raise exception 'Invalid order purpose';end if;
 select * into o from website_orders where invitation_id=r.id and purpose=p_purpose and applied_at is null and status in ('created','captured');
 if found then return jsonb_build_object('created',false,'order',to_jsonb(o));end if;
 if p_tax_bps is null or p_tax_bps<0 or p_tax_bps>10000 then raise exception 'Tax configuration required';end if;
 if p_base_paise is null or p_base_paise not in (100,19900) then raise exception 'Invalid invitation price';end if;
 t=round(p_base_paise::numeric*p_tax_bps/10000);
 insert into website_orders(invitation_id,owner_id,template_version_id,purpose,base_paise,tax_bps,tax_paise,amount) values(r.id,p_owner,r.template_version_id,p_purpose,p_base_paise,p_tax_bps,t,p_base_paise+t) returning * into o;
 return jsonb_build_object('created',true,'order',to_jsonb(o));end$$;
revoke all on function public.fmi_reserve_website_order_at_price(uuid,uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.fmi_reserve_website_order_at_price(uuid,uuid,text,integer,integer) to service_role;
commit;
