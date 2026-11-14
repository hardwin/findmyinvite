create table public.guest_interactions (
 invitation_id uuid not null references public.invitations(id) on delete cascade,
 kind text not null check(kind in ('wish','kolam','poll','glitter')),
 entry_key text not null,
 value jsonb not null,
 created_at timestamptz not null default now(),
 primary key(invitation_id,kind,entry_key)
);
create index guest_interactions_recent on public.guest_interactions(invitation_id,created_at desc);
alter table public.guest_interactions enable row level security;
revoke all on public.guest_interactions from public,anon,authenticated;
grant all on public.guest_interactions to service_role;

create function public.fmi_write_guest_interaction(p_invitation uuid,p_kind text,p_visitor text,p_request uuid,p_value jsonb)
returns void language plpgsql security invoker set search_path=public as $$
begin
 perform id from invitations where id=p_invitation and published and deleted_at is null and expires_at>now() for share;
 if not found then raise exception 'Invitation unavailable'; end if;
 if p_kind='poll' then
  insert into guest_interactions(invitation_id,kind,entry_key,value) values(p_invitation,p_kind,p_visitor,p_value)
  on conflict(invitation_id,kind,entry_key) do update set value=excluded.value;
 else
  insert into guest_interactions(invitation_id,kind,entry_key,value) values(p_invitation,p_kind,p_request::text,p_value)
  on conflict do nothing;
 end if;
end $$;

create function public.fmi_read_guest_interactions(p_invitation uuid)
returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object(
 'girl',(select count(*) from guest_interactions where invitation_id=p_invitation and kind='poll' and value->>'vote'='girl'),
 'boy',(select count(*) from guest_interactions where invitation_id=p_invitation and kind='poll' and value->>'vote'='boy'),
 'total',(select coalesce(sum((value->>'add')::int),0) from guest_interactions where invitation_id=p_invitation and kind='glitter'),
 'wishes',coalesce((select jsonb_agg(value||jsonb_build_object('id',entry_key) order by created_at desc) from (select * from guest_interactions where invitation_id=p_invitation and kind='wish' order by created_at desc limit 100) w),'[]'::jsonb),
 'kolams',coalesce((select jsonb_agg(value||jsonb_build_object('id',entry_key) order by created_at desc) from (select * from guest_interactions where invitation_id=p_invitation and kind='kolam' order by created_at desc limit 100) w),'[]'::jsonb)
 ) where exists(select 1 from invitations where id=p_invitation and published and deleted_at is null and expires_at>now());
$$;
revoke all on function public.fmi_write_guest_interaction(uuid,text,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.fmi_read_guest_interactions(uuid) from public,anon,authenticated;
grant execute on function public.fmi_write_guest_interaction(uuid,text,text,uuid,jsonb) to service_role;
grant execute on function public.fmi_read_guest_interactions(uuid) to service_role;
