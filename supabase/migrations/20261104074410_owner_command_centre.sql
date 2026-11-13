-- Prepared for the owner-dashboard release. Do not apply until local review.
create table public.owner_records (
 kind text not null, id text not null, revision bigint not null check(revision > 0),
 data jsonb not null check(jsonb_typeof(data)='object'), updated_at timestamptz not null default now(),
 primary key(kind,id)
);
create index owner_records_kind_time on public.owner_records(kind,updated_at desc);
create unique index owner_record_source on public.owner_records(kind,(data->>'sourceId')) where kind in ('sale','receipt','expense');
create unique index owner_article_slug on public.owner_records((data->>'slug')) where kind='article';
create table public.owner_audit(id uuid primary key default gen_random_uuid(),actor text not null,action text not null,target text not null,detail jsonb not null default '{}',at timestamptz not null default now());
create index owner_audit_time on public.owner_audit(at desc);
create table public.owner_revisions(record_id text not null,revision bigint not null,data jsonb not null,at timestamptz not null default now(),primary key(record_id,revision));
alter table public.owner_records enable row level security;
alter table public.owner_audit enable row level security;
alter table public.owner_revisions enable row level security;
revoke all on public.owner_records, public.owner_audit, public.owner_revisions from public, anon, authenticated;
grant all on public.owner_records, public.owner_audit, public.owner_revisions to service_role;
create or replace function public.owner_save(p_kind text,p_id text,p_data jsonb,p_revision bigint,p_actor text,p_action text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare prior owner_records; sale jsonb; paid bigint; stamp timestamptz:=clock_timestamp();
begin
 -- Serialise invariant checks across replicas, including simultaneous first writes.
 perform pg_advisory_xact_lock(728104223);
 select * into prior from owner_records where kind=p_kind and id=p_id for update;
 if coalesce(prior.revision,0)<>p_revision then raise sqlstate 'PT409' using message='A newer revision exists. Refresh before saving.'; end if;
 if p_kind='receipt' then
  if prior.id is not null then raise sqlstate 'PT409' using message='Payments are immutable. Record a refund or a new payment.'; end if;
  select data into sale from owner_records where kind='sale' and id=p_data->>'saleId';
  if sale is null then raise sqlstate 'PT409' using message='Sale not found.'; end if;
  select coalesce(sum((data->>'amount')::bigint * case when data->>'kind'='Refund' then -1 else 1 end),0) into paid from owner_records where kind='receipt' and data->>'saleId'=p_data->>'saleId';
  if (p_data->>'kind'='Refund' and (p_data->>'amount')::bigint>paid) or (p_data->>'kind'='Payment' and paid+(p_data->>'amount')::bigint>(sale->>'total')::bigint) then raise sqlstate 'PT409' using message='Payment or refund exceeds the outstanding balance.'; end if;
 end if;
 if p_kind='sale' and prior.id is not null and (p_data->'total'<>prior.data->'total' or p_data->'tax'<>prior.data->'tax') and exists(select 1 from owner_records where kind='receipt' and data->>'saleId'=p_id) then raise sqlstate 'PT409' using message='A sale with payments cannot have its price or GST rewritten.'; end if;
 insert into owner_records values(p_kind,p_id,p_revision+1,p_data,stamp) on conflict(kind,id) do update set revision=excluded.revision,data=excluded.data,updated_at=excluded.updated_at;
 if p_kind='article' then insert into owner_revisions values(p_id,p_revision+1,p_data,stamp); end if;
 if p_kind not in ('api-limit','product-event') then insert into owner_audit(actor,action,target,detail,at) values(p_actor,p_action,p_kind||':'||p_id,jsonb_build_object('revision',p_revision+1),stamp); end if;
 return p_data||jsonb_build_object('id',p_id,'revision',p_revision+1,'updatedAt',stamp);
exception when unique_violation then raise sqlstate 'PT409' using message='This source reference or article address already exists.';
end $$;
revoke all on function public.owner_save(text,text,jsonb,bigint,text,text) from public,anon,authenticated;
grant execute on function public.owner_save(text,text,jsonb,bigint,text,text) to service_role;
-- Historical capture times remain unknown. Only new transitions acquire timestamps.
alter table public.website_orders add column if not exists captured_at timestamptz, add column if not exists refunded_at timestamptz;
create or replace function public.owner_order_dates() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin
 if new.status='captured' and (tg_op='INSERT' or old.status is distinct from 'captured') then new.captured_at=coalesce(new.captured_at,now()); end if;
 if new.status='refunded' and (tg_op='INSERT' or old.status is distinct from 'refunded') then new.refunded_at=coalesce(new.refunded_at,now()); end if;
 return new;
end $$;
create trigger owner_order_dates before insert or update on public.website_orders for each row execute function public.owner_order_dates();
-- Legacy/video payment capture dates and GST must also be explicit.
alter table public.payments add column if not exists captured_at timestamptz, add column if not exists refunded_at timestamptz, add column if not exists tax_paise bigint;
create trigger owner_legacy_payment_dates before insert or update on public.payments for each row execute function public.owner_order_dates();
-- No historical dates or taxes are guessed. Owner reconciliation records retain evidence.

create or replace function public.owner_order_numbers(p_ids text[]) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare next_number bigint; order_id text; result jsonb;
begin
 perform pg_advisory_xact_lock(728104224);
 select coalesce(max((data->>'number')::bigint),0) into next_number from owner_records where kind='order-number';
 foreach order_id in array p_ids loop
  if not exists(select 1 from owner_records where kind='order-number' and id=order_id) then
   next_number:=next_number+1;
   insert into owner_records(kind,id,revision,data) values('order-number',order_id,1,jsonb_build_object('number',next_number));
  end if;
 end loop;
 select coalesce(jsonb_object_agg(id,data->'number'),'{}'::jsonb) into result from owner_records where kind='order-number';
 return result;
end $$;
revoke all on function public.owner_order_numbers(text[]) from public,anon,authenticated;
grant execute on function public.owner_order_numbers(text[]) to service_role;
