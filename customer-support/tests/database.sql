-- Run only against an authorized Supabase target. All fixture writes roll back.
begin;
set local role service_role;
do $$
declare a jsonb; b jsonb; c jsonb; n integer;
begin
  a := public.support_record_contact('whatsapp','lid:000000000000000000000000183301',null,
       'fmi-test-session-a','2026-10-18T10:00:00Z','2026-10-18T11:00:00Z');
  b := public.support_record_contact('whatsapp','lid:000000000000000000000000183301',null,
       'fmi-test-session-a','2026-10-18T09:00:00Z','2026-10-18T10:00:00Z');
  c := public.support_record_contact('whatsapp','lid:000000000000000000000000183301',null,
       'fmi-test-session-b','2026-10-18T12:00:00Z','2026-10-18T12:00:00Z');
  if a->>'customer_id' <> b->>'customer_id'
     or a->>'conversation_id' <> b->>'conversation_id'
     or a->>'customer_id' <> c->>'customer_id'
     or a->>'conversation_id' = c->>'conversation_id' then
    raise exception 'Support deduplication failed';
  end if;
  select count(*) into n from public.support_customers
    where id=(a->>'customer_id')::uuid and first_seen_at='2026-10-18T09:00:00Z'
      and last_seen_at='2026-10-18T12:00:00Z';
  if n<>1 then raise exception 'Support timestamp merge failed'; end if;
end $$;
rollback;
