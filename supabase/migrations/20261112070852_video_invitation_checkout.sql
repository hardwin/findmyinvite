-- Durable purchase records are separate from seven-day render/media retention.
create table public.video_invitation_orders (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  total_paise integer not null default 29900 check (total_paise = 29900),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'pending' check (status in ('pending','captured','complimentary','refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  checkout_token uuid,
  checkout_started_at timestamptz,
  promo_sha256 text,
  created_at timestamptz not null default now(),
  unlocked_at timestamptz,
  refunded_at timestamptz,
  constraint video_unlock_evidence check (
    (status = 'pending') or
    (status = 'complimentary' and promo_sha256 is not null and promo_sha256 ~ '^[a-f0-9]{64}$' and unlocked_at is not null) or
    (status in ('captured','refunded') and razorpay_order_id is not null and razorpay_payment_id is not null and unlocked_at is not null)
  )
);
create index video_invitation_orders_owner_idx on public.video_invitation_orders(owner_id, created_at desc);
alter table public.video_invitation_orders enable row level security;
revoke all on public.video_invitation_orders from public, anon, authenticated;
grant select, insert, update, delete on public.video_invitation_orders to service_role;

-- Only the authenticated application server may reserve an invitation or change billing.
create function public.fmi_reserve_video_invitation(p_id uuid, p_owner uuid, p_template text)
returns setof public.video_invitation_orders
language plpgsql security invoker set search_path = '' as $$
declare v public.video_invitation_orders;
begin
  insert into public.video_invitation_orders(id, owner_id, template_id)
    values(p_id, p_owner, p_template) on conflict(id) do nothing;
  select * into v from public.video_invitation_orders where id = p_id;
  if v.owner_id <> p_owner or v.template_id <> p_template then
    raise sqlstate 'PT409' using message = 'This invitation is unavailable. Reload your saved draft.';
  end if;
  return next v;
end;
$$;
revoke all on function public.fmi_reserve_video_invitation(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.fmi_reserve_video_invitation(uuid, uuid, text) to service_role;
