begin;
create table public.website_costs(month date primary key check(extract(day from month)=1),amount_paise bigint not null check(amount_paise>=0),note text not null default '',updated_by uuid references auth.users(id),updated_at timestamptz not null default now());
alter table public.website_costs enable row level security;
revoke all on public.website_costs from public,anon,authenticated;
grant all on public.website_costs to service_role;
create function public.fmi_website_metrics() returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object(
 'mediaBytes',(select coalesce(sum(bytes),0) from template_media where status='ready'),
 'paidInvitationsThisMonth',(select count(distinct invitation_id) from website_orders where status='captured' and created_at>=date_trunc('month',now())),
 'allocatedCostPaise',(select amount_paise from website_costs where month=date_trunc('month',now())::date),
 'unappliedCapturedOrders',(select count(*) from website_orders where status='captured' and applied_at is null),
 'stalledOrders',(select count(*) from website_orders where status='created' and created_at<now()-interval '15 minutes'),
 'failures',(select coalesce(jsonb_object_agg(action,n),'{}'::jsonb) from (select action,count(*) n from cms_audit where action in ('payment.failed','publication.failed','guest.error') and created_at>now()-interval '7 days' group by action) totals)
 );
$$;
revoke all on function public.fmi_website_metrics() from public,anon,authenticated;
grant execute on function public.fmi_website_metrics() to service_role;
commit;
