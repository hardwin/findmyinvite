begin;
-- Add the premium price without rewriting any reservation or agreed gateway total.
alter table public.video_invitation_orders drop constraint video_invitation_orders_total_paise_check;
alter table public.video_invitation_orders add constraint video_invitation_orders_total_paise_check check (
  (total_paise = 29900 and base_paise is null and tax_bps is null and tax_paise is null)
  or
  (base_paise is not null and tax_bps is not null and tax_paise is not null
    and tax_bps = 1800 and total_paise = base_paise + tax_paise
    and ((base_paise = 49900 and tax_paise = 8982)
      or (template_id = 'wedding-bells-v1' and base_paise = 69900 and tax_paise = 12582)))
);
-- Keep v2 for old instances during rollout and rollback.
create function public.fmi_reserve_video_invitation_v3(p_id uuid, p_owner uuid, p_template text)
returns setof public.video_invitation_orders
language plpgsql security invoker set search_path = '' as $$
declare
  v public.video_invitation_orders;
  price integer := case when p_template = 'wedding-bells-v1' then 69900 else 49900 end;
  tax integer := round(price * 0.18);
begin
  insert into public.video_invitation_orders(id, owner_id, template_id, base_paise, tax_bps, tax_paise, total_paise)
    values(p_id, p_owner, p_template, price, 1800, tax, price + tax) on conflict(id) do nothing;
  select * into v from public.video_invitation_orders where id = p_id;
  if v.owner_id <> p_owner or v.template_id <> p_template then
    raise sqlstate 'PT409' using message = 'This invitation is unavailable. Reload your saved draft.';
  end if;
  return next v;
end;
$$;
revoke all on function public.fmi_reserve_video_invitation_v3(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.fmi_reserve_video_invitation_v3(uuid, uuid, text) to service_role;
commit;
