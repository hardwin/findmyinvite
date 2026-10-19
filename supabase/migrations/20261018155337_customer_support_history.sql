-- Customer-authorized text history. No reasoning, tool logs, or attachment bytes.
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.support_customers(id) on delete cascade,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  message_key text not null check (message_key ~ '^[0-9a-f]{64}$'),
  role text not null check (role in ('user','assistant')),
  content text not null check (length(content) between 1 and 65536),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Generation hooks run before WhatsApp delivery; never claim a delivery receipt.
  delivery_state text not null check (delivery_state in ('received','generated','historical')),
  unique (customer_id,message_key)
);
create index support_messages_history_idx on public.support_messages(customer_id,occurred_at desc,id desc);
create index support_messages_conversation_idx on public.support_messages(conversation_id);
alter table public.support_messages enable row level security;
revoke all on public.support_messages from public,anon,authenticated;
grant select,insert,update,delete on public.support_messages to service_role;

create function public.support_record_message(
  p_channel text, p_identity text, p_phone_e164 text, p_session_id text,
  p_message_key text, p_role text, p_content text, p_occurred_at timestamptz,
  p_delivery_state text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare contact jsonb; result_id uuid;
begin
  if p_role is null or p_role not in ('user','assistant') or p_content is null
     or length(p_content) not between 1 and 65536 or p_message_key is null
     or p_message_key !~ '^[0-9a-f]{64}$' or p_delivery_state is null
     or p_delivery_state not in ('received','generated','historical')
     or (p_role='user' and p_delivery_state='generated')
     or (p_role='assistant' and p_delivery_state='received') then
    raise exception 'Invalid support message' using errcode='22023';
  end if;
  contact := public.support_record_contact(p_channel,p_identity,p_phone_e164,p_session_id,
                                           p_occurred_at,p_occurred_at);
  insert into public.support_messages(customer_id,conversation_id,message_key,role,content,occurred_at,delivery_state)
  values((contact->>'customer_id')::uuid,(contact->>'conversation_id')::uuid,p_message_key,
         p_role,p_content,p_occurred_at,p_delivery_state)
  on conflict(customer_id,message_key) do update set
    content=excluded.content, updated_at=now()
  where public.support_messages.role=excluded.role
  returning id into result_id;
  if result_id is null then
    raise exception 'Support message role conflict' using errcode='22023';
  end if;
  return jsonb_build_object('message_id',result_id);
end;
$$;

create function public.support_recent_messages(p_channel text,p_identity text,p_limit integer default 40)
returns table(message_key text,role text,content text,occurred_at timestamptz,delivery_state text)
language sql stable security invoker set search_path = '' as $$
  select recent.message_key,recent.role,recent.content,recent.occurred_at,recent.delivery_state
  from (
    select m.message_key,m.role,m.content,m.occurred_at,m.delivery_state,m.id
    from public.support_messages m
    join public.support_customers c on c.id=m.customer_id
    where c.channel=p_channel and c.channel_identity=p_identity
    order by m.occurred_at desc,case when m.role='assistant' then 1 else 0 end desc,m.id desc
    limit greatest(1,least(coalesce(p_limit,40),100))
  ) recent
  order by recent.occurred_at,case when recent.role='assistant' then 1 else 0 end,recent.id;
$$;
revoke all on function public.support_record_message(text,text,text,text,text,text,text,timestamptz,text)
  from public,anon,authenticated;
revoke all on function public.support_recent_messages(text,text,integer) from public,anon,authenticated;
grant execute on function public.support_record_message(text,text,text,text,text,text,text,timestamptz,text)
  to service_role;
grant execute on function public.support_recent_messages(text,text,integer) to service_role;
comment on table public.support_messages is
  'Private customer/support text. Generated assistant text is not a WhatsApp delivery receipt.';
notify pgrst,'reload schema';
