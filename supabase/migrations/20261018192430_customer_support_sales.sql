-- Private support sales catalog; separate from website template_catalog.
create table public.video_templates (
 id text primary key, name text not null, instagram_url text not null,
 standard_price_paise integer not null check(standard_price_paise>0),
 personalized_price_paise integer not null check(personalized_price_paise>=standard_price_paise),
 currency text not null default 'INR' check(currency='INR'), active boolean not null default true
);
insert into public.video_templates(id,name,instagram_url,standard_price_paise,personalized_price_paise)
values('church-christian-wedding-v1','Church Christian Wedding Template v1',
'https://www.instagram.com/reel/Dd9nJFRTWpB/?vrfl=cnphbDdjNXk3dDQ3',99900,149900);
create table public.support_sales_cases (
 customer_id uuid primary key references public.support_customers(id) on delete cascade,
 state jsonb not null default '{}'::jsonb check(jsonb_typeof(state)='object'),
 -- Only an operator/payment integration writes verified; customer/model claims never do.
 verified jsonb not null default '{}'::jsonb check(jsonb_typeof(verified)='object'),
 revision bigint not null default 0, updated_at timestamptz not null default now()
);
create table public.support_sales_events (
 customer_id uuid not null references public.support_customers(id) on delete cascade,
 event_id text not null, reply text not null, created_at timestamptz not null default now(),
 primary key(customer_id,event_id)
);
alter table public.video_templates enable row level security;
alter table public.support_sales_cases enable row level security;
alter table public.support_sales_events enable row level security;
revoke all on public.video_templates,public.support_sales_cases,public.support_sales_events from public,anon,authenticated;
grant select,insert,update,delete on public.video_templates,public.support_sales_cases,public.support_sales_events to service_role;

create function public.support_sales_context(p_identity text,p_event_id text)
returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object(
 'templates',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) from public.video_templates t where active),
 'state',coalesce(s.state,'{}'::jsonb),'verified',coalesce(s.verified,'{}'::jsonb),
 'revision',coalesce(s.revision,0),
 'previous_reply',(select e.reply from public.support_sales_events e where e.customer_id=c.id and e.event_id=p_event_id))
from public.support_customers c left join public.support_sales_cases s on s.customer_id=c.id
where c.channel='whatsapp' and c.channel_identity=p_identity;
$$;
create function public.support_sales_save(p_identity text,p_event_id text,p_revision bigint,p_state jsonb,p_reply text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare cid uuid; changed integer;
begin
 if jsonb_typeof(p_state)<>'object' or length(p_state::text)>20000 or length(p_reply)>4000
    or length(p_event_id)>300 or p_reply is null then raise exception 'Invalid sales update'; end if;
 select id into strict cid from public.support_customers where channel='whatsapp' and channel_identity=p_identity;
 -- Lock customer as well as case: serializes first-case creation and replay.
 perform 1 from public.support_customers where id=cid for update;
 if exists(select 1 from public.support_sales_events where customer_id=cid and event_id=p_event_id) then return false; end if;
 insert into public.support_sales_cases(customer_id) values(cid) on conflict do nothing;
 update public.support_sales_cases set state=p_state,revision=revision+1,updated_at=now()
 where customer_id=cid and revision=p_revision;
 get diagnostics changed=row_count;
 if changed=0 then return false; end if;
 insert into public.support_sales_events(customer_id,event_id,reply) values(cid,p_event_id,p_reply);
 return true;
end $$;
revoke all on function public.support_sales_context(text,text),public.support_sales_save(text,text,bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.support_sales_context(text,text),public.support_sales_save(text,text,bigint,jsonb,text) to service_role;
notify pgrst,'reload schema';

-- Operator-only command; never exposed as a model tool.
create function public.support_sales_verify(p_identity text,p_revision bigint,p_verified jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare changed integer;
begin
 if jsonb_typeof(p_verified)<>'object' or length(p_verified::text)>12000 then raise exception 'Invalid verified facts'; end if;
 update public.support_sales_cases s set verified=s.verified||p_verified,revision=revision+1,updated_at=now()
 from public.support_customers c where s.customer_id=c.id and c.channel='whatsapp'
 and c.channel_identity=p_identity and s.revision=p_revision;
 get diagnostics changed=row_count;
 return changed=1;
end $$;
revoke all on function public.support_sales_verify(text,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.support_sales_verify(text,bigint,jsonb) to service_role;
