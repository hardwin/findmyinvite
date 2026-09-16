-- Privileged approve/reject for /akay/shortlist.
-- service_role only. Matches Epic 2: approve + queue in one transaction; reject never touches replication_queue.
create or replace function public.approve_shortlist_candidate(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
  queue_id uuid;
  queue_status text;
begin
  update public.shortlist_candidates
  set status = 'approved', updated_at = now()
  where id = p_id and status = 'proposed'
  returning id into updated_id;

  if updated_id is null then
    if exists (select 1 from public.shortlist_candidates where id = p_id) then
      return jsonb_build_object('ok', false, 'error', 'already_decided');
    end if;
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  insert into public.replication_queue (candidate_id, status, assignee, notes)
  values (p_id, 'queued', '', '')
  on conflict (candidate_id) do nothing;

  select q.id, q.status into queue_id, queue_status
  from public.replication_queue q
  where q.candidate_id = p_id;

  if queue_id is null then
    raise exception 'Could not queue this design.';
  end if;

  return jsonb_build_object('ok', true, 'queue_id', queue_id, 'queue_status', queue_status);
end;
$$;

create or replace function public.reject_shortlist_candidate(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id uuid;
begin
  update public.shortlist_candidates
  set status = 'rejected', updated_at = now()
  where id = p_id and status = 'proposed'
  returning id into updated_id;

  if updated_id is null then
    if exists (select 1 from public.shortlist_candidates where id = p_id) then
      return jsonb_build_object('ok', false, 'error', 'already_decided');
    end if;
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.approve_shortlist_candidate(uuid) from public, anon, authenticated;
revoke all on function public.reject_shortlist_candidate(uuid) from public, anon, authenticated;
grant execute on function public.approve_shortlist_candidate(uuid) to service_role;
grant execute on function public.reject_shortlist_candidate(uuid) to service_role;
