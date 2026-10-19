-- Customer-facing video names and Instagram shop-window facts.
-- Internal name stays for operators; WhatsApp never speaks it.
alter table public.video_templates
  add column if not exists customer_name text,
  add column if not exists instagram_views integer not null default 0,
  add column if not exists instagram_page text not null default 'https://www.instagram.com/findmyinvite.ai';

alter table public.video_templates
  drop constraint if exists video_templates_instagram_views_check;
alter table public.video_templates
  add constraint video_templates_instagram_views_check check (instagram_views >= 0);

update public.video_templates
set customer_name = 'Christian Church Wedding',
    instagram_views = 100000,
    instagram_page = 'https://www.instagram.com/findmyinvite.ai'
where id = 'church-christian-wedding-v1';

update public.video_templates
set customer_name = coalesce(nullif(btrim(customer_name), ''), name)
where customer_name is null or btrim(customer_name) = '';

alter table public.video_templates
  alter column customer_name set not null;

-- Highest-view videos are offered first.
create or replace function public.support_sales_context(p_identity text, p_event_id text)
returns jsonb language sql stable security invoker set search_path='' as $$
select jsonb_build_object(
 'templates',(select coalesce(jsonb_agg(to_jsonb(t) order by t.instagram_views desc, t.id),'[]'::jsonb)
              from public.video_templates t where active),
 'state',coalesce(s.state,'{}'::jsonb),'verified',coalesce(s.verified,'{}'::jsonb),
 'revision',coalesce(s.revision,0),
 'previous_reply',(select e.reply from public.support_sales_events e where e.customer_id=c.id and e.event_id=p_event_id))
from public.support_customers c left join public.support_sales_cases s on s.customer_id=c.id
where c.channel='whatsapp' and c.channel_identity=p_identity;
$$;

revoke all on function public.support_sales_context(text,text) from public,anon,authenticated;
grant execute on function public.support_sales_context(text,text) to service_role;
notify pgrst,'reload schema';
