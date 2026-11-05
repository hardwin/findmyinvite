begin;
-- Apply after the Rs.199 application deployment is live. Preserve historical order amounts.
alter table public.website_offer drop constraint website_offer_base_paise_check;
update public.website_offer set base_paise=19900,updated_at=now() where id='website';
alter table public.website_offer add constraint website_offer_base_paise_check check(base_paise=19900);
update public.product_skus set price_paise=19900 where id in ('classic','royal');
create or replace function public.fmi_reserve_website_order(p_invitation uuid,p_owner uuid,p_purpose text,p_tax_bps integer) returns jsonb language sql security invoker set search_path=public as $$
 select public.fmi_reserve_website_order_at_price(p_invitation,p_owner,p_purpose,p_tax_bps,19900);
$$;
insert into public.cms_audit(action,target,detail) values('offer.price-updated','website','{"basePaise":19900,"taxBps":1800,"totalPaise":23482,"authorization":"User requested Rs.199 for all invitations"}');
commit;
