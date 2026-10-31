begin;
create table public.website_offer(id text primary key check(id='website'),base_paise integer not null check(base_paise=19900),tax_bps integer check(tax_bps between 0 and 10000),tax_label text not null default 'GST',updated_at timestamptz not null default now());
alter table public.website_offer enable row level security;
revoke all on public.website_offer from public,anon,authenticated;
grant all on public.website_offer to service_role;
-- Business explicitly confirmed 18% GST in this implementation session.
insert into public.website_offer(id,base_paise,tax_bps) values('website',19900,1800);
insert into public.cms_audit(action,target,detail) values('offer.tax-configured','website','{"basePaise":19900,"taxBps":1800,"taxLabel":"GST","authorization":"Business confirmed 18% GST"}');
commit;
