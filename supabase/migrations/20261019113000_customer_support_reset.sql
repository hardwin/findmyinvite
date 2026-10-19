-- Operator test reset: wipe one customer's conversation and sales case.
-- Keeps the customer identity row. Service-role only.
create function public.support_conversation_reset(p_identity text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare cid uuid;
begin
  if p_identity is null or length(p_identity) not between 1 and 100 then
    raise exception 'Invalid reset identity';
  end if;
  select id into cid from public.support_customers
   where channel='whatsapp' and channel_identity=p_identity;
  if cid is null then
    return jsonb_build_object('reset',true,'existed',false);
  end if;
  perform 1 from public.support_customers where id=cid for update;
  delete from public.support_sales_events where customer_id=cid;
  delete from public.support_sales_cases where customer_id=cid;
  delete from public.support_messages where customer_id=cid;
  delete from public.support_conversations where customer_id=cid;
  return jsonb_build_object('reset',true,'existed',true);
end $$;
revoke all on function public.support_conversation_reset(text) from public,anon,authenticated;
grant execute on function public.support_conversation_reset(text) to service_role;
notify pgrst,'reload schema';
