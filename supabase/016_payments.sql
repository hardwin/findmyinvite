-- Razorpay entitlements for paid website Create. Browser roles have no table access.
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(),
 razorpay_order_id text unique not null,
 razorpay_payment_id text,
 status text not null check (status in ('created','captured','failed')),
 amount integer not null check (amount > 0),
 currency text not null default 'INR',
 sku text,
 slug text,
 host text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists payments_slug_captured_idx on public.payments (slug, status, created_at desc);
create index if not exists payments_payment_id_idx on public.payments (razorpay_payment_id);
alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
grant all on public.payments to service_role;
