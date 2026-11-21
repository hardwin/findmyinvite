begin;
lock table public.video_invitation_orders in access exclusive mode;

alter table public.video_invitation_orders drop constraint video_free_access_template;
create or replace function public.fmi_free_video(p_template text)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select p_template in (
    'temple-v1', 'kerala-christian-v1', 'film-drive-v1', 'film-temple-v1',
    'film-vector-v1', 'film-garden-v1', 'film-tiles-v1', 'film-bollywood-v1',
    'film-truckart-v1', 'film-kovil-v1', 'film-royal-v1', 'film-kerala-v1',
    'film-veedu-v1', 'film-walk-v1', 'film-kurinji-v1', 'film-valli-v1',
    'film-aranmanai-v1', 'film-gettimelam-v1', 'film-kondattam-v1', 'film-mandapam-v1',
    'film-thottam-v1', 'film-jannal-v1', 'film-poonga-v1', 'film-roja-v1',
    'film-malligai-v1', 'film-gopuram-v1', 'film-theppam-v1', 'film-chettinad-v1',
    'film-kalyana-v1', 'film-avalum-v1', 'film-thamarai-v1', 'film-savedate-v1',
    'film-kulam-v1', 'film-karaikudi-v1', 'film-hopon-v1', 'film-rajakumari-v1',
    'film-rajakumaran-v1', 'film-ilavarasi-v1', 'film-velicham-v1'
  );
$$;

-- Only invitations that already held a free grant at cutover may keep it.
do $migration$
declare
  existing_grants uuid[];
begin
  select coalesce(array_agg(id), '{}'::uuid[]) into existing_grants
    from public.video_invitation_orders where template_id='film-oonjal-v1' and free_access;
  execute format(
    'alter table public.video_invitation_orders add constraint video_free_access_template
       check (not free_access or public.fmi_free_video(template_id)
              or (template_id = %L and id = any(%L::uuid[])))',
    'film-oonjal-v1', existing_grants
  );
end;
$migration$;

alter table public.video_invitation_orders drop constraint video_invitation_orders_total_paise_check;
alter table public.video_invitation_orders add constraint video_invitation_orders_total_paise_check check (
  (status='free' and free_access and total_paise=0 and base_paise is not null and base_paise=0
    and tax_bps is not null and tax_bps=0 and tax_paise is not null and tax_paise=0)
  or (total_paise=29900 and base_paise is null and tax_bps is null and tax_paise is null)
  or (base_paise is not null and tax_bps is not null and tax_paise is not null
    and tax_bps=1800 and total_paise=base_paise+tax_paise
    and ((base_paise=49900 and tax_paise=8982)
      or (template_id='wedding-bells-v1' and base_paise=69900 and tax_paise=12582)
      or (template_id='film-oonjal-v1' and base_paise=29900 and tax_paise=5382)))
);

create or replace function public.fmi_reserve_video_invitation_v3(p_id uuid, p_owner uuid, p_template text)
returns setof public.video_invitation_orders
language plpgsql security invoker set search_path = '' as $$
declare
  v public.video_invitation_orders;
  price integer := case p_template
    when 'wedding-bells-v1' then 69900
    when 'film-oonjal-v1' then 29900
    else 49900 end;
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

commit;
