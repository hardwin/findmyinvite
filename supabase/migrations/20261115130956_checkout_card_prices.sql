begin;
-- Stage before the application release. The original RPC and default keep
-- old instances and existing gateway orders on their previously agreed total.
alter table public.video_invitation_orders
  add column base_paise integer,
  add column tax_bps integer,
  add column tax_paise integer;

alter table public.video_invitation_orders
  drop constraint video_invitation_orders_total_paise_check;
alter table public.video_invitation_orders
  add constraint video_invitation_orders_total_paise_check check (
    (total_paise = 29900 and base_paise is null and tax_bps is null and tax_paise is null)
    or
    (total_paise = 58882 and base_paise is not null and tax_bps is not null and tax_paise is not null
      and base_paise = 49900 and tax_bps = 1800 and tax_paise = 8982
      and total_paise = base_paise + tax_paise)
  );

create function public.fmi_reserve_video_invitation_v2(p_id uuid, p_owner uuid, p_template text)
returns setof public.video_invitation_orders
language plpgsql security invoker set search_path = '' as $$
declare v public.video_invitation_orders;
begin
  insert into public.video_invitation_orders(id, owner_id, template_id, base_paise, tax_bps, tax_paise, total_paise)
    values(p_id, p_owner, p_template, 49900, 1800, 8982, 58882) on conflict(id) do nothing;
  select * into v from public.video_invitation_orders where id = p_id;
  if v.owner_id <> p_owner or v.template_id <> p_template then
    raise sqlstate 'PT409' using message = 'This invitation is unavailable. Reload your saved draft.';
  end if;
  return next v;
end;
$$;
revoke all on function public.fmi_reserve_video_invitation_v2(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.fmi_reserve_video_invitation_v2(uuid, uuid, text) to service_role;
commit;
