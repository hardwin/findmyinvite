-- FMI support CRM metadata. Independent of invitations, Auth, and analytics.
create table public.support_customers (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel = 'whatsapp'),
  channel_identity text not null check (length(channel_identity) between 1 and 100),
  phone_e164 text check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  display_name text check (length(display_name) <= 200),
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_customer_identity unique (channel, channel_identity),
  constraint support_customer_seen_order check (first_seen_at <= last_seen_at)
);

create table public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.support_customers(id) on delete cascade,
  hermes_session_id text not null check (length(hermes_session_id) between 1 and 200),
  status text not null default 'open' check (status in ('open','waiting_for_team','closed')),
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint support_conversation_session unique (customer_id, hermes_session_id),
  constraint support_conversation_seen_order check (first_seen_at <= last_seen_at)
);

create index support_customers_last_seen_idx on public.support_customers(last_seen_at desc);
create index support_conversations_status_seen_idx on public.support_conversations(status,last_seen_at desc);
alter table public.support_customers enable row level security;
alter table public.support_conversations enable row level security;
revoke all on public.support_customers, public.support_conversations from public, anon, authenticated;
grant select, insert, update, delete on public.support_customers, public.support_conversations to service_role;

-- One transaction avoids a contact without its conversation. Upserts tolerate
-- concurrent turns, replayed requests, lost HTTP responses, and delayed outbox flushes.
create function public.support_record_contact(
  p_channel text, p_identity text, p_phone_e164 text, p_session_id text,
  p_first_seen_at timestamptz, p_last_seen_at timestamptz
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  customer uuid;
  conversation uuid;
begin
  if p_channel is distinct from 'whatsapp' or p_identity is null
     or p_session_id is null or length(p_session_id) not between 1 and 200
     or p_first_seen_at is null or p_last_seen_at is null
     or p_first_seen_at > p_last_seen_at then
    raise exception 'Invalid support contact metadata' using errcode = '22023';
  end if;
  if p_phone_e164 is not null then
    if p_phone_e164 !~ '^\+[1-9][0-9]{6,14}$' or p_identity <> 'phone:' || p_phone_e164 then
      raise exception 'Invalid phone identity' using errcode = '22023';
    end if;
  elsif p_identity !~ '^lid:[0-9]{1,30}$' then
    raise exception 'Invalid opaque identity' using errcode = '22023';
  end if;

  insert into public.support_customers(channel,channel_identity,phone_e164,first_seen_at,last_seen_at)
  values(p_channel,p_identity,p_phone_e164,p_first_seen_at,p_last_seen_at)
  on conflict (channel,channel_identity) do update set
    first_seen_at = least(public.support_customers.first_seen_at,excluded.first_seen_at),
    last_seen_at = greatest(public.support_customers.last_seen_at,excluded.last_seen_at),
    updated_at = now()
  returning id into customer;

  insert into public.support_conversations(customer_id,hermes_session_id,first_seen_at,last_seen_at)
  values(customer,p_session_id,p_first_seen_at,p_last_seen_at)
  on conflict(customer_id,hermes_session_id) do update set
    first_seen_at = least(public.support_conversations.first_seen_at,excluded.first_seen_at),
    last_seen_at = greatest(public.support_conversations.last_seen_at,excluded.last_seen_at)
  returning id into conversation;
  return jsonb_build_object('customer_id',customer,'conversation_id',conversation);
end;
$$;
revoke all on function public.support_record_contact(text,text,text,text,timestamptz,timestamptz)
  from public, anon, authenticated;
grant execute on function public.support_record_contact(text,text,text,text,timestamptz,timestamptz)
  to service_role;

comment on table public.support_customers is
  'Private support identities; not Auth accounts, marketing consent, or invitation ownership.';
comment on table public.support_conversations is
  'Hermes session metadata only. No message bodies, attachments, or embeddings.';
notify pgrst, 'reload schema';
