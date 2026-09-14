-- Run separately in Supabase SQL editor. Server API uses service role only.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to browsers.
create table if not exists public.template_catalog (
 id text primary key, name text not null, description text not null default '',
 collection text not null check(collection in ('classic','royal')),
 badge text not null default '', sort_order integer not null default 0,
 published boolean not null default false, updated_at timestamptz not null default now()
);
create table if not exists public.template_variations (
 id text primary key, template_id text not null references public.template_catalog(id),
 name text not null, settings jsonb not null default '{}'::jsonb,
 published boolean not null default false
);
create table if not exists public.product_skus (
 id text primary key, name text not null, collection text not null check(collection in ('classic','royal')),
 price_paise integer not null check(price_paise >= 0), currency text not null default 'INR' check(currency='INR'),
 published boolean not null default false
);
create table if not exists public.blog_posts (
 slug text primary key check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), title text not null,
 excerpt text not null default '', body text not null default '',
 published boolean not null default false, published_at timestamptz,
 updated_at timestamptz not null default now(),
 check(not published or published_at is not null)
);
alter table public.template_catalog enable row level security;
alter table public.template_variations enable row level security;
alter table public.product_skus enable row level security;
alter table public.blog_posts enable row level security;
revoke all on public.template_catalog,public.template_variations,public.product_skus,public.blog_posts from anon, authenticated;
grant all on public.template_catalog,public.template_variations,public.product_skus,public.blog_posts to service_role;
insert into public.product_skus(id,name,collection,price_paise,published) values
 ('classic','FindMyInvite Classic','classic',119900,true),('royal','FindMyInvite Royal','royal',149900,true)
on conflict(id) do nothing;
-- Do not publish template rows until their assets are cleared for commercial use.
-- The API must return only published rows, and only blogs with published_at <= now().
